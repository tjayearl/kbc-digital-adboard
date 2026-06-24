import { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams, useOutletContext, useNavigate, Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { campaignTotals, lineTotal, money, productCatalog, rateCard, type Role, type Campaign, type AuditEvent } from '../../data/mockData';
import { OrderSheetContent } from '../../components/campaigns/OrderSheetContent';
import { FileText, Download, Upload, Trash2 } from 'lucide-react';
import { getCampaign, deleteCampaign, updateCampaign, createChangeOrder, requestDiscount, generateOrderSheet, downloadOrderSheetPdf, uploadSignedSheet, getCampaignAudit, BASE_URL, getAuthHeaders } from '../../services/api';
import { downloadBlob, orderSheetFilename, printBlob, shareOrderSheet } from '../../utils/pdfActions';

const tabs = ['Overview', 'Pricing', 'Order Sheet', 'Gate Checks', 'Reports', 'Audit Log'];

export function CampaignDetails() {
  const { role, currentUser, users } = useOutletContext<{ role: Role; currentUser?: any; users?: any[] }>();
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Overview');

  const [showCoModal, setShowCoModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(productCatalog[0]?.id || '');
  const [coQuantity, setCoQuantity] = useState(1);
  const [coScope, setCoScope] = useState('');
  const [updateCount, setUpdateCount] = useState(0);

  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [generating, setGenerating] = useState(false);

  const [airtimeSerial, setAirtimeSerial] = useState('');
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [uploadingSigned, setUploadingSigned] = useState(false);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (campaignId) {
      setLoading(true);
      Promise.all([getCampaign(campaignId), getCampaignAudit(campaignId)])
        .then(([campaignData, auditData]) => {
          setCampaign(campaignData);
          setAuditEvents(auditData);
          setError(null);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError('Failed to fetch campaign details.');
          setLoading(false);
        });
    }
  }, [campaignId, updateCount]);

  const handleDeleteCampaign = () => {
    if (!campaign) return;
    if (confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      deleteCampaign(campaign.id)
        .then(() => {
          alert('Campaign deleted successfully.');
          navigate('/campaigns');
        })
        .catch((err) => {
          alert(`Failed to delete campaign: ${err.message || err}`);
        });
    }
  };

  const totals = useMemo(() => {
    return campaign ? campaignTotals(campaign) : { subtotal: 0, boosting: 0, discount: 0, vat: 0, grandTotal: 0 };
  }, [campaign, updateCount]);

  const events = useMemo<AuditEvent[]>(() => {
    return auditEvents.map((e: any) => ({
      id: e.logId || e.id,
      campaignId: e.campaignId,
      action: e.action,
      user: users?.find(u => u.id === e.actor || u.id === `usr-fb-${e.actor}` || u.id.includes(e.actor))?.name || e.actor,
      role: e.role,
      timestamp: new Date(e.timestamp).toLocaleString(),
    }));
  }, [auditEvents, users]);

  const handleSubmitCo = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = productCatalog.find(p => p.id === selectedProductId);
    if (!prod || !campaign) return;

    const randNum = Math.floor(Math.random() * 90000 + 10000);
    const coRef = `DAB-CO-2026-${randNum}`;

    // Add to campaign products locally to calculate
    const newProductLine = {
      id: `p-co-${Date.now()}`,
      category: prod.category,
      name: `[CO: ${coRef}] ${prod.name}`,
      unit: prod.unit,
      quantity: coQuantity,
      unitPrice: prod.unitPrice,
    };

    const updatedProducts = [...campaign.products, newProductLine];
    const subtotal = coQuantity * prod.unitPrice;
    const vat = Math.round(subtotal * 0.16);

    const coPayload = {
      parentCampaignId: campaign.id,
      additionalLineItems: [{
        productId: prod.id,
        productName: `[CO: ${coRef}] ${prod.name}`,
        platform: '',
        quantity: coQuantity,
        postsPerDay: 1,
        unitPrice: prod.unitPrice,
        totalPrice: subtotal
      }],
      totals: {
        subtotal: subtotal,
        vatAmount: vat,
        grandTotal: subtotal + vat,
        discountValue: 0
      },
      reason: coScope || 'NIL'
    };

    createChangeOrder(coPayload)
      .then(() => {
        const updatedCampaign: Partial<Campaign> = {
          ...campaign,
          products: updatedProducts,
          status: 'Discount Pending' as any
        };
        return updateCampaign(campaign.id, updatedCampaign);
      })
      .then(() => {
        alert(`Change Order ${coRef} raised successfully!\nCampaign status reset to Discount Pending for approval.`);
        setShowCoModal(false);
        setSelectedProductId(productCatalog[0]?.id || '');
        setCoQuantity(1);
        setCoScope('');
        setUpdateCount(prev => prev + 1);
        setActiveTab('Overview');
      })
      .catch((err) => {
        console.error(err);
        alert(`Failed to submit Change Order: ${err.message || err}`);
      });
  };

  const handleDownloadPDF = async () => {
    if (!campaign) return;
    if (!campaign.orderSheetPdfUrl) {
      alert("Order Sheet PDF has not been generated yet.");
      return;
    }

    try {
      const blob = await downloadOrderSheetPdf(campaign.id);
      downloadBlob(blob, orderSheetFilename(campaign));
    } catch (err) {
      console.error("Failed to download PDF:", err);
      alert(`Failed to download PDF: ${(err as Error).message || err}`);
    }
  };

  const handlePrintPDF = async () => {
    if (!campaign) return;
    if (!campaign.orderSheetPdfUrl) {
      alert("Order Sheet PDF has not been generated yet.");
      return;
    }

    const printWindow = window.open('', '_blank');
    try {
      const blob = await downloadOrderSheetPdf(campaign.id);
      printBlob(blob, campaign.orderSheetPdfUrl, printWindow);
    } catch (err) {
      console.error("Failed to print PDF:", err);
      if (printWindow) {
        printWindow.location.href = campaign.orderSheetPdfUrl;
      } else {
        window.open(campaign.orderSheetPdfUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleSharePDF = async () => {
    if (!campaign) return;
    if (!campaign.orderSheetPdfUrl) {
      alert("Order Sheet PDF has not been generated yet.");
      return;
    }
    await shareOrderSheet(campaign);
  };

  const handleGenerateOrderSheet = () => {
    if (!campaign) return;
    setGenerating(true);
    generateOrderSheet(campaign.id)
      .then((res) => {
        alert("Order Sheet PDF generated successfully! Starting download...");
        setUpdateCount(prev => prev + 1);
        
        return downloadOrderSheetPdf(campaign.id)
          .then((blob) => downloadBlob(blob, `${res.dabRef || campaign.dabRef || campaign.id}_Order_Sheet.pdf`))
          .catch((err) => {
            console.error("Failed to download PDF directly:", err);
            if (res.pdfUrl) window.open(res.pdfUrl, '_blank', 'noopener,noreferrer');
          });
      })
      .catch((err) => {
        console.error(err);
        alert(`Failed to generate Order Sheet: ${err.message || err}`);
      })
      .finally(() => {
        setGenerating(false);
      });
  };

  const handleUploadSignedSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign || !airtimeSerial || !signedFile) {
      alert("Please select a file and enter the Air-Time Order serial number.");
      return;
    }
    setUploadingSigned(true);
    uploadSignedSheet(campaign.id, airtimeSerial, signedFile)
      .then((res: any) => {
        alert("Signed Order Sheet uploaded successfully!");
        setUpdateCount(prev => prev + 1);
        setSignedFile(null);
        setAirtimeSerial('');
      })
      .catch((err: any) => {
        console.error(err);
        alert(`Failed to upload signed sheet: ${err.message || err}`);
      })
      .finally(() => {
        setUploadingSigned(false);
      });
  };

  const handleRequestDiscount = () => {
    if (!campaign) return;
    requestDiscount(campaign.id, discountPercent, discountReason)
      .then(() => {
        alert("Discount request submitted successfully!");
        setShowDiscountModal(false);
        setUpdateCount(prev => prev + 1);
      })
      .catch((err) => {
        console.error(err);
        alert(`Failed to request discount: ${err.message || err}`);
      });
  };

  const handleSubmitForApproval = () => {
    if (!campaign) return;
    const targetStatus = (campaign.discountPercent || 0) > 0 ? 'Discount Pending' : 'Discount Approved';
    updateCampaign(campaign.id, { ...campaign, status: targetStatus })
      .then(() => {
        alert(targetStatus === 'Discount Pending' 
          ? "Campaign submitted for discount approval successfully!" 
          : "Campaign finalized successfully! You can now generate the Order Sheet."
        );
        setUpdateCount(prev => prev + 1);
      })
      .catch((err) => {
        console.error(err);
        alert(`Failed to submit campaign: ${err.message || err}`);
      });
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  if (error || !campaign) {
    return <Navigate to="/campaigns" replace />;
  }

  // Digital Ops reads docs at status >= briefUnlocked
  if (role === 'digitalOps' && campaign.status !== 'Brief Unlocked') {
    return <Navigate to="/campaigns" replace />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-bold text-ink">Client Details</h3>
                </CardHeader>
                <CardBody className="grid gap-4 sm:grid-cols-2">
                  <Info label="Contact Person" value={campaign.clientName} />
                  <Info label="Job Title" value={campaign.contactJobTitle || '—'} />
                  <Info label="Email Address" value={campaign.clientEmail} />
                  <Info label="Phone Number" value={campaign.clientPhone} />
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-bold text-ink">Company Details</h3>
                </CardHeader>
                <CardBody className="grid gap-4 sm:grid-cols-2">
                  <Info label="Company Name" value={campaign.clientCompany} />
                  <Info label="Industry / Sector" value={campaign.industry || '—'} />
                  <Info label="KRA PIN" value={campaign.kraPin || '—'} />
                  <Info label="Booking Type" value={campaign.bookingType || '—'} />
                  <div className="sm:col-span-2">
                    <Info label="Billing Address" value={campaign.billingAddress || '—'} />
                  </div>
                </CardBody>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-bold text-ink">Campaign Brief</h3>
                </CardHeader>
                <CardBody className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Info label="Campaign Name" value={campaign.name} />
                  </div>
                  <Info label="Start Date" value={campaign.startDate} />
                  <Info label="End Date" value={campaign.endDate} />
                  <div className="sm:col-span-2">
                    <Info label="Campaign Objective" value={campaign.objective || '—'} />
                  </div>
                  <div className="sm:col-span-2">
                    <Info label="Description" value={campaign.campaignDescription || '—'} />
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

      case 'Reports':
        return (
          <div className="max-w-3xl">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold text-ink">Campaign report</h3>
                <p className="text-sm text-slate-500 mt-1">Upload and manage post-campaign execution reports.</p>
              </CardHeader>
              <CardBody className="space-y-4">
                {campaign.reportFile ? (
                  <div className="rounded-lg border border-teal/20 bg-teal/10 p-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Report</p>
                    <p className="text-sm font-bold text-teal flex items-center gap-1.5 animate-in fade-in duration-200">
                      <FileText size={16} /> {campaign.reportFile}
                    </p>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="secondary" 
                        className="h-9 text-xs px-2.5" 
                        onClick={() => {
                          alert(`Downloading report: ${campaign.reportFile}`);
                        }}
                      >
                        <Download size={14} /> Download
                      </Button>
                      {(role === 'digitalOps' || role === 'admin' || role === 'sales') && (
                        <Button 
                          variant="danger" 
                          className="h-9 text-xs px-2.5"
                          onClick={() => {
                            updateCampaign(campaign.id, { ...campaign, reportFile: undefined })
                              .then(() => {
                                setUpdateCount(prev => prev + 1);
                                alert('Report file removed.');
                              })
                              .catch(err => {
                                alert(`Failed to remove report: ${err.message || err}`);
                              });
                          }}
                        >
                          <Trash2 size={14} /> Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
                    <p className="text-sm text-slate-500 italic">No custom report file uploaded.</p>
                    {(role === 'digitalOps' || role === 'admin' || role === 'sales') && (
                      <div className="mt-3 flex justify-center">
                        <input
                          type="file"
                          id="detail-report-upload"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              updateCampaign(campaign.id, { ...campaign, reportFile: file.name })
                                .then(() => {
                                  setUpdateCount(prev => prev + 1);
                                  alert(`Report "${file.name}" uploaded successfully!`);
                                })
                                .catch((err: any) => {
                                  alert(`Failed to upload report: ${err.message || err}`);
                                });
                            }
                          }}
                        />
                        <label htmlFor="detail-report-upload">
                          <Button variant="secondary" className="h-10 text-xs px-3 cursor-pointer" onClick={() => document.getElementById('detail-report-upload')?.click()}>
                            <Upload size={14} className="mr-1" /> Upload Report
                          </Button>
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
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

      case 'Order Sheet': {
        const isApproved = campaign.status === 'Discount Approved';
        const isGenerated = !!campaign.orderSheetPdfUrl || ['Order Generated', 'Client Signed', 'Countersigned', 'Payment Confirmed', 'Brief Unlocked'].includes(campaign.status);

        return (
          <div className="space-y-6">
            <Card>
              <CardBody className="p-6 sm:p-8 bg-slate-50/50 rounded-lg">
                <OrderSheetContent campaign={campaign} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold text-ink">Order Sheet PDF Actions</h3>
                <p className="mt-1 text-sm text-slate-500">{campaign.dabRef}</p>
              </CardHeader>
              <CardBody className="flex flex-col gap-3 sm:flex-row items-center">
                {isGenerated ? (
                  <>
                    <Button className="w-full sm:w-auto" onClick={handleDownloadPDF}>Download PDF</Button>
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={handlePrintPDF}>Print PDF</Button>
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={handleSharePDF}>Share PDF</Button>
                  </>
                ) : isApproved ? (
                  <Button 
                    className="w-full sm:w-auto" 
                    onClick={handleGenerateOrderSheet}
                    disabled={generating}
                  >
                    {generating ? 'Generating PDF...' : 'Generate Order Sheet PDF'}
                  </Button>
                ) : (
                  <p className="text-sm text-amber-600 font-semibold">
                    The campaign must be approved by the Advertising Manager before the Order Sheet PDF can be generated. Current status: {campaign.status}.
                  </p>
                )}
              </CardBody>
            </Card>

            {campaign.status === 'Order Generated' && (role === 'sales' || role === 'admin') && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-bold text-ink">Upload Client-Signed Order Sheet</h3>
                  <p className="mt-1 text-sm text-slate-500">Provide the client-signed scan/file and the verified Air-Time Order serial number to unlock the campaign brief.</p>
                </CardHeader>
                <CardBody>
                  <form onSubmit={handleUploadSignedSheet} className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="airtime-serial" className="text-sm font-semibold text-slate-700">Air-Time Order Serial Number *</label>
                      <input
                        id="airtime-serial"
                        type="text"
                        placeholder="e.g. ATO-2026-01482"
                        className="max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                        value={airtimeSerial}
                        onChange={(e) => setAirtimeSerial(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="signed-sheet-file" className="text-sm font-semibold text-slate-700">Client-Signed PDF *</label>
                      <input
                        id="signed-sheet-file"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setSignedFile(e.target.files?.[0] || null)}
                        className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-navy/10 file:text-navy hover:file:bg-navy/20 cursor-pointer"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={uploadingSigned || !airtimeSerial || !signedFile}
                      className="w-full sm:w-auto"
                    >
                      {uploadingSigned ? 'Uploading...' : 'Upload Signed Sheet'}
                    </Button>
                  </form>
                </CardBody>
              </Card>
            )}

            {campaign.signedSheetUrl && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-bold text-ink">Signed Order Sheet Document</h3>
                  <p className="mt-1 text-sm text-slate-500">The verified client-signed order sheet and registered Air-Time Order serial.</p>
                </CardHeader>
                <CardBody className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="font-semibold">Air-Time Serial:</span>
                    <Badge tone="teal">{campaign.airtimeOrderSerial || 'ATO-2026-01482'}</Badge>
                  </div>
                  <div>
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`${BASE_URL}/order-sheet/${campaign.id}/download-signed`, {
                            headers: await getAuthHeaders()
                          });
                          if (!res.ok) throw new Error('Failed to download');
                          const blob = await res.blob();
                          const url = window.URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `${campaign.dabRef || campaign.id}-signed.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(url);
                        } catch (err) {
                          alert('Failed to download signed sheet');
                        }
                      }}
                      className="inline-flex items-center text-sm font-bold text-navy hover:underline"
                    >
                      <FileText size={16} className="mr-1.5" /> Download Signed Order Sheet PDF
                    </button>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        );
      }

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
                <GateCheck label="Air-Time Order serial entered" done={!!campaign.airtimeOrderSerial} />
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
          <p className="mt-1 text-sm text-slate-500">{campaign.clientCompany} • Owner: {users?.find(u => u.id === campaign.owner || u.id === `usr-fb-${campaign.owner}` || u.id.includes(campaign.owner))?.name || campaign.owner}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {(role === 'sales' || role === 'admin') && (
            <>
              <Link to={`/campaigns/${campaign.id}/edit`}>
                <Button variant="secondary">Edit Campaign</Button>
              </Link>
              <Button variant="danger" onClick={handleDeleteCampaign}>Delete</Button>
              {campaign.status === 'Draft' && (
                <>
                  <Button variant="secondary" onClick={() => setShowDiscountModal(true)}>Request Discount</Button>
                  <Button onClick={handleSubmitForApproval}>Submit for Approval</Button>
                </>
              )}
              {['Countersigned', 'Payment Confirmed', 'Brief Unlocked'].includes(campaign.status) && (
                <Button variant="secondary" onClick={() => setShowCoModal(true)}>Raise DAB-CO</Button>
              )}
              {campaign.status === 'Discount Approved' && (
                <Button onClick={() => setActiveTab('Order Sheet')}>Generate Order Sheet</Button>
              )}
            </>
          )}
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
                    {productCatalog
                      .filter((p) => {
                        const rcItem = rateCard.find((rc) => rc.id === `rc-${p.id}` || rc.id === p.id);
                        return !rcItem || rcItem.status === 'Active';
                      })
                      .map((prod) => (
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

      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <h3 className="text-lg font-bold text-ink">Request Discount</h3>
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>
            
            <div className="my-4 space-y-4 overflow-y-auto pr-1">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Discount Percentage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  className="mt-1 min-h-12 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-gold focus:ring-2 focus:ring-gold/20"
                  placeholder="e.g. 10"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Reason for Discount</label>
                <textarea
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-gold focus:ring-2 focus:ring-gold/20"
                  placeholder="Provide justification for the requested discount..."
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
              <Button variant="secondary" onClick={() => setShowDiscountModal(false)}>Cancel</Button>
              <Button onClick={handleRequestDiscount} disabled={discountPercent <= 0 || !discountReason}>
                Submit Request
              </Button>
            </div>
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