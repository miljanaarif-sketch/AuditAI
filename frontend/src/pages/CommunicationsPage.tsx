import { useEffect, useRef, useState } from 'react'
import { Send, Bot, Mail, CheckCircle2 } from 'lucide-react'
import client from '../api/client'
import Header from '../components/Header'
import type { AuditSetup } from '../types'

interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  time: string
}

interface EmailRecord {
  id: string
  to: string
  subject: string
  body: string
  sent_at: string
  status: string
}

export default function CommunicationsPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const [emails, setEmails] = useState<EmailRecord[]>([])
  const [recipients, setRecipients] = useState<{ label: string; email: string }[]>([])
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sentFlash, setSentFlash] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    client.get('/comms/messages').then((res) => setMessages(res.data))
    client.get('/comms/emails').then((res) => setEmails(res.data))
    client.get('/setup').then((res) => {
      const s: AuditSetup = res.data
      const list: { label: string; email: string }[] = []
      const roleLabels: Record<string, string> = {
        ceo: 'CEO', cfo: 'CFO', financial_controller: 'Financial Controller',
        treasury_manager: 'Treasury Manager', hr_manager: 'HR Manager',
        it_manager: 'IT Manager', legal_contact: 'Legal Contact',
      }
      for (const [key, label] of Object.entries(roleLabels)) {
        const name = s.contacts[key]
        const email = s.contacts[`${key}_email`]
        if (name && email) list.push({ label: `${name} (${label})`, email })
      }
      const teamLabels: Record<string, string> = {
        engagement_partner: 'Engagement Partner', audit_manager: 'Audit Manager',
        audit_senior_1: 'Audit Senior', audit_senior_2: 'Audit Senior',
      }
      for (const [key, label] of Object.entries(teamLabels)) {
        const name = s.audit_team[key]
        const email = s.audit_team[`${key}_email`]
        if (name && email) list.push({ label: `${name} (${label})`, email })
      }
      setRecipients(list)
      if (list.length) setTo(list[0].email)
    })
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  async function sendEmail() {
    if (!to || !subject || !body || sending) return
    setSending(true)
    try {
      const res = await client.post('/comms/email', { to, subject, body })
      setEmails((prev) => [res.data, ...prev])
      setSubject('')
      setBody('')
      setSentFlash(true)
      setTimeout(() => setSentFlash(false), 2500)
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <Header
        title="Auditor Communication Platform"
        subtitle="Ask the NAWRAS assistant about the audit file, and send emails to client contacts and the engagement team."
      />

      <div className="grid grid-cols-2 gap-5">
        {/* Chat */}
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
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-sm text-slate-400">
                Try: "What is the overall progress?", "Which confirmations are outstanding?", "What items are missing?"
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
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
          <div className="flex gap-2 p-4 border-t border-slate-100">
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
              className="rounded-lg bg-emerald-600 text-white px-3.5 py-2 hover:bg-emerald-700 disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Email */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 text-sky-600">
                <Mail size={17} />
              </span>
              <div className="text-sm font-semibold text-slate-800">Compose Email</div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">To</label>
                <select
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  {recipients.map((r) => (
                    <option key={r.email} value={r.email}>
                      {r.label} — {r.email}
                    </option>
                  ))}
                </select>
              </div>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Message…"
                rows={5}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={sendEmail}
                  disabled={sending || !to || !subject || !body}
                  className="flex items-center gap-1.5 rounded-lg bg-sky-600 text-white text-sm px-4 py-2 hover:bg-sky-700 disabled:opacity-50"
                >
                  <Send size={14} /> Send
                </button>
                {sentFlash && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 size={14} /> Logged
                  </span>
                )}
                <span className="text-xs text-slate-400">Prototype — emails are logged, not dispatched.</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold text-slate-800 mb-3">Sent Log</div>
            {emails.length === 0 && <div className="text-sm text-slate-400">No emails yet.</div>}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {emails.map((e) => (
                <div key={e.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-800">{e.subject}</span>
                    <span className="text-xs text-slate-400">{e.sent_at}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">to {e.to}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
