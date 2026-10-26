import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBooking } from '../context/BookingContext'
import { useLang } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { createTask } from '../services/tasks'
import { estimateTaskCost } from '../services/payments'
import MapView from '../components/MapView'
import { errorMessage } from '../services/errors'

const WORDS = {
  en: { intro:'Tell us what you need. A nearby helper can take it from there.', details:'Describe your task', detailHelp:'Give helpers the details they need.', order:'Order / service cost (₦)', transport:'Suggested transport cost (₦)', transportHelp:'You suggest the transport amount.', where:'Where should it happen?', mapHelp:'Use one map to search and pin both locations.', payment:'Payment breakdown', runner:'Runner fee (10%)', quickrun:'QuickRun service fee', paystack:'Estimated Paystack fee', total:'Estimated total', cancel:'Cancel', publishing:'Publishing…', choose:'Choose a pickup location on the map before posting.', orderPlaceholder:'10000', transportPlaceholder:'500' },
  ha: { intro:'Faɗi abin da kake buƙata. Mai taimako na kusa zai iya yi maka.', details:'Bayyana aikinka', detailHelp:'Ba mai taimako cikakken bayani.', order:'Kuɗin kaya ko sabis (₦)', transport:'Kuɗin sufuri da ka ba da shawara (₦)', transportHelp:'Kai ne kake bayar da shawarar kuɗin sufuri.', where:'A ina za a yi aikin?', mapHelp:'Yi amfani da taswira guda ɗaya don nemo wuraren ɗauka da kaiwa.', payment:'Rarrabuwar kuɗin biya', runner:'Kuɗin mai aiki (10%)', quickrun:'Kuɗin sabis na QuickRun', paystack:'Kiyasin kuɗin Paystack', total:'Jimillar kuɗi', cancel:'Soke', publishing:'Ana wallafawa…', choose:'Zaɓi wurin ɗauka a taswira kafin wallafawa.', orderPlaceholder:'10000', transportPlaceholder:'500' },
  yo: { intro:'Sọ ohun tí o nílò. Olùrànlọ́wọ́ tó wà nítòsí lè ṣe é.', details:'Ṣàpèjúwe iṣẹ́ rẹ', detailHelp:'Fún olùrànlọ́wọ́ ní àlàyé tó yẹ.', order:'Owó ọjà tàbí iṣẹ́ (₦)', transport:'Owó ìrìnàjò tí o dábàá (₦)', transportHelp:'Ìwọ ni o dábàá owó ìrìnàjò.', where:'Níbo ni iṣẹ́ náà yóò ti wáyé?', mapHelp:'Lo maapu kan láti wá àti yan àwọn ibi méjèèjì.', payment:'Àlàyé owó ìsanwó', runner:'Owó olùṣe (10%)', quickrun:'Owó iṣẹ́ QuickRun', paystack:'Ìṣírò owó Paystack', total:'Àpapọ̀ owó', cancel:'Fagilé', publishing:'Ń fi síta…', choose:'Yan ibi ìgbàgbé lórí maapu kí o tó fi iṣẹ́ sílẹ̀.', orderPlaceholder:'10000', transportPlaceholder:'500' },
  ig: { intro:'Kọwaa ihe ị chọrọ. Onye enyemaka nọ nso nwere ike ime ya.', details:'Kọwaa ọrụ gị', detailHelp:'Nye onye enyemaka nkọwa zuru ezu.', order:'Ọnụ ego ihe ma ọ bụ ọrụ (₦)', transport:'Ụgwọ njem ị tụrụ aro (₦)', transportHelp:'Gị na-atụ aro ụgwọ njem.', where:'Ebee ka ọrụ ahụ ga-eme?', mapHelp:'Jiri otu maapụ chọọ ma họrọ ebe abụọ ahụ.', payment:'Nkọwa ụgwọ', runner:'Ụgwọ onye na-arụ ọrụ (10%)', quickrun:'Ụgwọ ọrụ QuickRun', paystack:'Atụmatụ ụgwọ Paystack', total:'Ngụkọta ego', cancel:'Kagbuo', publishing:'A na-ebipụta…', choose:'Họrọ ebe a ga-eburu ihe na maapụ tupu itinye ọrụ.', orderPlaceholder:'10000', transportPlaceholder:'500' }
}

