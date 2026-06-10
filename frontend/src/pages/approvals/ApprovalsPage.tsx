import { useState } from 'react';
import { CheckCircle2, CreditCard, FileSignature, XCircle } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { approvals as mockApprovals, campaigns, campaignTotals, money, auditEvents } from '../../data/mockData';

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
    // 1. Update the local state
    setApprovals((prev) =>
      prev.map((approval) =>
        approval.id === approvalId
          ? { ...approval, status: 'Approved' }
          : approval
      )
    );

    // 2. Find the approval in mockData and update it
    const approval = mockApprovals.find((a) => a.id === approvalId);
    if (!approval) return;
    approval.status = 'Approved';

    // 3. Find the campaign
    const campaign = campaigns.find((c) => c.id === approval.campaignId);
    if (!campaign) return;

    // 4. Handle workflow progression based on approval type
    if (approval.type === 'Discount') {
      // Transition campaign status
      campaign.status = 'Discount Approved';
      
      // Log audit events
      auditEvents.push({
        id: `ev-app-${Date.now()}-1`,
        campaignId: campaign.id,
        action: 'Discount Approved by Advertising Manager',
        user: 'Mary Njeri',
        role: 'Advertising Manager',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });

      auditEvents.push({
        id: `ev-app-${Date.now()}-2`,
        campaignId: campaign.id,
        action: 'Order Sheet Generated & Shared',
        user: 'Grace Mwangi',
        role: 'Sales',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });

      auditEvents.push({
        id: `ev-app-${Date.now()}-3`,
        campaignId: campaign.id,
        action: 'Client Signed Order Sheet',
        user: 'Peter Otieno',
        role: 'Sales',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });

      // Shift to Client Signed (which triggers Awaiting Countersign)
      campaign.status = 'Client Signed';

      // Push a new Countersign approval request to mock data
      const nextApproval = {
        id: `ap-cs-${Date.now()}`,
        campaignId: campaign.id,
        type: 'Countersign' as const,
        requestedBy: 'Grace Mwangi',
        value: campaignTotals(campaign).grandTotal,
        status: 'Pending' as const,
        note: 'Order Sheet signed by client. Ready for countersigning.',
      };
      mockApprovals.push(nextApproval);

      // Add to local state so the UI updates
      setApprovals((prev) => [...prev, nextApproval]);

      alert('Discount Approved!\nCampaign updated to Client Signed.\nCountersign request generated.');

    } else if (approval.type === 'Countersign') {
      campaign.status = 'Countersigned';

      auditEvents.push({
        id: `ev-app-${Date.now()}-1`,
        campaignId: campaign.id,
        action: 'Order Countersigned by Advertising Manager',
        user: 'Mary Njeri',
        role: 'Advertising Manager',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });

      auditEvents.push({
        id: `ev-app-${Date.now()}-2`,
        campaignId: campaign.id,
        action: 'Deposit Invoice Issued',
        user: 'Mary Njeri',
        role: 'Advertising Manager',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });

      auditEvents.push({
        id: `ev-app-${Date.now()}-3`,
        campaignId: campaign.id,
        action: 'Client Paid Deposit (Verification Pending)',
        user: 'Peter Otieno',
        role: 'Sales',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });

      // Push a new Payment approval request to mock data
      const nextApproval = {
        id: `ap-pay-${Date.now()}`,
        campaignId: campaign.id,
        type: 'Payment' as const,
        requestedBy: 'Grace Mwangi',
        value: Math.round(campaignTotals(campaign).grandTotal * 0.5), // 50% deposit
        status: 'Pending' as const,
        note: 'Deposit payment receipt uploaded by client. Please verify.',
      };
      mockApprovals.push(nextApproval);

      // Add to local state
      setApprovals((prev) => [...prev, nextApproval]);

      alert('Order Countersigned!\nDeposit invoice issued and client paid receipt.\nPayment verification request generated.');

    } else if (approval.type === 'Payment') {
      campaign.status = 'Payment Confirmed';
      campaign.paidDeposit = true;

      auditEvents.push({
        id: `ev-app-${Date.now()}-1`,
        campaignId: campaign.id,
        action: 'Payment Receipt Verified by Finance',
        user: 'Mary Njeri',
        role: 'Advertising Manager',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });

      auditEvents.push({
        id: `ev-app-${Date.now()}-2`,
        campaignId: campaign.id,
        action: 'Campaign Brief Unlocked',
        user: 'Mary Njeri',
        role: 'Advertising Manager',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });

      // Shift campaign status to Brief Unlocked
      campaign.status = 'Brief Unlocked';

      alert('Payment Verified!\nCampaign deposit confirmed and Campaign Brief unlocked for digital scheduling.');
    }
  };

  // Handle reject
  const handleReject = (approvalId: string) => {
    // 1. Update local state
    setApprovals((prev) =>
      prev.map((approval) =>
        approval.id === approvalId
          ? { ...approval, status: 'Rejected' }
          : approval
      )
    );

    // 2. Find and update mock data
    const approval = mockApprovals.find((a) => a.id === approvalId);
    if (!approval) return;
    approval.status = 'Rejected';

    // 3. Find campaign
    const campaign = campaigns.find((c) => c.id === approval.campaignId);
    if (!campaign) return;

    // 4. Handle rejection status
    if (approval.type === 'Discount') {
      campaign.status = 'Brief Unlocked';
      auditEvents.push({
        id: `ev-rej-${Date.now()}`,
        campaignId: campaign.id,
        action: 'Discount Rejected by Advertising Manager',
        user: 'Mary Njeri',
        role: 'Advertising Manager',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });
      alert('Discount request rejected.');
    } else {
      auditEvents.push({
        id: `ev-rej-${Date.now()}`,
        campaignId: campaign.id,
        action: `${approval.type} Rejected by Advertising Manager`,
        user: 'Mary Njeri',
        role: 'Advertising Manager',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });
      alert(`${approval.type} request rejected.`);
    }
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
