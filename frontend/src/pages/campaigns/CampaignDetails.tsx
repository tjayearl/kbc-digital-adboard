import { Navigate, useParams } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { auditEvents, campaignTotals, campaigns, lineTotal, money } from '../../data/mockData';

const tabs = ['Overview', 'Pricing', 'Order Sheet', 'Gate Checks', 'Audit Log'];

export function CampaignDetails() {
  const { campaignId } = useParams();
  const campaign = campaigns.find((item) => item.id === campaignId);

  if (!campaign) return <Navigate to="/campaigns" replace />;

  const totals = campaignTotals(campaign);
  const events = auditEvents.filter((event) => event.campaignId === campaign.id);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg bg-white p-5 shadow-soft lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Badge tone="navy">{campaign.dabRef}</Badge>
          <h2 className="mt-3 text-2xl font-bold text-ink">{campaign.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{campaign.clientCompany} • Owner: {campaign.owner}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary">Raise DAB-CO</Button>
          <Button>Generate Order Sheet</Button>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2">
        {tabs.map((tab, index) => (
          <button key={tab} className={`min-h-11 shrink-0 rounded-lg px-4 text-sm font-semibold ${index === 0 ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            {tab}
          </button>
        ))}
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-bold text-ink">Overview</h3>
            </CardHeader>
            <CardBody className="grid gap-4 md:grid-cols-2">
              <Info label="Client Contact" value={`${campaign.clientName}, ${campaign.clientPhone}`} />
              <Info label="Email" value={campaign.clientEmail} />
              <Info label="Industry" value={campaign.industry} />
              <Info label="Campaign Dates" value={`${campaign.startDate} to ${campaign.endDate}`} />
              <div className="md:col-span-2">
                <Info label="Objective" value={campaign.objective} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-bold text-ink">Hard gate checks</h3>
              <p className="mt-1 text-sm text-slate-500">Brief unlock is blocked until every item is complete. Sales has no override.</p>
            </CardHeader>
            <CardBody className="grid gap-3 md:grid-cols-3">
              <GateCheck label="Signed Order Sheet uploaded" done={['Client Signed', 'Countersigned', 'Payment Confirmed', 'Brief Unlocked'].includes(campaign.status)} />
              <GateCheck label="Air-Time Order serial entered" done={campaign.status !== 'Draft'} />
              <GateCheck label="Deposit or LPO confirmed" done={campaign.paidDeposit} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-bold text-ink">Product breakdown</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              {campaign.products.map((line) => (
                <div key={line.id} className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <Badge tone="neutral">{line.category}</Badge>
                    <p className="mt-2 font-bold text-ink">{line.name}</p>
                    <p className="text-sm text-slate-500">{line.quantity.toLocaleString()} {line.unit}{line.platform ? ` • ${line.platform}` : ''}</p>
                  </div>
                  <p className="font-bold text-navy">{money.format(lineTotal(line))}</p>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-bold text-ink">Audit timeline</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="border-l-4 border-gold pl-4">
                  <p className="font-bold text-ink">{event.action}</p>
                  <p className="mt-1 text-sm text-slate-500">{event.user} • {event.role} • {event.timestamp}</p>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        <Card className="self-start">
          <CardHeader>
            <h3 className="text-lg font-bold text-ink">Pricing summary</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <Info label="Status" value={campaign.status} />
            <Info label="DAB Reference" value={campaign.dabRef} />
            <Info label="Air-Time Serial" value={campaign.status === 'Draft' ? 'Required before unlock' : 'ATO-2026-01482'} />
            <PriceRow label="Subtotal" value={money.format(totals.subtotal)} />
            <PriceRow label="Discount" value={`-${money.format(totals.discount)}`} />
            <PriceRow label="VAT 16%" value={money.format(totals.vat)} />
            <div className="rounded-lg bg-gold/15 p-4">
              <p className="text-sm font-semibold text-slate-700">Grand Total</p>
              <p className="mt-1 text-2xl font-bold text-[#73510f]">{money.format(totals.grandTotal)}</p>
            </div>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

function GateCheck({ label, done }: { label: string; done: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${done ? 'border-teal/30 bg-teal/10' : 'border-danger/20 bg-danger/10'}`}>
      <Badge tone={done ? 'teal' : 'danger'}>{done ? 'Complete' : 'Blocked'}</Badge>
      <p className="mt-3 text-sm font-bold text-ink">{label}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold text-ink">{value}</span>
    </div>
  );
}
