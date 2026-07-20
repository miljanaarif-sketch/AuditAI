import { useEffect, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Folder,
  FolderOpen,
  FolderKey,
  Send,
  BookOpenCheck,
  GitCompareArrows,
  FileBarChart,
} from 'lucide-react'
import client from '../api/client'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import type { AnnexureGroup } from '../types'

const STATUS_OPTIONS = [
  { value: 'missing', label: 'missing' },
  { value: 'uploaded', label: 'uploaded' },
  { value: 'reviewed', label: 'reviewed' },
  { value: 'not_applicable', label: 'N/A (not applicable)' },
]

const BOXES = [
  { key: 'box1', label: 'Box 1 · Internal Documentation', icon: FolderKey },
  { key: 'box2', label: 'Box 2 · External Confirmations', icon: Send },
  { key: 'box3', label: 'Box 3 · General Ledger', icon: BookOpenCheck },
  { key: 'box4', label: 'Box 4 · Integrated Reports & Recons', icon: GitCompareArrows },
  { key: 'box5', label: 'Box 5 · Financial Reporting', icon: FileBarChart },
]

export default function AnnexureChecklistPage() {
  const [groups, setGroups] = useState<AnnexureGroup[]>([])
  const [openBox, setOpenBox] = useState<string | null>(null)
  const [openFolder, setOpenFolder] = useState<string | null>(null)

  function refresh() {
    client.get('/annexure/items').then((res) => setGroups(res.data))
  }

  useEffect(refresh, [])

  async function updateStatus(itemId: string, status: string) {
    await client.post(`/annexure/items/${itemId}/status`, { status })
    refresh()
  }

  function foldersForBox(box: string): AnnexureGroup[] {
    return groups.filter((g) => g.linked_box === box)
  }

  return (
    <div>
      <Header
        title="Full Item Listing"
        subtitle="Every report and document required for the audit — grouped by box and sub-folder, exactly as laid out in the client's List of Requirements."
      />

      <div className="space-y-3">
        {BOXES.map(({ key, label, icon: Icon }) => {
          const boxFolders = foldersForBox(key)
          const allItems = boxFolders.flatMap((g) => g.items)
          const missing = allItems.filter((i) => i.status === 'missing').length
          const isOpen = openBox === key
          return (
            <div key={key} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <button
                onClick={() => setOpenBox(isOpen ? null : key)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600">
                    <Icon size={18} />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {boxFolders.length} folders · {allItems.length} items
                      {missing > 0 && <span className="text-rose-600"> · {missing} missing</span>}
                    </div>
                  </div>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-2">
                  {boxFolders.length === 0 && (
                    <div className="text-sm text-slate-400">No requirements assigned to this box yet.</div>
                  )}
                  {boxFolders.map((g) => {
                    const folderKey = `${key}::${g.folder}`
                    const folderOpen = openFolder === folderKey
                    const folderMissing = g.items.filter((i) => i.status === 'missing').length
                    return (
                      <div key={folderKey} className="rounded-lg border border-slate-200 overflow-hidden">
                        <button
                          onClick={() => setOpenFolder(folderOpen ? null : folderKey)}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50"
                        >
                          <span className="flex items-center gap-2 text-sm text-slate-700">
                            {folderOpen ? (
                              <FolderOpen size={15} className="text-amber-500" />
                            ) : (
                              <Folder size={15} className="text-amber-500" />
                            )}
                            <span className="font-medium">{g.folder}</span>
                            <span className="text-xs text-slate-400">· {g.items.length} items</span>
                            {folderMissing > 0 && <span className="text-xs text-rose-600">· {folderMissing} missing</span>}
                          </span>
                          {folderOpen ? (
                            <ChevronUp size={14} className="text-slate-400" />
                          ) : (
                            <ChevronRight size={14} className="text-slate-400" />
                          )}
                        </button>
                        {folderOpen && (
                          <div className="px-4 pb-4 border-t border-slate-100 pt-2">
                            {g.folder_note && (
                              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5 mb-2">
                                {g.folder_note}
                              </div>
                            )}
                            <div className="space-y-1.5">
                              {g.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between gap-3 text-sm border-b border-slate-50 pb-1.5"
                                >
                                  <span className="text-slate-700">{item.item_name}</span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <StatusBadge status={item.status} />
                                    <select
                                      value={item.status}
                                      onChange={(e) => updateStatus(item.id, e.target.value)}
                                      className="rounded-lg border border-slate-200 px-1.5 py-0.5 text-xs"
                                    >
                                      {STATUS_OPTIONS.map((s) => (
                                        <option key={s.value} value={s.value}>
                                          {s.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
