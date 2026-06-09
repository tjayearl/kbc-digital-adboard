import { ArrowRight, BadgeDollarSign, CheckCircle2, FilePlus2, FileText, Lock, Megaphone, PlusCircle, Signature } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { approvals, campaigns, campaignTotals, money, workflowStages, type Role } from '../../data/mockData';

type DashboardProps = {
  role: Role;
};

export function Dashboard({ role }: DashboardProps) {
  const activeCampaigns = campaigns.filter((campaign) => campaign.status !== 'Brief Unlocked').length;
  const pendingApprovals = approvals.filter((approval) => approval.status === 'Pending').length;
  const revenue = campaigns.reduce((sum, campaign) => sum + campaignTotals(campaign).grandTotal, 0);
  const awaitingSignatures = campaigns.filter((campaign) => ['Order Generated', 'Client Signed'].includes(campaign.status)).length;

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-navy px-5 py-6 text-white shadow-soft sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <Badge tone="gold" className="mb-4 bg-gold text-white ring-white/20">
              Mock {role} workspace
            </Badge>
            <h2 className="text-2xl font-bold sm:text-3xl">Clear, priced digital advertising orders from campaign brief to countersignature.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
              Phase 1 ships the Order Sheet slice: configured scope, locked rate-card pricing, discount approval, and a signed-ready DAB document.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/campaigns/new">
              <Button className="w-full bg-gold text-ink hover:bg-[#d5a43a]">
                <PlusCircle size={18} />
                New Campaign
              </Button>
            </Link>
            <Link to="/orders">
              <Button className="w-full bg-gold text-navy hover:bg-[#d5a43a]">
                <FileText size={18} />
                Order Sheets
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Campaigns" value={String(activeCampaigns)} detail="Across current pipeline" icon={Megaphone} />
        <StatCard label="Pending Approvals" value={String(pendingApprovals)} detail="Discounts and countersigns" icon={CheckCircle2} />
        <StatCard label="Revenue" value={money.format(revenue)} detail="Projected from mock orders" icon={BadgeDollarSign} />
        <StatCard label="Awaiting Signatures" value={String(awaitingSignatures)} detail="Client or manager action" icon={Signature} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-ink">Campaign pipeline</h3>
                <p className="mt-1 text-sm text-slate-500">Priority orders and next actions.</p>
              </div>
              <Link to="/campaigns" className="text-sm font-bold text-navy">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {campaigns.map((campaign) => (
              <Link key={campaign.id} to={`/campaigns/${campaign.id}`} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-gold/70 hover:bg-gold/5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-ink">{campaign.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{campaign.clientCompany}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={campaign.status.includes('Pending') ? 'gold' : campaign.status.includes('Payment') ? 'teal' : 'navy'}>{campaign.status}</Badge>
                  <ArrowRight size={18} className="text-slate-400" />
                </div>
              </Link>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold text-ink">Order Sheet gate</h3>
            <p className="mt-1 text-sm text-slate-500">Digital Ops unlocks only after all three checks are complete.</p>
          </CardHeader>
          <CardBody className="space-y-5">
            <div className="grid gap-3">
              {['Signed Order Sheet uploaded', 'Air-Time Order serial entered', 'Deposit or LPO confirmed'].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full ${index === 2 ? 'bg-gold/20 text-[#73510f]' : 'bg-teal/10 text-teal'}`}>
                    {index === 2 ? <Lock size={17} /> : <CheckCircle2 size={17} />}
                  </span>
                  <span className="text-sm font-semibold text-slate-700">{item}</span>
                </div>
              ))}
            </div>
            <Link to="/campaigns/new">
              <Button className="w-full justify-start">
                <FilePlus2 size={18} />
                Create campaign
              </Button>
            </Link>
            <Link to="/orders">
              <Button variant="secondary" className="w-full justify-start">
                <FileText size={18} />
                Generate order sheet
              </Button>
            </Link>
            <Link to="/approvals">
              <Button variant="secondary" className="w-full justify-start">
                <CheckCircle2 size={18} />
                Review approvals
              </Button>
            </Link>
          </CardBody>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold text-ink">Workflow spine</h3>
          <p className="mt-1 text-sm text-slate-500">The brief defines these stages as the product rules.</p>
        </CardHeader>
        <CardBody className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {workflowStages.map((stage, index) => (
            <div key={stage.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Badge tone={index < 4 ? 'navy' : 'teal'}>Stage {index + 1}</Badge>
              <p className="mt-3 font-bold text-ink">{stage.name}</p>
              <p className="mt-1 text-sm text-slate-500">{stage.description}</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-gold">SLA: {stage.sla}</p>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
