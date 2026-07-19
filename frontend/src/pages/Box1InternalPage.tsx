import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, ChevronRight, FolderOpen, Folder } from 'lucide-react'
import client from '../api/client'
import Header from '../components/Header'
import DocumentTable from '../components/DocumentTable'
import BoxRequirements from '../components/BoxRequirements'
import type { InternalDocument } from '../types'

export default function Box1InternalPage() {
  const [categories, setCategories] = useState<string[]>([])
  const [documents, setDocuments] = useState<InternalDocument[]>([])
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const [openFolder, setOpenFolder] = useState<string | null>(null)

  function refresh() {
    client.get('/box1/documents').then((res) => setDocuments(res.data))
  }

  useEffect(() => {
    client.get('/box1/categories').then((res) => setCategories(res.data))
    refresh()
  }, [])

  return (
    <div>
      <Header
        title="1 · Internal Documentation"
        subtitle="Centralized repository of non-system entity documents — collected once, latest version only."
      />

      {categories.map((category) => {
        const docs = documents.filter((d) => d.category === category)
        if (docs.length === 0) return null
        const isOpen = openCategory === category
        return (
          <div key={category} className="rounded-xl border border-slate-200 bg-white mb-3 overflow-hidden">
            <button
              onClick={() => setOpenCategory(isOpen ? null : category)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50"
            >
              <div>
                <div className="text-sm font-semibold text-slate-800">{category}</div>
                <div className="text-xs text-slate-500 mt-0.5">{docs.length} documents</div>
              </div>
              {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>
            {isOpen && (
              <div className="px-5 pb-5 border-t border-slate-100 pt-3">
                {(() => {
                  const folders = [...new Set(docs.filter((d) => d.folder).map((d) => d.folder as string))]
                  const loose = docs.filter((d) => !d.folder)
                  if (folders.length === 0) return <DocumentTable documents={docs} onChanged={refresh} />
                  return (
                    <div className="space-y-2">
                      {folders.map((folder) => {
                        const folderDocs = docs.filter((d) => d.folder === folder)
                        const folderOpen = openFolder === `${category}::${folder}`
                        return (
                          <div key={folder} className="rounded-lg border border-slate-200 overflow-hidden">
                            <button
                              onClick={() => setOpenFolder(folderOpen ? null : `${category}::${folder}`)}
                              className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50"
                            >
                              <span className="flex items-center gap-2 text-sm text-slate-700">
                                {folderOpen ? (
                                  <FolderOpen size={15} className="text-amber-500" />
                                ) : (
                                  <Folder size={15} className="text-amber-500" />
                                )}
                                {folder}
                                <span className="text-xs text-slate-400">· {folderDocs.length} documents</span>
                              </span>
                              {folderOpen ? (
                                <ChevronUp size={14} className="text-slate-400" />
                              ) : (
                                <ChevronRight size={14} className="text-slate-400" />
                              )}
                            </button>
                            {folderOpen && (
                              <div className="px-4 pb-4 border-t border-slate-100 pt-2">
                                <DocumentTable documents={folderDocs} onChanged={refresh} />
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {loose.length > 0 && <DocumentTable documents={loose} onChanged={refresh} />}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )
      })}

      <BoxRequirements box="box1" />
    </div>
  )
}
