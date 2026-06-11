export type Role = 'sales' | 'adManager' | 'digitalOps' | 'finance' | 'admin';

export type CampaignStatus =
  | 'Draft'
  | 'Discount Pending'
  | 'Discount Approved'
  | 'Order Generated'
  | 'Client Signed'
  | 'Countersigned'
  | 'Payment Confirmed'
  | 'Brief Unlocked';

export type ProductCategory =
  | 'Social Media'
  | 'Website Ads'
  | 'Livestream Coverage'
  | 'Video Production'
  | 'Digital Activation'
  | 'Boosting'
  | 'Display'
  | 'Rich Media'
  | 'Content'
  | 'Mobile App'
  | 'Push & SMS'
  | 'Production';

export type ProductLine = {
  id: string;
  category: ProductCategory;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  platform?: string;
};

export type Campaign = {
  id: string;
  dabRef: string;
  clientCompany: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  industry: string;
  name: string;
  objective: string;
  startDate: string;
  endDate: string;
  owner: string;
  status: CampaignStatus;
  products: ProductLine[];
  discountPercent: number;
  discountReason?: string;
  paidDeposit: boolean;
};

export type Approval = {
  id: string;
  campaignId: string;
  type: 'Discount' | 'Countersign' | 'Payment';
  requestedBy: string;
  value: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  note: string;
};

export type RateCardItem = {
  id: string;
  name: string;
  category: ProductCategory;
  unit: string;
  unitPrice: number;
  version: string;
  updatedAt: string;
  status: 'Active' | 'Archived';
};

export type WorkflowStage = {
  id: string;
  name: string;
  description: string;
  sla: string;
};

export type ProductCatalogItem = {
  id: string;
  category: ProductCategory;
  name: string;
  unit: string;
  unitPrice: number;
  description: string;
  fields: string[];
};

export type MaterialSpec = {
  id: string;
  category: ProductCategory;
  title: string;
  deadline: string;
  requirements: string[];
  warning?: string;
};

export type AuditEvent = {
  id: string;
  campaignId: string;
  action: string;
  user: string;
  role: Role;
  timestamp: string;
};

export const roles: Role[] = ['sales', 'adManager', 'digitalOps', 'finance', 'admin'];

export const workflowStages: WorkflowStage[] = [
  { id: 'enquiry', name: 'Client enquiry & brief', description: 'Campaign objective, platform, budget, and timeline captured.', sla: 'Same day' },
  { id: 'proposal', name: 'Proposal, IO & payment', description: 'Rate-card quote, signed insertion order, 50% deposit or LPO.', sla: '24-48 hrs' },
  { id: 'materials', name: 'Material submission & QC', description: 'Asset upload, specs check, legal and compliance sign-off.', sla: '48-72 hrs' },
  { id: 'schedule', name: 'Platform scheduling & setup', description: 'Product-specific scheduling across digital media channels.', sla: 'Per booking' },
  { id: 'live', name: 'Go-live & monitoring', description: 'Publish, confirm, and track active campaigns.', sla: 'Per booking' },
  { id: 'proof', name: 'Verification & proof of delivery', description: 'Screenshots, impression reports, and as-run logs.', sla: '48 hrs post' },
  { id: 'billing', name: 'Billing & reconciliation', description: 'Balance invoice, VAT, and payment clearance.', sla: '7 days' },
  { id: 'report', name: 'Post-campaign report', description: 'Performance data, insights, and renewal offer.', sla: '5 days' },
];

