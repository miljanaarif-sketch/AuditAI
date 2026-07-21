import { useEffect, useRef, useState } from 'react'
import { Send, Bot, Ticket as TicketIcon, CircleDot } from 'lucide-react'
import client from '../api/client'
import Header from '../components/Header'

interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  time: string
}

interface TicketMessage {
  sender: string
  at: string
  text: string
}

interface Ticket {
  id: string
  number: number
  subject: string
  status: 'open' | 'pending' | 'closed'
  severity: 'high' | 'normal' | 'low'
  type: string
  group: string
  assigned_to: string
  days_open: number
  messages: TicketMessage[]
}

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-sky-100 text-sky-700',
  pending: 'bg-amber-100 text-amber-700',
  closed: 'bg-slate-200 text-slate-500',
}
const SEVERITY_DOT: Record<string, string> = {
  high: 'text-rose-500',
  normal: 'text-amber-400',
  low: 'text-slate-300',
}
const FILTERS = ['open', 'pending', 'closed', 'all'] as const

export default function CommunicationsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('open')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reply, setReply] = useState('')

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  function refreshTickets() {
    client.get('/comms/tickets').then((res) => setTickets(res.data))
  }

  useEffect(() => {
    refreshTickets()
    client.get('/comms/messages').then((res) => setMessages(res.data))
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const filtered = tickets.filter((t) => (filter === 'all' ? true : t.status === filter))
  const selected = tickets.find((t) => t.id === selectedId) ?? null
  const counts = {
    open: tickets.filter((t) => t.status === 'open').length,
    pending: tickets.filter((t) => t.status === 'pending').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
    all: tickets.length,
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return
    await client.post(`/comms/tickets/${selected.id}/reply`, { text: reply.trim() })
    setReply('')
    refreshTickets()
  }

  async function setStatus(t: Ticket, status: string) {
    await client.post(`/comms/tickets/${t.id}/status`, { status })
    refreshTickets()
  }

  async function sendChat() {
    const text = input.trim()
    if (!text || chatBusy) return
    setInput('')
    setChatBusy(true)
    setMessages((prev) => [...prev, { id: `tmp-${Date.now()}`, sender: 'user', text, time: '' }])
    try {
      const res = await client.post('/comms/chat', { message: text })
      setMessages((prev) => [...prev, res.data])
    } finally {
      setChatBusy(false)
    }
  }

  return (
    <div>
      <Header
        title="Auditor Communication Platform"
        subtitle="Ticket queue for audit queries and requests, with a full message chain — plus the NAWRAS assistant."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Ticketing */}
        <div className="lg:col-span-2 space-y-4 min-w-0">
          <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
            {/* filter tabs */}
            <div className="flex items-center gap-1 px-3 pt-3 flex-wrap">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-t-lg px-3 py-1.5 text-sm capitalize ${
                    filter === f ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {f} <span className="text-xs opacity-70">({counts[f]})</span>
                </button>
              ))}
              <span className="ml-auto pr-2 flex items-center gap-1.5 text-xs text-slate-400">
                <TicketIcon size={13} /> {filtered.length} tickets
              </span>
            </div>

            {/* ticket table */}
            <table className="w-full text-sm border-t border-slate-200">
              <thead>
                <tr className="text-left text-slate-500 bg-slate-50">
                  <th className="py-2 pl-4 pr-2 font-medium w-16">#</th>
                  <th className="py-2 pr-4 font-medium">Subject</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Severity</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium text-right">Days Open</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={`border-b border-slate-100 cursor-pointer ${
                      selectedId === t.id ? 'bg-sky-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5 pl-4 pr-2 text-slate-500">{t.number}</td>
                    <td className="py-2.5 pr-4 text-slate-800">{t.subject}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[t.status]}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="flex items-center gap-1 text-xs text-slate-600 capitalize">
                        <CircleDot size={12} className={SEVERITY_DOT[t.severity]} />
                        {t.severity}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-500">{t.type}</td>
                    <td className="py-2.5 pr-4 text-right text-slate-500">{t.days_open}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-slate-400">
                      No {filter} tickets.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* selected ticket detail + chain */}
          {selected && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    #{selected.number} · {selected.subject}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Type: <span className="text-slate-700">{selected.type}</span></span>
                    <span>Group: <span className="text-slate-700">{selected.group}</span></span>
                    <span>Assigned: <span className="text-slate-700">{selected.assigned_to}</span></span>
                    <span>Open {selected.days_open} day{selected.days_open === 1 ? '' : 's'}</span>
                  </div>
                </div>
                <select
                  value={selected.status}
                  onChange={(e) => setStatus(selected, e.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs capitalize"
                >
                  <option value="open">open</option>
                  <option value="pending">pending</option>
                  <option value="closed">closed</option>
                </select>
              </div>

              {/* message chain / log */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                {selected.messages.map((m, i) => {
                  const mine = m.sender === 'Audit Team'
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="w-24 shrink-0 text-right">
                        <div className={`text-xs font-medium ${mine ? 'text-sky-700' : m.sender === 'System' ? 'text-slate-400' : 'text-emerald-700'}`}>
                          {m.sender}
                        </div>
                        <div className="text-[11px] text-slate-400">{m.at}</div>
                      </div>
                      <div className="flex-1 border-l-2 border-slate-100 pl-3 text-sm text-slate-700">{m.text}</div>
                    </div>
                  )
                })}
              </div>

              {/* reply */}
              <div className="flex gap-2 mt-4 border-t border-slate-100 pt-3">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                  placeholder="Add a reply to the chain…"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <button
                  onClick={sendReply}
                  disabled={!reply.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-sky-600 text-white text-sm px-3 py-2 hover:bg-sky-700 disabled:opacity-50"
                >
                  <Send size={14} /> Reply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Chat bot */}
        <div className="rounded-xl border border-slate-200 bg-white flex flex-col" style={{ height: 560 }}>
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600">
              <Bot size={17} />
            </span>
            <div>
              <div className="text-sm font-semibold text-slate-800">NAWRAS Assistant</div>
              <div className="text-xs text-slate-400">answers from the live audit file</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-sm text-slate-400">
                Try: "What is the overall progress?", "Which confirmations are outstanding?", "What items are missing?"
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-800 rounded-bl-md'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {chatBusy && <div className="text-xs text-slate-400">assistant is typing…</div>}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2 p-3 border-t border-slate-100">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              placeholder="Ask about the audit file…"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              onClick={sendChat}
              disabled={chatBusy || !input.trim()}
              className="rounded-lg bg-emerald-600 text-white px-3 py-2 hover:bg-emerald-700 disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
