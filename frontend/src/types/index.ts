export interface InternalDocument {
  id: string
  category: string
  name: string
  version: number
  filename: string
  uploaded_at: string
  is_current: boolean
  owner: string
  owner_email: string
  folder: string | null
  doc_status: 'uploaded' | 'pending' | 'expired' | 'oig'
  level: 'OIG' | 'BU'
}

export interface BankReconciliation {
  id: string
  bank: string
  account: string
  book_balance: number
  bank_statement_balance: number
  items: { label: string; amount: number }[]
  adjusted_book_balance: number
  difference: number
}

export interface MailLogEntry {
  at: string
  type: 'sent' | 'received'
  text: string
}

export interface Confirmation {
  id: string
  type: 'customer' | 'supplier' | 'bank' | 'related_party' | 'legal'
  party_name: string
  gl_balance: number
  status: 'not_sent' | 'sent' | 'received' | 'matched' | 'difference'
  confirmed_amount: number | null
  difference: number | null
  letter_text: string | null
  sent_date: string | null
  received_date: string | null
  send_stage: 'generate' | 'approved' | 'sent'
  mail_log: MailLogEntry[]
}

export interface GLAccount {
  id: string
  code: string
  name: string
  category: string
  balance: number
  expected_doc_types: string[]
  attached_doc_count: number
  missing_evidence: boolean
}

export interface Journal {
  id: string
  account_id: string
  date: string
  description: string
  debit: number
  credit: number
  source: 'manual' | 'system'
  has_approval: boolean
  flags: string[]
}

export interface SourceDocument {
  id: string
  journal_id: string
  doc_type: string
  filename: string
  uploaded_at: string
}

export interface JeTestingStats {
  total: number
  manual: number
  system: number
  manual_pct: number
  system_pct: number
  flagged_count: number
  flagged: Journal[]
}

export interface ModuleReport {
  id: string
  module: string
  gl_account_id: string
  gl_account_name: string
  gl_account_code: string
  module_balance: number
  gl_balance: number
  threshold_amount: number
  variance: number
  variance_pct: number
  status: 'ok' | 'flagged'
}

export interface StatementLine {
  id: string
  statement: string
  section: string
  line_item: string
  amount: number
  gl_account_ids: string[]
  contributing_module: string | null
}

export interface StatementResponse {
  statement: string
  sections: Record<string, StatementLine[]>
  total: number
}

export interface Note {
  title: string
  body: string
}

export interface AnnexureItem {
  id: string
  linked_box: string
  folder: string
  folder_order: number
  folder_note: string | null
  item_name: string
  status: 'missing' | 'uploaded' | 'reviewed'
}

export interface AnnexureGroup {
  linked_box: string
  folder: string
  folder_order: number
  folder_note: string | null
  folder_group: string | null
  items: AnnexureItem[]
}

export interface BoxProgress {
  section: string
  weight: number
  pct: number
}

export interface PendingAction {
  priority: 'high' | 'medium' | 'low'
  item: string
  owner: string
  due: string
}

export interface AuditSetup {
  company: Record<string, string>
  audit_team: Record<string, string>
  contacts: Record<string, string>
  banking: Record<string, string>[]
  legal: Record<string, string>
}

export interface DashboardSummary {
  progress: BoxProgress[]
  overall_pct: number
  pending_actions: PendingAction[]
  box1: { documents: number }
  box2: { total: number; matched: number; outstanding: number }
  box3: { accounts: number; missing_evidence: number }
  box4: { reports: number; flagged: number }
  box5: { statements: number }
  annexure: { total: number; reviewed: number; progress_pct: number }
}