export const productCatalog: ProductCatalogItem[] = [
  {
    id: 'social-post',
    category: 'Social Media',
    name: 'Social media sponsored post',
    unit: 'post / platform',
    unitPrice: 23000,
    description: 'Facebook, X, Instagram, TikTok, and YouTube sponsored content.',
    fields: ['Platforms', 'Start date', 'End date', 'Posts per day', 'Language', 'Boosting option'],
  },
  {
    id: 'livestream-article',
    category: 'Livestream Coverage',
    name: 'Livestream + article',
    unit: 'hour',
    unitPrice: 200000,
    description: 'Website, YouTube, and Facebook livestream with article support.',
    fields: ['Destinations', 'Event name', 'Stream date', 'Start time', 'End time', 'Feed source'],
  },
  {
    id: 'livestream-social',
    category: 'Livestream Coverage',
    name: 'Livestream + 8 social posts',
    unit: 'hour',
    unitPrice: 300000,
    description: 'Event stream package with eight social media posts.',
    fields: ['Destinations', 'Stream days', 'Social post package', 'Branded overlays'],
  },
  {
    id: 'livestream-full',
    category: 'Livestream Coverage',
    name: 'Livestream + posts + article',
    unit: 'hour',
    unitPrice: 350000,
    description: 'Full livestream package with article and eight social media posts.',
    fields: ['Destinations', 'Stream days', 'Article brief', 'Social brief', 'Overlays'],
  },
  {
    id: 'display-above',
    category: 'Display',
    name: 'Display banner - above the fold',
    unit: 'day',
    unitPrice: 5200,
    description: 'Leaderboard or square display placement above the fold.',
    fields: ['Placement', 'Banner format', 'Start date', 'End date', 'Click-through URL'],
  },
  {
    id: 'display-below',
    category: 'Display',
    name: 'Display banner - below the fold',
    unit: 'day',
    unitPrice: 4550,
    description: 'Below-the-fold display campaign on selected KBC sections.',
    fields: ['Placement', 'Banner format', 'Target section', 'Click-through URL'],
  },
  {
    id: 'rich-media',
    category: 'Rich Media',
    name: 'Rich media / roadblock / skin',
    unit: 'hour',
    unitPrice: 100000,
    description: 'Roadblock, skin branding, overlay, expandable, sidekick, or video banner.',
    fields: ['Format', 'Start date', 'End date', 'Hours booked', 'Preferred time slots'],
  },
  {
    id: 'article-client',
    category: 'Content',
    name: 'Sponsored article - client copy',
    unit: 'article',
    unitPrice: 74100,
    description: 'Client-written article published as sponsored content.',
    fields: ['Topic', 'Publication date', 'Hero image', 'Author details'],
  },
  {
    id: 'article-kbc',
    category: 'Content',
    name: 'Sponsored article - KBC writes',
    unit: 'article',
    unitPrice: 104000,
    description: 'KBC-written sponsored article from approved client brief.',
    fields: ['Topic', 'Key messages', 'Approved claims', 'Review contact'],
  },
  {
    id: 'app-ad',
    category: 'Mobile App',
    name: 'Custom in-app ad',
    unit: 'month',
    unitPrice: 325000,
    description: 'KBC app advertising placement.',
    fields: ['Placement', 'Months', 'Start date', 'Click-through URL'],
  },
  {
    id: 'push',
    category: 'Push & SMS',
    name: 'App push notification',
    unit: 'send',
    unitPrice: 0.3,
    description: 'Push notification sent to estimated reach.',
    fields: ['Number of sends', 'Estimated reach', 'Scheduled date', 'Message copy'],
  },
  {
    id: 'sms',
    category: 'Push & SMS',
    name: 'Bulk SMS',
    unit: 'SMS',
    unitPrice: 5,
    description: 'Bulk SMS alert with editorial review.',
    fields: ['Audience size', 'Sender ID', 'Message copy', 'Scheduled time'],
  },
  {
    id: 'landing-page',
    category: 'Production',
    name: 'Landing page design',
    unit: 'page',
    unitPrice: 117000,
    description: 'Lead-generation or campaign landing page production.',
    fields: ['Creative brief', 'Copy', 'Hero image', 'Lead destination', 'Privacy URL'],
  },
  {
    id: 'animated-video',
    category: 'Production',
    name: 'Animated video 16-30 sec',
    unit: 'video',
    unitPrice: 169000,
    description: 'Animated campaign video production.',
    fields: ['Script', 'Storyboard', 'Voiceover language', 'Brand assets'],
  },
];

