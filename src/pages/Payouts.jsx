import { useEffect, useState } from 'react'
import { useLang } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { call } from '../services/payments'
import { errorMessage } from '../services/errors'

export default function Payouts() {
  const { t } = useLang()
  const toast = useToast()
  const [banks, setBanks] = useState([])
  const [bankCode, setBankCode] = useState('')
  const [acct, setAcct] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    call('listBanks')().then((r) => setBanks(r.data)).catch((e) => toast(errorMessage(e, 'Could not load banks.')))
  }, [toast])

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const r = await call('saveBankAccount')({ bankCode, accountNumber: acct })
      toast(`${t.saved}: ${r.data.accountName}`)
    } catch (err) { toast(errorMessage(err, 'Could not save the bank account.')) } finally { setBusy(false) }
  }

  return (
    <form className="form pad" style={{ maxWidth: 440 }} onSubmit={save}>
      <h2>{t.payouts}</h2>
      <select required value={bankCode} onChange={(e) => setBankCode(e.target.value)} className="lang" style={{ color: 'inherit', borderColor: 'var(--line)', padding: 12 }}>
        <option value="">{t.bank}</option>
        {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
      </select>
      <input required inputMode="numeric" pattern="\d{10}" maxLength={10} placeholder={t.accountNumber} value={acct} onChange={(e) => setAcct(e.target.value.replace(/\D/g, ''))} />
      <button className="btn gold" disabled={busy}>{t.save}</button>
    </form>
  )
}
