import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CalendarDays, CheckSquare, Clock3, UploadCloud, FileText, Plus, X, Calendar, Radio } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { materialSpecs, type Campaign } from '../../data/mockData';
import { getCampaigns, getCampaign, uploadPod, generateReport, updateCampaign } from '../../services/api';

export function OperationsPage() {
  const navigate = useNavigate();

  // State for campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [error, setError] = useState<string | null>(null);

  // State for validation checkboxes
  const [validationChecked, setValidationChecked] = useState({
    Artwork: false,
    VideoAssets: false,
    SocialAssets: false
  });

  // State for POD upload
  const [podUploaded, setPodUploaded] = useState(false);
  const [podFileName, setPodFileName] = useState('');
  const [podPreview, setPodPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  // State for delivered items
  const [deliveredItems, setDeliveredItems] = useState<Array<{ name: string; quantity: number; notes: string }>>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemNotes, setNewItemNotes] = useState('');
  const [reportNotes, setReportNotes] = useState('');

  // Reference to the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch unlocked briefs on page load
  useEffect(() => {
    fetchUnlockedBriefs();
  }, []);

  const fetchUnlockedBriefs = async () => {
    setLoading(true);
    setError(null);
    try {
      const allCampaigns = await getCampaigns();
      console.log('📊 Campaigns loaded:', allCampaigns.map(c => ({ name: c.name, status: c.status })));
      setCampaigns(allCampaigns);
      
      // Auto-select the first unlocked campaign if available
      const unlocked = allCampaigns.filter((campaign) =>
        ['Brief Unlocked', 'Scheduled', 'Live', 'live', 'Delivered'].includes(campaign.status)
      );
      if (unlocked.length > 0) {
        setSelectedCampaign(unlocked[0]);
        // Reset validation state when campaign changes
        setValidationChecked({
          Artwork: false,
          VideoAssets: false,
          SocialAssets: false
        });
        setPodUploaded(false);
        setPodFileName('');
        setPodPreview('');
        // Reset delivered items
        setDeliveredItems([]);
        setReportNotes('');
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
      setError('Failed to load campaigns. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate dynamic stats from campaigns data based on Digital Ops workflow
  const stats = {
    // Ready for Execution = Brief Unlocked (Digital Ops can work on these)
    readyForExecution: campaigns.filter(c => c.status === 'Brief Unlocked').length,
    
    // Scheduled = Campaigns that have been scheduled by Digital Ops
    scheduled: campaigns.filter(c => c.status === 'Scheduled').length,
    
    // Live = Campaigns that are live/in market
    live: campaigns.filter(c => c.status === 'Live').length,
    
    // Delivered = Campaigns with POD uploaded or marked as delivered
    delivered: campaigns.filter(c => c.status === 'Delivered' || c.status === 'POD_UPLOADED').length
  };

  const handleValidationToggle = (item: keyof typeof validationChecked) => {
    setValidationChecked(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const handleValidateAll = () => {
    setValidationChecked({
      Artwork: true,
      VideoAssets: true,
      SocialAssets: true
    });
  };

  const allValidationsChecked = Object.values(validationChecked).every(v => v === true);

  // ✅ MAIN HELPER FUNCTION - ONLY ONE
  const updateCampaignStatus = async (campaignId: string, newStatus: string) => {
    try {
      // Only send the status field
      await updateCampaign(campaignId, { 
        status: newStatus 
      } as any);
      
      // Refresh campaigns to update stats
      const allCampaigns = await getCampaigns();
      setCampaigns(allCampaigns);
      
      // Update selected campaign
      const updated = allCampaigns.find(c => c.id === campaignId);
      if (updated) {
        setSelectedCampaign(updated);
      }
      
      return updated;
    } catch (error) {
      console.error('Failed to update campaign status:', error);
      throw error;
    }
  };

  // 🆕 Schedule Campaign - Move from Brief Unlocked to Scheduled
  const handleScheduleCampaign = async () => {
    if (!selectedCampaign) {
      alert('Please select a campaign');
      return;
    }

    if (!allValidationsChecked) {
      alert('Please complete all material validations first');
      return;
    }

    try {
      await updateCampaignStatus(selectedCampaign.id, 'Scheduled');
      alert(`Campaign "${selectedCampaign.name}" has been scheduled successfully!`);
    } catch (err) {
      console.error('Failed to schedule campaign:', err);
      alert('Failed to schedule campaign. Please try again.');
    }
  };

  // 🆕 Log Go-Live - Move from Scheduled to Live
  const handleLogGoLive = async () => {
    if (!selectedCampaign) {
      alert('Please select a campaign');
      return;
    }

    try {
      await updateCampaignStatus(selectedCampaign.id, 'Live');
      alert(`Campaign "${selectedCampaign.name}" is now LIVE!`);
    } catch (err) {
      console.error('Failed to log go-live:', err);
      alert('Failed to log go-live. Please try again.');
    }
  };

  const handleAddDeliveredItem = () => {
    if (!newItemName.trim()) {
      alert('Please enter an item name');
      return;
    }
    setDeliveredItems([
      ...deliveredItems,
      {
        name: newItemName.trim(),
        quantity: newItemQuantity,
        notes: newItemNotes.trim()
      }
    ]);
    setNewItemName('');
    setNewItemQuantity(1);
    setNewItemNotes('');
  };

  const handleRemoveDeliveredItem = (index: number) => {
    setDeliveredItems(deliveredItems.filter((_, i) => i !== index));
  };

  const handlePODUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCampaign) {
      alert('Please select a campaign first');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid file (JPG, PNG, or PDF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadPod(selectedCampaign.id, file);
      
      setPodFileName(result.fileName || file.name);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPodPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
      
      setPodUploaded(true);
      
      // Update campaign status to Delivered when POD is uploaded
      await updateCampaignStatus(selectedCampaign.id, 'Delivered');
      
      alert(`POD uploaded successfully and campaign marked as Delivered!`);
    } catch (err) {
      console.error('Failed to upload POD:', err);
      alert('Failed to upload POD. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleGenerateReport = async () => {
    if (!selectedCampaign) {
      alert('Please select a campaign');
      return;
    }

    if (deliveredItems.length === 0) {
      alert('Please add at least one delivered item before generating the report');
      return;
    }

    setGeneratingReport(true);
    try {
      const result = await generateReport(selectedCampaign.id, {
        deliveredItems: deliveredItems,
        notes: reportNotes
      });
      
      navigate(`/reports?reportId=${result.reportId}&campaign=${encodeURIComponent(selectedCampaign.name)}`);
      
      setDeliveredItems([]);
      setReportNotes('');
      
    } catch (err) {
      console.error('Failed to generate report:', err);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const canGenerateReport = podUploaded && deliveredItems.length > 0;

  const handleCampaignSelect = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setValidationChecked({
      Artwork: false,
      VideoAssets: false,
      SocialAssets: false
    });
    setPodUploaded(false);
    setPodFileName('');
    setPodPreview('');
    setDeliveredItems([]);
    setReportNotes('');
  };

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-ink">Digital operations</h2>
          <p className="mt-1 text-sm text-slate-500">Unlocked briefs ready for execution.</p>
        </div>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3 text-danger">
              <AlertTriangle size={20} />
              <p>{error}</p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Digital operations</h2>
        <p className="mt-1 text-sm text-slate-500">Unlocked briefs ready for execution.</p>
      </div>

      {/* DYNAMIC STAT CARDS - These are correct as they filter on specific statuses */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ready for Execution" value={stats.readyForExecution.toString()} detail="Unlocked briefs" icon={CheckSquare} />
        <StatCard label="Scheduled" value={stats.scheduled.toString()} detail="Calendar entries" icon={CalendarDays} />
        <StatCard label="Live" value={stats.live.toString()} detail="Campaigns in market" icon={Clock3} />
        <StatCard label="Delivered" value={stats.delivered.toString()} detail="Proof uploaded" icon={UploadCloud} />
      </section>
      
      {/* Campaigns for Ops List */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold text-ink">Campaigns for Operations</h3>
          <p className="mt-1 text-sm text-slate-500">
            {campaigns.filter(c => ['Brief Unlocked', 'Scheduled', 'Live', 'live', 'Delivered'].includes(c.status)).length} campaign{campaigns.filter(c => ['Brief Unlocked', 'Scheduled', 'Live', 'live', 'Delivered'].includes(c.status)).length !== 1 ? 's' : ''} in the operations pipeline.
          </p>
        </CardHeader>
        <CardBody>
          {campaigns.filter(c => ['Brief Unlocked', 'Scheduled', 'Live', 'live', 'Delivered'].includes(c.status)).length === 0 ? (
            <p className="text-center text-slate-500 py-4">No unlocked briefs available.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.filter(c => ['Brief Unlocked', 'Scheduled', 'Live', 'live', 'Delivered'].includes(c.status))
                .map((campaign) => (
                  <div
                    key={campaign.id}
                    className={`rounded-lg border p-4 cursor-pointer transition ${
                      selectedCampaign?.id === campaign.id
                        ? 'border-gold bg-gold/5 ring-2 ring-gold/30'
                        : 'border-slate-200 hover:border-gold/50 hover:bg-slate-50'
                    }`}
                    onClick={() => handleCampaignSelect(campaign)}
                  >
                    <p className="font-bold text-ink">{campaign.name}</p>
                    <p className="text-sm text-slate-500">{campaign.clientCompany}</p>
                    <Badge tone="gold" className="mt-2">{campaign.status}</Badge>
                  </div>
                ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Campaign Details */}
      {selectedCampaign && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink">{selectedCampaign.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedCampaign.clientCompany} • {selectedCampaign.dabRef}
                </p>
              </div>
              <Badge tone="navy">{selectedCampaign.status}</Badge>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Client</p>
                <p className="font-semibold">{selectedCampaign.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Dates</p>
                <p className="font-semibold">{selectedCampaign.startDate} to {selectedCampaign.endDate}</p>
              </div>
            </div>

            {/* Workflow Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200">
              {selectedCampaign.status === 'Brief Unlocked' && (
                <Button 
                  onClick={handleScheduleCampaign}
                  disabled={!allValidationsChecked}
                  className="bg-teal text-white hover:bg-teal/80"
                >
                  <Calendar size={18} className="mr-2" />
                  Schedule Campaign
                </Button>
              )}
              
              {selectedCampaign.status === 'Scheduled' && (
                <Button 
                  onClick={handleLogGoLive}
                  className="bg-gold text-navy hover:bg-[#d5a43a]"
                >
                  <Radio size={18} className="mr-2" />
                  Log Go-Live
                </Button>
              )}

              {selectedCampaign.status === 'Brief Unlocked' && !allValidationsChecked && (
                <p className="text-sm text-slate-500 self-center">
                  Complete all validations to schedule
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ============================================================
          MATERIAL VALIDATION CHECKLIST
          ============================================================ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-ink">Material validation checklist</h3>
              <p className="mt-1 text-sm text-slate-500">Digital Ops validates specs only after the brief unlocks.</p>
            </div>
            {!allValidationsChecked && (
              <button
                onClick={handleValidateAll}
                className="rounded-md border border-gold bg-white px-3 py-1.5 text-sm font-semibold text-navy transition hover:bg-gold/10"
              >
                Validate all
              </button>
            )}
          </div>
        </CardHeader>
        <CardBody className="grid gap-3 md:grid-cols-3">
          {['Artwork', 'Video Assets', 'Social Assets'].map((item) => {
            const itemKey = item.replace(' ', '') as keyof typeof validationChecked;
            return (
              <label key={item} className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 px-4">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-slate-300 text-navy focus:ring-gold"
                  checked={validationChecked[itemKey]}
                  onChange={() => handleValidationToggle(itemKey)}
                  disabled={selectedCampaign?.status !== 'Brief Unlocked'}
                />
                <span className="font-semibold text-slate-700">{item}</span>
              </label>
            );
          })}
        </CardBody>
      </Card>

      {/* ============================================================
          MATERIAL SPECIFICATIONS AND DEADLINES
          ============================================================ */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold text-ink">Material specifications and deadlines</h3>
          <p className="mt-1 text-sm text-slate-500">Pulled from the DAB UI prototype reference.</p>
        </CardHeader>
        <CardBody className="grid gap-4 xl:grid-cols-2">
          {materialSpecs.map((spec) => (
            <article key={spec.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Badge tone="navy">{spec.category}</Badge>
                  <h4 className="mt-3 font-bold text-ink">{spec.title}</h4>
                  <p className="mt-1 text-sm font-semibold text-[#73510f]">Due: {spec.deadline}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                {spec.requirements.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-slate-600">
                    <CheckSquare className="mt-0.5 shrink-0 text-teal" size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {spec.warning ? (
                <div className="mt-4 flex gap-2 rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm font-semibold text-danger">
                  <AlertTriangle className="mt-0.5 shrink-0" size={16} />
                  <span>{spec.warning}</span>
                </div>
              ) : null}
            </article>
          ))}
        </CardBody>
      </Card>

      {/* ============================================================
          PROOF OF DELIVERY (POD) SECTION
          ============================================================ */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold text-ink">Proof of Delivery (POD)</h3>
          <p className="mt-1 text-sm text-slate-500">Upload screenshots or proof of campaign delivery.</p>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <input
              type="file"
              id="pod-upload"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={handlePODUpload}
              disabled={!allValidationsChecked || uploading || !selectedCampaign || selectedCampaign.status === 'Brief Unlocked'}
            />
            <Button 
              variant="secondary" 
              disabled={!allValidationsChecked || uploading || !selectedCampaign || selectedCampaign.status === 'Brief Unlocked'}
              onClick={handleUploadClick}
            >
              <UploadCloud size={18} className="mr-2" />
              {uploading ? 'Uploading...' : podUploaded ? 'Replace POD' : 'Upload POD'}
            </Button>
            {!selectedCampaign && (
              <p className="text-sm text-slate-500">Select a campaign first</p>
            )}
            {selectedCampaign?.status === 'Brief Unlocked' && (
              <p className="text-sm text-slate-500">Schedule campaign before uploading POD</p>
            )}
            {!allValidationsChecked && selectedCampaign && selectedCampaign.status !== 'Brief Unlocked' && (
              <p className="text-sm text-slate-500">Complete material validation first</p>
            )}
          </div>
          
          {podFileName && (
            <div className="rounded-lg border border-teal/20 bg-teal/10 p-3">
              <p className="text-sm font-semibold text-teal">✓ POD uploaded: {podFileName}</p>
            </div>
          )}
          
          {podPreview && (
            <div className="mt-2">
              <p className="text-sm text-slate-600 mb-2">Preview:</p>
              <img src={podPreview} alt="POD Preview" className="max-h-48 rounded-lg border border-slate-200" />
            </div>
          )}
        </CardBody>
      </Card>

      {/* ============================================================
          DELIVERED ITEMS SECTION
          ============================================================ */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold text-ink">Delivered Items</h3>
          <p className="mt-1 text-sm text-slate-500">Add the items that were actually delivered for this campaign.</p>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* Add new item form */}
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto] items-end">
            <div>
              <label className="text-sm font-semibold text-slate-700">Item Name</label>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g., Facebook Sponsored Post"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                disabled={!selectedCampaign || selectedCampaign.status === 'Brief Unlocked'}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Quantity</label>
              <input
                type="number"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(Number(e.target.value))}
                min="1"
                className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                disabled={!selectedCampaign || selectedCampaign.status === 'Brief Unlocked'}
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-sm font-semibold text-slate-700">Notes (optional)</label>
              <input
                type="text"
                value={newItemNotes}
                onChange={(e) => setNewItemNotes(e.target.value)}
                placeholder="Any delivery notes"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                disabled={!selectedCampaign || selectedCampaign.status === 'Brief Unlocked'}
              />
            </div>
            <Button 
              onClick={handleAddDeliveredItem} 
              className="md:col-span-1"
              disabled={!selectedCampaign || selectedCampaign.status === 'Brief Unlocked'}
            >
              <Plus size={16} className="mr-2" />
              Add Item
            </Button>
          </div>

          {/* Delivered items list */}
          {deliveredItems.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold text-slate-700">Delivered Items ({deliveredItems.length})</p>
              {deliveredItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <div>
                    <p className="font-semibold text-ink">{item.name}</p>
                    <p className="text-sm text-slate-500">Qty: {item.quantity} {item.notes && `• ${item.notes}`}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveDeliveredItem(index)}
                    className="text-danger hover:text-danger/70"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ============================================================
          CAMPAIGN REPORT SECTION
          ============================================================ */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold text-ink">Campaign Report</h3>
          <p className="mt-1 text-sm text-slate-500">Generate performance report with delivered items.</p>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* Report notes */}
          <div>
            <label className="text-sm font-semibold text-slate-700">Report Notes (optional)</label>
            <textarea
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              placeholder="Add any additional notes for the report..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[80px]"
              disabled={!selectedCampaign || selectedCampaign.status === 'Brief Unlocked'}
            />
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <Button 
              onClick={handleGenerateReport} 
              disabled={!canGenerateReport || generatingReport || !selectedCampaign || selectedCampaign.status === 'Brief Unlocked'}
              variant={canGenerateReport ? 'primary' : 'secondary'}
            >
              <FileText size={18} className="mr-2" />
              {generatingReport ? 'Generating...' : 'Generate Report'}
            </Button>
            {!selectedCampaign && (
              <p className="text-sm text-slate-500">Select a campaign first</p>
            )}
            {selectedCampaign?.status === 'Brief Unlocked' && (
              <p className="text-sm text-slate-500">Schedule campaign before generating report</p>
            )}
            {!podUploaded && selectedCampaign && selectedCampaign.status !== 'Brief Unlocked' && (
              <p className="text-sm text-slate-500">Upload POD to enable report generation</p>
            )}
            {podUploaded && deliveredItems.length === 0 && (
              <p className="text-sm text-slate-500">Add at least one delivered item</p>
            )}
          </div>

          {/* Show delivery summary if items exist */}
          {deliveredItems.length > 0 && (
            <div className="rounded-lg border border-teal/20 bg-teal/10 p-3">
              <p className="text-sm font-semibold text-teal">
                ✓ Ready to generate report with {deliveredItems.length} delivered item{deliveredItems.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}