export const materialSpecs: MaterialSpec[] = [
  {
    id: 'spec-social',
    category: 'Social Media',
    title: 'Social media sponsored content',
    deadline: '5 business days before first post',
    requirements: ['1080 x 1080 images or 1080 x 1920 stories/reels', 'JPG/PNG images, MP4 H.264 video', 'Caption copy, CTA, URL, hashtags, and handles', 'Transparent PNG logo and brand colours'],
    warning: 'Alcohol, pharmaceuticals, financial products, and political content require compliance clearance.',
  },
  {
    id: 'spec-livestream',
    category: 'Livestream Coverage',
    title: 'Livestream assets and technical brief',
    deadline: '7 business days before event',
    requirements: ['1080p feed, RTMP or SRT protocol', 'Runsheet, title card, sponsor logo, and overlay graphics', 'Dedicated upload connection and backup plan', 'Mandatory pre-stream test 48 hours before event'],
    warning: 'A signed content indemnity form is required for all livestreams.',
  },
  {
    id: 'spec-display',
    category: 'Display',
    title: 'Display and rich media ad tags',
    deadline: '3 business days before campaign start',
    requirements: ['Leaderboard 728 x 90, square 300 x 250, half-page 300 x 600, mobile 320 x 50', 'JPG, PNG, GIF, or HTML5 with hosted ad tag', 'Click-through URL with UTM parameters', 'No auto-play audio or deceptive close buttons'],
  },
  {
    id: 'spec-content',
    category: 'Content',
    title: 'Sponsored content and articles',
    deadline: '5-7 business days before publish',
    requirements: ['400-1,200 word article or approved KBC brief', 'Hero image minimum 1200 x 675', 'Author name, bio, key messages, and approved claims', 'Client edits returned within 48 hours'],
  },
  {
    id: 'spec-app',
    category: 'Mobile App',
    title: 'Mobile app advertising',
    deadline: '5 business days before campaign start',
    requirements: ['320 x 50 or 300 x 250 in-app banners', '1080 x 1920 interstitial creative', 'MP4 for app video adverts', 'Click-through URL or app deep link'],
  },
  {
    id: 'spec-push',
    category: 'Push & SMS',
    title: 'Push notifications and SMS',
    deadline: '48 hours before scheduled send',
    requirements: ['Push title max 50 characters', 'Push body max 150 characters', 'SMS copy max 160 characters per unit', 'Approved sender ID and opt-out handling'],
    warning: 'All copy is subject to KBC editorial review and Kenya Data Protection Act compliance.',
  },
  {
    id: 'spec-production',
    category: 'Production',
    title: 'Production services',
    deadline: 'At IO signing',
    requirements: ['Vector logo, brand colours, and brand guidelines', 'Approved script or page copy before work starts', 'Product images minimum 2000px on shortest side', 'Two revision rounds included'],
  },
];

export const rateCard: RateCardItem[] = [
  ...productCatalog.map((item) => ({
    id: `rc-${item.id}`,
    name: item.name,
    category: item.category,
    unit: item.unit,
    unitPrice: item.unitPrice,
    version: '2026.1',
    updatedAt: '2026-06-09',
    status: 'Active' as const,
  })),
];

