import Header from '../components/Header'
import SetupAccordion from '../components/SetupAccordion'

export default function MasterDataPage() {
  return (
    <div>
      <Header
        title="Master Data Configuration"
        subtitle="Audit Setup (Cover Page) — engagement reference data, collected once during implementation."
      />

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 mb-6 text-sm text-emerald-900">
        This master data covers only what is <span className="font-semibold">not already available in the NAWRAS ERP</span>.
        Company, transactional and module data (GL, payroll, inventory, receivables, payables) flow directly from
        NAWRAS — here we maintain the engagement-specific reference data only: audit firm details, key contacts,
        bank relationships and legal advisors.
      </div>

      <SetupAccordion />
    </div>
  )
}
