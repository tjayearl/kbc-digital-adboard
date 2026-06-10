import { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { auditEvents, approvals, campaignTotals, campaigns, lineTotal, money, productCatalog } from '../../data/mockData';
import { OrderSheetContent } from '../../components/campaigns/OrderSheetContent';

const tabs = ['Overview', 'Pricing', 'Order Sheet', 'Gate Checks', 'Audit Log'];

export function CampaignDetails() {
  const { campaignId } = useParams();
  const campaign = campaigns.find((item) => item.id === campaignId);
  const [activeTab, setActiveTab] = useState('Overview');

  const [showCoModal, setShowCoModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(productCatalog[0]?.id || '');
  const [coQuantity, setCoQuantity] = useState(1);
  const [coScope, setCoScope] = useState('');
  const [updateCount, setUpdateCount] = useState(0);

  if (!campaign) return <Navigate to="/campaigns" replace />;

  const totals = useMemo(() => {
    return campaignTotals(campaign);
  }, [campaign, updateCount]);

  const events = useMemo(() => {
    return auditEvents.filter((event) => event.campaignId === campaign.id);
  }, [campaign.id, updateCount]);

  const handleSubmitCo = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = productCatalog.find(p => p.id === selectedProductId);
    if (!prod || !campaign) return;

    const randNum = Math.floor(Math.random() * 90000 + 10000);
    const coRef = `DAB-CO-2026-${randNum}`;

    // Add to campaign products
    const newProductLine = {
      id: `p-co-${Date.now()}`,
      category: prod.category,
      name: `[CO: ${coRef}] ${prod.name}`,
      unit: prod.unit,
      quantity: coQuantity,
      unitPrice: prod.unitPrice,
    };
    campaign.products.push(newProductLine);

    // Update campaign status
    campaign.status = 'Discount Pending';

    // Push audit event
    auditEvents.push({
      id: `ev-co-${Date.now()}`,
      campaignId: campaign.id,
      action: `Change Order ${coRef} Raised (Scope: ${coScope || 'NIL'})`,
      user: 'Grace Mwangi',
      role: 'Sales',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    });

    // Push approval
    approvals.push({
      id: `ap-co-${Date.now()}`,
      campaignId: campaign.id,
      type: 'Discount',
      requestedBy: 'Grace Mwangi',
      value: prod.unitPrice * coQuantity,
      status: 'Pending',
      note: `Change Order ${coRef} scope addition: ${coScope || 'NIL'}`
    });

    alert(`Change Order ${coRef} raised successfully!\nCampaign status reset to Discount Pending for approval.`);
    setShowCoModal(false);
    setSelectedProductId(productCatalog[0].id);
    setCoQuantity(1);
    setCoScope('');
    setUpdateCount(prev => prev + 1);
    setActiveTab('Overview');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
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
            </div>

            
          </div>
        );

      case 'Pricing':
        return (
          <div className="max-w-3xl">
            <Card>
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
          </div>
        );

      case 'Order Sheet':
        return (
          <div className="space-y-6">
            <Card>
              <CardBody className="p-6 sm:p-8 bg-slate-50/50 rounded-lg">
                <OrderSheetContent campaign={campaign} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold text-ink">Locked PDF actions</h3>
                <p className="mt-1 text-sm text-slate-500">{campaign.dabRef}</p>
              </CardHeader>
              <CardBody className="flex flex-col gap-3 sm:flex-row">
                <Button className="w-full sm:w-auto">Download PDF</Button>
                <Button variant="secondary" className="w-full sm:w-auto">Print PDF</Button>
                <Button variant="secondary" className="w-full sm:w-auto">Share PDF</Button>
              </CardBody>
            </Card>
          </div>
        );

      case 'Gate Checks':
        return (
          <div className="max-w-4xl">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold text-ink">Hard gate checks</h3>
                <p className="mt-1 text-sm text-slate-500">Brief unlock is blocked until every item is complete. Sales has no override.</p>
              </CardHeader>
              <CardBody className="grid gap-4 md:grid-cols-3">
                <GateCheck label="Signed Order Sheet uploaded" done={['Client Signed', 'Countersigned', 'Payment Confirmed', 'Brief Unlocked'].includes(campaign.status)} />
                <GateCheck label="Air-Time Order serial entered" done={campaign.status !== 'Draft'} />
                <GateCheck label="Deposit or LPO confirmed" done={campaign.paidDeposit} />
              </CardBody>
            </Card>
          </div>
        );

      case 'Audit Log':
        return (
          <div className="max-w-3xl">
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
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg bg-white p-5 shadow-soft lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Badge tone="navy">{campaign.dabRef}</Badge>
          <h2 className="mt-3 text-2xl font-bold text-ink">{campaign.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{campaign.clientCompany} • Owner: {campaign.owner}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" onClick={() => setShowCoModal(true)}>Raise DAB-CO</Button>
          <Button onClick={() => setActiveTab('Order Sheet')}>Generate Order Sheet</Button>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`min-h-11 shrink-0 rounded-lg px-4 text-sm font-semibold transition-colors ${
              activeTab === tab ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {renderTabContent()}

      {showCoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <h3 className="text-lg font-bold text-ink">Raise Change Order (DAB-CO)</h3>
              <button
                type="button"
                onClick={() => setShowCoModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCo} className="mt-4 flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto pr-1.5 space-y-3.5 pb-2 min-h-0">
                <div className="rounded-lg bg-gold/10 border border-gold/30 p-3 text-xs text-[#73510f]">
                  <p className="font-bold">Original Campaign: {campaign.name}</p>
                  <p className="mt-1 font-semibold">Reference: {campaign.dabRef}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Select product to add *</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                  >
                    {productCatalog.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        [{prod.category}] {prod.name} — {money.format(prod.unitPrice)} / {prod.unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                      value={coQuantity}
                      onChange={(e) => setCoQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Unit</label>
                    <input
                      type="text"
                      disabled
                      className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500 outline-none"
                      value={productCatalog.find(p => p.id === selectedProductId)?.unit || ''}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Additional Scope / Reason *</label>
                  <textarea
                    required
                    placeholder="Explain why this change order is being raised and details of the scope change..."
                    className="w-full min-h-[60px] h-20 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                    value={coScope}
                    onChange={(e) => setCoScope(e.target.value)}
                  />
                </div>

                {/* Pricing Preview */}
                {(() => {
                  const prod = productCatalog.find(p => p.id === selectedProductId);
                  if (!prod) return null;
                  const sub = prod.unitPrice * coQuantity;
                  const vat = Math.round(sub * 0.16);
                  const total = sub + vat;
                  return (
                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-1.5 text-xs">
                      <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Pricing Preview</p>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Subtotal:</span>
                        <span className="font-bold text-ink">{money.format(sub)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">VAT (16%):</span>
                        <span className="font-bold text-ink">{money.format(vat)}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm">
                        <span className="font-semibold text-slate-700">Additional Total:</span>
                        <span className="font-bold text-navy">{money.format(total)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-3.5 shrink-0 mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCoModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Submit Change Order
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
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
