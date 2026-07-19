import { useEffect, useState } from 'react'
import { X, FileText } from 'lucide-react'
import client from '../api/client'
import type { GLAccount, Journal, SourceDocument } from '../types'
import { formatSAR } from '../utils/format'
import StatusBadge from './StatusBadge'

export default function DrillDownModal({ account, onClose }: { account: GLAccount; onClose: () => void }) {
  const [journals, setJournals] = useState<Journal[]>([])
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null)
  const [documents, setDocuments] = useState<SourceDocument[]>([])

  useEffect(() => {
    client.get(`/box3/accounts/${account.id}`).then((res) => setJournals(res.data.journals))
  }, [account.id])

  useEffect(() => {
    if (!selectedJournal) {
      setDocuments([])
      return
    }
    client.get(`/box3/journals/${selectedJournal.id}`).then((res) => setDocuments(res.data.documents))
  }, [selectedJournal])

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div>
            <div className="text-xs text-slate-400">{account.code}</div>
            <div className="font-semibold text-slate-900">{account.name}</div>
            <div className="text-sm text-slate-500">{formatSAR(account.balance)}</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-6">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase mb-2">Journals</div>
            <div className="space-y-1">
              {journals.map((j) => (
                <button
                  key={j.id}
                  onClick={() => setSelectedJournal(j)}
                  className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition ${
                    selectedJournal?.id === j.id
                      ? 'border-sky-400 bg-sky-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="text-slate-800">{j.description}</span>
                    <span className="text-slate-500">{j.date}</span>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-slate-500">
                    <span>{j.source === 'manual' ? 'Manual' : 'System'} · {j.debit ? `Dr ${formatSAR(j.debit)}` : `Cr ${formatSAR(j.credit)}`}</span>
                    {j.flags.length > 0 && <span className="text-rose-600">{j.flags.join(', ')}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-slate-500 uppercase mb-2">Source Documents</div>
            {!selectedJournal && <div className="text-sm text-slate-400">Select a journal to drill down to its source document.</div>}
            {selectedJournal && documents.length === 0 && (
              <div className="text-sm text-rose-500">No source document attached — evidence gap.</div>
            )}
            <div className="space-y-2">
              {documents.map((d) => (
                <div key={d.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <FileText size={16} className="text-slate-400" />
                  <div>
                    <div className="text-slate-800">{d.filename}</div>
                    <div className="text-xs text-slate-500">{d.doc_type} · uploaded {d.uploaded_at}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="text-xs font-medium text-slate-500 uppercase mb-2">Document-Definition Range</div>
          <div className="flex flex-wrap gap-2">
            {account.expected_doc_types.map((t) => (
              <span key={t} className="text-xs rounded-full border border-slate-200 px-2.5 py-1 text-slate-600">
                {t}
              </span>
            ))}
          </div>
          {account.missing_evidence && (
            <div className="mt-2">
              <StatusBadge status="missing" /> <span className="text-xs text-slate-500 ml-1">fewer attached documents than expected doc types</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