export const campaigns: Campaign[] = [
  {
    id: 'cmp-1',
    dabRef: 'DAB-2026-00001',
    clientCompany: 'Kenya Tourism Board',
    clientName: 'Amina Wekesa',
    clientEmail: 'amina@ktb.example',
    clientPhone: '+254 711 204 500',
    industry: 'Tourism',
    name: 'Magical Kenya June Push',
    objective: 'Increase domestic tourism bookings through social and website placements.',
    startDate: '2026-06-15',
    endDate: '2026-07-15',
    owner: 'Grace Mwangi',
    status: 'Discount Pending',
    discountPercent: 8,
    discountReason: 'Bundled national campaign with repeat client commitment.',
    paidDeposit: false,
    products: [
      { id: 'p-1', category: 'Social Media', name: 'Social media sponsored post', unit: 'post / platform', quantity: 18, unitPrice: 23000, platform: 'Facebook, Instagram' },
      { id: 'p-2', category: 'Display', name: 'Display banner - above the fold', unit: 'day', quantity: 14, unitPrice: 5200 },
      { id: 'p-3', category: 'Push & SMS', name: 'App push notification', unit: 'send', quantity: 80000, unitPrice: 0.3, platform: 'KBC App' },
    ],
  },
  {
    id: 'cmp-2',
    dabRef: 'DAB-2026-00002',
    clientCompany: 'Equity Bank',
    clientName: 'Peter Otieno',
    clientEmail: 'peter@equity.example',
    clientPhone: '+254 722 816 019',
    industry: 'Financial Services',
    name: 'SME Account Launch',
    objective: 'Generate awareness for SME digital banking products.',
    startDate: '2026-06-20',
    endDate: '2026-08-05',
    owner: 'Daniel Kariuki',
    status: 'Order Generated',
    discountPercent: 0,
    paidDeposit: true,
    products: [
      { id: 'p-4', category: 'Production', name: 'Animated video 16-30 sec', unit: 'video', quantity: 2, unitPrice: 169000 },
      { id: 'p-5', category: 'Social Media', name: 'Social media sponsored post', unit: 'post / platform', quantity: 24, unitPrice: 23000, platform: 'Facebook, X, Instagram' },
      { id: 'p-6', category: 'Livestream Coverage', name: 'Livestream + posts + article', unit: 'hour', quantity: 4, unitPrice: 350000 },
    ],
  },
  {
    id: 'cmp-3',
    dabRef: 'DAB-2026-00003',
    clientCompany: 'Naivas Supermarket',
    clientName: 'Jane Muthoni',
    clientEmail: 'jane@naivas.example',
    clientPhone: '+254 733 412 118',
    industry: 'Retail',
    name: 'Back to School Offers',
    objective: 'Drive regional offer visibility with digital activation and social proof.',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    owner: 'Grace Mwangi',
    status: 'Payment Confirmed',
    discountPercent: 5,
    discountReason: 'Approved volume discount.',
    paidDeposit: true,
    products: [
      { id: 'p-7', category: 'Mobile App', name: 'Custom in-app ad', unit: 'month', quantity: 1, unitPrice: 325000 },
      { id: 'p-8', category: 'Content', name: 'Sponsored article - KBC writes', unit: 'article', quantity: 3, unitPrice: 104000 },
      { id: 'p-9', category: 'Social Media', name: 'Social media sponsored post', unit: 'post / platform', quantity: 16, unitPrice: 23000, platform: 'Facebook, Instagram' },
    ],
  },
];

export const approvals: Approval[] = [
  { id: 'ap-1', campaignId: 'cmp-1', type: 'Discount', requestedBy: 'Grace Mwangi', value: 8, status: 'Pending', note: 'Repeat client bundle request.' },
  { id: 'ap-2', campaignId: 'cmp-2', type: 'Countersign', requestedBy: 'Daniel Kariuki', value: 819000, status: 'Pending', note: 'Client order sheet signed.' },
  { id: 'ap-3', campaignId: 'cmp-3', type: 'Payment', requestedBy: 'Grace Mwangi', value: 732450, status: 'Approved', note: 'Deposit verified by finance.' },
];

export const auditEvents: AuditEvent[] = [
  { id: 'ev-1', campaignId: 'cmp-1', action: 'Campaign Created', user: 'Grace Mwangi', role: 'sales', timestamp: '2026-06-02 09:14' },
  { id: 'ev-2', campaignId: 'cmp-1', action: 'Discount Requested', user: 'Grace Mwangi', role: 'sales', timestamp: '2026-06-02 10:06' },
  { id: 'ev-3', campaignId: 'cmp-2', action: 'PDF Generated', user: 'Daniel Kariuki', role: 'sales', timestamp: '2026-06-03 15:45' },
  { id: 'ev-4', campaignId: 'cmp-2', action: 'Client Signed', user: 'Peter Otieno', role: 'sales', timestamp: '2026-06-04 11:20' },
  { id: 'ev-5', campaignId: 'cmp-3', action: 'Payment Confirmed', user: 'Mary Njeri', role: 'adManager', timestamp: '2026-06-05 14:01' },
];

export function lineTotal(line: ProductLine) {
  return line.quantity * line.unitPrice;
}

export function campaignTotals(campaign: Campaign) {
  const subtotal = campaign.products.reduce((sum, line) => sum + lineTotal(line), 0);
  const boosting = campaign.products
    .filter((line) => line.category === 'Boosting')
    .reduce((sum, line) => sum + lineTotal(line), 0);
  const discount = Math.round(subtotal * (campaign.discountPercent / 100));
  const taxable = subtotal - discount;
  const vat = Math.round(taxable * 0.16);
  const grandTotal = taxable + vat;

  return { subtotal, boosting, discount, vat, grandTotal };
}

export const money = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
});
