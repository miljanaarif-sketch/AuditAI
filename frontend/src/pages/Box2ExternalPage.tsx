import { useEffect, useState } from 'react'
import { Mail, MailCheck, ChevronUp, ChevronRight, Users, Truck, Landmark, Scale } from 'lucide-react'
import client from '../api/client'
import Header from '../components/Header'
import BoxRequirements from '../components/BoxRequirements'
import StatusBadge from '../components/StatusBadge'
import { formatSAR } from '../utils/format'
import type { Confirmation } from '../types'

const TYPES = [
  { key: 'customer', label: 'Customer Confirmations', icon: Users },
  { key: 'supplier', label: 'Supplier Confirmations', icon: Truck },
  { key: 'bank', label: 'Bank Confirmations', icon: Landmark },
  { key: 'legal_rp', label: 'Legal & Related Party Confirmations', icon: Scale },
]

const STATUS_OPTIONS = ['not_sent', 'sent', 'received', 'matched', 'difference']
const RECEIVED_STATES = ['received', 'matched', 'difference']

export default function Box2ExternalPage() {
  const [confirmations, setConfirmations] = useState<Confirmation[]>([])
  const [openFolder, setOpenFolder] = useState<string | null>(null)
  const [letterFor, setLetterFor] = useState<Confirmation | null>(null)
  const [letterText, setLetterText] = useState('')
  const [letterKind, setLetterKind] = useState<'request' | 'received'>('request')

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

  async function updateStatus(conf: Confirmation, status: string) {
    await client.post(`/box2/confirmations/${conf.id}/status`, { status })
    refresh()
  }

  return (
    <div>
      <Header
        title="2 · External Confirmations"
        subtitle="Third-party evidence — circularisation list, request letters, and matching against GL balances."
      />

      <div className="space-y-2">
        {TYPES.map(({ key, label, icon: Icon }) => {
          const rows = confirmations.filter((c) => c.type === key)
          if (rows.length === 0) return null
          const received = rows.filter((c) => RECEIVED_STATES.includes(c.status)).length
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
                    · {rows.length} parties · {received} replies received
                  </span>
                </span>
                {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-slate-100 pt-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-200">
                        <th className="py-2 pr-4 font-medium">Party</th>
                        <th className="py-2 pr-4 font-medium text-right">GL Balance</th>
                        <th className="py-2 pr-4 font-medium text-right">Confirmed</th>
                        <th className="py-2 pr-4 font-medium text-right">Difference</th>
                        <th className="py-2 pr-4 font-medium">Status</th>
                        <th className="py-2 pr-4 font-medium">Request</th>
                        <th className="py-2 pr-4 font-medium">Received reply</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((c) => {
                        const hasReply = RECEIVED_STATES.includes(c.status)
                        return (
                          <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-2 pr-4 text-slate-800">{c.party_name}</td>
                            <td className="py-2 pr-4 text-right text-slate-700">{formatSAR(c.gl_balance)}</td>
                            <td className="py-2 pr-4 text-right text-slate-700">{formatSAR(c.confirmed_amount)}</td>
                            <td className={`py-2 pr-4 text-right ${c.difference ? 'text-rose-600' : 'text-slate-400'}`}>
                              {c.difference ? formatSAR(c.difference) : '—'}
                            </td>
                            <td className="py-2 pr-4">
                              <select
                                value={c.status}
                                onChange={(e) => updateStatus(c, e.target.value)}
                                className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                              <span className="ml-2 align-middle">
                                <StatusBadge status={c.status} />
                              </span>
                            </td>
                            <td className="py-2 pr-4">
                              <button
                                onClick={() => viewRequestLetter(c)}
                                className="flex items-center gap-1 text-xs text-sky-700 hover:underline"
                              >
                                <Mail size={13} /> Request letter
                              </button>
                            </td>
                            <td className="py-2 pr-4">
                              {hasReply ? (
                                <button
                                  onClick={() => viewReceivedLetter(c)}
                                  className="flex items-center gap-1 text-xs text-emerald-700 hover:underline font-medium"
                                >
                                  <MailCheck size={13} /> View reply
                                  {c.received_date && <span className="text-slate-400">· {c.received_date}</span>}
                                </button>
                              ) : (
                                <span className="text-xs text-slate-300">awaiting reply</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
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

      <BoxRequirements box="box2" />
    </div>
  )
}
