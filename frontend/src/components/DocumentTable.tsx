import { useState } from 'react'
import { Pencil, Check, BellRing } from 'lucide-react'
import client from '../api/client'
import type { InternalDocument } from '../types'

const STATUS_META: { key: InternalDocument['doc_status']; label: string; dot: string; activeRing: string }[] = [
  { key: 'uploaded', label: 'Uploaded', dot: 'bg-emerald-500', activeRing: 'ring-emerald-300' },
  { key: 'pending', label: 'Pending', dot: 'bg-rose-500', activeRing: 'ring-rose-300' },
  { key: 'expired', label: 'Expired', dot: 'bg-amber-400', activeRing: 'ring-amber-300' },
  { key: 'oig', label: 'OIG level', dot: 'bg-blue-500', activeRing: 'ring-blue-300' },
]

// OIG (parent) status/level is only offered for Group policies documents
const isGroupPolicies = (doc: InternalDocument) => doc.category === 'Group policies'

function StatusDots({ doc, onChanged }: { doc: InternalDocument; onChanged: () => void }) {
  async function setStatus(status: InternalDocument['doc_status']) {
    if (status === doc.doc_status) return
    await client.post(`/box1/documents/${doc.id}/update`, { doc_status: status })
    onChanged()
  }
  const active = STATUS_META.find((s) => s.key === doc.doc_status)
  const statuses = isGroupPolicies(doc) ? STATUS_META : STATUS_META.filter((s) => s.key !== 'oig')
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        {statuses.map((s) => (
          <button
            key={s.key}
            title={s.label}
            onClick={() => setStatus(s.key)}
            className={`w-3.5 h-3.5 rounded-full transition ${s.dot} ${
              doc.doc_status === s.key ? `ring-2 ring-offset-1 ${s.activeRing}` : 'opacity-25 hover:opacity-60'
            }`}
          />
        ))}
      </div>
      <span className={`text-xs ${doc.doc_status === 'oig' ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>
        {active?.label}
      </span>
    </div>
  )
}

function ResponsibleCell({ doc, onChanged }: { doc: InternalDocument; onChanged: () => void }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(doc.owner)
  const [email, setEmail] = useState(doc.owner_email)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await client.post(`/box1/documents/${doc.id}/update`, { owner: name, owner_email: email })
    setSaving(false)
    setEditing(false)
    onChanged()
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <div>
          <div className="text-slate-700">{doc.owner || '—'}</div>
          <a href={`mailto:${doc.owner_email}`} className="text-xs text-sky-700 hover:underline">
            {doc.owner_email}
          </a>
        </div>
        <button
          onClick={() => {
            setName(doc.owner)
            setEmail(doc.owner_email)
            setEditing(true)
          }}
          title="Edit responsible person"
          className="text-slate-300 hover:text-slate-600"
        >
          <Pencil size={13} />
        </button>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5">
      <div className="space-y-1">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-40 rounded border border-slate-300 px-2 py-0.5 text-xs"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-40 rounded border border-slate-300 px-2 py-0.5 text-xs"
        />
      </div>
      <button
        onClick={save}
        disabled={saving}
        title="Save"
        className="rounded bg-emerald-600 text-white p-1 hover:bg-emerald-700 disabled:opacity-50"
      >
        <Check size={13} />
      </button>
    </div>
  )
}

function ReminderButton({ doc }: { doc: InternalDocument }) {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function remind() {
    if (busy || sent) return
    setBusy(true)
    try {
      await client.post(`/box1/documents/${doc.id}/remind`)
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={remind}
      disabled={busy}
      title={`Email a reminder to ${doc.owner_email}`}
      className={`flex items-center gap-1 rounded-lg border text-xs px-2 py-1 transition ${
        sent
          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 text-slate-600 hover:border-sky-300 hover:text-sky-700'
      }`}
    >
      {sent ? <Check size={12} /> : <BellRing size={12} />}
      {sent ? 'Sent' : 'Send reminder'}
    </button>
  )
}

export default function DocumentTable({
  documents,
  onChanged,
}: {
  documents: InternalDocument[]
  onChanged: () => void
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-slate-500 border-b border-slate-200">
          <th className="py-2 pr-4 font-medium">Document</th>
          <th className="py-2 pr-4 font-medium">Status</th>
          <th className="py-2 pr-4 font-medium">Level</th>
          <th className="py-2 pr-4 font-medium">Responsible</th>
          <th className="py-2 pr-4 font-medium">Uploaded</th>
          <th className="py-2 pr-4 font-medium">Reminder</th>
        </tr>
      </thead>
      <tbody>
        {documents.map((doc) => (
          <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="py-2 pr-4 text-slate-800">{doc.name}</td>
            <td className="py-2 pr-4">
              <StatusDots doc={doc} onChanged={onChanged} />
            </td>
            <td className="py-2 pr-4">
              {isGroupPolicies(doc) ? (
                <button
                  onClick={async () => {
                    await client.post(`/box1/documents/${doc.id}/update`, {
                      level: doc.level === 'OIG' ? 'BU' : 'OIG',
                    })
                    onChanged()
                  }}
                  title="Click to switch level — OIG-level documents are automatically marked OK"
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium border transition ${
                    doc.level === 'OIG'
                      ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {doc.level === 'OIG' ? 'OIG · Parent' : 'BU'}
                </button>
              ) : (
                <span className="rounded-full px-2.5 py-0.5 text-xs font-medium border bg-slate-100 text-slate-600 border-slate-200">
                  BU
                </span>
              )}
            </td>
            <td className="py-2 pr-4">
              <ResponsibleCell doc={doc} onChanged={onChanged} />
            </td>
            <td className="py-2 pr-4 text-slate-500">{doc.uploaded_at}</td>
            <td className="py-2 pr-4">
              <ReminderButton doc={doc} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
