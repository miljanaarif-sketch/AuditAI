import { useEffect, useRef, useState } from 'react'
import { Mail, MailCheck, ChevronUp, ChevronRight, Users, Truck, Landmark, Scale, Handshake, Check, Upload, FileCheck2 } from 'lucide-react'
import client from '../api/client'
import Header from '../components/Header'
import BoxRequirements from '../components/BoxRequirements'
import StatusBadge from '../components/StatusBadge'
import { formatSAR } from '../utils/format'
import type { Confirmation, MailLogEntry } from '../types'

const TYPES = [
  { key: 'customer', label: 'Customer Confirmations', icon: Users },
  { key: 'supplier', label: 'Supplier Confirmations', icon: Truck },
  { key: 'bank', label: 'Bank Confirmations', icon: Landmark },
  { key: 'related_party', label: 'Related Party Confirmations', icon: Handshake },
  { key: 'legal', label: 'Legal Confirmations', icon: Scale },
]

const STEPS: { key: Confirmation['send_stage']; label: string }[] = [
  { key: 'generate', label: 'Generate' },
  { key: 'approved', label: 'Approve' },
  { key: 'sent', label: 'Send' },
]
const REPLY_OPTIONS = ['received', 'matched', 'difference']
const RECEIVED_STATES = ['received', 'matched', 'difference']
const SAMPLE_OPTIONS = [50, 40, 20, 10]
// legal confirmations are a single document, not a balance circularisation
const SAMPLEABLE = ['customer', 'supplier', 'bank', 'related_party']

