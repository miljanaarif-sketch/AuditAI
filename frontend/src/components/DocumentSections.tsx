import { useRef, useState } from 'react'
import { Upload, Database, ClipboardList, FileText } from 'lucide-react'
import client from '../api/client'
import DocumentTable from './DocumentTable'
import type { InternalDocument } from '../types'

export default function DocumentSections({
  documents,
  category,
  folder,
  onChanged,
}: {
  documents: InternalDocument[]
  category: string
  folder?: string | null
  onChanged: () => void
}) {
  const [tab, setTab] = useState<'summary' | 'database'>('summary')
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function upload() {
    if (!file || !name) return
    setBusy(true)
    const form = new FormData()
    form.append('category', category)
    form.append('name', name)
    form.append('file', file)
    if (folder) form.append('folder', folder)
    try {
      await client.post('/box1/documents/upload', form)
      setName('')
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  const tabClass = (active: boolean) =>
    `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
      active ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'
    }`

  return (
    <div>
      <div className="flex gap-1 mb-3">
        <button onClick={() => setTab('summary')} className={tabClass(tab === 'summary')}>
          <ClipboardList size={13} /> Document Summary
        </button>
        <button onClick={() => setTab('database')} className={tabClass(tab === 'database')}>
          <Database size={13} /> Document Database
        </button>
      </div>

      {tab === 'summary' ? (
        <DocumentTable documents={documents} onChanged={onChanged} />
      ) : (
        <div>
          <div className="flex flex-wrap gap-2 mb-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Document name"
              className="flex-1 min-w-[180px] rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
            />
            <input
              ref={fileRef}
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm max-w-[220px]"
            />
            <button
              onClick={upload}
              disabled={busy || !file || !name}
              className="flex items-center gap-1.5 rounded-lg bg-sky-600 text-white text-sm px-3 py-1.5 hover:bg-sky-700 disabled:opacity-50"
            >
              <Upload size={14} /> Upload
            </button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4 font-medium">Document</th>
                <th className="py-2 pr-4 font-medium">File</th>
                <th className="py-2 pr-4 font-medium">Version</th>
                <th className="py-2 pr-4 font-medium">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 pr-4 text-slate-800">{d.name}</td>
                  <td className="py-2 pr-4">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <FileText size={13} className="text-slate-400" />
                      {d.filename}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-slate-500">v{d.version}</td>
                  <td className="py-2 pr-4 text-slate-500">{d.uploaded_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
