import { auth } from '../firebase';
import {
  type Campaign,
  type ProductCatalogItem,
  type ProductCategory,
  type RateCardItem,
  type Approval
} from '../data/mockData';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://kbc-digital-adboard.onrender.com/api/v1';

// Dynamic rate card cache
let cachedRateCard: any[] = [];

export async function fetchAndCacheRateCard() {
  try {
    const res = await fetch(`${BASE_URL}/rate-card`, {
      headers: await getAuthHeaders()
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    cachedRateCard = data;
    return data;
  } catch (error) {
    console.error('Failed to pre-fetch rate card:', error);
  }
}

const fallbackRateCard = [
  {"id": "rc-social-fb", "category": "Social Media Sponsored Content", "name": "Facebook Sponsored Post", "platform": "Facebook", "unit": "per post", "unitPrice": 23000},
  {"id": "rc-social-ig", "category": "Social Media Sponsored Content", "name": "Instagram Sponsored Post", "platform": "Instagram", "unit": "per post", "unitPrice": 23000},
  {"id": "rc-social-x", "category": "Social Media Sponsored Content", "name": "X (Twitter) Sponsored Post", "platform": "X (Twitter)", "unit": "per post", "unitPrice": 23000},
  {"id": "rc-social-tt", "category": "Social Media Sponsored Content", "name": "TikTok Sponsored Post", "platform": "TikTok", "unit": "per post", "unitPrice": 23000},
  {"id": "rc-live-web", "category": "Livestream", "name": "KBC Website / App Stream + 1 Article", "platform": "KBC Website / App", "unit": "per hour", "unitPrice": 150000},
  {"id": "rc-live-1", "category": "Livestream", "name": "Stream + 1 Article", "platform": "Website / YouTube / Facebook", "unit": "per hour", "unitPrice": 200000},
  {"id": "rc-live-8sm", "category": "Livestream", "name": "Stream + 8 SM Posts", "platform": "Website / YouTube / Facebook", "unit": "per hour", "unitPrice": 300000},
  {"id": "rc-live-all", "category": "Livestream", "name": "Stream + 8 SM Posts + 1 Article", "platform": "Website / YouTube / Facebook", "unit": "per hour", "unitPrice": 350000},
  {"id": "rc-rm-rb", "category": "Rich Media Advertising", "name": "Roadblock", "platform": "Desktop / Mobile", "unit": "per hour", "unitPrice": 100000},
  {"id": "rc-rm-sb", "category": "Rich Media Advertising", "name": "Skin Branding", "platform": "Desktop / Mobile", "unit": "per hour", "unitPrice": 100000},
  {"id": "rc-rm-ol", "category": "Rich Media Advertising", "name": "Overlay", "platform": "Desktop / Mobile", "unit": "per hour", "unitPrice": 100000},
  {"id": "rc-rm-ex", "category": "Rich Media Advertising", "name": "Expandable Ad", "platform": "Desktop / Mobile", "unit": "per hour", "unitPrice": 100000},
  {"id": "rc-sms", "category": "Bulk SMS Alerts", "name": "Bulk SMS - Up to 50K Users", "platform": "SMS", "unit": "per SMS", "unitPrice": 4},
  {"id": "rc-prod-anim2", "category": "Video Production (Animated)", "name": "Animated Video 2-5 Seconds", "platform": "Digital", "unit": "per video", "unitPrice": 127400},
  {"id": "rc-prod-anim6", "category": "Video Production (Animated)", "name": "Animated Video 6-15 Seconds", "platform": "Digital", "unit": "per video", "unitPrice": 153400},
  {"id": "rc-prod-anim16", "category": "Video Production (Animated)", "name": "Animated Video 16-30 Seconds", "platform": "Digital", "unit": "per video", "unitPrice": 169000},
  {"id": "rc-prod-still2", "category": "Video Production (Still Graphic)", "name": "Still Graphic Video 2-5 Seconds", "platform": "Digital", "unit": "per video", "unitPrice": 80000},
  {"id": "rc-prod-still6", "category": "Video Production (Still Graphic)", "name": "Still Graphic Video 6-15 Seconds", "platform": "Digital", "unit": "per video", "unitPrice": 110000},
  {"id": "rc-prod-still16", "category": "Video Production (Still Graphic)", "name": "Still Graphic Video 16-30 Seconds", "platform": "Digital", "unit": "per video", "unitPrice": 140000},
  {"id": "rc-prod-int", "category": "Video Interview", "name": "Video Interview 1-3 Minutes", "platform": "Online", "unit": "per video", "unitPrice": 52000},
  {"id": "rc-prod-doc", "category": "Online Documentary", "name": "Online Documentary 10-15 Minutes", "platform": "Online", "unit": "per documentary", "unitPrice": 500000},
  {"id": "rc-epaper-host", "category": "Online E-Paper Hosting", "name": "Weekly E-Paper Edition Hosting", "platform": "Publication Website", "unit": "per weekly edition", "unitPrice": 110500},
  {"id": "rc-display-above", "category": "Display Banner Advertising (Tenancy)", "name": "Above the Fold Banner", "platform": "KBC Website", "unit": "per banner per day", "unitPrice": 5200},
  {"id": "rc-display-below", "category": "Display Banner Advertising (Tenancy)", "name": "Below the Fold Banner", "platform": "KBC Website", "unit": "per banner per day", "unitPrice": 4550},
  {"id": "rc-content-client", "category": "Sponsored Content", "name": "Sponsored Article (Client Provided)", "platform": "KBC Website", "unit": "per article", "unitPrice": 57000},
  {"id": "rc-content-kbc", "category": "Sponsored Content", "name": "Sponsored Article (Written by KBC)", "platform": "KBC Website", "unit": "per article", "unitPrice": 80000},
  {"id": "rc-prod-landing", "category": "Landing Page Campaign", "name": "Landing Page Design", "platform": "KBC Website", "unit": "per landing page", "unitPrice": 117000},
  {"id": "rc-prod-banner", "category": "Creative Development", "name": "Banner Artwork Design", "platform": "Website / Mobile / Social Media", "unit": "per banner", "unitPrice": 15600},
  {"id": "rc-prod-info", "category": "Infographic Design", "name": "Infographic Creative Generation", "platform": "Digital", "unit": "per creative", "unitPrice": 97500},
  {"id": "rc-prod-email", "category": "Email Marketing", "name": "Email Marketing Newsletter", "platform": "Email", "unit": "per email", "unitPrice": 84500},
  {"id": "rc-app-ad", "category": "Mobile App Advertising", "name": "Customised Advert on KBC App", "platform": "KBC App", "unit": "per advert per month", "unitPrice": 325000},
  {"id": "rc-app-spon", "category": "Mobile App Advertising", "name": "Full KBC App Sponsorship", "platform": "KBC App", "unit": "per month", "unitPrice": 487500},
  {"id": "rc-app-push", "category": "Mobile App Advertising", "name": "Mobile App Push Notification", "platform": "KBC App", "unit": "per push notification", "unitPrice": 0.30},
  {"id": "rc-app-vid15", "category": "Mobile App Advertising", "name": "App Video Advert 15 Seconds", "platform": "KBC App", "unit": "per video per month", "unitPrice": 275000}
];

export function matchFrontendProductToBackend(p: any, rateCardItems: any[]): any {
  const items = rateCardItems && rateCardItems.length > 0 ? rateCardItems : fallbackRateCard;

  const categoryMap: Record<ProductCategory, string[]> = {
    'Social Media': ['Social Media Sponsored Content'],
    'Livestream Coverage': ['Livestream'],
    'Rich Media': ['Rich Media Advertising'],
    'Push & SMS': ['Bulk SMS Alerts', 'Mobile App Advertising'],
    'Production': ['Video Production (Animated)', 'Video Production (Still Graphic)', 'Video Interview', 'Online Documentary', 'Landing Page Campaign', 'Creative Development', 'Infographic Design', 'Email Marketing'],
    'Display': ['Online E-Paper Hosting', 'Display Banner Advertising (CPM)', 'Display Banner Advertising (Tenancy)', 'E-Paper Advertising'],
    'Content': ['Sponsored Content', 'E-Paper Subscription'],
    'Mobile App': ['Mobile App Advertising']
  } as any;

  const allowedCategories = categoryMap[p.category as ProductCategory] || [];

  // Match by name or price
  // 1. Exact Name match (case insensitive)
  let bestMatch = items.find(item => 
    item.name.toLowerCase().replace(/[^a-z0-9]/g, '') === p.name.toLowerCase().replace(/[^a-z0-9]/g, '')
  );

  // 2. Exact category & price match
  if (!bestMatch) {
    bestMatch = items.find(item => 
      allowedCategories.includes(item.category) && 
      Math.abs(item.unitPrice - p.unitPrice) < 0.1
    );
  }

  // 3. Name similarity match
  if (!bestMatch) {
    bestMatch = items.find(item => 
      allowedCategories.includes(item.category) && 
      (item.name.toLowerCase().includes(p.name.toLowerCase().split(' ')[0]) || 
       p.name.toLowerCase().includes(item.name.toLowerCase().split(' ')[0]))
    );
  }

  // 4. Category default match
  if (!bestMatch) {
    bestMatch = items.find(item => allowedCategories.includes(item.category));
  }

  return bestMatch;
}

// Helper to get auth headers with Firebase ID Token
export async function getAuthHeaders(isMultipart = false) {
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch (e) {
      console.error('Error getting Firebase ID Token:', e);
    }
  }
  return headers;
}

// ----------------------------------------------------
// PRODUCT CATALOG & RATE CARD MAPPING HELPERS
// ----------------------------------------------------

export function mapBackendRateCardToFrontendCatalog(item: any): ProductCatalogItem {
  const categoryMap: Record<string, ProductCategory> = {
    'Social Media Sponsored Content': 'Social Media',
    'Livestream': 'Livestream Coverage',
    'Rich Media Advertising': 'Rich Media',
    'Bulk SMS Alerts': 'Push & SMS',
    'Video Production (Animated)': 'Production',
    'Video Production (Still Graphic)': 'Production',
    'Video Interview': 'Production',
    'Online Documentary': 'Production',
    'Online E-Paper Hosting': 'Display',
    'Display Banner Advertising (CPM)': 'Display',
    'Display Banner Advertising (Tenancy)': 'Display',
    'E-Paper Subscription': 'Content',
    'Sponsored Content': 'Content',
    'Landing Page Campaign': 'Production',
    'Creative Development': 'Production',
    'Infographic Design': 'Production',
    'Email Marketing': 'Production',
    'Embedded Video Ads': 'Production',
    'E-Paper Advertising': 'Display',
    'Mobile App Advertising': 'Mobile App',
  };

  const category = categoryMap[item.category] || 'Social Media';

  // Map description and fields dynamically or using default placeholders
  let fields: string[] = [];
  if (category === 'Social Media') {
    fields = ['Platforms', 'Start date', 'End date', 'Posts per day', 'Language', 'Boosting option'];
  } else if (category === 'Livestream Coverage') {
    fields = ['Destinations', 'Event name', 'Stream date', 'Start time', 'End time', 'Feed source'];
  } else if (category === 'Display') {
    fields = ['Placement', 'Banner format', 'Start date', 'End date', 'Click-through URL'];
  } else if (category === 'Rich Media') {
    fields = ['Format', 'Start date', 'End date', 'Hours booked', 'Preferred time slots'];
  } else if (category === 'Content') {
    fields = ['Topic', 'Publication date', 'Hero image', 'Author details'];
  } else if (category === 'Mobile App') {
    fields = ['Placement', 'Months', 'Start date', 'Click-through URL'];
  } else if (category === 'Push & SMS') {
    fields = ['Number of sends', 'Estimated reach', 'Scheduled date', 'Message copy'];
  } else {
    fields = ['Creative brief', 'Copy', 'Hero image', 'Lead destination', 'Privacy URL'];
  }

  return {
    id: item.id,
    category,
    name: item.name,
    unit: item.unit,
    unitPrice: item.unitPrice,
    description: item.description || `${item.name} (${item.platform || 'Digital'})`,
    fields,
  };
}

// ----------------------------------------------------
// CAMPAIGN MAPPING LAYER (FRONTEND <-> BACKEND API)
// ----------------------------------------------------

export function mapFrontendCampaignToBackend(c: any) {
  // calculate totals
  const subtotal = c.products ? c.products.reduce((sum: number, line: any) => sum + (line.quantity * line.unitPrice), 0) : 0;
  const discountPercent = c.discountPercent || 0;
  const discountValue = Math.round(subtotal * (discountPercent / 100));
  const taxable = subtotal - discountValue;
  const vat = Math.round(taxable * 0.16);
  const grandTotal = taxable + vat;

  // calculate flight days
  let flightDays = 1;
  if (c.startDate && c.endDate) {
    const start = new Date(c.startDate);
    const end = new Date(c.endDate);
    const diff = end.getTime() - start.getTime();
    if (diff > 0) {
      flightDays = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    }
  }

  // line items
  const lineItems = (c.products || []).map((p: any) => {
    const matchedItem = matchFrontendProductToBackend(p, cachedRateCard);
    
    return {
      productId: matchedItem ? matchedItem.id : p.id,
      productName: matchedItem ? matchedItem.name : p.name,
      platform: p.platform || (matchedItem ? matchedItem.platform : ''),
      quantity: p.quantity,
      postsPerDay: p.postsPerDay || 1,
      unitPrice: matchedItem ? matchedItem.unitPrice : p.unitPrice,
      totalPrice: p.quantity * (matchedItem ? matchedItem.unitPrice : p.unitPrice)
    };
  });

  // discount
  const discount = {
    requested: discountPercent > 0 || (c as any).discount?.requested || false,
    requestedBy: (c as any).discount?.requestedBy || null,
    requestedAt: (c as any).discount?.requestedAt || null,
    percentage: discountPercent,
    approvedBy: (c as any).discount?.approvedBy || null,
    approvedAt: (c as any).discount?.approvedAt || null,
    status: (c as any).discount?.status || 'pending',
    reason: c.discountReason || (c as any).discount?.reason || ''
  };

  const payload = {
    client: {
      name: c.clientName || '',
      contact: c.clientName || '',
      email: c.clientEmail || '',
      phone: c.clientPhone || '',
      company: c.clientCompany || ''
    },
    campaign: {
      name: c.name || '',
      startDate: c.startDate || '',
      endDate: c.endDate || '',
      flightDays: flightDays
    },
    lineItems: lineItems,
    boosting: {
      required: c.socialBoost === 'yes' || (c as any).boosting?.required || false,
      platforms: c.socialPlatforms || (c as any).boosting?.platforms || [],
      budget: parseFloat(c.socialBoostBudget || '0') || (c as any).boosting?.budget || 0,
      isOnTopOfOrder: (c as any).boosting?.isOnTopOfOrder || false
    },
    discount: discount,
    totals: {
      subtotal: subtotal,
      vatAmount: vat,
      grandTotal: grandTotal,
      discountValue: discountValue
    },
    bookingType: c.bookingType || null,
    
    // Save all frontend wizard fields at root level (since backend has extra='allow' configured)
    kraPin: c.kraPin || '',
    billingAddress: c.billingAddress || '',
    contactJobTitle: c.contactJobTitle || '',
    campaignDescription: c.campaignDescription || '',
    targetAudience: c.targetAudience || '',
    geography: c.geography || '',
    budgetRange: c.budgetRange || '',
    creativeAssets: c.creativeAssets || '',
    socialPlatforms: c.socialPlatforms || [],
    socialSchedule: c.socialSchedule || [],
    socialCopyBy: c.socialCopyBy || '',
    socialLanguage: c.socialLanguage || '',
    socialBrief: c.socialBrief || '',
    socialBoost: c.socialBoost || '',
    socialExclusivity: c.socialExclusivity || '',
    liveDest: c.liveDest || '',
    livePackage: c.livePackage || '',
    liveDays: c.liveDays || [],
    liveEventName: c.liveEventName || '',
    liveLocation: c.liveLocation || '',
    liveFeed: c.liveFeed || '',
    liveOverlays: c.liveOverlays || '',
    displayType: c.displayType || '',
    displayFormat: c.displayFormat || '',
    displayStartDate: c.displayStartDate || '',
    displayEndDate: c.displayEndDate || '',
    displaySection: c.displaySection || '',
    displayUrl: c.displayUrl || '',
    displayCreative: c.displayCreative || '',
    rmTypes: c.rmTypes || [],
    rmStartDate: c.rmStartDate || '',
    rmEndDate: c.rmEndDate || '',
    rmHours: c.rmHours || '',
    rmTimeSlots: c.rmTimeSlots || '',
    rmUrl: c.rmUrl || '',
    contentTypes: c.contentTypes || [],
    contentQty: c.contentQty || '',
    contentFreq: c.contentFreq || '',
    contentStartDate: c.contentStartDate || '',
    contentEndDate: c.contentEndDate || '',
    contentBrief: c.contentBrief || '',
    appType: c.appType || '',
    appMonths: c.appMonths || '',
    appPlacement: c.appPlacement || '',
    appStartDate: c.appStartDate || '',
    appUrl: c.appUrl || '',
    pushChannel: c.pushChannel || '',
    pushSends: c.pushSends || '',
    pushReach: c.pushReach || '',
    pushDate: c.pushDate || '',
    pushTime: c.pushTime || '',
    pushMessage: c.pushMessage || '',
    prodTypes: c.prodTypes || [],
    prodBrief: c.prodBrief || '',
    prodDueDate: c.prodDueDate || '',
    prodVoLang: c.prodVoLang || '',
    dec1: c.dec1 || false,
    dec2: c.dec2 || false,
    dec3: c.dec3 || false,
    reportFile: c.reportFile
  };

  return payload;
}

export function mapBackendCampaignToFrontend(bc: any): Campaign {
  // Map backend status to frontend CampaignStatus
  const statusMap: Record<string, string> = {
    draft: 'Draft',
    discountPending: 'Discount Pending',
    discountApproved: 'Discount Approved',
    orderSheetGenerated: 'Order Generated',
    clientSigned: 'Client Signed',
    adManagerCountersigned: 'Countersigned',
    paymentConfirmed: 'Payment Confirmed',
    briefUnlocked: 'Brief Unlocked',
    inExecution: 'Brief Unlocked',
    delivered: 'Brief Unlocked',
    reported: 'Brief Unlocked',
    closed: 'Brief Unlocked',
  };

  const status = statusMap[bc.status] || bc.status || 'Draft';

  const products = (bc.lineItems || []).map((item: any) => {
    return {
      id: item.productId,
      productId: item.productId,
      category: item.category || 'Social Media',
      name: item.productName,
      unit: item.unit || 'post / platform',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      platform: item.platform
    };
  });

  return {
    id: bc.id,
    dabRef: bc.dabRef || '',
    clientCompany: bc.client?.company || bc.clientCompany || '',
    clientName: bc.client?.name || bc.clientName || '',
    clientEmail: bc.client?.email || bc.clientEmail || '',
    clientPhone: bc.client?.phone || bc.clientPhone || '',
    industry: bc.industry || '',
    name: bc.campaign?.name || bc.name || '',
    objective: bc.campaignGoal || bc.objective || '',
    startDate: bc.campaign?.startDate || bc.startDate || '',
    endDate: bc.campaign?.endDate || bc.endDate || '',
    owner: bc.createdBy || bc.owner || '',
    status: status as any,
    products: products,
    discountPercent: bc.discount?.percentage || bc.discountPercent || 0,
    discountReason: bc.discount?.reason || bc.discountReason || '',
    paidDeposit: bc.payment?.confirmed || bc.paidDeposit || false,
    reportFile: bc.reportFile || undefined,
    
    // Wizard configurations
    bookingType: bc.bookingType || '',
    kraPin: bc.kraPin || '',
    billingAddress: bc.billingAddress || '',
    contactJobTitle: bc.contactJobTitle || '',
    campaignDescription: bc.campaignDescription || '',
    targetAudience: bc.targetAudience || '',
    geography: bc.geography || '',
    budgetRange: bc.budgetRange || '',
    creativeAssets: bc.creativeAssets || '',
    socialPlatforms: bc.socialPlatforms || [],
    socialSchedule: bc.socialSchedule || [],
    socialCopyBy: bc.socialCopyBy || '',
    socialLanguage: bc.socialLanguage || '',
    socialBrief: bc.socialBrief || '',
    socialBoost: bc.socialBoost || '',
    socialExclusivity: bc.socialExclusivity || '',
    liveDest: bc.liveDest || '',
    livePackage: bc.livePackage || '',
    liveDays: bc.liveDays || [],
    liveEventName: bc.liveEventName || '',
    liveLocation: bc.liveLocation || '',
    liveFeed: bc.liveFeed || '',
    liveOverlays: bc.liveOverlays || '',
    displayType: bc.displayType || '',
    displayFormat: bc.displayFormat || '',
    displayStartDate: bc.displayStartDate || '',
    displayEndDate: bc.displayEndDate || '',
    displaySection: bc.displaySection || '',
    displayUrl: bc.displayUrl || '',
    displayCreative: bc.displayCreative || '',
    rmTypes: bc.rmTypes || [],
    rmStartDate: bc.rmStartDate || '',
    rmEndDate: bc.rmEndDate || '',
    rmHours: bc.rmHours || '',
    rmTimeSlots: bc.rmTimeSlots || '',
    rmUrl: bc.rmUrl || '',
    contentTypes: bc.contentTypes || [],
    contentQty: bc.contentQty || '',
    contentFreq: bc.contentFreq || '',
    contentStartDate: bc.contentStartDate || '',
    contentEndDate: bc.contentEndDate || '',
    contentBrief: bc.contentBrief || '',
    appType: bc.appType || '',
    appMonths: bc.appMonths || '',
    appPlacement: bc.appPlacement || '',
    appStartDate: bc.appStartDate || '',
    appUrl: bc.appUrl || '',
    pushChannel: bc.pushChannel || '',
    pushSends: bc.pushSends || '',
    pushReach: bc.pushReach || '',
    pushDate: bc.pushDate || '',
    pushTime: bc.pushTime || '',
    pushMessage: bc.pushMessage || '',
    prodTypes: bc.prodTypes || [],
    prodBrief: bc.prodBrief || '',
    prodDueDate: bc.prodDueDate || '',
    prodVoLang: bc.prodVoLang || '',
    dec1: bc.dec1 || false,
    dec2: bc.dec2 || false,
    dec3: bc.dec3 || false
  };
}

// ----------------------------------------------------
// API REQUEST METHODS
// ----------------------------------------------------

export async function getRateCard(): Promise<ProductCatalogItem[]> {
  try {
    const res = await fetch(`${BASE_URL}/rate-card`, {
      headers: await getAuthHeaders()
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.map(mapBackendRateCardToFrontendCatalog);
  } catch (error) {
    console.warn('Failed to fetch rate card from backend, using frontend catalog fallback.', error);
    throw error;
  }
}

export async function getCampaigns(): Promise<Campaign[]> {
  try {
    const res = await fetch(`${BASE_URL}/campaigns`, {
      headers: await getAuthHeaders()
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.map(mapBackendCampaignToFrontend);
  } catch (error) {
    console.error('Failed to fetch campaigns:', error);
    throw error;
  }
}

export async function getCampaign(campaignId: string): Promise<Campaign> {
  try {
    const res = await fetch(`${BASE_URL}/campaigns/${campaignId}`, {
      headers: await getAuthHeaders()
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return mapBackendCampaignToFrontend(data);
  } catch (error) {
    console.error(`Failed to fetch campaign ${campaignId}:`, error);
    throw error;
  }
}

export async function createCampaign(campaign: Partial<Campaign>): Promise<{ campaignId: string; message: string }> {
  try {
    const payload = mapFrontendCampaignToBackend(campaign);
    const res = await fetch(`${BASE_URL}/campaigns/`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Failed to create campaign:', error);
    throw error;
  }
}

export async function updateCampaign(campaignId: string, campaign: Partial<Campaign>): Promise<any> {
  try {
    const payload = mapFrontendCampaignToBackend(campaign);
    const res = await fetch(`${BASE_URL}/campaigns/${campaignId}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Failed to update campaign ${campaignId}:`, error);
    throw error;
  }
}

export async function deleteCampaign(campaignId: string): Promise<any> {
  try {
    const res = await fetch(`${BASE_URL}/campaigns/${campaignId}`, {
      method: 'DELETE',
      headers: await getAuthHeaders()
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`Failed to delete campaign ${campaignId}:`, error);
    throw error;
  }
}

export async function requestDiscount(campaignId: string, percentage: number, reason: string): Promise<any> {
  try {
    const res = await fetch(`${BASE_URL}/discounts/${campaignId}/request`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ percentage, reason })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Failed to request discount for ${campaignId}:`, error);
    throw error;
  }
}

export async function reviewDiscount(campaignId: string, action: 'approve' | 'reject', note = ''): Promise<any> {
  try {
    const res = await fetch(`${BASE_URL}/discounts/${campaignId}/review`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ action, note })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Failed to review discount for ${campaignId}:`, error);
    throw error;
  }
}

export async function generateOrderSheet(campaignId: string): Promise<{ message: string; dabRef: string; pdfUrl: string }> {
  try {
    const res = await fetch(`${BASE_URL}/order-sheet/${campaignId}/generate`, {
      method: 'POST',
      headers: await getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Failed to generate order sheet for ${campaignId}:`, error);
    throw error;
  }
}

export async function uploadSignedSheet(campaignId: string, airtimeOrderSerial: string, file: File): Promise<any> {
  try {
    const formData = new FormData();
    formData.append('airtimeOrderSerial', airtimeOrderSerial);
    formData.append('file', file);

    const headers = await getAuthHeaders(true); // multipart
    const res = await fetch(`${BASE_URL}/order-sheet/${campaignId}/upload-signed`, {
      method: 'POST',
      headers,
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Failed to upload signed sheet for ${campaignId}:`, error);
    throw error;
  }
}

export async function countersignOrderSheet(campaignId: string): Promise<any> {
  try {
    const res = await fetch(`${BASE_URL}/order-sheet/${campaignId}/countersign`, {
      method: 'POST',
      headers: await getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Failed to countersign order sheet for ${campaignId}:`, error);
    throw error;
  }
}

export async function confirmPayment(campaignId: string): Promise<any> {
  try {
    const res = await fetch(`${BASE_URL}/order-sheet/${campaignId}/confirm-payment`, {
      method: 'POST',
      headers: await getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Failed to confirm payment for ${campaignId}:`, error);
    throw error;
  }
}

export async function uploadPod(campaignId: string, file: File, note = ''): Promise<any> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('note', note);

    const headers = await getAuthHeaders(true); // multipart
    const res = await fetch(`${BASE_URL}/execution/${campaignId}/pod`, {
      method: 'POST',
      headers,
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Failed to upload POD for ${campaignId}:`, error);
    throw error;
  }
}

export async function createChangeOrder(payload: {
  parentCampaignId: string;
  additionalLineItems: any[];
  totals: { subtotal: number; vatAmount: number; grandTotal: number; discountValue?: number };
  reason: string;
}): Promise<any> {
  try {
    const res = await fetch(`${BASE_URL}/change-orders/`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Failed to create change order:', error);
    throw error;
  }
}

export async function getChangeOrders(campaignId: string): Promise<any[]> {
  try {
    const res = await fetch(`${BASE_URL}/change-orders/campaign/${campaignId}`, {
      headers: await getAuthHeaders()
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`Failed to fetch change orders for campaign ${campaignId}:`, error);
    return [];
  }
}

export async function getUsers(): Promise<any[]> {
  try {
    const res = await fetch(`${BASE_URL}/users/`, {
      headers: await getAuthHeaders()
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
}

export async function createUser(userData: { name: string; email: string; role: string; phone?: string; password?: string }): Promise<any> {
  try {
    const res = await fetch(`${BASE_URL}/users/`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        phone: userData.phone || '',
        password: userData.password || 'User1234'
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Failed to create user:', error);
    throw error;
  }
}

export async function updateUser(uid: string, userData: any): Promise<any> {
  try {
    const res = await fetch(`${BASE_URL}/users/${uid}`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Failed to update user:', error);
    throw error;
  }
}

export async function deleteUser(uid: string): Promise<any> {
  try {
    const res = await fetch(`${BASE_URL}/users/${uid}`, {
      method: 'DELETE',
      headers: await getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw error;
  }
}

export async function deleteRateCardItem(id: string): Promise<any> {
  try {
    const res = await fetch(`${BASE_URL}/rate-card/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Failed to delete rate card item ${id}:`, error);
    throw error;
  }
}