function Stepper({ conf, onAdvance, onViewLetter }: { conf: Confirmation; onAdvance: () => void; onViewLetter: () => void }) {
  const current = STEPS.findIndex((s) => s.key === conf.send_stage)
  const nextLabel = conf.send_stage === 'generate' ? 'Approve' : conf.send_stage === 'approved' ? 'Send' : null
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1">
            <button
              onClick={s.key === 'generate' ? onViewLetter : undefined}
              title={s.key === 'generate' ? 'View request letter' : s.label}
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                i <= current
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-400'
              } ${s.key === 'generate' ? 'hover:bg-emerald-200 cursor-pointer' : ''}`}
            >
              {i < current && <Check size={10} />}
              {s.label}
            </button>
            {i < STEPS.length - 1 && <span className="text-slate-300 text-[10px]">›</span>}
          </div>
        ))}
      </div>
      {nextLabel ? (
        <button
          onClick={onAdvance}
          className="rounded-lg bg-sky-600 text-white text-[11px] px-2 py-1 hover:bg-sky-700"
        >
          {nextLabel} →
        </button>
      ) : (
        <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
          <Check size={11} /> Sent
        </span>
      )}
    </div>
  )
}

function LegalDocRow({ conf, onChanged }: { conf: Confirmation; onChanged: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const uploaded = !!conf.document_filename

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    const form = new FormData()
    form.append('file', file)
    try {
      await client.post(`/box2/confirmations/${conf.id}/upload`, form)
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-50 py-2 text-sm">
      <div className="min-w-0">
        <div className="text-slate-800">{conf.party_name}</div>
        {uploaded && (
          <div className="flex items-center gap-1 text-xs text-emerald-600 mt-0.5">
            <FileCheck2 size={11} />
            <span className="font-medium">Uploaded</span>
            <span className="text-slate-400 truncate">· {conf.document_filename} · {conf.received_date}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge status={uploaded ? 'matched' : 'not_sent'} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="flex items-center gap-1 rounded-lg border border-slate-200 text-slate-600 text-xs px-2.5 py-1 hover:border-sky-300 hover:text-sky-700 disabled:opacity-50"
        >
          <Upload size={12} /> {uploaded ? 'Replace document' : 'Upload document'}
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={onFile} />
      </div>
    </div>
  )
}

export default function Box2ExternalPage() {
  const [confirmations, setConfirmations] = useState<Confirmation[]>([])
  const [openFolder, setOpenFolder] = useState<string | null>(null)
  const [letterFor, setLetterFor] = useState<Confirmation | null>(null)
  const [letterText, setLetterText] = useState('')
  const [letterKind, setLetterKind] = useState<'request' | 'received'>('request')
  const [mailFor, setMailFor] = useState<Confirmation | null>(null)

  function refresh() {
    client.get('/box2/confirmations').then((res) => setConfirmations(res.data))
  }

  useEffect(refresh, [])

  async function viewRequestLetter(conf: Confirmation) {
    const res = await client.post(`/box2/confirmations/${conf.id}/generate-letter`)
    setLetterFor(conf)
    setLetterKind('request')
    setLetterText(res.data.letter_text)
  }

  async function viewReceivedLetter(conf: Confirmation) {
    const res = await client.get(`/box2/confirmations/${conf.id}/received-letter`)
    setLetterFor(conf)
    setLetterKind('received')
    setLetterText(res.data.received_letter_text)
  }

  async function advance(conf: Confirmation) {
    await client.post(`/box2/confirmations/${conf.id}/advance`)
    refresh()
  }

  async function setReply(conf: Confirmation, status: string) {
    await client.post(`/box2/confirmations/${conf.id}/status`, { status })
    refresh()
  }

  async function selectSample(type: string, mode: string, n?: number) {
    await client.post('/box2/select-sample', { type, mode, n })
    refresh()
  }

  async function toggleSelect(conf: Confirmation) {
    await client.post(`/box2/confirmations/${conf.id}/toggle-select`)
    refresh()
  }

  return (
    <div>
      <Header
        title="2 · External Confirmations"
        subtitle="Third-party evidence — each confirmation runs Generate → Approve → Send; replies and mail history are logged here."
      />

      <div className="space-y-2">
        {TYPES.map(({ key, label, icon: Icon }) => {
          const rows = confirmations.filter((c) => c.type === key)
          if (rows.length === 0) return null
          const sent = rows.filter((c) => c.send_stage === 'sent').length
          const received = rows.filter((c) => RECEIVED_STATES.includes(c.status)).length
          const selectedCount = rows.filter((c) => c.selected).length
          const sampleable = SAMPLEABLE.includes(key)
          const isOpen = openFolder === key
          return (
            <div key={key} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <button
                onClick={() => setOpenFolder(isOpen ? null : key)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50"
              >
                <span className="flex items-center gap-2.5 text-sm text-slate-800">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 text-sky-600">
                    <Icon size={16} />
                  </span>
                  <span className="font-semibold">{label}</span>
                  <span className="text-xs text-slate-400">
                    · {rows.length} parties · {selectedCount} selected · {sent} sent · {received} replies
                  </span>
                </span>
                {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-slate-100 pt-3 overflow-x-auto">
                  {key === 'legal' ? (
                    <div className="space-y-1">
                      <div className="text-xs text-slate-400 mb-2">
                        Legal / litigation confirmation — upload the lawyer's response letter.
                      </div>
                      {rows.map((c) => (
                        <LegalDocRow key={c.id} conf={c} onChanged={refresh} />
                      ))}
                    </div>
                  ) : (
                    <>
                  {sampleable && (
                    <div className="flex items-center flex-wrap gap-2 mb-3 text-xs">
                      <span className="font-medium text-slate-600">Circularisation sample:</span>
                      <button
                        onClick={() => selectSample(key, 'all')}
                        className="rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 px-2.5 py-1 hover:bg-emerald-100"
                      >
                        Select all
                      </button>
                      {SAMPLE_OPTIONS.map((n) => (
                        <button
                          key={n}
                          onClick={() => selectSample(key, 'top', n)}
                          className="rounded-lg border border-slate-200 text-slate-600 px-2.5 py-1 hover:border-sky-300 hover:text-sky-700"
                        >
                          Top {n}
                        </button>
                      ))}
                      <button
                        onClick={() => selectSample(key, 'none')}
                        className="rounded-lg border border-slate-200 text-slate-500 px-2.5 py-1 hover:bg-slate-50"
                      >
                        Clear
                      </button>
                      <span className="text-slate-400">
                        {selectedCount} of {rows.length} selected (by balance) · then run the workflow on selected
                      </span>
                    </div>
                  )}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-200">
                        <th className="py-2 pr-3 font-medium w-8"></th>
                        <th className="py-2 pr-4 font-medium">Party</th>
                        <th className="py-2 pr-4 font-medium text-right">GL Balance</th>
                        <th className="py-2 pr-4 font-medium text-right">Confirmed</th>
                        <th className="py-2 pr-4 font-medium">Workflow</th>
                        <th className="py-2 pr-4 font-medium">Reply</th>
                        <th className="py-2 pr-4 font-medium">Mails</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((c) => {
                        const hasReply = RECEIVED_STATES.includes(c.status)
                        const isSent = c.send_stage === 'sent'
                        const dim = sampleable && !c.selected
                        return (
                          <tr key={c.id} className={`border-b border-slate-100 hover:bg-slate-50 ${dim ? 'opacity-45' : ''}`}>
                            <td className="py-2 pr-3">
                              <input
                                type="checkbox"
                                checked={c.selected}
                                onChange={() => toggleSelect(c)}
                                className="accent-emerald-600"
                                title="Include in circularisation sample"
                              />
                            </td>
                            <td className="py-2 pr-4 text-slate-800">{c.party_name}</td>
                            <td className="py-2 pr-4 text-right text-slate-700">{formatSAR(c.gl_balance)}</td>
                            <td className={`py-2 pr-4 text-right ${c.difference ? 'text-rose-600' : 'text-slate-700'}`}>
                              {formatSAR(c.confirmed_amount)}
                              {c.difference ? <span className="block text-[11px]">Δ {formatSAR(c.difference)}</span> : null}
                            </td>
                            <td className="py-2 pr-4">
                              {dim ? (
                                <span className="text-xs text-slate-400">not in sample</span>
                              ) : (
                                <Stepper conf={c} onAdvance={() => advance(c)} onViewLetter={() => viewRequestLetter(c)} />
                              )}
                            </td>
                            <td className="py-2 pr-4">
                              {!isSent ? (
                                <span className="text-xs text-slate-300">awaiting send</span>
                              ) : hasReply ? (
                                <span className="flex items-center gap-2">
                                  <StatusBadge status={c.status} />
                                  <button
                                    onClick={() => viewReceivedLetter(c)}
                                    className="flex items-center gap-1 text-xs text-emerald-700 hover:underline font-medium"
                                  >
                                    <MailCheck size={12} /> View reply
                                  </button>
                                </span>
                              ) : (
                                <select
                                  value=""
                                  onChange={(e) => e.target.value && setReply(c, e.target.value)}
                                  className="rounded-lg border border-slate-200 px-1.5 py-0.5 text-xs text-slate-500"
                                >
                                  <option value="">Log reply…</option>
                                  {REPLY_OPTIONS.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td className="py-2 pr-4">
                              <button
                                onClick={() => setMailFor(c)}
                                className="flex items-center gap-1 text-xs text-slate-600 hover:text-sky-700"
                                title="View mail history"
                              >
                                <Mail size={13} /> {c.mail_log.length}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {letterFor && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="font-semibold text-slate-900 mb-3">
              {letterKind === 'received' ? 'Received confirmation' : 'Request letter'} — {letterFor.party_name}
            </div>
            <pre
              className={`whitespace-pre-wrap text-sm rounded-lg p-4 mb-4 ${
                letterKind === 'received'
                  ? 'text-slate-700 bg-emerald-50 border border-emerald-200'
                  : 'text-slate-700 bg-slate-50'
              }`}
            >
              {letterText}
            </pre>
            <button
              onClick={() => setLetterFor(null)}
              className="rounded-lg bg-slate-800 text-white text-sm px-4 py-2 hover:bg-slate-900"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {mailFor && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="font-semibold text-slate-900 mb-1">Mail history — {mailFor.party_name}</div>
            <div className="text-xs text-slate-400 mb-4">Also logged in Auditor Communications → Sent Log.</div>
            {mailFor.mail_log.length === 0 ? (
              <div className="text-sm text-slate-400 mb-4">No mail yet — send the confirmation first.</div>
            ) : (
              <div className="space-y-2 mb-4">
                {mailFor.mail_log.map((m: MailLogEntry, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-100 px-3 py-2">
                    <span
                      className={`mt-0.5 flex items-center justify-center w-6 h-6 rounded-lg ${
                        m.type === 'sent' ? 'bg-sky-50 text-sky-600' : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {m.type === 'sent' ? <Mail size={13} /> : <MailCheck size={13} />}
                    </span>
                    <div>
                      <div className="text-sm text-slate-700">{m.text}</div>
                      <div className="text-xs text-slate-400">{m.at}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setMailFor(null)}
              className="rounded-lg bg-slate-800 text-white text-sm px-4 py-2 hover:bg-slate-900"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <BoxRequirements box="box2" />
    </div>
  )
}
