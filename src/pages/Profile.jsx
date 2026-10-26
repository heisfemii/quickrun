import { useEffect, useState } from 'react'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { storage } from '../services/firebase'
import { errorMessage } from '../services/errors'
const SERVICES = ['delivery','shopping','cleaning','plumbing','carpentry','electrical','painting','moving','gardening','other']
export default function Profile() {
  const { user, profile, updateUserProfile } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({ name:'', phone:'', bio:'', avatarUrl:'', avatarColor:'#D4AF37', role:'tasker', services:[], minimumPrice:'' })
  const [busy, setBusy] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  useEffect(() => { if (profile) setForm({ name:profile.name||user?.displayName||'', phone:profile.phone||'', bio:profile.bio||'', avatarUrl:profile.avatarUrl||'', avatarColor:profile.avatarColor||'#D4AF37', role:profile.role||'tasker', services:profile.services||[], minimumPrice:profile.minimumPrice||'' }) }, [profile,user])
  const save = async e => { e.preventDefault(); setBusy(true); try { await updateUserProfile({ ...form, minimumPrice:Number(form.minimumPrice)||0 }); toast('Profile saved successfully.') } catch(err) { toast(errorMessage(err, 'Could not save your profile.')) } finally { setBusy(false) } }
  const uploadPhoto = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast('Choose an image file.'); e.target.value = ''; return }
    if (file.size > 5 * 1024 * 1024) { toast('Please choose an image smaller than 5 MB.'); e.target.value = ''; return }
    setPhotoBusy(true)
    try {
      const photoRef = ref(storage, `profile-photos/${user.uid}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`)
      await uploadBytes(photoRef, file, { contentType: file.type })
      const avatarUrl = await getDownloadURL(photoRef)
      await updateUserProfile({ avatarUrl, photoURL: avatarUrl })
      setForm(f => ({ ...f, avatarUrl }))
      toast('Profile picture updated.')
    } catch(err) { toast(errorMessage(err, 'Could not upload the photo.')) }
    finally { setPhotoBusy(false); e.target.value = '' }
  }
  const toggleService = s => setForm(f => ({ ...f, services:f.services.includes(s)?f.services.filter(x=>x!==s):[...f.services,s] }))
  const initial = (form.name || user?.email || 'Q').trim().charAt(0).toUpperCase()
  return <main className="wrap narrow"><div className="page-head"><div><span className="eyebrow">YOUR ACCOUNT</span><h1>Profile details</h1><p>Manage how people see you on QuickRun.</p></div></div>
    <form className="form-panel" onSubmit={save}>
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24, flexWrap:'wrap' }}><div style={{ width:76,height:76,borderRadius:'50%',display:'grid',placeItems:'center',background:form.avatarColor,color:'#14233D',fontSize:30,fontWeight:800,overflow:'hidden',flexShrink:0 }}>{form.avatarUrl?<img src={form.avatarUrl} alt="Profile avatar" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:initial}</div><div style={{flex:1,minWidth:220}}><strong>Profile picture</strong><p className="muted" style={{margin:'4px 0 10px'}}>Your email’s first letter is used until you upload a photo. Choose an image from your device.</p><label>Upload photo<input type="file" accept="image/*" onChange={uploadPhoto} disabled={photoBusy}/></label>{photoBusy&&<span className="form-help">Uploading photo…</span>}<label>Avatar colour<select value={form.avatarColor} onChange={e=>setForm({...form,avatarColor:e.target.value})}><option value="#D4AF37">QuickRun gold</option><option value="#B8D9CC">Sage</option><option value="#D7C9F2">Lavender</option><option value="#F4C7B8">Coral</option><option value="#B9D7F0">Sky blue</option></select></label></div></div>
      <label>Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Email address<input value={user?.email||''} disabled readOnly/></label><label>Phone number<input type="tel" placeholder="080…" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label>About you<textarea rows="3" maxLength={300} placeholder="A short introduction…" value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})}/></label>
      <label>Account mode<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="tasker">Tasker — post tasks</option><option value="runner">Runner — accept tasks</option><option value="both">Both — switch any time</option></select></label>
      {(form.role==='runner'||form.role==='both')&&<><label>Services you offer</label><div className="service-checks">{SERVICES.map(s=><label key={s} className="service-check"><input type="checkbox" checked={form.services.includes(s)} onChange={()=>toggleService(s)}/>{s.charAt(0).toUpperCase()+s.slice(1)}</label>)}</div><label>Minimum service price (₦)<input type="number" min="0" step="500" placeholder="10000" value={form.minimumPrice} onChange={e=>setForm({...form,minimumPrice:e.target.value})}/><span className="form-help">Shown as “From ₦{(Number(form.minimumPrice)||0).toLocaleString()}”. Set 0 if you price each job separately.</span></label></>}
      <button className="btn" disabled={busy}>{busy?'Saving…':'Save profile →'}</button>
    </form><section className="form-panel mt"><h2>Runner reputation</h2><div className="row" style={{justifyContent:'space-between'}}><div><div className="gold" style={{fontSize:24}}>★ {Number(profile?.rating||0).toFixed(1)}</div><span className="muted">{profile?.reviewCount||0} reviews</span></div><div><strong style={{fontSize:24}}>{profile?.successfulRuns||0}</strong><br/><span className="muted">Successful runs</span></div></div></section>
  </main>
}
