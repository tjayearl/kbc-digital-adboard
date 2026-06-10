import { useState } from 'react';
import { CheckCircle2, CreditCard, FileSignature, XCircle } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { approvals as mockApprovals, campaigns, campaignTotals, money } from '../../data/mockData';

const tabs = ['Pending Discounts', 'Awaiting Countersign', 'Payment Verification'];

// Map tab names to approval types
const tabToType: Record<string, string> = {
  'Pending Discounts': 'Discount',
  'Awaiting Countersign': 'Countersign',
  'Payment Verification': 'Payment',
};

export function ApprovalsPage() {
  // State for active tab and approvals (starts as copy of mock data)
  const [activeTab, setActiveTab] = useState('Pending Discounts');
  const [approvals, setApprovals] = useState(mockApprovals);

  // Get the type for current tab
  const currentType = tabToType[activeTab];

  // Filter approvals based on active tab AND only show pending ones
  const filteredApprovals = approvals.filter(
    (approval) => approval.type === currentType && approval.status === 'Pending'
  );

  // Handle approve
  const handleApprove = (approvalId: string) => {
    setApprovals((prev) =>
      prev.map((approval) =>
        approval.id === approvalId
          ? { ...approval, status: 'Approved' }
          : approval
      )
    );
  };

  // Handle reject
  const handleReject = (approvalId: string) => {
    setApprovals((prev) =>
      prev.map((approval) =>
        approval.id === approvalId
          ? { ...approval, status: 'Rejected' }
          : approval
      )
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Approval center</h2>
        <p className="mt-1 text-sm text-slate-500">
          Advertising manager queue for discounts, countersignatures, and payments.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`min-h-11 shrink-0 rounded-lg px-4 text-sm font-semibold transition-colors ${
              activeTab === tab
                ? 'bg-navy text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <section className="grid gap-4 xl:grid-cols-3">
        {filteredApprovals.length === 0 ? (
          <div className="col-span-full rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
            No pending approvals in this category
          </div>
        ) : (
          filteredApprovals.map((approval) => {
            const campaign = campaigns.find((item) => item.id === approval.campaignId);
            const totals = campaign ? campaignTotals(campaign) : null;
            const Icon =
              approval.type === 'Discount'
                ? CheckCircle2
                : approval.type === 'Countersign'
                ? FileSignature
                : CreditCard;

            return (
              <Card key={approval.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge
                        tone={
                          approval.status === 'Pending'
                            ? 'gold'
                            : approval.status === 'Approved'
                            ? 'teal'
                            : 'danger'
                        }
                      >
                        {approval.status}
                      </Badge>
                      <h3 className="mt-3 text-lg font-bold text-ink">
                        {approval.type}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {campaign?.name}
                      </p>
                    </div>
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-navy/10 text-navy">
                      <Icon size={21} />
                    </span>
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                      Requested by
                    </p>
                    <p className="mt-1 font-semibold text-ink">
                      {approval.requestedBy}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                      Value
                    </p>
                    <p className="mt-1 font-semibold text-ink">
                      {approval.type === 'Discount'
                        ? `${approval.value}%`
                        : money.format(approval.value)}
                    </p>
                  </div>
                  {approval.type === 'Discount' && totals ? (
                    <div className="rounded-lg bg-gold/10 p-3">
                      <PriceRow
                        label="Rate-card price"
                        value={money.format(totals.subtotal)}
                      />
                      <PriceRow
                        label="Concession value"
                        value={money.format(totals.discount)}
                      />
                      <PriceRow
                        label="Discounted excl. VAT"
                        value={money.format(totals.subtotal - totals.discount)}
                      />
                    </div>
                  ) : null}
                  <p className="text-sm text-slate-600">{approval.note}</p>
                  <div className="flex gap-3">
                    <Button
                      className="flex-1"
                      onClick={() => handleApprove(approval.id)}
                    >
                      <CheckCircle2 size={18} />
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      className="flex-1"
                      onClick={() => handleReject(approval.id)}
                    >
                      <XCircle size={18} />
                      Reject
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-xs">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="font-bold text-ink">{value}</span>
    </div>
  );
}
