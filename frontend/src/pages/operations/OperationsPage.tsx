import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, CalendarDays, CheckSquare, Clock3, UploadCloud, 
  FileText, Plus, X, Calendar, Radio, Mail, Eye, ThumbsUp, 
  ThumbsDown, AlertCircle, Save, Clock, CheckCircle, Loader2
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { materialSpecs, type Campaign, type ProductLine } from '../../data/mockData';
import { 
  getCampaigns, 
  getCampaign, 
  uploadPod, 
  generateReport, 
  updateCampaignStatus as apiUpdateCampaignStatus,
  saveExecutionPlan,
  logGoLive,
  saveDeliveredItems
} from '../../services/api';

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Get unique product categories from campaign products
const getUniqueCategories = (campaign: Campaign): string[] => {
  if (!campaign.products || campaign.products.length === 0) return [];
  const categories = campaign.products.map(p => p.category);
  return [...new Set(categories)];
};

// Get requirements for a category from materialSpecs
const getRequirementsForCategory = (category: string): string[] => {
  const spec = materialSpecs.find(s => s.category === category);
  return spec?.requirements || [];
};

// Get the full spec object for a category
const getSpecForCategory = (category: string) => {
  return materialSpecs.find(s => s.category === category);
};

// Calculate due date (subtract business days)
const calculateDueDate = (startDate: string, category: string): string => {
  const dueDaysMap: Record<string, number> = {
    'Social Media': 5,
    'Website Ads': 5,
    'Livestream Coverage': 7,
    'Video Production': 5,
    'Digital Activation': 5,
    'Boosting': 3,
    'Display': 3,
    'Rich Media': 3,
    'Content': 5,
    'Mobile App': 5,
    'Push & SMS': 2,
    'Production': 0
  };
  const days = dueDaysMap[category] || 5;
  const date = new Date(startDate);
  let count = 0;
  while (count < days) {
    date.setDate(date.getDate() - 1);
    if (date.getDay() !== 0 && date.getDay() !== 6) count++;
  }
  return date.toISOString().split('T')[0];
};

// Check if overdue
const isOverdue = (dueDate: string): boolean => {
  return new Date() > new Date(dueDate);
};

