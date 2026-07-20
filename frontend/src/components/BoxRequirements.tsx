import { useEffect, useRef, useState } from 'react'
import { ChevronUp, ChevronRight, Folder, FolderOpen, Upload, DatabaseZap, FileCheck2 } from 'lucide-react'
import client from '../api/client'
import StatusBadge from './StatusBadge'
import type { AnnexureGroup, AnnexureItem } from '../types'

const STATUS_OPTIONS = [
  { value: 'missing', label: 'missing' },
  { value: 'uploaded', label: 'uploaded' },
  { value: 'reviewed', label: 'reviewed' },
  { value: 'not_applicable', label: 'N/A (not applicable)' },
]

const GROUP_ORDER = ['Income Statement items', 'Balance Sheet items', 'Other items']

function ItemRow({ item, onChanged }: { item: AnnexureItem; onChanged: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function setStatus(status: string) {
    await client.post(`/annexure/items/${item.id}/status`, { status })
    onChanged()
  }
  async function pullNawras() {
    setBusy(true)
    try {
      await client.post(`/annexure/items/${item.id}/pull-nawras`)
      onChanged()
    } finally {
      setBusy(false)
    }
  }
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    const form = new FormData()
    form.append('file', file)
    try {
      await client.post(`/annexure/items/${item.id}/upload`, form)
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 text-sm border-b border-slate-50 pb-1.5">
      <div className="min-w-0">
        <div className="text-slate-700">{item.item_name}</div>
        {item.source && (
          <div className="flex items-center gap-1 text-xs mt-0.5 text-slate-400">
            <FileCheck2 size={11} className={item.source === 'nawras' ? 'text-violet-600' : 'text-sky-600'} />
            <span className={item.source === 'nawras' ? 'text-violet-600 font-medium' : 'text-sky-600 font-medium'}>
              {item.source === 'nawras' ? 'NAWRAS ERP' : 'Uploaded'}
            </span>
            <span className="truncate">· {item.filename}</span>
            {item.populated_at && <span>· {item.populated_at}</span>}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={pullNawras}
          disabled={busy}
          title="Auto-populate this report directly from the NAWRAS ERP"
          className="flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 text-[11px] px-2 py-1 hover:bg-violet-100 disabled:opacity-50"
        >
          <DatabaseZap size={12} /> NAWRAS
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          title="Upload a document for this item"
          className="flex items-center gap-1 rounded-lg border border-slate-200 text-slate-600 text-[11px] px-2 py-1 hover:border-sky-300 hover:text-sky-700 disabled:opacity-50"
        >
          <Upload size={12} /> Upload
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={onFile} />
        <StatusBadge status={item.status} />
        <select
          value={item.status}
          onChange={(e) => setStatus(e.target.value)}
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
  )
}

export default function BoxRequirements({ box, title = 'Requirements & Evidence' }: { box: string; title?: string }) {
  const [groups, setGroups] = useState<AnnexureGroup[]>([])
  const [openFolder, setOpenFolder] = useState<string | null>(null)

  function refresh() {
    client.get('/annexure/items').then((res) => setGroups(res.data.filter((g: AnnexureGroup) => g.linked_box === box)))
  }

  useEffect(refresh, [box])

  if (groups.length === 0) return null

  const allItems = groups.flatMap((g) => g.items)
  const missing = allItems.filter((i) => i.status === 'missing').length
  const grouped = groups.some((g) => g.folder_group)

  function renderFolder(g: AnnexureGroup) {
    const folderKey = `${box}::${g.folder}`
    const folderOpen = openFolder === folderKey
    const folderMissing = g.items.filter((i) => i.status === 'missing').length
    return (
      <div key={folderKey} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
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
                <ItemRow key={item.id} item={item} onChanged={refresh} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const orderedGroups = [
    ...GROUP_ORDER,
    ...[...new Set(groups.map((g) => g.folder_group).filter((x): x is string => !!x && !GROUP_ORDER.includes(x)))],
  ]

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        <span className="text-xs text-slate-400">
          {groups.length} folders · {allItems.length} items
          {missing > 0 && <span className="text-rose-600"> · {missing} missing</span>}
        </span>
      </div>

      {grouped ? (
        <div className="space-y-5">
          {orderedGroups.map((groupName) => {
            const folders = groups.filter((g) => g.folder_group === groupName)
            if (folders.length === 0) return null
            return (
              <div key={groupName}>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-100 rounded-md px-3 py-1.5 mb-2">
                  {groupName}
                </div>
                <div className="space-y-2">{folders.map(renderFolder)}</div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">{groups.map(renderFolder)}</div>
      )}
    </div>
  )
}
