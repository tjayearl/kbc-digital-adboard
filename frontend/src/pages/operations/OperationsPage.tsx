import { useState, useRef, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
  AlertTriangle, CalendarDays, CheckSquare, Clock3, UploadCloud, 
  FileText, Plus, X, Calendar, Radio, Lock, CheckCircle, 
  Clock, AlertCircle, Eye, User, Calendar as CalendarIcon,
  Image, Video, Share2, TrendingUp, BarChart3,
  Play, Send, Zap, Layers, ArrowRight, Edit3, Save
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { materialSpecs, type Campaign } from '../../data/mockData';
import { getCampaigns, getCampaign, uploadPod, generateReport, updateCampaign } from '../../services/api';

// Types for asset verification
interface AssetVerification {
  type: 'Artwork' | 'VideoAssets' | 'SocialAssets';
  status: 'pending' | 'received';
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

// Types for scheduling
interface PostSchedule {
  id: string;
  platform: string;
  date: string;
  time: string;
  content: string;
  status: 'pending' | 'scheduled' | 'posted';
}

interface CampaignSchedule {
  platforms: string[];
  postingFrequency: string;
  startDate: string;
  endDate: string;
  posts: PostSchedule[];
  platformOrder: string[];
  notes: string;
}

// Types for go-live
interface GoLiveDetails {
  date: string;
  time: string;
  loggedBy: string;
  notes: string;
  executionStatus: 'pending' | 'in-progress' | 'completed';
  postsPublished: number;
  totalPosts: number;
  errors?: string[];
}

// Campaign with workflow state
interface CampaignWithWorkflow extends Campaign {
  isActive?: boolean;
  isLocked?: boolean;
  isCompleted?: boolean;
  assetVerifications?: AssetVerification[];
  schedule?: CampaignSchedule;
  goLiveDetails?: GoLiveDetails;
}

export function OperationsPage() {
  const navigate = useNavigate();

  // ============================================
  // GET CURRENT USER FROM AUTH CONTEXT
  // ============================================
  const { currentUser: contextUser } = useOutletContext<{ currentUser?: { name: string; email: string; role: string } }>() || {};
  const currentUser = contextUser || {
    name: 'Jane Smith', // Fallback if context is not available
    email: 'jane.smith@kbc.com',
    role: 'digitalOps'
  };

  // State for campaigns
  const [campaigns, setCampaigns] = useState<CampaignWithWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignWithWorkflow | null>(null);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // State for asset verification
  const [assetVerifications, setAssetVerifications] = useState<AssetVerification[]>([
    { type: 'Artwork', status: 'pending' },
    { type: 'VideoAssets', status: 'pending' },
    { type: 'SocialAssets', status: 'pending' }
  ]);

  // ============================================
  // SCHEDULING STATE
  // ============================================
  const [schedule, setSchedule] = useState<CampaignSchedule>({
    platforms: [],
    postingFrequency: 'As scheduled',
    startDate: '',
    endDate: '',
    posts: [],
    platformOrder: [],
    notes: ''
  });

  const [editingSchedule, setEditingSchedule] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [postDate, setPostDate] = useState('');
  const [postTime, setPostTime] = useState('');

  // ============================================
  // GO-LIVE STATE
  // ============================================
  const [goLiveDate, setGoLiveDate] = useState('');
  const [goLiveTime, setGoLiveTime] = useState('');
  const [goLiveNotes, setGoLiveNotes] = useState('');
  const [goLiveExecuting, setGoLiveExecuting] = useState(false);
  const [goLiveProgress, setGoLiveProgress] = useState(0);
  const [goLiveLogs, setGoLiveLogs] = useState<string[]>([]);

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

  // Set default dates when campaign is selected
  useEffect(() => {
    if (selectedCampaign) {
      const now = new Date();
      
      // Auto-fill go-live date and time with current date/time
      setGoLiveDate(now.toISOString().split('T')[0]);
      setGoLiveTime(now.toTimeString().slice(0, 5));
      
      // Initialize schedule with platforms from products and dates from campaign
      if (!selectedCampaign.schedule) {
        // Extract unique platforms from products
        const platforms: string[] = [];
        if (selectedCampaign.products && selectedCampaign.products.length > 0) {
          selectedCampaign.products.forEach(product => {
            if (product.platform && !platforms.includes(product.platform)) {
              platforms.push(product.platform);
            }
          });
        }
        
        // Set default post date to campaign start date
        const defaultPostDate = selectedCampaign.startDate || now.toISOString().split('T')[0];
        setPostDate(defaultPostDate);
        
        setSchedule({
          ...schedule,
          startDate: selectedCampaign.startDate,
          endDate: selectedCampaign.endDate,
          platforms: platforms,
          platformOrder: platforms.length > 0 ? platforms : ['Instagram', 'Facebook', 'Twitter']
        });
        
        // Set default selected platform
        if (platforms.length > 0) {
          setSelectedPlatform(platforms[0]);
        }
      } else {
        setSchedule(selectedCampaign.schedule);
        // Set default selected platform
        if (selectedCampaign.schedule.platformOrder.length > 0) {
          setSelectedPlatform(selectedCampaign.schedule.platformOrder[0]);
        }
      }
    }
  }, [selectedCampaign?.id]);

  const fetchUnlockedBriefs = async () => {
    setLoading(true);
    setError(null);
    try {
      const allCampaigns = await getCampaigns();
      console.log('📊 Campaigns loaded:', allCampaigns.map(c => ({ name: c.name, status: c.status })));
      
      const unlockedBriefs = allCampaigns.filter((campaign) =>
        ['Brief Unlocked', 'Scheduled', 'Live', 'Delivered'].includes(campaign.status)
      );

      const sortedCampaigns = sortCampaignsByWorkflow(unlockedBriefs);
      setCampaigns(sortedCampaigns);
      
      const firstActive = sortedCampaigns.find(c => c.status !== 'Delivered');
      if (firstActive) {
        setSelectedCampaign(firstActive);
        setActiveCampaignId(firstActive.id);
        initializeAssetVerifications(firstActive);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
      setError('Failed to load campaigns. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sortCampaignsByWorkflow = (campaigns: Campaign[]): CampaignWithWorkflow[] => {
    const completed = campaigns.filter(c => c.status === 'Delivered');
    const active = campaigns.filter(c => c.status !== 'Delivered');
    
    completed.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
    active.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    const result: CampaignWithWorkflow[] = [];
    
    if (active.length > 0) {
      result.push({ ...active[0], isActive: true, isLocked: false, isCompleted: false });
    }
    
    for (let i = 1; i < active.length; i++) {
      result.push({ ...active[i], isActive: false, isLocked: true, isCompleted: false });
    }
    
    for (const campaign of completed) {
      result.push({ ...campaign, isActive: false, isLocked: false, isCompleted: true });
    }
    
    return result;
  };

  const initializeAssetVerifications = (campaign: CampaignWithWorkflow) => {
    if (campaign.assetVerifications) {
      setAssetVerifications(campaign.assetVerifications);
      return;
    }
    
    const initialVerifications: AssetVerification[] = [
      { type: 'Artwork', status: 'pending' },
      { type: 'VideoAssets', status: 'pending' },
      { type: 'SocialAssets', status: 'pending' }
    ];
    setAssetVerifications(initialVerifications);
  };

  const activeCampaign = campaigns.find(c => c.isActive);

  // ============================================
  // ✅ CORRECT: Get campaign category from products
  // ============================================
  const getCampaignCategory = (campaign: CampaignWithWorkflow): string => {
    if (campaign.products && campaign.products.length > 0) {
      return campaign.products[0].category;
    }
    return 'General';
  };

  // ============================================
  // ✅ UPDATED: Filter material specs by specific product name
  // ============================================
  const getFilteredMaterialSpecs = () => {
    if (!selectedCampaign) return materialSpecs;
    
    // Get the first product name
    const productName = selectedCampaign.products && selectedCampaign.products.length > 0 
      ? selectedCampaign.products[0].name 
      : '';
    
    if (!productName) return materialSpecs;
    
    // Map product names to material spec categories or specific specs
    // This matches the exact product the client chose
    const productToSpecMap: Record<string, string> = {
      'Social media sponsored post': 'Social Media',
      'Livestream + article': 'Livestream Coverage',
      'Livestream + 8 social posts': 'Livestream Coverage',
      'Livestream + posts + article': 'Livestream Coverage',
      'Display banner - above the fold': 'Display',
      'Display banner - below the fold': 'Display',
      'Rich media / roadblock / skin': 'Display',
      'Sponsored article - client copy': 'Content',
      'Sponsored article - KBC writes': 'Content',
      'Custom in-app ad': 'Mobile App',
      'App push notification': 'Push & SMS',
      'Bulk SMS': 'Push & SMS',
      'Landing page design': 'Production',
      'Animated video 16-30 sec': 'Production'
    };
    
    const mappedCategory = productToSpecMap[productName] || getCampaignCategory(selectedCampaign);
    
    return materialSpecs.filter(spec => spec.category === mappedCategory);
  };

  // ============================================
  // ASSET VERIFICATION FUNCTIONS
  // ============================================
  
  const handleAssetVerification = (type: 'Artwork' | 'VideoAssets' | 'SocialAssets') => {
    if (!selectedCampaign || !selectedCampaign.isActive) {
      alert('This campaign is locked. Please complete the active campaign first.');
      return;
    }

    const updatedVerifications = assetVerifications.map(asset => {
      if (asset.type === type) {
        return {
          ...asset,
          status: 'received' as const,
          verifiedBy: currentUser.name, // ✅ Use actual logged-in user
          verifiedAt: new Date().toISOString(),
          notes: asset.notes || ''
        };
      }
      return asset;
    });

    setAssetVerifications(updatedVerifications);
    
    const updatedCampaign = {
      ...selectedCampaign,
      assetVerifications: updatedVerifications
    };
    setSelectedCampaign(updatedCampaign);
    
    const updatedCampaigns = campaigns.map(c => 
      c.id === selectedCampaign.id ? updatedCampaign : c
    );
    setCampaigns(updatedCampaigns);
  };

  const handleAssetNoteChange = (type: 'Artwork' | 'VideoAssets' | 'SocialAssets', note: string) => {
    const updatedVerifications = assetVerifications.map(asset => {
      if (asset.type === type) {
        return { ...asset, notes: note };
      }
      return asset;
    });
    setAssetVerifications(updatedVerifications);
  };

  const allAssetsReceived = assetVerifications.every(a => a.status === 'received');

  // ============================================
  // SCHEDULING FUNCTIONS
  // ============================================
  
  const handleAddPostToSchedule = () => {
    if (!selectedCampaign || !selectedCampaign.isActive) {
      alert('Please select an active campaign');
      return;
    }

    if (!newPostContent.trim()) {
      alert('Please enter post content');
      return;
    }

    if (!postDate || !postTime) {
      alert('Please select date and time for the post');
      return;
    }

    if (!selectedPlatform) {
      alert('Please select a platform');
      return;
    }

    // ✅ Validate post date is within campaign dates
    if (selectedCampaign.startDate && selectedCampaign.endDate) {
      const postDateObj = new Date(postDate);
      const startDateObj = new Date(selectedCampaign.startDate);
      const endDateObj = new Date(selectedCampaign.endDate);
      
      if (postDateObj < startDateObj || postDateObj > endDateObj) {
        alert(`Please select a date between ${selectedCampaign.startDate} and ${selectedCampaign.endDate}`);
        return;
      }
    }

    const newPost: PostSchedule = {
      id: Date.now().toString(),
      platform: selectedPlatform,
      date: postDate,
      time: postTime,
      content: newPostContent.trim(),
      status: 'scheduled'
    };

    setSchedule({
      ...schedule,
      posts: [...schedule.posts, newPost]
    });

    // Reset form but keep the date as a default
    setNewPostContent('');
    setPostTime('');
    // Keep the date as is for next post
  };

  const handleRemovePostFromSchedule = (postId: string) => {
    setSchedule({
      ...schedule,
      posts: schedule.posts.filter(p => p.id !== postId)
    });
  };

  const handleUpdatePlatformOrder = (platforms: string[]) => {
    setSchedule({
      ...schedule,
      platformOrder: platforms
    });
  };

  const handleSaveSchedule = async () => {
    if (!selectedCampaign) return;

    if (schedule.posts.length === 0) {
      alert('Please add at least one scheduled post');
      return;
    }

    try {
      console.log('📅 Executing schedule for campaign:', selectedCampaign.name);
      console.log('📋 Platform order:', schedule.platformOrder);
      console.log('📝 Posts to schedule:', schedule.posts.length);
      
      const updatedCampaign = {
        ...selectedCampaign,
        schedule: schedule,
        status: 'Scheduled' as const
      };
      
      await updateCampaign(selectedCampaign.id, { 
        status: 'Scheduled',
        schedule: schedule
      } as any);
      
      setSelectedCampaign(updatedCampaign);
      await fetchUnlockedBriefs();
      
      alert(`✅ Campaign "${selectedCampaign.name}" scheduled successfully!\n📝 ${schedule.posts.length} posts scheduled across ${schedule.platforms.join(', ')}`);
      
      setEditingSchedule(false);
      
    } catch (err) {
      console.error('Failed to schedule campaign:', err);
      alert('Failed to schedule campaign. Please try again.');
    }
  };

  // ============================================
  // GO-LIVE FUNCTIONS
  // ============================================
  
  const handleExecuteGoLive = async () => {
    if (!selectedCampaign) {
      alert('Please select a campaign');
      return;
    }

    if (!goLiveDate || !goLiveTime) {
      alert('Please set the go-live date and time');
      return;
    }

    if (!confirm(`⚠️ Are you sure you want to launch campaign "${selectedCampaign.name}"?\n\nThis will publish all scheduled posts and make the campaign live.`)) {
      return;
    }

    setGoLiveExecuting(true);
    setGoLiveProgress(0);
    setGoLiveLogs([]);

    try {
      console.log('🚀 Executing go-live for campaign:', selectedCampaign.name);
      
      const posts = schedule.posts.filter(p => p.status === 'scheduled');
      const totalPosts = posts.length;
      let published = 0;
      const errors: string[] = [];

      for (const post of posts) {
        try {
          console.log(`📤 Publishing to ${post.platform}: ${post.content.substring(0, 30)}...`);
          post.status = 'posted';
          published++;
          
          setGoLiveProgress(Math.round((published / totalPosts) * 100));
          setGoLiveLogs(prev => [...prev, `✅ Published to ${post.platform} at ${post.time}`]);
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (err) {
          const errorMsg = `❌ Failed to publish to ${post.platform}: ${err}`;
          errors.push(errorMsg);
          setGoLiveLogs(prev => [...prev, errorMsg]);
        }
      }

      const goLiveDetails: GoLiveDetails = {
        date: goLiveDate,
        time: goLiveTime,
        loggedBy: currentUser.name, // ✅ Use actual logged-in user
        notes: goLiveNotes,
        executionStatus: errors.length === 0 ? 'completed' : 'in-progress',
        postsPublished: published,
        totalPosts: totalPosts,
        errors: errors.length > 0 ? errors : undefined
      };

      await updateCampaign(selectedCampaign.id, { 
        status: 'Live',
        goLiveDetails: goLiveDetails
      } as any);

      const updatedCampaign = {
        ...selectedCampaign,
        goLiveDetails: goLiveDetails,
        status: 'Live' as const
      };
      setSelectedCampaign(updatedCampaign);

      await fetchUnlockedBriefs();

      if (errors.length === 0) {
        alert(`✅ Campaign "${selectedCampaign.name}" is now LIVE!\n📊 ${published}/${totalPosts} posts published successfully.`);
      } else {
        alert(`⚠️ Campaign "${selectedCampaign.name}" is LIVE with some errors.\n✅ ${published}/${totalPosts} posts published.\n❌ ${errors.length} errors occurred. Check logs.`);
      }

      setGoLiveNotes('');
      setGoLiveProgress(0);
      
    } catch (err) {
      console.error('Failed to execute go-live:', err);
      alert('Failed to execute go-live. Please check logs and try again.');
    } finally {
      setGoLiveExecuting(false);
    }
  };

  // ============================================
  // DELIVERED ITEMS FUNCTIONS
  // ============================================

  const handleAddDeliveredItem = () => {
    if (!newItemName.trim()) {
      alert('Please select an item from the dropdown');
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

  // ============================================
  // POD FUNCTIONS
  // ============================================

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
      
      await updateCampaign(selectedCampaign.id, { status: 'Delivered' } as any);
      await fetchUnlockedBriefs();
      
      alert(`✅ POD uploaded successfully!`);
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

  // ============================================
  // REPORT FUNCTIONS
  // ============================================

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

  // ============================================
  // MARK COMPLETE
  // ============================================

  const handleMarkComplete = async () => {
    if (!selectedCampaign) return;

    if (!allAssetsReceived) {
      alert('Please verify all assets before marking as complete.');
      return;
    }

    if (!podUploaded) {
      alert('Please upload Proof of Delivery before completing the campaign.');
      return;
    }

    try {
      await updateCampaign(selectedCampaign.id, { status: 'Delivered' } as any);
      await fetchUnlockedBriefs();
      
      alert(`✅ Campaign "${selectedCampaign.name}" completed successfully!`);
      
      setPodUploaded(false);
      setPodFileName('');
      setPodPreview('');
      setDeliveredItems([]);
      setReportNotes('');
      
    } catch (err) {
      console.error('Failed to complete campaign:', err);
      alert('Failed to complete campaign. Please try again.');
    }
  };

  // ============================================
  // UI HELPERS
  // ============================================

  const canGenerateReport = podUploaded && deliveredItems.length > 0;

  const handleCampaignSelect = (campaign: CampaignWithWorkflow) => {
    if (campaign.isLocked) {
      alert('🔒 This brief is locked. Please complete the active campaign first.');
      return;
    }
    
    setSelectedCampaign(campaign);
    setPodUploaded(false);
    setPodFileName('');
    setPodPreview('');
    setDeliveredItems([]);
    setReportNotes('');
    
    if (campaign.assetVerifications) {
      setAssetVerifications(campaign.assetVerifications);
    } else {
      initializeAssetVerifications(campaign);
    }
    
    if (campaign.schedule) {
      setSchedule(campaign.schedule);
    }
  };

  const getCountdownDays = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCountdownStatus = (days: number) => {
    if (days < 0) return { color: 'text-danger', bg: 'bg-danger/10', label: 'Overdue' };
    if (days <= 2) return { color: 'text-danger', bg: 'bg-danger/10', label: 'Urgent' };
    if (days <= 5) return { color: 'text-warning', bg: 'bg-warning/10', label: 'Soon' };
    return { color: 'text-teal', bg: 'bg-teal/10', label: 'On Track' };
  };

  // ============================================
  // RENDER
  // ============================================

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

  // Get the display category for the selected campaign
  const displayCategory = selectedCampaign ? getCampaignCategory(selectedCampaign) : '';

  // Get available products for dropdown
  const availableProducts = selectedCampaign?.products || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Digital operations</h2>
          <p className="mt-1 text-sm text-slate-500">Unlocked briefs ready for execution.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm self-start sm:self-auto">
          <User size={16} className="text-slate-400" />
          <span>Operator: <span className="font-semibold text-ink">{currentUser.name}</span></span>
        </div>
      </div>
      
      {/* ============================================================
          VERTICAL BRIEFS LIST
          ============================================================ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-ink">Campaign Briefs</h3>
              <p className="mt-1 text-sm text-slate-500">
                Work through campaigns one at a time. Complete the active campaign to unlock the next.
              </p>
            </div>
            <Badge tone="gold">
              {activeCampaign ? `Active: ${activeCampaign.name}` : 'No active campaign'}
            </Badge>
          </div>
        </CardHeader>
        <CardBody>
          {campaigns.filter(c => c.status !== 'Delivered').length === 0 && 
           campaigns.filter(c => c.status === 'Delivered').length === 0 ? (
            <p className="text-center text-slate-500 py-8">No unlocked briefs available.</p>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => {
                const isActive = campaign.isActive;
                const isLocked = campaign.isLocked;
                const isCompleted = campaign.isCompleted;
                const countdownDays = getCountdownDays(campaign.endDate);
                const countdownStatus = getCountdownStatus(countdownDays);
                const category = getCampaignCategory(campaign);
                
                let cardStyles = 'rounded-lg border p-4 transition-all cursor-pointer ';
                if (isActive) {
                  cardStyles += 'border-gold bg-gold/5 ring-2 ring-gold/30 shadow-md ';
                } else if (isLocked) {
                  cardStyles += 'border-slate-200 opacity-50 cursor-not-allowed ';
                } else if (isCompleted) {
                  cardStyles += 'border-teal/30 bg-teal/5 opacity-70 ';
                }
                
                return (
                  <div
                    key={campaign.id}
                    className={cardStyles}
                    onClick={() => handleCampaignSelect(campaign)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          {isActive && (
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-gold">
                              <Radio size={16} className="animate-pulse" />
                              ACTIVE
                            </span>
                          )}
                          {isLocked && (
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400">
                              <Lock size={16} />
                              LOCKED
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal">
                              <CheckCircle size={16} />
                              COMPLETED
                            </span>
                          )}
                          
                          <h4 className="font-bold text-ink truncate">{campaign.name}</h4>
                          <Badge tone="navy" className="text-xs">{campaign.status}</Badge>
                        </div>
                        
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                          <span>{campaign.clientCompany}</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <CalendarIcon size={14} />
                            {campaign.startDate} - {campaign.endDate}
                          </span>
                          <span>•</span>
                          <Badge tone="gold" className="text-xs">{category}</Badge>
                        </div>
                      </div>
                      
                      {!isCompleted && (
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${countdownStatus.bg} ${countdownStatus.color}`}>
                          <Clock size={16} />
                          <span className="font-semibold text-sm">
                            {countdownDays} days until LIVE
                          </span>
                          <span className="text-xs font-medium">{countdownStatus.label}</span>
                        </div>
                      )}
                    </div>
                    
                    {isActive && campaign.assetVerifications && (
                      <div className="mt-3 flex flex-wrap items-center gap-4 pt-3 border-t border-slate-200">
                        {campaign.assetVerifications.map((asset) => (
                          <div key={asset.type} className="flex items-center gap-1.5 text-sm">
                            {asset.type === 'Artwork' && <Image size={14} className="text-slate-400" />}
                            {asset.type === 'VideoAssets' && <Video size={14} className="text-slate-400" />}
                            {asset.type === 'SocialAssets' && <Share2 size={14} className="text-slate-400" />}
                            <span>{asset.type.replace('Assets', '')}</span>
                            {asset.status === 'received' ? (
                              <CheckCircle size={14} className="text-teal" />
                            ) : (
                              <Clock size={14} className="text-slate-400" />
                            )}
                          </div>
                        ))}
                        <span className="text-xs text-slate-400 ml-2">
                          {campaign.assetVerifications.filter(a => a.status === 'received').length}/{campaign.assetVerifications.length} received
                        </span>
                      </div>
                    )}
                    
                    {isLocked && (
                      <p className="mt-2 text-sm text-slate-400">
                        ⏳ Waiting for previous campaign to complete
                      </p>
                    )}
                    
                    {isCompleted && (
                      <p className="mt-2 text-sm text-teal">
                        ✅ Completed on {new Date().toLocaleDateString()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ============================================================
          CAMPAIGN DETAILS
          ============================================================ */}
      {selectedCampaign && !selectedCampaign.isLocked && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-bold text-ink">{selectedCampaign.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedCampaign.clientCompany} • {selectedCampaign.dabRef}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone="navy">{selectedCampaign.status}</Badge>
                {selectedCampaign.isActive && (
                  <Badge tone="gold" className="animate-pulse">▶ Active</Badge>
                )}
              </div>
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
              <div>
                <p className="text-sm text-slate-500">Category</p>
                <p className="font-semibold">{displayCategory}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Product</p>
                <p className="font-semibold">{selectedCampaign.products[0]?.name || 'Not specified'}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ============================================================
          ASSET VERIFICATION SECTION
          ============================================================ */}
      {selectedCampaign && selectedCampaign.isActive && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink">Asset Verification</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Verify that all assets have been received and meet specifications.
                  <span className="block text-xs text-slate-400 mt-0.5">
                    ✅ Default: Pending | Click "Mark as Received" after manual verification
                  </span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold">
                  {assetVerifications.filter(a => a.status === 'received').length}/{assetVerifications.length} Verified
                </span>
                <div className="mt-1 h-1.5 w-32 rounded-full bg-slate-200 overflow-hidden">
                  <div 
                    className="h-full bg-teal transition-all duration-300"
                    style={{ width: `${(assetVerifications.filter(a => a.status === 'received').length / assetVerifications.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {assetVerifications.map((asset) => (
              <div key={asset.type} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {asset.type === 'Artwork' && <Image size={20} className="text-navy" />}
                      {asset.type === 'VideoAssets' && <Video size={20} className="text-navy" />}
                      {asset.type === 'SocialAssets' && <Share2 size={20} className="text-navy" />}
                      <h4 className="font-bold text-ink">{asset.type.replace('Assets', ' Assets')}</h4>
                      <Badge tone={asset.status === 'received' ? 'teal' : 'neutral'}>
                        {asset.status === 'received' ? '✅ Received' : '⏳ Pending'}
                      </Badge>
                    </div>
                    
                    {asset.status === 'received' && (
                      <div className="mt-2 text-sm text-slate-500 space-y-0.5">
                        <p className="flex items-center gap-1">
                          <User size={14} />
                          Verified by: <span className="font-semibold text-ink">{asset.verifiedBy || currentUser.name}</span>
                        </p>
                        <p className="flex items-center gap-1">
                          <Clock size={14} />
                          Verified at: <span className="font-semibold text-ink">
                            {asset.verifiedAt ? new Date(asset.verifiedAt).toLocaleString() : 'Just now'}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {asset.status === 'pending' ? (
                      <Button
                        onClick={() => handleAssetVerification(asset.type)}
                        className="bg-teal text-white hover:bg-teal/80"
                      >
                        <CheckSquare size={16} className="mr-1" />
                        Mark as Received
                      </Button>
                    ) : (
                      <span className="text-sm text-teal font-semibold">✓ Verified</span>
                    )}
                  </div>
                </div>
                
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Add verification notes (optional)"
                    value={asset.notes || ''}
                    onChange={(e) => handleAssetNoteChange(asset.type, e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                    disabled={asset.status === 'received'}
                  />
                </div>
              </div>
            ))}
            
            {allAssetsReceived && (
              <div className="rounded-lg border border-teal/20 bg-teal/10 p-3 flex items-center gap-2">
                <CheckCircle size={20} className="text-teal" />
                <p className="font-semibold text-teal">All assets verified! Ready to proceed.</p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ============================================================
          MATERIAL SPECIFICATIONS - FILTERED BY PRODUCT
          ============================================================ */}
      {selectedCampaign && !selectedCampaign.isLocked && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold text-ink">Material Specifications</h3>
            <p className="mt-1 text-sm text-slate-500">
              Specifications for: {selectedCampaign.products[0]?.name || displayCategory}
              {selectedCampaign.isActive && ' Verify assets against these requirements.'}
            </p>
          </CardHeader>
          <CardBody className="grid gap-4 xl:grid-cols-2">
            {getFilteredMaterialSpecs().length > 0 ? (
              getFilteredMaterialSpecs().map((spec) => (
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
              ))
            ) : (
              <p className="text-sm text-slate-500 col-span-2 text-center py-4">
                No material specifications found for this product.
              </p>
            )}
          </CardBody>
        </Card>
      )}

      {/* ============================================================
          SCHEDULING SECTION - WITH DYNAMIC PLATFORM ORDER & DATE VALIDATION
          ============================================================ */}
      {selectedCampaign && selectedCampaign.isActive && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink">📅 Scheduling & Execution</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Plan your campaign schedule. Decide platform order, posting frequency, and schedule each post.
                  {selectedCampaign.status === 'Scheduled' && (
                    <span className="block text-xs text-teal mt-0.5">✅ Schedule is locked. You can view but not edit.</span>
                  )}
                </p>
              </div>
              {selectedCampaign.status === 'Brief Unlocked' && (
                <Button
                  onClick={() => setEditingSchedule(!editingSchedule)}
                  variant="secondary"
                >
                  {editingSchedule ? <Save size={16} className="mr-1" /> : <Edit3 size={16} className="mr-1" />}
                  {editingSchedule ? 'Save Schedule' : 'Edit Schedule'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* Platform Order */}
            <div>
              <label className="text-sm font-semibold text-slate-700">Platform Order</label>
              <p className="text-xs text-slate-400 mb-2">
                {schedule.platformOrder.length > 0 
                  ? 'Platforms from the client order. Drag to reorder (first = highest priority).' 
                  : 'No platforms specified in the order.'}
              </p>
              <div className="flex flex-wrap gap-2">
                {schedule.platformOrder.length > 0 ? (
                  schedule.platformOrder.map((platform, index) => (
                    <div key={platform} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 bg-white">
                      <span className="text-xs font-medium text-slate-500">#{index + 1}</span>
                      <span className="font-semibold">{platform}</span>
                      {editingSchedule && index > 0 && (
                        <button 
                          className="text-slate-400 hover:text-navy"
                          onClick={() => {
                            const newOrder = [...schedule.platformOrder];
                            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
                            handleUpdatePlatformOrder(newOrder);
                          }}
                        >
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">No platforms available from the order</p>
                )}
              </div>
              <div className="mt-2 text-sm text-slate-500">
                <span className="font-semibold">Posting Frequency:</span> {schedule.postingFrequency}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                <span className="font-semibold">Campaign Date Range:</span> {schedule.startDate} to {schedule.endDate}
              </div>
            </div>

            {/* Add Post Form - Only when editing */}
            {editingSchedule && selectedCampaign.status === 'Brief Unlocked' && (
              <div className="rounded-lg border border-gold/30 bg-gold/5 p-4">
                <h4 className="font-semibold text-ink mb-3">Add Scheduled Post</h4>
                <div className="grid gap-3 md:grid-cols-[auto,1fr,auto,auto]">
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-gold focus:outline-none"
                    disabled={schedule.platformOrder.length === 0}
                  >
                    {schedule.platformOrder.length > 0 ? (
                      schedule.platformOrder.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))
                    ) : (
                      <option value="">No platforms available</option>
                    )}
                  </select>
                  <input
                    type="text"
                    placeholder="Post content..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-gold focus:outline-none"
                    disabled={schedule.platformOrder.length === 0}
                  />
                  <input
                    type="date"
                    value={postDate}
                    onChange={(e) => setPostDate(e.target.value)}
                    min={schedule.startDate}
                    max={schedule.endDate}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-gold focus:outline-none"
                    disabled={schedule.platformOrder.length === 0}
                  />
                  <input
                    type="time"
                    value={postTime}
                    onChange={(e) => setPostTime(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-gold focus:outline-none"
                    disabled={schedule.platformOrder.length === 0}
                  />
                  <Button 
                    onClick={handleAddPostToSchedule} 
                    className="md:col-start-5"
                    disabled={schedule.platformOrder.length === 0}
                  >
                    <Plus size={16} className="mr-1" />
                    Add
                  </Button>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  Post date must be between {schedule.startDate} and {schedule.endDate}
                </div>
              </div>
            )}

            {/* Scheduled Posts List */}
            {schedule.posts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-700">
                    Scheduled Posts ({schedule.posts.length})
                  </p>
                  <Badge tone="teal">{schedule.posts.filter(p => p.status === 'scheduled').length} pending</Badge>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {schedule.posts.map((post) => (
                    <div key={post.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge tone="navy" className="text-xs">{post.platform}</Badge>
                          <span className="text-xs text-slate-500">{post.date} at {post.time}</span>
                          <Badge tone={post.status === 'posted' ? 'teal' : 'neutral'} className="text-xs">
                            {post.status === 'posted' ? '✅ Posted' : '⏳ Scheduled'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 truncate mt-1">{post.content}</p>
                      </div>
                      {editingSchedule && selectedCampaign.status === 'Brief Unlocked' && post.status === 'scheduled' && (
                        <button
                          onClick={() => handleRemovePostFromSchedule(post.id)}
                          className="ml-2 text-danger hover:text-danger/70"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule Notes */}
            <div>
              <label className="text-sm font-semibold text-slate-700">Schedule Notes</label>
              <textarea
                value={schedule.notes}
                onChange={(e) => setSchedule({ ...schedule, notes: e.target.value })}
                placeholder="Add notes about the schedule..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[60px] focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                disabled={!editingSchedule || selectedCampaign.status !== 'Brief Unlocked'}
              />
            </div>

            {/* Schedule Actions */}
            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200">
              {selectedCampaign.status === 'Brief Unlocked' && (
                <>
                  <Button
                    onClick={handleSaveSchedule}
                    disabled={schedule.posts.length === 0 || schedule.platformOrder.length === 0}
                    className="bg-teal text-white hover:bg-teal/80"
                  >
                    <Calendar size={18} className="mr-2" />
                    Execute Schedule
                  </Button>
                  {schedule.posts.length === 0 && (
                    <p className="text-sm text-slate-500 self-center">Add at least one post to schedule</p>
                  )}
                  {schedule.platformOrder.length === 0 && (
                    <p className="text-sm text-slate-500 self-center">No platforms available from the order</p>
                  )}
                </>
              )}
              {selectedCampaign.status === 'Scheduled' && (
                <div className="rounded-lg border border-teal/20 bg-teal/10 p-3 flex items-center gap-2">
                  <CheckCircle size={20} className="text-teal" />
                  <p className="font-semibold text-teal">Schedule is locked and ready for go-live!</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ============================================================
          GO-LIVE SECTION
          ============================================================ */}
      {selectedCampaign && selectedCampaign.isActive && selectedCampaign.status === 'Scheduled' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold text-ink">🚀 Execute Go-Live</h3>
            <p className="mt-1 text-sm text-slate-500">
              Launch your campaign! This will publish all scheduled posts and make the campaign live.
              <span className="block text-xs text-teal mt-0.5">⚠️ This action will execute the actual go-live process.</span>
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">Go-Live Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={goLiveDate}
                    onChange={(e) => setGoLiveDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 pl-10 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                    disabled={goLiveExecuting}
                  />
                  <CalendarIcon size={18} className="absolute left-3 top-2.5 text-slate-400" />
                </div>
                <p className="text-xs text-slate-400 mt-1">Auto-captured from current date/time, editable if needed</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Go-Live Time</label>
                <div className="relative">
                  <input
                    type="time"
                    value={goLiveTime}
                    onChange={(e) => setGoLiveTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 pl-10 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                    disabled={goLiveExecuting}
                  />
                  <Clock size={18} className="absolute left-3 top-2.5 text-slate-400" />
                </div>
                <p className="text-xs text-slate-400 mt-1">Auto-captured from current date/time, editable if needed</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Notes (Optional)</label>
              <textarea
                value={goLiveNotes}
                onChange={(e) => setGoLiveNotes(e.target.value)}
                placeholder="Add any go-live notes..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[60px] focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                disabled={goLiveExecuting}
              />
            </div>

            {/* Go-Live Progress */}
            {goLiveExecuting && (
              <div className="rounded-lg border border-gold/30 bg-gold/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-ink">Executing Go-Live...</p>
                  <span className="text-sm font-semibold text-gold">{goLiveProgress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div 
                    className="h-full bg-gold transition-all duration-500"
                    style={{ width: `${goLiveProgress}%` }}
                  />
                </div>
                <div className="mt-3 max-h-32 overflow-y-auto space-y-1">
                  {goLiveLogs.map((log, index) => (
                    <p key={index} className="text-xs text-slate-600">{log}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleExecuteGoLive}
                disabled={goLiveExecuting || schedule.posts.filter(p => p.status === 'scheduled').length === 0}
                className="bg-gold text-navy hover:bg-[#d5a43a]"
              >
                <Play size={18} className="mr-2" />
                {goLiveExecuting ? 'Executing...' : 'Execute Go-Live'}
              </Button>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <p className="text-sm text-slate-500">
                  <User size={14} className="inline mr-1" />
                  Will be logged by: <span className="font-semibold text-ink">{currentUser.name}</span>
                </p>
              </div>
            </div>

            {schedule.posts.filter(p => p.status === 'scheduled').length === 0 && !goLiveExecuting && (
              <p className="text-sm text-slate-500">No pending posts to publish</p>
            )}

            {/* Go-Live Summary if campaign is Live */}
            {selectedCampaign.goLiveDetails && (
              <div className="rounded-lg border border-teal/20 bg-teal/10 p-4">
                <h4 className="font-semibold text-teal mb-2">✅ Go-Live Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-slate-500">Date</p>
                    <p className="font-semibold">{selectedCampaign.goLiveDetails.date}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Time</p>
                    <p className="font-semibold">{selectedCampaign.goLiveDetails.time}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Logged By</p>
                    <p className="font-semibold">{selectedCampaign.goLiveDetails.loggedBy}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Posts Published</p>
                    <p className="font-semibold">{selectedCampaign.goLiveDetails.postsPublished}/{selectedCampaign.goLiveDetails.totalPosts}</p>
                  </div>
                </div>
                {selectedCampaign.goLiveDetails.notes && (
                  <div className="mt-2 text-sm text-slate-600">
                    <p className="text-slate-500">Notes</p>
                    <p>{selectedCampaign.goLiveDetails.notes}</p>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ============================================================
          PROOF OF DELIVERY (POD) SECTION
          ============================================================ */}
      {selectedCampaign && !selectedCampaign.isLocked && (
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
                disabled={!allAssetsReceived || uploading || !selectedCampaign || !selectedCampaign.isActive}
              />
              <Button 
                variant="secondary" 
                disabled={!allAssetsReceived || uploading || !selectedCampaign || !selectedCampaign.isActive}
                onClick={handleUploadClick}
              >
                <UploadCloud size={18} className="mr-2" />
                {uploading ? 'Uploading...' : podUploaded ? 'Replace POD' : 'Upload POD'}
              </Button>
              {!selectedCampaign.isActive && (
                <p className="text-sm text-slate-500">This campaign is locked</p>
              )}
              {selectedCampaign.isActive && !allAssetsReceived && (
                <p className="text-sm text-slate-500">Verify all assets before uploading POD</p>
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
      )}

      {/* ============================================================
          DELIVERED ITEMS SECTION WITH DROPDOWN
          ============================================================ */}
      {selectedCampaign && !selectedCampaign.isLocked && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold text-ink">Delivered Items</h3>
            <p className="mt-1 text-sm text-slate-500">Select the items that were actually delivered for this campaign.</p>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto] items-end">
              <div>
                <label className="text-sm font-semibold text-slate-700">Select Item</label>
                <select
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  disabled={!selectedCampaign.isActive || availableProducts.length === 0}
                >
                  <option value="">Select a product...</option>
                  {availableProducts.map((product, index) => (
                    <option key={index} value={product.name}>
                      {product.name} ({product.quantity} x {product.unit})
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
                  className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  disabled={!selectedCampaign.isActive}
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-sm font-semibold text-slate-700">Notes (optional)</label>
                <input
                  type="text"
                  value={newItemNotes}
                  onChange={(e) => setNewItemNotes(e.target.value)}
                  placeholder="Any delivery notes"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  disabled={!selectedCampaign.isActive}
                />
              </div>
              <Button 
                onClick={handleAddDeliveredItem} 
                className="md:col-span-1"
                disabled={!selectedCampaign.isActive || !newItemName}
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
                      disabled={!selectedCampaign.isActive}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ============================================================
          CAMPAIGN REPORT SECTION
          ============================================================ */}
      {selectedCampaign && !selectedCampaign.isLocked && (
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[80px] focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                disabled={!selectedCampaign.isActive}
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <Button 
                onClick={handleGenerateReport} 
                disabled={!canGenerateReport || generatingReport || !selectedCampaign || !selectedCampaign.isActive}
                variant={canGenerateReport ? 'primary' : 'secondary'}
              >
                <FileText size={18} className="mr-2" />
                {generatingReport ? 'Generating...' : 'Generate Report'}
              </Button>
              {!selectedCampaign.isActive && (
                <p className="text-sm text-slate-500">This campaign is locked</p>
              )}
              {selectedCampaign.isActive && !podUploaded && (
                <p className="text-sm text-slate-500">Upload POD to enable report generation</p>
              )}
              {podUploaded && deliveredItems.length === 0 && (
                <p className="text-sm text-slate-500">Add at least one delivered item</p>
              )}
            </div>

            {deliveredItems.length > 0 && (
              <div className="rounded-lg border border-teal/20 bg-teal/10 p-3">
                <p className="text-sm font-semibold text-teal">
                  ✓ Ready to generate report with {deliveredItems.length} delivered item{deliveredItems.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ============================================================
          COMPLETE CAMPAIGN BUTTON
          ============================================================ */}
      {selectedCampaign && selectedCampaign.isActive && (
        <Card>
          <CardBody className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h4 className="font-bold text-ink">Complete Campaign</h4>
              <p className="text-sm text-slate-500">
                Once all steps are complete, mark the campaign as done to unlock the next brief.
              </p>
            </div>
            <Button
              onClick={handleMarkComplete}
              disabled={!allAssetsReceived || !podUploaded || deliveredItems.length === 0}
              className="bg-teal text-white hover:bg-teal/80"
            >
              <CheckCircle size={18} className="mr-2" />
              Mark Campaign Complete
            </Button>
          </CardBody>
        </Card>
      )}

      {/* ============================================================
          LOCKED CAMPAIGN MESSAGE
          ============================================================ */}
      {selectedCampaign && selectedCampaign.isLocked && (
        <Card>
          <CardBody className="flex items-center justify-center gap-3 py-8 text-slate-500">
            <Lock size={24} />
            <div className="text-center">
              <p className="font-semibold text-ink">🔒 This brief is locked</p>
              <p className="text-sm">Please complete the active campaign first before accessing this brief.</p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}