import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Free stack: Leaflet + OpenStreetMap tiles + Nominatim (search / reverse geocoding). No API key.
// Nominatim's usage policy allows ~1 request/second and forbids search-as-you-type,
// so searching happens on Enter / the Search button only.
const DEFAULT_CENTER = { lat: 8.4966, lng: 4.5421 }
const NO_TASKS = [] // stable reference so the marker effect doesn't re-run on every render
const NOMINATIM = 'https://nominatim.openstreetmap.org'
const validPoint = (p) => Boolean(p) && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng))
const dot = (color, radius = 9) => ({ radius, color: '#14233D', weight: 2, fillColor: color, fillOpacity: 1 })

async function nominatim(path) {
  let res
  try { res = await fetch(`${NOMINATIM}${path}&format=jsonv2&accept-language=en`) } catch { throw new Error('Cannot reach the map search service. Check your internet connection.') }
  if (res.status === 429) throw new Error('Too many searches in a short time. Wait a few seconds and try again.')
  if (!res.ok) throw new Error(`Map search failed (HTTP ${res.status}). Try again in a moment.`)
  return res.json()
}

/**
 * Read-only map: pass `tasks` and/or `pickup` / `delivery`.
 * Picker mode (post form): also pass `onPickupPick` / `onDeliveryPick`, `activeField`, `onActiveFieldChange`.
 */