export default function PostTask() {
  const { user } = useAuth()
  const { draft, update, reset } = useBooking()
  const { t, lang } = useLang()
  const toast = useToast()
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)
  const [activeField, setActiveField] = useState('pickup')
  const w = WORDS[lang] || WORDS.en
  const costs = estimateTaskCost({ budget: draft.budget, transportCost: draft.transportCost })
  const submit = async (e) => {
    e.preventDefault()
    if (!user) return nav('/login')
    if (!draft.pickupLocation || !draft.pickupAddress) return toast(w.choose)
    setBusy(true)
    try {
      await createTask(draft, user)
      reset(); toast(t.posted); nav('/my-tasks')
    } catch (err) { toast(errorMessage(err, 'Could not post the task.')) }
    finally { setBusy(false) }
  }
  return <main className="wrap narrow">
    <div className="page-head"><div><span className="eyebrow">{lang === 'ha' ? 'AIKI GA AL’UMMA' : lang === 'yo' ? 'IṢẸ́ FÚN ÀWỌN ÈNÌYÀN' : lang === 'ig' ? 'ỌRỤ MAKA OBODO' : 'ASK YOUR COMMUNITY'}</span><h1>{t.postTask}</h1><p>{w.intro}</p></div></div>
    <form className="form-panel" onSubmit={submit}>
      <div className="row" style={{ marginBottom: 20 }}><span className="num">1</span><div><h2 style={{ fontSize: '1.1rem', margin: 0 }}>{w.details}</h2><span className="muted" style={{ fontSize: '.85rem' }}>{w.detailHelp}</span></div></div>
      <label>{t.title}<input placeholder={lang === 'ha' ? 'misali: Siyo mini kayan abinci' : lang === 'yo' ? 'àpẹẹrẹ: Ra oúnjẹ fún mi' : lang === 'ig' ? 'dịka: Zụtara m nri' : 'e.g. Pick up groceries for me'} required maxLength={100} value={draft.title} onChange={e => update({ title: e.target.value })} /></label>
      <label>{t.description}<textarea rows="4" placeholder={lang === 'ha' ? 'Me ya kamata a yi? Bayyana muhimman bayanai…' : lang === 'yo' ? 'Kí ni a nílò láti ṣe? Fi àlàyé tó ṣe pàtàkì kún un…' : lang === 'ig' ? 'Gịnị ka a ga-eme? Tinye nkọwa dị mkpa…' : 'What needs to be done? Include useful details…'} required value={draft.description} onChange={e => update({ description: e.target.value })} /></label>
      <div className="row"><label className="grow">{t.category}<select value={draft.category} onChange={e => update({ category: e.target.value })}>{Object.entries(t.cats).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label><label className="grow">{w.order}<input type="number" min="1" step="100" placeholder={w.orderPlaceholder} required value={draft.budget} onChange={e => update({ budget: e.target.value })} /></label></div>
      <label>{w.transport}<input type="number" min="0" step="50" placeholder={w.transportPlaceholder} required value={draft.transportCost} onChange={e => update({ transportCost: e.target.value })} /><span className="form-help">{w.transportHelp}</span></label>
      <div className="row" style={{ margin: '28px 0 18px' }}><span className="num">2</span><div><h2 style={{ fontSize: '1.1rem', margin: 0 }}>{w.where}</h2><span className="muted" style={{ fontSize: '.85rem' }}>{w.mapHelp}</span></div></div>
      <div className="map-frame"><MapView height={360} pickup={draft.pickupLocation} delivery={draft.deliveryLocation} activeField={activeField} onActiveFieldChange={setActiveField} onPickupPick={(location, label) => update({ pickupLocation: location, pickupAddress: label })} onDeliveryPick={(location, label) => update({ deliveryLocation: location, deliveryAddress: label })} /></div>
      <div className="form-panel mt"><h3 style={{ marginTop: 0 }}>{w.payment}</h3><div className="cost-row"><span>{w.order}</span><strong>₦{costs.order.toLocaleString()}</strong></div><div className="cost-row"><span>{w.runner}</span><strong>₦{costs.runnerFee.toLocaleString()}</strong></div><div className="cost-row"><span>{w.transport}</span><strong>₦{costs.transport.toLocaleString()}</strong></div><div className="cost-row"><span>{w.quickrun}</span><strong>₦{costs.platformFee.toLocaleString()}</strong></div><div className="cost-row"><span>{w.paystack}</span><strong>₦{costs.paystackFee.toLocaleString()}</strong></div><div className="cost-row cost-total"><span>{w.total}</span><strong>₦{costs.total.toLocaleString()}</strong></div></div>
      <div className="row mt" style={{ justifyContent: 'space-between' }}><Link to="/browse" className="btn ghost">{w.cancel}</Link><button className="btn" disabled={busy}>{busy ? w.publishing : t.submit}<span>→</span></button></div>
    </form>
  </main>
}
