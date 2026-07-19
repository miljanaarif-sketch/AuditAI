import { Construction } from 'lucide-react'
import Header from '../components/Header'
import BoxRequirements from '../components/BoxRequirements'
import BankReconciliationPanel from '../components/BankReconciliation'

export default function Box4ModulesPage() {
  return (
    <div>
      <Header
        title="4 · Operational Reports & Reconciliations"
        subtitle="Reports from the operational modules — Production, Payroll & HR, Procurement, Sales, Treasury and Tax — reconciled against the General Ledger."
      />

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 flex items-start gap-4">
        <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-amber-50 text-amber-500 shrink-0">
          <Construction size={22} />
        </span>
        <div>
          <div className="text-sm font-semibold text-slate-800 mb-1">Reconciliation engine — to be developed</div>
          <p className="text-sm text-slate-500">
            Automated tie-out of each module report to its GL balance will connect to the NAWRAS ERP.
            The required operational reports are organised into folders below.
          </p>
        </div>
      </div>

      <BankReconciliationPanel />

      <BoxRequirements box="box4" title="Required Operational Reports" />
    </div>
  )
}
