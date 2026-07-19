import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Check, Plus, Trash2, Landmark } from 'lucide-react'
import client from '../api/client'
import type { AuditSetup } from '../types'

type ObjectSectionKey = 'company' | 'audit_team' | 'contacts' | 'legal'

const SECTIONS: { key: ObjectSectionKey; number: number; title: string; hint: string; fields: [string, string][] }[] = [
  {
    key: 'company',
    number: 1,
    title: 'Company Information',
    hint: 'Company Details',
    fields: [
      ['company_name', 'Company Name'],
      ['registration_no', 'Registration No.'],
      ['vat_no', 'VAT No.'],
      ['financial_year_end', 'Financial Year-End'],
      ['functional_currency', 'Functional Currency'],
      ['engagement_date', 'Engagement Date'],
      ['audit_timeline', 'Audit Timeline'],
    ],
  },
  {
    key: 'audit_team',
    number: 2,
    title: 'Audit Team',
    hint: 'Audit Firm & Engagement Team',
    fields: [
      ['audit_firm', 'Audit Firm'],
      ['audit_firm_email', 'Firm Email'],
      ['engagement_partner', 'Engagement Partner'],
      ['engagement_partner_email', 'Partner Email'],
      ['audit_manager', 'Audit Manager'],
      ['audit_manager_email', 'Manager Email'],
      ['audit_senior_1', 'Audit Senior 1'],
      ['audit_senior_1_email', 'Senior 1 Email'],
      ['audit_senior_2', 'Audit Senior 2'],
      ['audit_senior_2_email', 'Senior 2 Email'],
    ],
  },
  {
    key: 'contacts',
    number: 3,
    title: 'Key Internal Contacts',
    hint: 'Management Contacts',
    fields: [
      ['ceo', 'CEO'],
      ['ceo_email', 'CEO Email'],
      ['cfo', 'CFO'],
      ['cfo_email', 'CFO Email'],
      ['financial_controller', 'Financial Controller'],
      ['financial_controller_email', 'Controller Email'],
      ['treasury_manager', 'Treasury Manager'],
      ['treasury_manager_email', 'Treasury Email'],
      ['hr_manager', 'HR Manager'],
      ['hr_manager_email', 'HR Email'],
      ['it_manager', 'IT Manager'],
      ['it_manager_email', 'IT Email'],
      ['legal_contact', 'Legal Contact'],
      ['legal_contact_email', 'Legal Email'],
    ],
  },
  {
    key: 'legal',
    number: 5,
    title: 'Legal Advisors',
    hint: 'Legal Counsel',
    fields: [
      ['law_firm', 'Law Firm'],
      ['contact_person', 'Contact Person'],
      ['email', 'Email'],
      ['phone', 'Phone'],
    ],
  },
]

const BANK_FIELDS: [string, string][] = [
  ['bank_name', 'Bank Name'],
  ['account_name', 'Account Name'],
  ['relationship_manager', 'Relationship Manager'],
  ['email', 'Email'],
  ['phone', 'Phone'],
]

const EMPTY_BANK: Record<string, string> = {
  bank_name: '',
  account_name: '',
  relationship_manager: '',
  email: '',
  phone: '',
}

function SectionShell({
  number,
  title,
  hint,
  isOpen,
  onToggle,
  children,
}: {
  number: number
  title: string
  hint: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            {number}
          </span>
          <div>
            <div className="text-sm font-semibold text-slate-800">{title}</div>
            <div className="text-xs text-slate-400">{hint}</div>
          </div>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {isOpen && <div className="px-5 pb-5 pt-1 border-t border-slate-100">{children}</div>}
    </div>
  )
}

