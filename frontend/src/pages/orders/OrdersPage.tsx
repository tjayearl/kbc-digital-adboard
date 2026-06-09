import { Download, Lock, Printer, Share2 } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { campaignTotals, campaigns, lineTotal, money } from '../../data/mockData';

export function OrdersPage() {
  const campaign = campaigns[1];
  const totals = campaignTotals(campaign);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-ink">Order sheet preview</h2>
          <p className="mt-1 text-sm text-slate-500">Signed-ready, non-editable Order Sheet content for server-side PDF generation.</p>
        </div>

        <Card>
          <CardBody className="space-y-8 p-6 sm:p-8">
            <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Kenya Broadcasting Corporation</p>
                <h3 className="mt-2 text-2xl font-bold text-navy">Digital Advertising Order Sheet</h3>
                <p className="mt-1 text-sm text-slate-500">The Air-Time Order authorises budget. This Order Sheet defines exactly what that budget buys.</p>
              </div>
              <Badge tone="navy">{campaign.dabRef}</Badge>
            </header>

            <section className="grid gap-4 md:grid-cols-2">
              <DocumentBlock title="Client Details" rows={[['Company', campaign.clientCompany], ['Contact', campaign.clientName], ['Phone', campaign.clientPhone], ['Email', campaign.clientEmail]]} />
              <DocumentBlock title="Campaign Details" rows={[['Campaign', campaign.name], ['Objective', campaign.objective], ['Start Date', campaign.startDate], ['End Date', campaign.endDate]]} />
            </section>

            <section>
              <h4 className="text-lg font-bold text-ink">Product Breakdown</h4>
              <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {campaign.products.map((line) => (
                      <tr key={line.id}>
                        <td className="px-4 py-3 font-semibold">{line.name}</td>
                        <td className="px-4 py-3">{line.unit}</td>
                        <td className="px-4 py-3 text-right">{line.quantity.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold">{money.format(lineTotal(line))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <DocumentBlock title="Approved Discount Block" rows={[['Rate-card price', money.format(totals.subtotal)], ['Approved discount', `${campaign.discountPercent}%`], ['Concession value', money.format(totals.discount)], ['Reason', campaign.discountReason || 'NIL'], ['Approver', 'Advertising Manager signature required']]} />
              <DocumentBlock title="Totals" rows={[['Subtotal', money.format(totals.subtotal)], ['VAT 16%', money.format(totals.vat)], ['Grand Total', money.format(totals.grandTotal)]]} strongLast />
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <DocumentBlock title="Boosting Breakdown" rows={[['Platforms', 'Facebook, Instagram, KBC App'], ['Budget', 'NIL unless listed as a line item'], ['Treatment', 'Shown explicitly; never a footnote']]} />
              <DocumentBlock title="Unlock Requirements" rows={[['Signed scan', 'Required'], ['Air-Time serial', 'ATO-2026-01482'], ['Deposit / LPO', campaign.paidDeposit ? 'Confirmed' : 'Pending']]} />
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <SignatureBox label="Client Signature" />
              <SignatureBox label="Advertising Manager Signature" />
            </section>
          </CardBody>
        </Card>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="text-navy" size={20} />
              <h3 className="text-lg font-bold text-ink">Locked PDF actions</h3>
            </div>
            <p className="mt-1 text-sm text-slate-500">{campaign.dabRef}</p>
          </CardHeader>
          <CardBody className="grid gap-3">
            <Button>
              <Download size={18} />
              Download PDF
            </Button>
            <Button variant="secondary">
              <Printer size={18} />
              Print PDF
            </Button>
            <Button variant="secondary">
              <Share2 size={18} />
              Share PDF
            </Button>
          </CardBody>
        </Card>
      </aside>
    </div>
  );
}

function DocumentBlock({ title, rows, strongLast = false }: { title: string; rows: Array<[string, string]>; strongLast?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <h4 className="font-bold text-ink">{title}</h4>
      <dl className="mt-3 space-y-2">
        {rows.map(([label, value], index) => (
          <div key={label} className="grid grid-cols-[120px_1fr] gap-3 text-sm">
            <dt className="text-slate-500">{label}</dt>
            <dd className={strongLast && index === rows.length - 1 ? 'text-lg font-bold text-gold' : 'font-semibold text-ink'}>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SignatureBox({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-5">
      <p className="text-sm font-bold text-slate-600">{label}</p>
      <div className="mt-12 border-t border-slate-300 pt-2 text-xs text-slate-500">Name, signature, and date</div>
    </div>
  );
}
