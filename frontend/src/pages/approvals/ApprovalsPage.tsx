import { useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, FileSignature, XCircle, Lock } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { campaignTotals, money, type Role, type Campaign, type Approval } from '../../data/mockData';
import { getCampaigns, reviewDiscount, countersignOrderSheet, confirmPayment, updateCampaign } from '../../services/api';

const tabs = ['Pending Discounts', 'Awaiting Countersign', 'Payment Verification'];

const tabToType: Record<string, string> = {
  'Pending Discounts': 'Discount',
  'Awaiting Countersign': 'Countersign',
  'Payment Verification': 'Payment',
};

export function ApprovalsPage() {
  const { role, currentUser } = useOutletContext<{ role: Role; currentUser?: any }>();

  const [activeTab, setActiveTab] = useState('Pending Discounts');
  const [campaignList, setCampaignList] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    getCampaigns()
      .then((data) => {
        setCampaignList(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [updateCount]);

  if (role !== 'adManager' && role !== 'admin') {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center p-6 bg-white rounded-lg border border-slate-200 shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger mb-4">
          <Lock size={28} />
        </div>
        <h3 className="text-xl font-bold text-ink">Access Denied</h3>
        <p className="mt-2 text-sm text-slate-500 max-w-sm leading-relaxed">
          You do not have permission to access the Approval Center. This page is restricted to the Advertising Manager.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  // Dynamically build approvals from campaign list
  const approvalsList: Approval[] = [];
  campaignList.forEach((c) => {
    if (c.status === 'Discount Pending') {
      approvalsList.push({
        id: `ap-disc-${c.id}`,
        campaignId: c.id,
        type: 'Discount',
        requestedBy: c.owner || 'Sales Rep',
        value: c.discountPercent || 0,
        status: 'Pending',
        note: c.discountReason || 'Discount request pending review.'
      });
    } else if (c.status === 'Client Signed') {
      approvalsList.push({
        id: `ap-cs-${c.id}`,
        campaignId: c.id,
        type: 'Countersign',
        requestedBy: c.owner || 'Sales Rep',
        value: campaignTotals(c).grandTotal,
        status: 'Pending',
        note: 'Order Sheet signed by client. Ready for countersigning.'
      });
    } else if (c.status === 'Countersigned') {
      approvalsList.push({
        id: `ap-pay-${c.id}`,
        campaignId: c.id,
        type: 'Payment',
        requestedBy: c.owner || 'Sales Rep',
        value: Math.round(campaignTotals(c).grandTotal * 0.5),
        status: 'Pending',
        note: 'Deposit payment receipt uploaded by client. Please verify.'
      });
    }
  });

  const currentType = tabToType[activeTab];

  const filteredApprovals = approvalsList.filter(
    (approval) => approval.type === currentType && approval.status === 'Pending'
  );

  const handleApprove = (approval: Approval) => {
    const campaign = campaignList.find((c) => c.id === approval.campaignId);
    if (!campaign) return;

    if (approval.type === 'Discount') {
      reviewDiscount(campaign.id, 'approve', 'Discount Approved by Advertising Manager')
        .then(() => {
          alert('Discount Approved successfully!');
          setUpdateCount(prev => prev + 1);
        })
        .catch((err) => {
          alert(`Failed to approve discount: ${err.message || err}`);
        });
    } else if (approval.type === 'Countersign') {
      countersignOrderSheet(campaign.id)
        .then(() => {
          alert('Order Countersigned successfully!');
          setUpdateCount(prev => prev + 1);
        })
        .catch((err) => {
          alert(`Failed to countersign: ${err.message || err}`);
        });
    } else if (approval.type === 'Payment') {
      confirmPayment(campaign.id)
        .then(() => {
          alert('Payment Verified successfully!\nCampaign brief unlocked for operations.');
          setUpdateCount(prev => prev + 1);
        })
        .catch((err) => {
          alert(`Failed to verify payment: ${err.message || err}`);
        });
    }
  };

  const handleReject = (approval: Approval) => {
    const campaign = campaignList.find((c) => c.id === approval.campaignId);
    if (!campaign) return;

    if (approval.type === 'Discount') {
      reviewDiscount(campaign.id, 'reject', 'Discount Rejected by Advertising Manager')
        .then(() => {
          alert('Discount request rejected.');
          setUpdateCount(prev => prev + 1);
        })
        .catch((err) => {
          alert(`Failed to reject discount: ${err.message || err}`);
        });
    } else {
      // For Countersign/Payment, reject them by reverting status back to draft or custom status
      updateCampaign(campaign.id, { ...campaign, status: 'Draft' as any })
        .then(() => {
          alert(`${approval.type} request rejected. Campaign reverted to Draft.`);
          setUpdateCount(prev => prev + 1);
        })
        .catch((err) => {
          alert(`Failed to reject approval request: ${err.message || err}`);
        });
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
            const campaign = campaignList.find((item) => item.id === approval.campaignId);
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
                    {approval.type === 'Discount' ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="w-20 rounded border border-slate-200 px-2 py-1 text-sm font-semibold text-ink outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                          value={approval.value}
                          onChange={(e) => {
                            const val = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                            if (campaign) {
                              updateCampaign(campaign.id, { ...campaign, discountPercent: val })
                                .then(() => {
                                  setUpdateCount(prev => prev + 1);
                                })
                                .catch(err => console.error(err));
                            }
                          }}
                        />
                        <span className="text-sm font-bold text-slate-500">%</span>
                      </div>
                    ) : (
                      <p className="mt-1 font-semibold text-ink">
                        {money.format(approval.value)}
                      </p>
                    )}
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
                      onClick={() => handleApprove(approval)}
                    >
                      <CheckCircle2 size={18} />
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      className="flex-1"
                      onClick={() => handleReject(approval)}
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