export default function SetupAccordion() {
  const [setup, setSetup] = useState<AuditSetup | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [openBank, setOpenBank] = useState<number | null>(0)

  useEffect(() => {
    client.get('/setup').then((res) => setSetup(res.data))
  }, [])

  if (!setup) return null

  function updateField(section: ObjectSectionKey, field: string, value: string) {
    setSetup((prev) => (prev ? { ...prev, [section]: { ...prev[section], [field]: value } } : prev))
  }

  function updateBank(index: number, field: string, value: string) {
    setSetup((prev) => {
      if (!prev) return prev
      const banking = prev.banking.map((b, i) => (i === index ? { ...b, [field]: value } : b))
      return { ...prev, banking }
    })
  }

  function addBank() {
    setSetup((prev) => {
      if (!prev) return prev
      setOpenBank(prev.banking.length)
      return { ...prev, banking: [...prev.banking, { ...EMPTY_BANK }] }
    })
  }

  function removeBank(index: number) {
    setSetup((prev) => (prev ? { ...prev, banking: prev.banking.filter((_, i) => i !== index) } : prev))
    setOpenBank(null)
  }

  async function saveSection(sectionKey: string) {
    if (!setup) return
    await client.put('/setup', setup)
    setSaved(sectionKey)
    setTimeout(() => setSaved(null), 2000)
  }

  function saveButton(sectionKey: string) {
    return (
      <button
        onClick={() => saveSection(sectionKey)}
        className="mt-4 flex items-center gap-1.5 rounded-lg bg-sky-600 text-white text-sm px-3 py-1.5 hover:bg-sky-700"
      >
        {saved === sectionKey ? <><Check size={14} /> Saved</> : 'Save'}
      </button>
    )
  }

  const sectionsBeforeBanking = SECTIONS.filter((s) => s.number < 4)
  const sectionsAfterBanking = SECTIONS.filter((s) => s.number > 4)

  function renderObjectSection(section: (typeof SECTIONS)[number]) {
    return (
      <SectionShell
        key={section.key}
        number={section.number}
        title={section.title}
        hint={section.hint}
        isOpen={open === section.key}
        onToggle={() => setOpen(open === section.key ? null : section.key)}
      >
        <div className="grid grid-cols-2 gap-3">
          {section.fields.map(([field, label]) => (
            <div key={field}>
              <label className="block text-xs text-slate-500 mb-1">{label}</label>
              <input
                value={setup![section.key][field] ?? ''}
                onChange={(e) => updateField(section.key, field, e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
              />
            </div>
          ))}
        </div>
        {saveButton(section.key)}
      </SectionShell>
    )
  }

  return (
    <div className="space-y-2">
      {sectionsBeforeBanking.map(renderObjectSection)}

      <SectionShell
        number={4}
        title="Banking Information"
        hint={`Bank Relationship Details · ${setup.banking.length} bank${setup.banking.length === 1 ? '' : 's'}`}
        isOpen={open === 'banking'}
        onToggle={() => setOpen(open === 'banking' ? null : 'banking')}
      >
        <div className="space-y-2 mt-2">
          {setup.banking.map((bank, i) => (
            <div key={i} className="rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setOpenBank(openBank === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50"
              >
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Landmark size={15} className="text-emerald-600" />
                  {bank.bank_name || 'New bank'}
                  {bank.account_name && <span className="text-xs text-slate-400">· {bank.account_name}</span>}
                </div>
                {openBank === i ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
              </button>
              {openBank === i && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-3">
                    {BANK_FIELDS.map(([field, label]) => (
                      <div key={field}>
                        <label className="block text-xs text-slate-500 mb-1">{label}</label>
                        <input
                          value={bank[field] ?? ''}
                          onChange={(e) => updateBank(i, field, e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => removeBank(i)}
                    className="mt-3 flex items-center gap-1.5 rounded-lg border border-rose-200 text-rose-600 text-xs px-2.5 py-1.5 hover:bg-rose-50"
                  >
                    <Trash2 size={13} /> Remove bank
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addBank}
            className="mt-4 flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 text-sm px-3 py-1.5 hover:bg-emerald-100"
          >
            <Plus size={14} /> Add bank
          </button>
          {saveButton('banking')}
        </div>
      </SectionShell>

      {sectionsAfterBanking.map(renderObjectSection)}
    </div>
  )
}