// Get days overdue
const getDaysOverdue = (dueDate: string): number => {
  const diff = new Date().getTime() - new Date(dueDate).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Get days remaining
const getDaysRemaining = (dueDate: string): number => {
  const diff = new Date(dueDate).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export function OperationsPage() {
  const navigate = useNavigate();

  // ============================================================
  // STATE
  // ============================================================

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [error, setError] = useState<string | null>(null);

  // User role - this should come from your auth context
  const [userRole] = useState<'sales' | 'adManager' | 'digitalOps' | 'finance' | 'admin'>('digitalOps');

  // Check permissions
  const canExecute = userRole === 'digitalOps';
  const isAdmin = userRole === 'admin';

  // Material Check state (dynamic checkboxes for detailed specs)
  const [materialValidations, setMaterialValidations] = useState<Record<string, boolean>>({});
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  // Execution Plan state
  const [showExecutionPlan, setShowExecutionPlan] = useState(false);
  const [executionPlan, setExecutionPlan] = useState<Record<string, any>>({});

  // Go Live state
  const [showGoLiveModal, setShowGoLiveModal] = useState(false);
  const [goLiveDate, setGoLiveDate] = useState('');
  const [goLiveTime, setGoLiveTime] = useState('');
  const [goLiveNotes, setGoLiveNotes] = useState('');

  // POD state
  const [podUploaded, setPodUploaded] = useState(false);
  const [podFileName, setPodFileName] = useState('');
  const [podPreview, setPodPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Delivered items state
  const [deliveredItems, setDeliveredItems] = useState<Array<{ name: string; quantity: number; notes: string }>>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemNotes, setNewItemNotes] = useState('');
  const [reportNotes, setReportNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // FETCH CAMPAIGNS
  // ============================================================

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const allCampaigns = await getCampaigns();
      console.log('📊 Campaigns loaded:', allCampaigns.map(c => ({ 
        name: c.name, 
        status: c.status, 
        products: c.products?.length || 0 
      })));
      setCampaigns(allCampaigns);

      // Auto-select first Brief Unlocked campaign if available
      const unlockedCampaigns = allCampaigns.filter(c => c.status === 'Brief Unlocked');
      if (unlockedCampaigns.length > 0) {
        setSelectedCampaign(unlockedCampaigns[0]);
        resetOpsState();
      } else {
        // If no Brief Unlocked, try to select any ops campaign
        const opsCampaigns = allCampaigns.filter((campaign) =>
          ['Pending Materials', 'Materials Received', 'Material Check', 
           'Material Check Approved', 'Ready for Execution', 'Scheduled', 'Live', 'Delivered'].includes(campaign.status)
        );
        if (opsCampaigns.length > 0) {
          setSelectedCampaign(opsCampaigns[0]);
          resetOpsState();
        }
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
      setError('Failed to load campaigns. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  const getOpsCampaigns = (campaigns: Campaign[]) => {
    const opsStatuses = [
      'Brief Unlocked', 'Pending Materials', 'Materials Received', 
      'Material Check', 'Material Check Approved', 'Ready for Execution', 
      'Scheduled', 'Live', 'Delivered'
    ];
    return campaigns.filter(c => opsStatuses.includes(c.status));
  };

  const resetOpsState = () => {
    setMaterialValidations({});
    setRejectionReason('');
    setShowRejectionModal(false);
    setPodUploaded(false);
    setPodFileName('');
    setPodPreview('');
    setDeliveredItems([]);
    setReportNotes('');
    setNewItemName('');
    setNewItemQuantity(1);
    setNewItemNotes('');
    setShowExecutionPlan(false);
    setExecutionPlan({});
    setShowGoLiveModal(false);
    setGoLiveDate('');
    setGoLiveTime('');
    setGoLiveNotes('');
  };

  const hasProducts = (campaign: Campaign): boolean => {
    return campaign.products && campaign.products.length > 0;
  };

  const getMaterialCheckProgress = (): number => {
    const total = Object.keys(materialValidations).length;
    const completed = Object.values(materialValidations).filter(v => v).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const isMaterialCheckComplete = (): boolean => {
    const total = Object.keys(materialValidations).length;
    const completed = Object.values(materialValidations).filter(v => v).length;
    return total > 0 && completed === total;
  };

  // Get submission window dates
  const getSubmissionWindow = (campaign: Campaign): { windowStart: string; windowEnd: string } | null => {
    if (!campaign.startDate) return null;
    const categories = getUniqueCategories(campaign);
    if (categories.length === 0) return null;
    const dueDate = calculateDueDate(campaign.startDate, categories[0]);
    const windowStart = new Date(dueDate);
    windowStart.setDate(windowStart.getDate() - 4); // 5 business days window
    return {
      windowStart: windowStart.toISOString().split('T')[0],
      windowEnd: dueDate
    };
  };

  // ============================================================
  // STATS
  // ============================================================

  const stats = {
    readyForExecution: campaigns.filter(c => c.status === 'Brief Unlocked').length,
    scheduled: campaigns.filter(c => c.status === 'Scheduled').length,
    live: campaigns.filter(c => c.status === 'Live').length,
    delivered: campaigns.filter(c => c.status === 'Delivered' || c.status === 'POD_UPLOADED').length
  };

  // ============================================================
  // STATUS UPDATE (simplified - only status)
  // ============================================================

  const updateCampaignStatus = async (campaignId: string, newStatus: string) => {
    try {
      await apiUpdateCampaignStatus(campaignId, newStatus);
      const allCampaigns = await getCampaigns();
      setCampaigns(allCampaigns);
      const updated = allCampaigns.find(c => c.id === campaignId);
      if (updated) setSelectedCampaign(updated);
      return updated;
    } catch (error) {
      console.error('Failed to update campaign status:', error);
      throw error;
    }
  };

  // ============================================================
  // ACTIONS - Mark Received
  // ============================================================

  const handleMarkReceived = async () => {
    if (!selectedCampaign || !canExecute) return;
    try {
      await updateCampaignStatus(selectedCampaign.id, 'Materials Received');
      // Initialize material validations based on products
      const validations: Record<string, boolean> = {};
      const categories = getUniqueCategories(selectedCampaign);
      categories.forEach((category: string) => {
        getRequirementsForCategory(category).forEach((req: string) => {
          validations[`${category}_${req}`] = false;
        });
      });
      setMaterialValidations(validations);
      alert('✅ Materials marked as received!');
    } catch (err) {
      alert('Failed to update. Please try again.');
    }
  };

  // ============================================================
  // ACTIONS - Material Check
  // ============================================================

  const handleStartMaterialCheck = async () => {
    if (!selectedCampaign || !canExecute) return;
    try {
      await updateCampaignStatus(selectedCampaign.id, 'Material Check');
      alert('🔍 Material Check started!');
    } catch (err) {
      alert('Failed to start material check. Please try again.');
    }
  };

  const handleMaterialToggle = (key: string) => {
    if (!canExecute) return;
    setMaterialValidations(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApproveMaterials = async () => {
    if (!selectedCampaign || !canExecute) return;
    if (!isMaterialCheckComplete()) {
      alert('Please complete all material checks before approving');
      return;
    }
    try {
      await updateCampaignStatus(selectedCampaign.id, 'Material Check Approved');
      alert('✅ Materials approved!');
    } catch (err) {
      alert('Failed to approve. Please try again.');
    }
  };

  const handleRejectMaterials = () => {
    if (!canExecute) return;
    setShowRejectionModal(true);
  };

  const handleConfirmRejection = async () => {
    if (!selectedCampaign || !canExecute) return;
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    try {
      await updateCampaignStatus(selectedCampaign.id, 'Pending Materials');
      setShowRejectionModal(false);
      setRejectionReason('');
      alert('❌ Materials rejected. Campaign moved back to Pending Materials.');
    } catch (err) {
      alert('Failed to reject. Please try again.');
    }
  };

  // ============================================================
  // ACTIONS - Ready for Execution
  // ============================================================

  const handleMarkReady = async () => {
    if (!selectedCampaign || !canExecute) return;
    try {
      await updateCampaignStatus(selectedCampaign.id, 'Ready for Execution');
      alert('✅ Campaign is now Ready for Execution!');
    } catch (err) {
      alert('Failed to update. Please try again.');
    }
  };

  // ============================================================
  // ACTIONS - Schedule (Execution Plan)
  // ============================================================

  const handleScheduleWithPlan = () => {
    if (!selectedCampaign || !canExecute) return;
    // Initialize execution plan with default values for each product category
    const plan: Record<string, any> = {};
    const categories = getUniqueCategories(selectedCampaign);
    categories.forEach((category: string) => {
      plan[category] = {
        postsPerDay: 1,
        frequency: 'Daily',
        times: ['9:00 AM'],
        placement: 'Standard',
        notes: ''
      };
    });
    setExecutionPlan(plan);
    setShowExecutionPlan(true);
  };

  const handleSaveExecutionPlan = async () => {
    if (!selectedCampaign || !canExecute) return;
    try {
      // 1. Save the execution plan to its own endpoint
      await saveExecutionPlan(selectedCampaign.id, executionPlan);
      
      // 2. Update status separately
      await updateCampaignStatus(selectedCampaign.id, 'Scheduled');
      
      setShowExecutionPlan(false);
      alert(`✅ Campaign "${selectedCampaign.name}" has been scheduled with execution plan!`);
    } catch (err) {
      alert('Failed to schedule. Please try again.');
      console.error(err);
    }
  };

  const handleExecutionPlanChange = (category: string, field: string, value: any) => {
    setExecutionPlan(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  // ============================================================
  // ACTIONS - Go Live
  // ============================================================

  const handleOpenGoLive = () => {
    if (!selectedCampaign || !canExecute) return;
    const now = new Date();
    setGoLiveDate(now.toISOString().split('T')[0]);
    setGoLiveTime(now.toTimeString().slice(0, 5));
    setGoLiveNotes('');
    setShowGoLiveModal(true);
  };

  const handleConfirmGoLive = async () => {
    if (!selectedCampaign || !canExecute) return;
    if (!goLiveDate || !goLiveTime) {
      alert('Please enter the actual go-live date and time');
      return;
    }
    try {
      // 1. Save go-live details to its own endpoint
      await logGoLive(selectedCampaign.id, {
        actualGoLiveDate: `${goLiveDate}T${goLiveTime}`,
        goLiveLoggedBy: 'Digital Ops', // Should come from auth context
        goLiveNotes: goLiveNotes
      });
      
      // 2. Update status
      await updateCampaignStatus(selectedCampaign.id, 'Live');
      
      setShowGoLiveModal(false);
      alert(`🚀 Campaign "${selectedCampaign.name}" is now LIVE!`);
    } catch (err) {
      alert('Failed to log go-live. Please try again.');
      console.error(err);
    }
  };

  // ============================================================
  // ACTIONS - POD & Report
  // ============================================================

  const handlePODUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCampaign || !canExecute) return;

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
      // 1. Upload POD with filename
      const result = await uploadPod(selectedCampaign.id, file, '', { 
        podFileName: file.name 
      });
      
      setPodFileName(result.fileName || file.name);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPodPreview(reader.result as string);
        reader.readAsDataURL(file);
      }
      setPodUploaded(true);
      
      // 2. Update status to delivered
      await updateCampaignStatus(selectedCampaign.id, 'Delivered');
      
      alert('✅ POD uploaded and campaign marked as Delivered!');
    } catch (err) {
      console.error('Failed to upload POD:', err);
      alert('Failed to upload POD. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleAddDeliveredItem = () => {
    if (!newItemName.trim()) {
      alert('Please select an item');
      return;
    }
    setDeliveredItems([
      ...deliveredItems,
      { name: newItemName.trim(), quantity: newItemQuantity, notes: newItemNotes.trim() }
    ]);
    setNewItemName('');
    setNewItemQuantity(1);
    setNewItemNotes('');
  };

  const handleRemoveDeliveredItem = (index: number) => {
    setDeliveredItems(deliveredItems.filter((_, i) => i !== index));
  };

  const handleGenerateReport = async () => {
    if (!selectedCampaign || !canExecute) return;
    if (deliveredItems.length === 0) {
      alert('Please add at least one delivered item');
      return;
    }
    setGeneratingReport(true);
    try {
      // 1. Save delivered items to its own endpoint
      await saveDeliveredItems(selectedCampaign.id, deliveredItems);
      
      // 2. Generate the report
      const result = await generateReport(selectedCampaign.id, {
        deliveredItems,
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

  // ============================================================
  // SELECT CAMPAIGN
  // ============================================================

  const handleCampaignSelect = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    resetOpsState();
    // Initialize material validations if campaign is in Material Check
    if (campaign.status === 'Material Check' && hasProducts(campaign)) {
      const validations: Record<string, boolean> = {};
      const categories = getUniqueCategories(campaign);
      categories.forEach((category: string) => {
        getRequirementsForCategory(category).forEach((req: string) => {
          validations[`${category}_${req}`] = false;
        });
      });
      setMaterialValidations(validations);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

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
          <h2 className="text-2xl font-bold text-ink">Digital Operations</h2>
          <p className="mt-1 text-sm text-slate-500">Campaign execution workflow</p>
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

  // Get unlocked campaigns (Brief Unlocked status)
  const unlockedCampaigns = campaigns.filter(c => c.status === 'Brief Unlocked');
  
  // Filter campaigns by status for sections
  const pendingMaterials = campaigns.filter(c => c.status === 'Pending Materials');
  const materialCheck = campaigns.filter(c => c.status === 'Materials Received' || c.status === 'Material Check');
  const readyToSchedule = campaigns.filter(c => c.status === 'Material Check Approved' || c.status === 'Ready for Execution');
  const scheduled = campaigns.filter(c => c.status === 'Scheduled');
  const live = campaigns.filter(c => c.status === 'Live');

  // Get selected campaign's product categories
  const selectedCategories = selectedCampaign ? getUniqueCategories(selectedCampaign) : [];
  const hasSelectedProducts = selectedCampaign && hasProducts(selectedCampaign);
  
  // Get submission window for selected campaign
  const submissionWindow = selectedCampaign ? getSubmissionWindow(selectedCampaign) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">Digital Operations</h2>
          <p className="mt-1 text-sm text-slate-500">
            Campaign execution workflow
            {isAdmin && <span className="ml-2 text-amber-600">(View Only Mode)</span>}
            {canExecute && <span className="ml-2 text-teal-600">(Execution Mode)</span>}
          </p>
        </div>
        {isAdmin && <Badge tone="gold">View Only</Badge>}
        {canExecute && <Badge tone="teal">Full Access</Badge>}
      </div>

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ready for Execution" value={stats.readyForExecution.toString()} detail="Unlocked briefs" icon={CheckSquare} />
        <StatCard label="Scheduled" value={stats.scheduled.toString()} detail="Calendar entries" icon={CalendarDays} />
        <StatCard label="Live" value={stats.live.toString()} detail="Campaigns in market" icon={Clock3} />
        <StatCard label="Delivered" value={stats.delivered.toString()} detail="Proof uploaded" icon={UploadCloud} />
      </section>

      {/* ============================================================
          SECTION: UNLOCKED CAMPAIGNS (NEW BRIEFS READY)
          ============================================================ */}
      {unlockedCampaigns.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink">📋 New Briefs Ready</h3>
                <p className="mt-1 text-sm text-slate-500">Click a campaign to view full details</p>
              </div>
              <Badge tone="gold">{unlockedCampaigns.length}</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {unlockedCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className={`rounded-lg border p-4 cursor-pointer transition ${
                    selectedCampaign?.id === campaign.id
                      ? 'border-gold bg-gold/5 ring-2 ring-gold/30'
                      : 'border-slate-200 hover:border-gold/50 hover:bg-slate-50'
                  }`}
                  onClick={() => handleCampaignSelect(campaign)}
                >
                  <p className="font-bold text-ink text-lg">{campaign.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge tone="gold">Brief Unlocked</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ============================================================
          SECTION: WAITING FOR CLIENT MATERIALS
          ============================================================ */}
      {pendingMaterials.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink">⏳ Waiting for Client Materials</h3>
                <p className="mt-1 text-sm text-slate-500">Campaigns waiting for client to submit assets</p>
              </div>
              <Badge tone="gold">{pendingMaterials.length}</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {pendingMaterials.map((campaign) => {
                const categories = getUniqueCategories(campaign);
                const dueDate = campaign.startDate && categories.length > 0
                  ? calculateDueDate(campaign.startDate, categories[0])
                  : '';
                const overdue = dueDate ? isOverdue(dueDate) : false;
                const daysOverdue = dueDate ? getDaysOverdue(dueDate) : 0;
                return (
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
                    {dueDate && (
                      <p className="text-xs text-slate-500 mt-1">
                        📅 Due: {new Date(dueDate).toLocaleDateString()}
                        {overdue && (
                          <span className="text-danger font-semibold ml-2">
                            ⚠️ {daysOverdue} days overdue
                          </span>
                        )}
                      </p>
                    )}
                    {categories.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {categories.map((cat) => (
                          <Badge key={cat} tone="neutral" className="text-xs">{cat}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <Badge tone="gold">{campaign.status}</Badge>
                    </div>
                    <Button 
                      className="mt-3 w-full bg-teal text-white hover:bg-teal/80 text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCampaign(campaign);
                        handleMarkReceived();
                      }}
                      disabled={!canExecute}
                    >
                      <Mail size={14} className="mr-1" />
                      Mark Received
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ============================================================
          SECTION: MATERIAL CHECK
          ============================================================ */}
      {materialCheck.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink">🔍 Material Check</h3>
                <p className="mt-1 text-sm text-slate-500">Campaigns with assets received, being checked</p>
              </div>
              <Badge tone="navy">{materialCheck.length}</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {materialCheck.map((campaign) => {
                let progress = 0;
                if (campaign.status === 'Material Check' && selectedCampaign && campaign.id === selectedCampaign.id) {
                  progress = getMaterialCheckProgress();
                }
                const categories = getUniqueCategories(campaign);
                return (
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
                    {categories.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {categories.map((cat) => (
                          <Badge key={cat} tone="neutral" className="text-xs">{cat}</Badge>
                        ))}
                      </div>
                    )}
                    {campaign.status === 'Material Check' && campaign.id === selectedCampaign?.id && (
                      <div className="mt-2">
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div 
                            className="bg-teal h-1.5 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{progress}% complete</p>
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <Badge tone="navy">{campaign.status}</Badge>
                    </div>
                    <Button 
                      className="mt-3 w-full bg-gold text-navy hover:bg-[#d5a43a] text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCampaign(campaign);
                        if (campaign.status === 'Materials Received') {
                          handleStartMaterialCheck();
                        }
                      }}
                      disabled={!canExecute || campaign.status === 'Material Check'}
                    >
                      <Eye size={14} className="mr-1" />
                      {campaign.status === 'Materials Received' ? 'Start Material Check' : 'Continue Check'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ============================================================
          SECTION: READY TO SCHEDULE
          ============================================================ */}
      {readyToSchedule.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink">✅ Ready to Schedule</h3>
                <p className="mt-1 text-sm text-slate-500">Campaigns approved and ready to schedule</p>
              </div>
              <Badge tone="teal">{readyToSchedule.length}</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {readyToSchedule.map((campaign) => {
                const categories = getUniqueCategories(campaign);
                return (
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
                    {categories.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {categories.map((cat) => (
                          <Badge key={cat} tone="neutral" className="text-xs">{cat}</Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-teal font-semibold mt-1">✅ All materials approved</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge tone="teal">{campaign.status}</Badge>
                    </div>
                    <Button 
                      className="mt-3 w-full bg-teal text-white hover:bg-teal/80 text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCampaign(campaign);
                        if (campaign.status === 'Material Check Approved') {
                          handleMarkReady();
                        } else {
                          handleScheduleWithPlan();
                        }
                      }}
                      disabled={!canExecute}
                    >
                      <Calendar size={14} className="mr-1" />
                      {campaign.status === 'Material Check Approved' ? 'Mark as Ready' : 'Create Schedule'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ============================================================
          SECTION: SCHEDULED
          ============================================================ */}
      {scheduled.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink">📅 Scheduled</h3>
                <p className="mt-1 text-sm text-slate-500">Campaigns scheduled, waiting to go live</p>
              </div>
              <Badge tone="navy">{scheduled.length}</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {scheduled.map((campaign) => {
                const categories = getUniqueCategories(campaign);
                return (
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
                    {categories.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {categories.map((cat) => (
                          <Badge key={cat} tone="neutral" className="text-xs">{cat}</Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      {campaign.startDate} to {campaign.endDate}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge tone="navy">{campaign.status}</Badge>
                    </div>
                    <Button 
                      className="mt-3 w-full bg-gold text-navy hover:bg-[#d5a43a] text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCampaign(campaign);
                        handleOpenGoLive();
                      }}
                      disabled={!canExecute}
                    >
                      <Radio size={14} className="mr-1" />
                      Log Go-Live
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ============================================================
          SECTION: LIVE
          ============================================================ */}
      {live.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink">📡 Live</h3>
                <p className="mt-1 text-sm text-slate-500">Campaigns currently running</p>
              </div>
              <Badge tone="teal">{live.length}</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {live.map((campaign) => {
                const categories = getUniqueCategories(campaign);
                return (
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
                    {categories.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {categories.map((cat) => (
                          <Badge key={cat} tone="neutral" className="text-xs">{cat}</Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      {campaign.startDate} to {campaign.endDate}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge tone="teal">📡 Live</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ============================================================
          CAMPAIGN DETAILS
          ============================================================ */}
      {selectedCampaign && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-lg font-bold text-ink">{selectedCampaign.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedCampaign.clientCompany} • {selectedCampaign.dabRef}
                </p>
              </div>
              <Badge tone="navy">{selectedCampaign.status}</Badge>
            </div>
          </CardHeader>
          <CardBody className="space-y-6">
            {/* Campaign Details */}
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Client</p>
                <p className="font-semibold">{selectedCampaign.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Campaign Period</p>
                <p className="font-semibold">{selectedCampaign.startDate} to {selectedCampaign.endDate}</p>
              </div>
            </div>

            {/* ============================================================
                ORDERED PRODUCTS (Grouped by Spec Category)
                ============================================================ */}
            {hasSelectedProducts && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Ordered Products</p>
                <div className="space-y-3">
                  {selectedCategories.map((category: string) => {
                    const productsInCategory = selectedCampaign.products.filter(p => p.category === category);
                    if (productsInCategory.length === 0) return null;
                    return (
                      <div key={category} className="rounded-lg border border-slate-200 p-3">
                        <p className="font-semibold text-ink">{category}</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {productsInCategory.map((product: ProductLine) => (
                            <Badge key={product.id} tone="neutral" className="text-xs">
                              {product.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============================================================
                MATERIALS STATUS
                ============================================================ */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-ink">Materials Status</h4>
                <Badge tone={selectedCampaign.status === 'Pending Materials' ? 'gold' : 'teal'}>
                  {selectedCampaign.status === 'Pending Materials' ? '⏳ Pending' : '✅ Received'}
                </Badge>
              </div>
              {selectedCampaign.status === 'Pending Materials' && (
                <p className="text-sm text-slate-500 mt-1">Client has not submitted materials yet.</p>
              )}
              {selectedCampaign.status !== 'Pending Materials' && selectedCampaign.status !== 'Brief Unlocked' && (
                <p className="text-sm text-slate-500 mt-1">
                  Submitted on: {new Date().toLocaleDateString()}
                </p>
              )}
              {selectedCampaign.status === 'Brief Unlocked' && (
                <p className="text-sm text-slate-500 mt-1">Brief is unlocked. Awaiting materials from client.</p>
              )}
            </div>

            {/* ============================================================
                SUBMISSION DEADLINE CALCULATION
                ============================================================ */}
            {submissionWindow && selectedCampaign.status === 'Brief Unlocked' && (
              <div className="pt-4 border-t border-slate-200">
                <h4 className="font-bold text-ink">Material Submission Deadline</h4>
                <div className="mt-2 rounded-lg bg-slate-50 p-4 space-y-2">
                  <p className="text-sm">
                    <span className="font-semibold">Deadline:</span>{' '}
                    {new Date(submissionWindow.windowEnd).toLocaleDateString()}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Submission Window:</span>{' '}
                    {new Date(submissionWindow.windowStart).toLocaleDateString()} - {new Date(submissionWindow.windowEnd).toLocaleDateString()}
                  </p>
                  {isOverdue(submissionWindow.windowEnd) ? (
                    <p className="text-sm text-danger font-semibold">
                      ⚠️ OVERDUE - Materials were due {getDaysOverdue(submissionWindow.windowEnd)} days ago
                    </p>
                  ) : (
                    <p className="text-sm text-teal font-semibold">
                      {getDaysRemaining(submissionWindow.windowEnd)} days remaining
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================
                MATERIAL CHECKLIST (Detailed Specs Check)
                ============================================================ */}
            {['Materials Received', 'Material Check', 'Material Check Approved'].includes(selectedCampaign.status) && hasSelectedProducts && (
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-ink">Material Checklist</h4>
                  {selectedCampaign.status === 'Material Check' && (
                    <span className="text-sm text-slate-500">{getMaterialCheckProgress()}% complete</span>
                  )}
                </div>

                {selectedCategories.map((category: string) => {
                  const requirements = getRequirementsForCategory(category);
                  const spec = getSpecForCategory(category);
                  if (requirements.length === 0 || !spec) return null;

                  return (
                    <div key={category} className="rounded-lg border border-slate-200 p-4 mt-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-ink">{category}</p>
                        <Badge tone="navy">{spec.deadline}</Badge>
                      </div>
                      <div className="space-y-2 mt-2">
                        {requirements.map((req: string) => {
                          const key = `${category}_${req}`;
                          const checked = materialValidations[key] || false;
                          const disabled = selectedCampaign.status === 'Material Check Approved' || !canExecute;
                          return (
                            <label 
                              key={req} 
                              className={`flex items-start gap-3 p-2 rounded-lg transition ${
                                checked ? 'bg-teal/5' : 'hover:bg-slate-50'
                              } ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal focus:ring-gold"
                                checked={checked}
                                onChange={() => handleMaterialToggle(key)}
                                disabled={disabled}
                              />
                              <span className="text-sm text-slate-700">{req}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                
                {/* Material Check Progress */}
                {selectedCampaign.status === 'Material Check' && (
                  <div className="mb-4 mt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Material Check Progress</span>
                      <span className="font-semibold text-ink">{getMaterialCheckProgress()}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-teal h-2 rounded-full transition-all duration-500"
                        style={{ width: `${getMaterialCheckProgress()}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Material Check Actions */}
                {selectedCampaign.status === 'Material Check' && canExecute && (
                  <div className="flex gap-3 flex-wrap pt-2">
                    <Button 
                      onClick={handleApproveMaterials}
                      className="bg-teal text-white hover:bg-teal/80"
                      disabled={!isMaterialCheckComplete()}
                    >
                      <ThumbsUp size={18} className="mr-2" />
                      Approve Materials
                    </Button>
                    <Button 
                      onClick={handleRejectMaterials}
                      variant="secondary"
                      className="border-danger text-danger hover:bg-danger/10"
                    >
                      <ThumbsDown size={18} className="mr-2" />
                      Reject Materials
                    </Button>
                    {!isMaterialCheckComplete() && (
                      <p className="text-sm text-slate-500 self-center">
                        Complete all checks before approving
                      </p>
                    )}
                  </div>
                )}
                
                {/* Rejection Reason Display */}
                {selectedCampaign.materialRejectionReason && (
                  <div className="mt-3 rounded-lg bg-danger/10 border border-danger/30 p-3">
                    <p className="text-sm font-semibold text-danger">Rejection Reason:</p>
                    <p className="text-sm text-slate-700">{selectedCampaign.materialRejectionReason}</p>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================
                WORKFLOW ACTION BUTTONS
                ============================================================ */}
            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200">
              {selectedCampaign.status === 'Brief Unlocked' && (
                <Button 
                  onClick={handleScheduleWithPlan}
                  disabled={!canExecute}
                  className="bg-teal text-white hover:bg-teal/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Calendar size={18} className="mr-2" />
                  Create Schedule
                </Button>
              )}
              
              {selectedCampaign.status === 'Scheduled' && (
                <Button 
                  onClick={handleOpenGoLive}
                  disabled={!canExecute}
                  className="bg-gold text-navy hover:bg-[#d5a43a] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Radio size={18} className="mr-2" />
                  Log Go-Live
                </Button>
              )}

              {selectedCampaign.status === 'Ready for Execution' && (
                <Button 
                  onClick={handleScheduleWithPlan}
                  disabled={!canExecute}
                  className="bg-teal text-white hover:bg-teal/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Calendar size={18} className="mr-2" />
                  Create Schedule
                </Button>
              )}

              {selectedCampaign.status === 'Material Check Approved' && (
                <Button 
                  onClick={handleMarkReady}
                  disabled={!canExecute}
                  className="bg-teal text-white hover:bg-teal/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={18} className="mr-2" />
                  Mark Ready for Execution
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ============================================================
          EXECUTION PLAN MODAL
          ============================================================ */}
      {showExecutionPlan && selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-ink">📅 Execution Plan</h3>
              <h4 className="text-sm font-semibold text-ink">{selectedCampaign.name}</h4>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Create the execution timetable for this campaign. The client has provided the campaign period. 
                Digital Ops decides the actual posting/airing schedule.
              </p>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-ink">Client Campaign Period</p>
                <p className="text-sm text-slate-700">{selectedCampaign.startDate} to {selectedCampaign.endDate}</p>
              </div>

              {selectedCategories.map((category: string) => {
                const plan = executionPlan[category] || { postsPerDay: 1, frequency: 'Daily', times: ['9:00 AM'], placement: 'Standard', notes: '' };
                return (
                  <div key={category} className="rounded-lg border border-slate-200 p-4">
                    <p className="font-semibold text-ink mb-3">{category}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-semibold text-slate-700">Number of posts</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={plan.postsPerDay}
                          onChange={(e) => handleExecutionPlanChange(category, 'postsPerDay', parseInt(e.target.value) || 1)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700">Frequency</label>
                        <select
                          value={plan.frequency}
                          onChange={(e) => handleExecutionPlanChange(category, 'frequency', e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        >
                          <option value="Daily">Daily</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Once">Once</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700">Posting times</label>
                        <input
                          type="text"
                          value={plan.times.join(', ')}
                          onChange={(e) => handleExecutionPlanChange(category, 'times', e.target.value.split(',').map(t => t.trim()))}
                          placeholder="e.g., 8:00 AM, 11:00 AM, 2:00 PM"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700">Placement</label>
                        <input
                          type="text"
                          value={plan.placement}
                          onChange={(e) => handleExecutionPlanChange(category, 'placement', e.target.value)}
                          placeholder="e.g., Banner, Sidebar"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-sm font-semibold text-slate-700">Notes</label>
                        <input
                          type="text"
                          value={plan.notes}
                          onChange={(e) => handleExecutionPlanChange(category, 'notes', e.target.value)}
                          placeholder="Any additional notes"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button 
                  variant="secondary"
                  onClick={() => setShowExecutionPlan(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveExecutionPlan}
                  className="bg-teal text-white hover:bg-teal/80"
                >
                  <Save size={16} className="mr-2" />
                  Save Execution Plan & Schedule
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          GO LIVE MODAL
          ============================================================ */}
      {showGoLiveModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-ink mb-2">🚀 Log Go-Live</h3>
            <p className="text-sm text-slate-500 mb-4">
              Confirm that this campaign has actually started running.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Campaign</label>
                <p className="text-sm text-ink font-medium">{selectedCampaign.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-slate-700">Scheduled Start</label>
                <p className="text-sm text-slate-600">{selectedCampaign.startDate}</p>
              </div>
              
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Actual Go-Live Date</label>
                  <input
                    type="date"
                    value={goLiveDate}
                    onChange={(e) => setGoLiveDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Actual Go-Live Time</label>
                  <input
                    type="time"
                    value={goLiveTime}
                    onChange={(e) => setGoLiveTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-slate-700">Logged By</label>
                <p className="text-sm text-slate-600">Digital Ops</p>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-slate-700">Notes (optional)</label>
                <textarea
                  value={goLiveNotes}
                  onChange={(e) => setGoLiveNotes(e.target.value)}
                  placeholder="Add any notes about the go-live..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[60px]"
                />
              </div>
            </div>
            
            <div className="flex gap-3 justify-end pt-4 border-t mt-4">
              <Button 
                variant="secondary" 
                onClick={() => setShowGoLiveModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmGoLive}
                className="bg-gold text-navy hover:bg-[#d5a43a]"
              >
                <Radio size={16} className="mr-2" />
                Confirm Go-Live
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MATERIAL SPECIFICATIONS AND DEADLINES (ALL SPECS BY DEFAULT)
          ============================================================ */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold text-ink">Material Specifications and Deadlines</h3>
          <p className="mt-1 text-sm text-slate-500">
            {selectedCampaign 
              ? `Showing specs for: ${selectedCategories.join(', ')}` 
              : 'All material specifications'}
          </p>
        </CardHeader>
        <CardBody>
          {!selectedCampaign ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {materialSpecs.map((spec) => (
                <article key={spec.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Badge tone="navy">{spec.category}</Badge>
                      <h4 className="mt-3 font-bold text-ink">{spec.title}</h4>
                      <p className="mt-1 text-sm font-semibold text-[#73510f]">Due: {spec.deadline}</p>
                    </div>
                    <Badge tone="gold">Pending</Badge>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {spec.requirements.map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-slate-600">
                        <CheckSquare className="mt-0.5 shrink-0 text-teal" size={16} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {spec.warning && (
                    <div className="mt-4 flex gap-2 rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm font-semibold text-danger">
                      <AlertTriangle className="mt-0.5 shrink-0" size={16} />
                      <span>{spec.warning}</span>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : selectedCategories.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No products found for this campaign</p>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {selectedCategories.map((category: string) => {
                const spec = materialSpecs.find(s => s.category === category);
                if (!spec) return null;
                const dueDate = selectedCampaign.startDate ? calculateDueDate(selectedCampaign.startDate, category) : '';
                const overdue = dueDate ? isOverdue(dueDate) : false;
                const isApproved = selectedCampaign.status === 'Material Check Approved';
                return (
                  <article key={spec.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <Badge tone="navy">{spec.category}</Badge>
                        <h4 className="mt-3 font-bold text-ink">{spec.title}</h4>
                        <p className="mt-1 text-sm font-semibold text-[#73510f]">
                          Due: {dueDate ? new Date(dueDate).toLocaleDateString() : spec.deadline} ({spec.deadline})
                        </p>
                        {overdue && !isApproved && (
                          <p className="text-sm text-danger font-semibold">⚠️ OVERDUE</p>
                        )}
                      </div>
                      <Badge tone={overdue && !isApproved ? 'danger' : 'gold'}>
                        {overdue && !isApproved ? 'Overdue' : 'Pending'}
                      </Badge>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {spec.requirements.map((item) => (
                        <li key={item} className="flex gap-2 text-sm text-slate-600">
                          <CheckSquare className="mt-0.5 shrink-0 text-teal" size={16} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    {spec.warning && (
                      <div className="mt-4 flex gap-2 rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm font-semibold text-danger">
                        <AlertTriangle className="mt-0.5 shrink-0" size={16} />
                        <span>{spec.warning}</span>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
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
              disabled={!selectedCampaign || selectedCampaign.status === 'Brief Unlocked' || selectedCampaign.status === 'Pending Materials' || selectedCampaign.status === 'Material Check' || selectedCampaign.status === 'Material Check Approved' || !canExecute}
            />
            <Button 
              variant="secondary" 
              disabled={!selectedCampaign || selectedCampaign.status === 'Brief Unlocked' || selectedCampaign.status === 'Pending Materials' || selectedCampaign.status === 'Material Check' || selectedCampaign.status === 'Material Check Approved' || !canExecute}
              onClick={handleUploadClick}
            >
              <UploadCloud size={18} className="mr-2" />
              {uploading ? 'Uploading...' : podUploaded ? 'Replace POD' : 'Upload POD'}
            </Button>
            {!selectedCampaign && (
              <p className="text-sm text-slate-500">Select a campaign first</p>
            )}
            {(selectedCampaign?.status === 'Brief Unlocked' || selectedCampaign?.status === 'Pending Materials' || selectedCampaign?.status === 'Material Check' || selectedCampaign?.status === 'Material Check Approved') && (
              <p className="text-sm text-slate-500">Campaign must be Scheduled or Live to upload POD</p>
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
          <p className="mt-1 text-sm text-slate-500">Select the items that were actually delivered for this campaign.</p>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto] items-end">
            <div>
              <label className="text-sm font-semibold text-slate-700">Item Name</label>
              <select
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                disabled={!selectedCampaign || selectedCampaign.status === 'Brief Unlocked' || selectedCampaign.status === 'Pending Materials' || !canExecute}
              >
                <option value="">Select delivered item...</option>
                {selectedCampaign && getUniqueCategories(selectedCampaign).map((category: string) => (
                  <option key={category} value={`${category} - Full Delivery`}>
                    {category} (Full Delivery)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Quantity</label>
              <input
                type="number"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(Number(e.target.value))}
                min="1"
                className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                disabled={!selectedCampaign || selectedCampaign.status === 'Brief Unlocked' || selectedCampaign.status === 'Pending Materials' || !canExecute}
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
                disabled={!selectedCampaign || selectedCampaign.status === 'Brief Unlocked' || selectedCampaign.status === 'Pending Materials' || !canExecute}
              />
            </div>
            <Button 
              onClick={handleAddDeliveredItem} 
              className="md:col-span-1"
              disabled={!selectedCampaign || selectedCampaign.status === 'Brief Unlocked' || selectedCampaign.status === 'Pending Materials' || !canExecute}
            >
              <Plus size={16} className="mr-2" />
              Add Item
            </Button>
          </div>

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
          <div>
            <label className="text-sm font-semibold text-slate-700">Report Notes (optional)</label>
            <textarea
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              placeholder="Add any additional notes for the report..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[80px]"
              disabled={!selectedCampaign || selectedCampaign.status === 'Brief Unlocked' || selectedCampaign.status === 'Pending Materials' || !canExecute}
            />
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <Button 
              onClick={handleGenerateReport} 
              disabled={!canGenerateReport || generatingReport || !selectedCampaign || selectedCampaign.status === 'Brief Unlocked' || selectedCampaign.status === 'Pending Materials' || !canExecute}
              variant={canGenerateReport && canExecute ? 'primary' : 'secondary'}
            >
              <FileText size={18} className="mr-2" />
              {generatingReport ? 'Generating...' : 'Generate Report'}
            </Button>
            {!selectedCampaign && (
              <p className="text-sm text-slate-500">Select a campaign first</p>
            )}
            {(selectedCampaign?.status === 'Brief Unlocked' || selectedCampaign?.status === 'Pending Materials') && (
              <p className="text-sm text-slate-500">Campaign must be Live or Delivered before generating report</p>
            )}
            {!podUploaded && selectedCampaign && selectedCampaign.status !== 'Brief Unlocked' && selectedCampaign.status !== 'Pending Materials' && (
              <p className="text-sm text-slate-500">Upload POD to enable report generation</p>
            )}
            {podUploaded && deliveredItems.length === 0 && (
              <p className="text-sm text-slate-500">Add at least one delivered item</p>
            )}
          </div>

          {deliveredItems.length > 0 && podUploaded && canExecute && (
            <div className="rounded-lg border border-teal/20 bg-teal/10 p-3">
              <p className="text-sm font-semibold text-teal">
                ✓ Ready to generate report with {deliveredItems.length} delivered item{deliveredItems.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ============================================================
          REJECTION MODAL
          ============================================================ */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-ink mb-2">Reject Materials</h3>
            <p className="text-sm text-slate-500 mb-4">
              Please provide a reason for rejecting these materials.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Image resolution is too low, wrong format submitted..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[100px] mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmRejection}
                className="bg-danger text-white hover:bg-danger/80"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}