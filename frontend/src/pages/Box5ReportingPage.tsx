import { Printer, Construction } from 'lucide-react'
import client from '../api/client'
import Header from '../components/Header'
import BoxRequirements from '../components/BoxRequirements'
import { formatSAR } from '../utils/format'
import type { StatementResponse, Note } from '../types'

const IFRS_TITLES: Record<string, string> = {
  BS: 'Statement of Financial Position',
  IS: 'Statement of Profit or Loss and Other Comprehensive Income',
}

function renderStatementHtml(title: string, data: StatementResponse): string {
  const sections = Object.entries(data.sections)
    .map(([section, lines]) => {
      const rows = lines
        .map(
          (l) =>
            `<tr><td class="li">${l.line_item}</td><td class="amt">${formatSAR(l.amount)}</td></tr>`,
        )
        .join('')
      return `<tr class="sec"><td colspan="2">${section}</td></tr>${rows}`
    })
    .join('')
  return `
    <h2>${title}</h2>
    <div class="asat">As at 31 December 2025 (expressed in Saudi Riyals)</div>
    <table>
      <thead><tr><th>Note</th><th class="amt">2025</th></tr></thead>
      <tbody>
        ${sections}
        <tr class="total"><td>Total</td><td class="amt">${formatSAR(data.total)}</td></tr>
      </tbody>
    </table>`
}

export default function Box5ReportingPage() {
  async function printIFRS() {
    const [bs, is, notesRes, setupRes] = await Promise.all([
      client.get('/box5/statements/BS'),
      client.get('/box5/statements/IS'),
      client.get('/box5/notes'),
      client.get('/setup'),
    ])
    const company = setupRes.data?.company?.company_name ?? 'Obeikan Plastic'
    const notesHtml = (notesRes.data as Note[])
      .map((n, i) => `<p class="note"><b>${i + 1}. ${n.title}</b><br/>${n.body}</p>`)
      .join('')
    const w = window.open('', '_blank', 'width=820,height=1000')
    if (!w) return
    w.document.write(`<!doctype html><html><head><title>${company} — Financial Statements 2025</title>
      <style>
        body { font-family: Georgia, 'Times New Roman', serif; color:#111; margin:48px; }
        .cover { text-align:center; margin-bottom:40px; }
        .cover h1 { font-size:22px; margin:0 0 6px; }
        .cover .sub { color:#555; font-size:13px; }
        .ifrs { font-size:11px; letter-spacing:1px; color:#777; text-transform:uppercase; margin-top:8px; }
        h2 { font-size:15px; border-bottom:2px solid #111; padding-bottom:4px; margin:34px 0 4px; }
        .asat { color:#555; font-size:12px; margin-bottom:10px; }
        table { width:100%; border-collapse:collapse; font-size:13px; }
        th { text-align:left; color:#555; font-size:11px; border-bottom:1px solid #999; padding:4px 0; }
        th.amt, td.amt { text-align:right; }
        td { padding:4px 0; }
        td.li { padding-left:16px; }
        tr.sec td { font-weight:bold; padding-top:10px; text-transform:uppercase; font-size:11px; color:#333; }
        tr.total td { border-top:2px solid #111; font-weight:bold; padding-top:6px; }
        .note { font-size:12px; line-height:1.5; margin:0 0 10px; }
        @media print { body { margin:24px; } }
      </style></head><body>
      <div class="cover">
        <h1>${company}</h1>
        <div class="sub">Financial Statements for the year ended 31 December 2025</div>
        <div class="ifrs">Prepared in accordance with IFRS as endorsed in Saudi Arabia (SOCPA)</div>
      </div>
      ${renderStatementHtml(IFRS_TITLES.BS, bs.data)}
      ${renderStatementHtml(IFRS_TITLES.IS, is.data)}
      <h2>Notes to the Financial Statements</h2>
      ${notesHtml}
      </body></html>`)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 400)
  }

  return (
    <div>
      <Header
        title="5 · Financial Reporting"
        subtitle="Assembled statements and notes — every line traces back through the reports, GL, confirmations and documents."
      />

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-16 text-center">
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 mb-4">
          <Construction size={28} />
        </span>
        <div className="text-lg font-semibold text-slate-800 mb-1">Under development</div>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          The financial statements and notes will populate here once the General Ledger module is
          connected to the NAWRAS ERP. Meanwhile, the full IFRS-format statements can be produced with
          one click.
        </p>
        <button
          onClick={printIFRS}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white text-sm px-4 py-2 hover:bg-emerald-700"
        >
          <Printer size={16} /> One-click IFRS report printing
        </button>
      </div>

      <BoxRequirements box="box5" />
    </div>
  )
}