export default function MapView({
  tasks = NO_TASKS, height = 380, pickup, delivery,
  activeField = 'pickup', onActiveFieldChange, onPickupPick, onDeliveryPick,
}) {
  const navigate = useNavigate()
  const interactive = Boolean(onPickupPick || onDeliveryPick)
  const mapNode = useRef(null), mapRef = useRef(null), layerRef = useRef(null)
  const latest = useRef({}), geocodeSeq = useRef(0)
  const [ready, setReady] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [mapError, setMapError] = useState('')
  const focus = activeField === 'delivery' ? delivery : pickup
  latest.current = { activeField, onPickupPick, onDeliveryPick }

  const choose = (loc, label) => {
    const { activeField: field, onPickupPick: pickPickup, onDeliveryPick: pickDelivery } = latest.current
    ;(field === 'delivery' ? pickDelivery : pickPickup)?.(loc, label)
    setQuery(label)
    setResults([])
    setMapError('')
  }

  // Create the map once.
  useEffect(() => {
    const start = (validPoint(focus) && focus) || (validPoint(pickup) && pickup) || DEFAULT_CENTER
    const map = L.map(mapNode.current, { center: [start.lat, start.lng], zoom: validPoint(focus) ? 16 : 13 })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    if (interactive) {
      map.on('click', async (e) => {
        const loc = { lat: e.latlng.lat, lng: e.latlng.lng }
        const coords = `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`
        choose(loc, coords) // immediate; upgraded to a street address when reverse geocoding answers
        const seq = ++geocodeSeq.current
        try {
          const r = await nominatim(`/reverse?lat=${loc.lat}&lon=${loc.lng}&zoom=18`)
          if (seq === geocodeSeq.current && r?.display_name) choose(loc, r.display_name)
        } catch { /* keep the coordinates as the label */ }
      })
    }
    setReady(true)
    const resize = setTimeout(() => map.invalidateSize(), 0)
    return () => { clearTimeout(resize); map.remove(); mapRef.current = null; layerRef.current = null; setReady(false) }
    // The map is created once; markers and panning are handled by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Markers.
  useEffect(() => {
    const layer = layerRef.current
    if (!ready || !layer) return
    layer.clearLayers()
    if (validPoint(pickup)) L.circleMarker([pickup.lat, pickup.lng], dot('#25A56A')).bindTooltip('Pickup').addTo(layer)
    if (validPoint(delivery)) L.circleMarker([delivery.lat, delivery.lng], dot('#E36A4A')).bindTooltip('Delivery').addTo(layer)
    tasks.filter((t) => validPoint(t.location)).forEach((t) => {
      const box = document.createElement('div')
      const title = document.createElement('strong'); title.textContent = t.title || 'QuickRun task'
      const price = document.createElement('p'); price.textContent = `₦${Number(t.budget || 0).toLocaleString()}`; price.style.margin = '4px 0'
      const link = document.createElement('a'); link.href = `/task/${encodeURIComponent(t.id)}`; link.textContent = 'View task'
      link.onclick = (e) => { e.preventDefault(); navigate(`/task/${encodeURIComponent(t.id)}`) }
      box.append(title, price, link)
      L.circleMarker([t.location.lat, t.location.lng], dot('#D4AF37')).bindPopup(box).addTo(layer)
    })
  }, [ready, pickup?.lat, pickup?.lng, delivery?.lat, delivery?.lng, tasks]) // eslint-disable-line react-hooks/exhaustive-deps

  // Pan/zoom only when the relevant point changes (not on every re-render).
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    if (!interactive && validPoint(pickup) && validPoint(delivery)) {
      map.fitBounds([[pickup.lat, pickup.lng], [delivery.lat, delivery.lng]], { padding: [60, 60] })
    } else if (validPoint(focus)) {
      map.setView([focus.lat, focus.lng], 16)
    }
  }, [ready, focus?.lat, focus?.lng, delivery?.lat, delivery?.lng]) // eslint-disable-line react-hooks/exhaustive-deps

  // The search box belongs to the field being edited.
  useEffect(() => { setQuery(''); setResults([]) }, [activeField])

  const search = async () => {
    const q = query.trim()
    if (q.length < 3) { setMapError('Type at least 3 characters, then press Search.'); return }
    setSearching(true); setMapError(''); setResults([])
    try {
      const found = await nominatim(`/search?q=${encodeURIComponent(q)}&countrycodes=ng&limit=6`)
      if (!found.length) setMapError('No places found. Try a landmark, street or area name, or click the map to drop a pin.')
      setResults(found)
    } catch (err) { setMapError(err.message) } finally { setSearching(false) }
  }

  const pick = (r) => {
    const loc = { lat: Number(r.lat), lng: Number(r.lon) }
    choose(loc, r.display_name)
  }

  return (
    <div className="map-search-wrap">
      {interactive && (
        <>
          <div className="row map-field-switch" style={{ marginBottom: 10 }}>
            <button type="button" className={`btn ${activeField === 'pickup' ? '' : 'ghost'}`} onClick={() => onActiveFieldChange?.('pickup')}>Pickup</button>
            <button type="button" className={`btn ${activeField === 'delivery' ? '' : 'ghost'}`} onClick={() => onActiveFieldChange?.('delivery')}>Delivery</button>
          </div>
          {/* A <div>, not a <form>: this component lives inside the post-task <form>, and forms cannot nest. */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <input
              style={{ flex: 1, minWidth: 0, margin: 0 }} autoComplete="off" value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); search() } }}
              aria-label={activeField === 'delivery' ? 'Search delivery location' : 'Search pickup location'}
              placeholder={activeField === 'delivery' ? 'Search delivery place (e.g. Peace Street, Ilorin)' : 'Search pickup place (e.g. Shoprite, Tanke Junction)'}
            />
            <button type="button" className="btn" onClick={search} disabled={searching}>{searching ? 'Searching…' : 'Search'}</button>
          </div>
          <span className="form-help" style={{ display: 'block', marginBottom: 10 }}>Type a place and press Search, then choose a result, or click the map to drop a pin.</span>
          {results.length > 0 && (
            <ul style={{ listStyle: 'none', margin: '8px 0 12px', padding: 0, border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
              {results.map((r) => (
                <li key={r.place_id}>
                  <button type="button" onClick={() => pick(r)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 0, borderBottom: '1px solid var(--line)', cursor: 'pointer', font: 'inherit', color: 'inherit' }}>
                    {r.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {mapError && <p className="form-help" role="alert">{mapError}</p>}
      <div ref={mapNode} style={{ height, width: '100%', borderRadius: 14, background: '#eef1f4', zIndex: 0 }} aria-label="Map" />
    </div>
  )
}
