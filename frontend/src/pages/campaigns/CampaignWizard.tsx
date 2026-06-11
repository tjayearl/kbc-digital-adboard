import clsx from 'clsx';
import { Check, ChevronDown, FileText, Plus, Send, Trash2 } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { InputField, SelectField, TextareaField } from '../../components/ui/Field';
import { campaigns, campaignTotals, lineTotal, materialSpecs, money, productCatalog, rateCard, approvals, workflowStages, type ProductCategory, type ProductLine, type Role } from '../../data/mockData';

const enquirySteps = ['Client details', 'Campaign brief', 'Products', 'Review', 'Order sheet'];

const categoryOrder: ProductCategory[] = ['Social Media', 'Livestream Coverage', 'Display', 'Rich Media', 'Content', 'Mobile App', 'Push & SMS', 'Production'];

const contentProductsList = [
  { label: 'Sponsored article — client copy', price: 74100 },
  { label: 'Sponsored article — KBC writes', price: 104000 },
  { label: 'Video product/service review', price: 104000 },
  { label: 'Online documentary (10–15 min)', price: 500000 },
  { label: 'e-Paper supplement (per page)', price: 65000 },
  { label: 'Clickable advert on e-Paper', price: 169000 },
  { label: 'Online e-Paper hosting (weekly)', price: 110500 },
  { label: 'Video advert on e-Paper', price: 357500 }
];

const productionProductsList = [
  { label: 'Animated video 2–5 sec', price: 127400 },
  { label: 'Animated video 6–15 sec', price: 153400 },
  { label: 'Animated video 16–30 sec', price: 169000 },
  { label: 'Still graphic video 2–5 sec', price: 104000 },
  { label: 'Still graphic video 6–15 sec', price: 143000 },
  { label: 'Still graphic video 16-30 sec', price: 182000 },
  { label: 'Video interview (1–3 min hosted)', price: 52000 },
  { label: 'Landing page design', price: 117000 },
  { label: 'Banner design (per campaign)', price: 15600 },
  { label: 'Infographic design', price: 97500 },
  { label: 'Email newsletter', price: 84500 }
];

export function CampaignWizard() {
  const navigate = useNavigate();
  const { currentUser } = useOutletContext<{ currentUser?: any }>();
  const [openCategory, setOpenCategory] = useState<ProductCategory | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<ProductLine[]>([]);

  const [organisation, setOrganisation] = useState('');
  const [kraPin, setKraPin] = useState('');
  const [industry, setIndustry] = useState('');
  const [bookingType, setBookingType] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactJobTitle, setContactJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  const [campaignGoal, setCampaignGoal] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [geography, setGeography] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [creativeAssets, setCreativeAssets] = useState('');

  // Configurator inputs states
  // 1. Social Media
  const [socialPlatforms, setSocialPlatforms] = useState<string[]>([]);
  const [socialSchedule, setSocialSchedule] = useState<Array<{ id: string; startDate: string; endDate: string; postsPerDay: number }>>([]);
  const [socialCopyBy, setSocialCopyBy] = useState('');
  const [socialLanguage, setSocialLanguage] = useState('');
  const [socialBrief, setSocialBrief] = useState('');
  const [socialBoost, setSocialBoost] = useState('');
  const [socialExclusivity, setSocialExclusivity] = useState('');

  // 2. Livestream
  const [liveDest, setLiveDest] = useState('');
  const [livePackage, setLivePackage] = useState('');
  const [liveDays, setLiveDays] = useState<Array<{ id: string; date: string; start: string; end: string }>>([]);
  const [liveEventName, setLiveEventName] = useState('');
  const [liveLocation, setLiveLocation] = useState('');
  const [liveFeed, setLiveFeed] = useState('');
  const [liveOverlays, setLiveOverlays] = useState('');

  // 3. Display
  const [displayType, setDisplayType] = useState(''); // Above the fold
  const [displayFormat, setDisplayFormat] = useState('');
  const [displayStartDate, setDisplayStartDate] = useState('');
  const [displayEndDate, setDisplayEndDate] = useState(''); // 14 days
  const [displaySection, setDisplaySection] = useState('');
  const [displayUrl, setDisplayUrl] = useState('');
  const [displayCreative, setDisplayCreative] = useState('');

  // 4. Rich Media
  const [rmTypes, setRmTypes] = useState<string[]>([]);
  const [rmStartDate, setRmStartDate] = useState('');
  const [rmEndDate, setRmEndDate] = useState('');
  const [rmHours, setRmHours] = useState<number | ''>('');
  const [rmTimeSlots, setRmTimeSlots] = useState('');
  const [rmUrl, setRmUrl] = useState('');

  // 5. Content
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [contentQty, setContentQty] = useState<number | ''>('');
  const [contentFreq, setContentFreq] = useState('');
  const [contentStartDate, setContentStartDate] = useState('');
  const [contentEndDate, setContentEndDate] = useState('');
  const [contentBrief, setContentBrief] = useState('');

  // 6. Mobile App
  const [appType, setAppType] = useState('');
  const [appMonths, setAppMonths] = useState<number | ''>('');
  const [appPlacement, setAppPlacement] = useState('');
  const [appStartDate, setAppStartDate] = useState('');
  const [appUrl, setAppUrl] = useState('');

  // 7. Push & SMS
  const [pushChannel, setPushChannel] = useState('');
  const [pushSends, setPushSends] = useState<number | ''>('');
  const [pushReach, setPushReach] = useState<number | ''>('');
  const [pushDate, setPushDate] = useState('');
  const [pushTime, setPushTime] = useState('');
  const [pushMessage, setPushMessage] = useState('');

  // 8. Production
  const [prodTypes, setProdTypes] = useState<string[]>([]);
  const [prodBrief, setProdBrief] = useState('');
  const [prodDueDate, setProdDueDate] = useState('');
  const [prodVoLang, setProdVoLang] = useState('');

  // Submission state
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generatedRef, setGeneratedRef] = useState('');
  const [dec1, setDec1] = useState(false);
  const [dec2, setDec2] = useState(false);
  const [dec3, setDec3] = useState(false);

  // Synchronise configured states into selectedProducts
  useEffect(() => {
    const list: ProductLine[] = [];

    // 1. Social Media
    if (socialPlatforms.length > 0) {
      let totalPosts = 0;
      socialSchedule.forEach((r) => {
        if (r.startDate && r.endDate) {
          const diffTime = Math.abs(new Date(r.endDate).getTime() - new Date(r.startDate).getTime());
          const days = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
          totalPosts += days * r.postsPerDay;
        } else {
          totalPosts += r.postsPerDay;
        }
      });
      const qty = socialPlatforms.length * Math.max(1, totalPosts);
      list.push({
        id: 'p-social',
        category: 'Social Media',
        name: 'Social media sponsored post',
        unit: 'post / platform',
        quantity: qty,
        unitPrice: 23000,
        platform: socialPlatforms.join(', '),
      });
    }

    // 2. Livestream Coverage
    const pkgPrice = parseInt(livePackage) || 0;
    if (pkgPrice > 0 && liveDest) {
      let totalHrs = 0;
      liveDays.forEach((d) => {
        if (d.start && d.end) {
          const [sh, sm] = d.start.split(':').map(Number);
          const [eh, em] = d.end.split(':').map(Number);
          const hrs = Math.max(1, Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60));
          totalHrs += hrs;
        } else {
          totalHrs += 1;
        }
      });
      let name = 'Livestream + article';
      if (pkgPrice === 300000) name = 'Livestream + 8 social posts';
      if (pkgPrice === 350000) name = 'Livestream + posts + article';
      list.push({
        id: 'p-livestream',
        category: 'Livestream Coverage',
        name,
        unit: 'hour',
        quantity: Math.max(1, totalHrs),
        unitPrice: pkgPrice,
        platform: liveDest,
      });
    }

    // 3. Display
    const displayRate = parseInt(displayType) || 0;
    if (displayRate > 0 && displayStartDate && displayEndDate) {
      const diffTime = Math.abs(new Date(displayEndDate).getTime() - new Date(displayStartDate).getTime());
      const days = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
      const name = displayType === '5200' ? 'Display banner - above the fold' : 'Display banner - below the fold';
      list.push({
        id: 'p-display',
        category: 'Display',
        name,
        unit: 'day',
        quantity: days,
        unitPrice: displayRate,
      });
    }

    // 4. Rich Media
    if (rmTypes.length > 0 && rmStartDate && rmEndDate) {
      const qty = rmTypes.length * (Number(rmHours) || 1);
      list.push({
        id: 'p-rich-media',
        category: 'Rich Media',
        name: 'Rich media / roadblock / skin',
        unit: 'hour',
        quantity: qty,
        unitPrice: 100000,
        platform: rmTypes.join(', '),
      });
    }

    // 5. Content
    if (contentTypes.length > 0) {
      contentTypes.forEach((t, i) => {
        const PRICES_content: Record<string, number> = {
          'Sponsored article — client copy': 74100,
          'Sponsored article — KBC writes': 104000,
          'Video product/service review': 104000,
          'Online documentary (10–15 min)': 500000,
          'e-Paper supplement (per page)': 65000,
          'Clickable advert on e-Paper': 169000,
          'Online e-Paper hosting (weekly)': 110500,
          'Video advert on e-Paper': 357500
        };
        const price = PRICES_content[t] || 0;
        list.push({
          id: `p-content-${i}`,
          category: 'Content',
          name: t,
          unit: 'unit',
          quantity: Number(contentQty) || 1,
          unitPrice: price,
        });
      });
    }

    // 6. Mobile App
    const appRate = parseInt(appType) || 0;
    if (appRate > 0) {
      const opts = [
        { label: 'Custom in-app ad', val: '325000' },
        { label: 'Full app sponsorship', val: '487500' },
        { label: '15-sec video advert', val: '357500' },
        { label: '30-sec video advert', val: '643500' }
      ];
      const name = opts.find(o => o.val === appType)?.label || 'Custom in-app ad';
      list.push({
        id: 'p-app',
        category: 'Mobile App',
        name,
        unit: 'month',
        quantity: Number(appMonths) || 1,
        unitPrice: appRate,
      });
    }

    // 7. Push & SMS
    if (pushChannel) {
      const rate = pushChannel === 'Bulk SMS' ? 5 : 0.30;
      const unit = pushChannel === 'Bulk SMS' ? 'SMS' : 'send';
      const qty = (Number(pushReach) || 0) * (Number(pushSends) || 1);
      list.push({
        id: 'p-push',
        category: 'Push & SMS',
        name: pushChannel === 'Bulk SMS' ? 'Bulk SMS' : 'App push notification',
        unit,
        quantity: qty,
        unitPrice: rate,
      });
    }

    // 8. Production
    if (prodTypes.length > 0) {
      prodTypes.forEach((t, i) => {
        const PRICES_production: Record<string, number> = {
          'Animated video 2–5 sec': 127400,
          'Animated video 6–15 sec': 153400,
          'Animated video 16–30 sec': 169000,
          'Still graphic video 2–5 sec': 104000,
          'Still graphic video 6–15 sec': 143000,
          'Still graphic video 16-30 sec': 182000,
          'Video interview (1–3 min hosted)': 52000,
          'Landing page design': 117000,
          'Banner design (per campaign)': 15600,
          'Infographic design': 97500,
          'Email newsletter': 84500
        };
        const price = PRICES_production[t] || 0;
        list.push({
          id: `p-production-${i}`,
          category: 'Production',
          name: t,
          unit: 'item',
          quantity: 1,
          unitPrice: price,
        });
      });
    }

    setSelectedProducts(list);
  }, [
    socialPlatforms,
    socialSchedule,
    liveDest,
    livePackage,
    liveDays,
    displayType,
    displayStartDate,
    displayEndDate,
    rmTypes,
    rmHours,
    rmStartDate,
    rmEndDate,
    contentTypes,
    contentQty,
    appType,
    appMonths,
    pushChannel,
    pushSends,
    pushReach,
    prodTypes,
  ]);

  const totals = useMemo(() => {
    return campaignTotals({
      products: selectedProducts,
      discountPercent: 0,
    } as any);
  }, [selectedProducts]);

  const groupedProducts = useMemo(
    () =>
      categoryOrder
        .map((category) => ({
          category,
          products: productCatalog.filter((item) => {
            if (item.category !== category) return false;
            const rcItem = rateCard.find((rc) => rc.id === `rc-${item.id}` || rc.id === item.id);
            return !rcItem || rcItem.status === 'Active';
          }),
          spec: materialSpecs.find((item) => item.category === category),
        }))
        .filter((group) => group.products.length > 0),
    [],
  );

  const handleSubmitEnquiry = () => {
    if (!dec1 || !dec2 || !dec3) {
      alert('Please check all declaration boxes to proceed.');
      return;
    }
    const randNum = Math.floor(Math.random() * 90000 + 10000);
    const refNum = `DAB-2026-${randNum}`;
    setGeneratedRef(refNum);

    const newCampaign = {
      id: `cmp-${Date.now()}`,
      dabRef: refNum,
      clientCompany: organisation,
      clientName: contactName,
      clientEmail: email,
      clientPhone: phone,
      industry: industry,
      name: `Booking Enquiry - ${organisation}`,
      objective: campaignGoal,
      startDate: startDate,
      endDate: endDate,
      owner: currentUser?.name || 'Grace Mwangi',
      status: 'Discount Pending' as const,
      discountPercent: 0,
      paidDeposit: false,
      products: selectedProducts,
    };

    campaigns.push(newCampaign);

    // Push the corresponding discount approval request
    approvals.push({
      id: `ap-${Date.now()}`,
      campaignId: newCampaign.id,
      type: 'Discount' as const,
      requestedBy: currentUser?.name || 'Grace Mwangi',
      value: 0,
      status: 'Pending' as const,
      note: 'New campaign booking enquiry submitted.',
    });

    setIsSubmitted(true);
  };

  const handleSaveDraft = () => {
    const randNum = Math.floor(Math.random() * 90000 + 10000);
    const refNum = `DAB-2026-${randNum}`;

    const newCampaign = {
      id: `cmp-${Date.now()}`,
      dabRef: refNum,
      clientCompany: organisation,
      clientName: contactName,
      clientEmail: email,
      clientPhone: phone,
      industry: industry,
      name: organisation ? `Draft: Booking Enquiry - ${organisation}` : 'Draft: Booking Enquiry',
      objective: campaignGoal,
      startDate: startDate,
      endDate: endDate,
      owner: currentUser?.name || 'Grace Mwangi',
      status: 'Draft' as const,
      discountPercent: 0,
      paidDeposit: false,
      products: selectedProducts,
    };

    campaigns.push(newCampaign);
    alert('Draft saved successfully!');
    navigate('/campaigns');
  };

  // Custom Form Renders
  const renderSocialForm = () => (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Select platforms *</label>
        <div className="flex flex-wrap gap-2">
          {['Facebook', 'X (Twitter)', 'Instagram', 'TikTok', 'YouTube'].map((plat) => {
            const isSelected = socialPlatforms.includes(plat);
            return (
              <button
                key={plat}
                type="button"
                onClick={() => {
                  setSocialPlatforms((prev) =>
                    prev.includes(plat) ? prev.filter((p) => p !== plat) : [...prev, plat]
                  );
                }}
                className={clsx(
                  'rounded-lg border px-4 py-2 text-sm font-bold transition cursor-pointer',
                  isSelected
                    ? 'border-gold bg-gold/10 text-[#73510f]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                )}
              >
                {plat}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-slate-500">Ksh 23,000 per post per platform • select all that apply</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">Post schedule * <span className="text-xs font-normal text-slate-500">— add a row for each posting date or frequency block</span></label>
        <div className="space-y-3">
          {socialSchedule.map((row) => (
            <div key={row.id} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 md:grid-cols-4 items-end">
              <InputField
                label="Start date"
                type="date"
                value={row.startDate}
                onChange={(e) => {
                  setSocialSchedule((prev) =>
                    prev.map((r) => (r.id === row.id ? { ...r, startDate: e.target.value } : r))
                  );
                }}
              />
              <InputField
                label="End date"
                type="date"
                value={row.endDate}
                onChange={(e) => {
                  setSocialSchedule((prev) =>
                    prev.map((r) => (r.id === row.id ? { ...r, endDate: e.target.value } : r))
                  );
                }}
              />
              <InputField
                label="Posts per day"
                type="number"
                min="1"
                value={row.postsPerDay}
                onChange={(e) => {
                  setSocialSchedule((prev) =>
                    prev.map((r) => (r.id === row.id ? { ...r, postsPerDay: parseInt(e.target.value) || 1 } : r))
                  );
                }}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (socialSchedule.length > 1) {
                      setSocialSchedule((prev) => prev.filter((r) => r.id !== row.id));
                    }
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#B71C1C] transition cursor-pointer"
                  title="Delete row"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          className="mt-2 text-xs"
          onClick={() => {
            setSocialSchedule((prev) => [
              ...prev,
              { id: `s-${Date.now()}`, startDate: '', endDate: '', postsPerDay: 1 }
            ]);
          }}
        >
          <Plus size={14} className="mr-1" /> Add date block
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Post copy provided by *"
          value={socialCopyBy}
          onChange={(e) => setSocialCopyBy(e.target.value)}
        >
          <option value="">— select —</option>
          <option>Client</option>
          <option>KBC to write</option>
        </SelectField>
        <SelectField
          label="Content language *"
          value={socialLanguage}
          onChange={(e) => setSocialLanguage(e.target.value)}
        >
          <option value="">— select —</option>
          <option>English</option>
          <option>Kiswahili</option>
          <option>English &amp; Kiswahili</option>
          <option>Vernacular</option>
        </SelectField>
      </div>

      <TextareaField
        label="Key message / caption brief"
        value={socialBrief}
        onChange={(e) => setSocialBrief(e.target.value)}
        placeholder="Describe the message, tone, hashtags, call to action, or any mentions to include"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Boosting / paid amplification"
          value={socialBoost}
          onChange={(e) => setSocialBoost(e.target.value)}
        >
          <option value="">— select —</option>
          <option>Organic only (KBC page reach)</option>
          <option>Boosted — KBC manages spend</option>
        </SelectField>
        <SelectField
          label="Competitor exclusivity required?"
          value={socialExclusivity}
          onChange={(e) => setSocialExclusivity(e.target.value)}
        >
          <option value="">— select —</option>
          <option>No</option>
          <option>Yes — specify below</option>
        </SelectField>
      </div>
    </div>
  );

  const renderLivestreamForm = () => (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Streaming destinations *</label>
        <div className="flex flex-wrap gap-2">
          {['KBC Website', 'YouTube', 'Facebook', 'All three'].map((d) => {
            const isSelected = liveDest === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setLiveDest((prev) => prev === d ? '' : d)}
                className={clsx(
                  'rounded-lg border px-4 py-2 text-sm font-bold transition cursor-pointer',
                  isSelected
                    ? 'border-gold bg-gold/10 text-[#73510f]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                )}
              >
                {d}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-slate-500">Website only = Ksh 200,000/hr | All three + article = Ksh 200,000/hr | All three + 8 SM posts = Ksh 300,000/hr | All three + 8 posts + article = Ksh 350,000/hr</p>
      </div>

      <SelectField
        label="Package *"
        value={livePackage}
        onChange={(e) => setLivePackage(e.target.value)}
      >
        <option value="">— select —</option>
        <option value="200000">Stream + 1 article — Ksh 200,000/hr</option>
        <option value="300000">Stream + 8 SM posts — Ksh 300,000/hr</option>
        <option value="350000">Stream + 8 SM posts + 1 article — Ksh 350,000/hr</option>
      </SelectField>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">Stream day(s) &amp; times *</label>
        <div className="space-y-3">
          {liveDays.map((row) => (
            <div key={row.id} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 md:grid-cols-4 items-end">
              <InputField
                label="Date"
                type="date"
                value={row.date}
                onChange={(e) => {
                  setLiveDays((prev) =>
                    prev.map((r) => (r.id === row.id ? { ...r, date: e.target.value } : r))
                  );
                }}
              />
              <InputField
                label="Start time"
                type="time"
                value={row.start}
                onChange={(e) => {
                  setLiveDays((prev) =>
                    prev.map((r) => (r.id === row.id ? { ...r, start: e.target.value } : r))
                  );
                }}
              />
              <InputField
                label="End time"
                type="time"
                value={row.end}
                onChange={(e) => {
                  setLiveDays((prev) =>
                    prev.map((r) => (r.id === row.id ? { ...r, end: e.target.value } : r))
                  );
                }}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (liveDays.length > 1) {
                      setLiveDays((prev) => prev.filter((r) => r.id !== row.id));
                    }
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#B71C1C] transition cursor-pointer"
                  title="Delete row"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          className="mt-2 text-xs"
          onClick={() => {
            setLiveDays((prev) => [
              ...prev,
              { id: `l-${Date.now()}`, date: '', start: '', end: '' }
            ]);
          }}
        >
          <Plus size={14} className="mr-1" /> Add stream day
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Event name *"
          value={liveEventName}
          onChange={(e) => setLiveEventName(e.target.value)}
          placeholder="e.g. Safaricom Annual Gala 2025"
        />
        <InputField
          label="Stream location / source"
          value={liveLocation}
          onChange={(e) => setLiveLocation(e.target.value)}
          placeholder="e.g. KICC Nairobi / remote feed"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Feed provided by"
          value={liveFeed}
          onChange={(e) => setLiveFeed(e.target.value)}
        >
          <option value="">— select —</option>
          <option>Client provides encoder/feed</option>
          <option>KBC production crew required</option>
          <option>To be discussed</option>
        </SelectField>
        <SelectField
          label="Branded overlays / lower thirds?"
          value={liveOverlays}
          onChange={(e) => setLiveOverlays(e.target.value)}
        >
          <option value="">— select —</option>
          <option>No</option>
          <option>Yes — client provides graphics</option>
          <option>Yes — KBC to design</option>
        </SelectField>
      </div>
    </div>
  );

  const renderDisplayForm = () => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Placement *"
          value={displayType}
          onChange={(e) => setDisplayType(e.target.value)}
        >
          <option value="">— select —</option>
          <option value="5200">Above the fold — Ksh 5,200/day</option>
          <option value="4550">Below the fold — Ksh 4,550/day</option>
          <option value="117">CPM model — Ksh 117 per 1,000 impressions</option>
        </SelectField>
        <SelectField
          label="Banner format"
          value={displayFormat}
          onChange={(e) => setDisplayFormat(e.target.value)}
        >
          <option value="">— select —</option>
          <option>Leaderboard 728×90</option>
          <option>Square banner 300×250</option>
          <option>Both formats</option>
        </SelectField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Campaign start date *"
          type="date"
          value={displayStartDate}
          onChange={(e) => setDisplayStartDate(e.target.value)}
        />
        <InputField
          label="Campaign end date *"
          type="date"
          value={displayEndDate}
          onChange={(e) => setDisplayEndDate(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Target pages / section"
          value={displaySection}
          onChange={(e) => setDisplaySection(e.target.value)}
        >
          <option value="">— run of site —</option>
          <option>Homepage only</option>
          <option>News section</option>
          <option>Sport section</option>
          <option>Business section</option>
          <option>Entertainment</option>
          <option>Specific article (specify)</option>
        </SelectField>
        <InputField
          label="Click-through URL *"
          type="url"
          value={displayUrl}
          onChange={(e) => setDisplayUrl(e.target.value)}
          placeholder="https://"
        />
      </div>

      <SelectField
        label="Creative assets"
        value={displayCreative}
        onChange={(e) => setDisplayCreative(e.target.value)}
      >
        <option value="">— select —</option>
        <option>Client will supply (per spec sheet)</option>
        <option>KBC to design — Ksh 15,600 per banner</option>
      </SelectField>
    </div>
  );

  const renderRichMediaForm = () => (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Format * <span className="text-xs font-normal text-slate-500">— Ksh 100,000/hour each</span></label>
        <div className="flex flex-wrap gap-2">
          {['Roadblock', 'Skin branding', 'Overlay', 'Expandable ad', 'Skin peel ad', 'Sidekick', 'Video banner'].map((t) => {
            const isSelected = rmTypes.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setRmTypes((prev) =>
                    prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
                  );
                }}
                className={clsx(
                  'rounded-lg border px-4 py-2 text-sm font-bold transition cursor-pointer',
                  isSelected
                    ? 'border-gold bg-gold/10 text-[#73510f]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InputField
          label="Start date *"
          type="date"
          value={rmStartDate}
          onChange={(e) => setRmStartDate(e.target.value)}
        />
        <InputField
          label="End date *"
          type="date"
          value={rmEndDate}
          onChange={(e) => setRmEndDate(e.target.value)}
        />
        <InputField
          label="No. of hours booked *"
          type="number"
          min="1"
          value={rmHours}
          onChange={(e) => setRmHours(e.target.value === '' ? '' : (parseInt(e.target.value) || 1))}
          placeholder="e.g. 4"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Preferred time slots"
          value={rmTimeSlots}
          onChange={(e) => setRmTimeSlots(e.target.value)}
          placeholder="e.g. 08:00–10:00 and 18:00–20:00"
        />
        <InputField
          label="Click-through URL"
          type="url"
          value={rmUrl}
          onChange={(e) => setRmUrl(e.target.value)}
          placeholder="https://"
        />
      </div>
    </div>
  );

  const renderContentForm = () => (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Select content products *</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {contentProductsList.map((item) => {
            const isSelected = contentTypes.includes(item.label);
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setContentTypes((prev) =>
                    prev.includes(item.label) ? prev.filter((t) => t !== item.label) : [...prev, item.label]
                  );
                }}
                className={clsx(
                  'rounded-lg border p-3 text-left transition cursor-pointer flex flex-col justify-between min-h-16',
                  isSelected
                    ? 'border-gold bg-gold/10 text-[#73510f]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                )}
              >
                <span className="text-sm font-bold">{item.label}</span>
                <span className="mt-1 text-xs text-slate-500 font-semibold">{money.format(item.price)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {contentTypes.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              label="Quantity *"
              type="number"
              min="1"
              value={contentQty}
              onChange={(e) => setContentQty(e.target.value === '' ? '' : (parseInt(e.target.value) || 1))}
              placeholder="Number of units"
            />
            <SelectField
              label="Publication frequency"
              value={contentFreq}
              onChange={(e) => setContentFreq(e.target.value)}
            >
              <option value="">— select —</option>
              <option>One-off</option>
              <option>Weekly</option>
              <option>Twice a week</option>
              <option>Daily</option>
              <option>Monthly</option>
            </SelectField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              label="Start date *"
              type="date"
              value={contentStartDate}
              onChange={(e) => setContentStartDate(e.target.value)}
            />
            <InputField
              label="End date"
              type="date"
              value={contentEndDate}
              onChange={(e) => setContentEndDate(e.target.value)}
            />
          </div>

          <TextareaField
            label="Content brief / topic"
            value={contentBrief}
            onChange={(e) => setContentBrief(e.target.value)}
            placeholder="Topic, key message, approved claims, brand guidelines, any regulatory restrictions"
          />
        </>
      )}
    </div>
  );

  const renderAppForm = () => (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">App product *</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { label: 'Custom in-app ad', sub: 'Ksh 325,000/month', val: '325000' },
            { label: 'Full app sponsorship', sub: 'Ksh 487,500/month', val: '487500' },
            { label: '15-sec video advert', sub: 'Ksh 357,500/month', val: '357500' },
            { label: '30-sec video advert', sub: 'Ksh 643,500/month', val: '643500' },
          ].map((item) => {
            const isSelected = appType === item.val;
            return (
              <button
                key={item.val}
                type="button"
                onClick={() => setAppType((prev) => prev === item.val ? '' : item.val)}
                className={clsx(
                  'rounded-lg border p-3 text-left transition cursor-pointer flex flex-col justify-between min-h-16',
                  isSelected
                    ? 'border-gold bg-gold/10 text-[#73510f]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                )}
              >
                <span className="text-sm font-bold">{item.label}</span>
                <span className="mt-1 text-xs text-slate-500 font-semibold">{item.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Number of months *"
          type="number"
          min="1"
          max="12"
          value={appMonths}
          onChange={(e) => setAppMonths(e.target.value === '' ? '' : (parseInt(e.target.value) || 1))}
        />
        <SelectField
          label="Preferred placement"
          value={appPlacement}
          onChange={(e) => setAppPlacement(e.target.value)}
        >
          <option value="">— select —</option>
          <option>Home screen</option>
          <option>News feed</option>
          <option>Video player pre-roll</option>
          <option>Any (run of app)</option>
        </SelectField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Start date *"
          type="date"
          value={appStartDate}
          onChange={(e) => setAppStartDate(e.target.value)}
        />
        <InputField
          label="Click-through URL"
          type="url"
          value={appUrl}
          onChange={(e) => setAppUrl(e.target.value)}
          placeholder="https://"
        />
      </div>
    </div>
  );

  const renderPushForm = () => (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Channel *</label>
        <div className="flex gap-2">
          {['App push notification', 'Bulk SMS'].map((c) => {
            const isSelected = pushChannel === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setPushChannel((prev) => prev === c ? '' : c)}
                className={clsx(
                  'rounded-lg border px-4 py-2 text-sm font-bold transition cursor-pointer',
                  isSelected
                    ? 'border-gold bg-gold/10 text-[#73510f]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                )}
              >
                {c}
              </button>
            );
          })}
        </div>
        {pushChannel === 'App push notification' && (
          <p className="mt-1 text-xs text-slate-500">Ksh 0.30 per push notification sent</p>
        )}
        {pushChannel === 'Bulk SMS' && (
          <p className="mt-1 text-xs text-slate-500">Ksh 5.00 per SMS • up to 50,000 users per batch</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Number of sends *"
          type="number"
          min="1"
          value={pushSends}
          onChange={(e) => setPushSends(e.target.value === '' ? '' : (parseInt(e.target.value) || 1))}
        />
        <InputField
          label="Estimated reach per send *"
          type="number"
          min="1000"
          step="1000"
          value={pushReach}
          onChange={(e) => setPushReach(e.target.value === '' ? '' : (parseInt(e.target.value) || 10000))}
          placeholder="e.g. 25000"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Scheduled date *"
          type="date"
          value={pushDate}
          onChange={(e) => setPushDate(e.target.value)}
        />
        <InputField
          label="Scheduled time"
          type="time"
          value={pushTime}
          onChange={(e) => setPushTime(e.target.value)}
        />
      </div>

      <TextareaField
        label="Message / notification copy *"
        value={pushMessage}
        onChange={(e) => setPushMessage(e.target.value)}
        placeholder="Push: headline (max 50 chars) + body (max 150 chars)&#10;SMS: message text (max 160 chars per SMS)"
        hint="Push notifications and SMS are subject to editorial review before dispatch"
      />
    </div>
  );

  const renderProductionForm = () => (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Production items needed *</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {productionProductsList.map((item) => {
            const isSelected = prodTypes.includes(item.label);
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setProdTypes((prev) =>
                    prev.includes(item.label) ? prev.filter((t) => t !== item.label) : [...prev, item.label]
                  );
                }}
                className={clsx(
                  'rounded-lg border p-3 text-left transition cursor-pointer flex flex-col justify-between min-h-16',
                  isSelected
                    ? 'border-gold bg-gold/10 text-[#73510f]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                )}
              >
                <span className="text-sm font-bold">{item.label}</span>
                <span className="mt-1 text-xs text-slate-500 font-semibold">{money.format(item.price)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {prodTypes.length > 0 && (
        <>
          <TextareaField
            label="Creative brief"
            value={prodBrief}
            onChange={(e) => setProdBrief(e.target.value)}
            placeholder="Describe the product/service, tone, target audience, key message, language, branding notes, and any reference material"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              label="Required by date"
              type="date"
              value={prodDueDate}
              onChange={(e) => setProdDueDate(e.target.value)}
            />
            <SelectField
              label="Voiceover language (if applicable)"
              value={prodVoLang}
              onChange={(e) => setProdVoLang(e.target.value)}
            >
              <option value="">— select / N/A —</option>
              <option>English</option>
              <option>Kiswahili</option>
              <option>English &amp; Kiswahili</option>
              <option>Vernacular</option>
            </SelectField>
          </div>
        </>
      )}
    </div>
  );

  const renderConfiguratorForm = (category: ProductCategory) => {
    switch (category) {
      case 'Social Media':
        return renderSocialForm();
      case 'Livestream Coverage':
        return renderLivestreamForm();
      case 'Display':
        return renderDisplayForm();
      case 'Rich Media':
        return renderRichMediaForm();
      case 'Content':
        return renderContentForm();
      case 'Mobile App':
        return renderAppForm();
      case 'Push & SMS':
        return renderPushForm();
      case 'Production':
        return renderProductionForm();
      default:
        return null;
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-8">
        <Card className="border-teal shadow-soft">
          <CardBody className="text-center p-8 space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal/15 text-teal">
              <Check size={36} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-ink">Booking Enquiry Submitted</h2>
              <p className="text-sm text-slate-500">
                Your enquiry has been successfully received and has transitioned to the next stage in the master flow.
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 inline-block border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">DAB Reference Number</span>
              <span className="text-xl font-bold text-navy mt-1 block">{generatedRef}</span>
            </div>
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <div className="flex gap-3 justify-center text-left max-w-md mx-auto">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-[#73510f]">2</span>
                <div>
                  <p className="text-sm font-bold text-ink">Current Stage: Proposal, IO &amp; payment</p>
                  <p className="text-xs text-slate-500">
                    KBC Sales team will contact you to confirm rate card options and send the Insertion Order (IO) for signing.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">SLA: 24–48 hours</p>
                </div>
              </div>
            </div>
            <div className="pt-4 flex gap-4 justify-center">
              <Link to="/campaigns">
                <Button>Go to Campaigns Pipeline</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">New KBC Digital booking</h2>
        <p className="mt-1 text-sm text-slate-500">Client enquiry, campaign brief, product configuration, and order sheet preparation.</p>
      </div>

      <Card>
        <CardBody>
          <ol className="grid gap-3 md:grid-cols-5">
            {enquirySteps.map((step, index) => (
              <li
                key={step}
                onClick={() => {
                  const stepIds = [
                    'step-client-details',
                    'step-campaign-brief',
                    'step-products',
                    'step-review',
                    'step-order-sheet'
                  ];
                  document.getElementById(stepIds[index])?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer bg-navy/10 text-navy hover:bg-navy/20 transition-colors duration-200 select-none"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const stepIds = [
                      'step-client-details',
                      'step-campaign-brief',
                      'step-products',
                      'step-review',
                      'step-order-sheet'
                    ];
                    document.getElementById(stepIds[index])?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 bg-navy text-white">{index + 1}</span>
                <span className="text-sm font-semibold">{step}</span>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>

      <Card id="step-client-details" className="scroll-mt-24">
        <CardHeader>
          <h3 className="text-lg font-bold text-ink">1. Organisation and primary contact</h3>
          <p className="mt-1 text-sm text-slate-500">Fields align to the DAB enquiry reference.</p>
        </CardHeader>
        <CardBody className="grid gap-4 md:grid-cols-2">
          <InputField label="Company / organisation name" value={organisation} onChange={(e) => setOrganisation(e.target.value)} placeholder="e.g. Kenya Tourism Board" />
          <InputField label="KRA PIN / registration no." value={kraPin} onChange={(e) => setKraPin(e.target.value)} placeholder="e.g. P051234567M" />
          <SelectField label="Industry / sector" value={industry} onChange={(e) => setIndustry(e.target.value)}>
            <option value="">— select —</option>
            <option>Telecommunications</option>
            <option>Banking & finance</option>
            <option>Government / public sector</option>
            <option>Hospitality & tourism</option>
            <option>Retail</option>
            <option>Technology</option>
          </SelectField>
          <SelectField label="Booking type" value={bookingType} onChange={(e) => setBookingType(e.target.value)}>
            <option value="">— select —</option>
            <option>Direct client</option>
            <option>Through advertising agency</option>
            <option>Through media buying agency</option>
            <option>Government / LPO basis</option>
          </SelectField>
          <InputField label="Client Full name" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="e.g. Amina Wekesa" />
          <InputField label="Job title" value={contactJobTitle} onChange={(e) => setContactJobTitle(e.target.value)} placeholder="e.g. Marketing Manager" />
          <InputField label="Email address" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. amina@ktb.example" />
          <InputField label="Phone / WhatsApp" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +254 711 204 500" />
          <InputField label="Billing address / P.O. Box" className="md:col-span-2" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} placeholder="e.g. P.O. Box 1234-00100, Nairobi" />
        </CardBody>
      </Card>

      <Card id="step-campaign-brief" className="scroll-mt-24">
        <CardHeader>
          <h3 className="text-lg font-bold text-ink">2. Campaign brief</h3>
          <p className="mt-1 text-sm text-slate-500">Plain-language inputs for sales teams and client approvals.</p>
        </CardHeader>
        <CardBody className="grid gap-4 md:grid-cols-2">
          <SelectField label="Primary campaign goal" value={campaignGoal} onChange={(e) => setCampaignGoal(e.target.value)}>
            <option value="">— select —</option>
            <option>Brand awareness / reach</option>
            <option>Product or service launch</option>
            <option>Lead generation</option>
            <option>Event promotion</option>
            <option>Sales / conversion</option>
            <option>Corporate reputation / PR</option>
            <option>Political campaign</option>
          </SelectField>
          <SelectField label="Primary audience" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}>
            <option value="">— select —</option>
            <option>General public (all adults)</option>
            <option>Youth (18-34)</option>
            <option>Adults 35-54</option>
            <option>Senior adults (55+)</option>
            <option>Business decision-makers</option>
            <option>Parents / families</option>
          </SelectField>
          <SelectField label="Geographic focus" value={geography} onChange={(e) => setGeography(e.target.value)}>
            <option value="">— select —</option>
            <option>National (all Kenya)</option>
            <option>Nairobi & Central</option>
            <option>Coast region</option>
            <option>Western Kenya</option>
            <option>Rift Valley</option>
            <option>Multiple regions</option>
          </SelectField>
          <SelectField label="Estimated budget range" value={budgetRange} onChange={(e) => setBudgetRange(e.target.value)}>
            <option value="">— select —</option>
            <option>Under Ksh 100,000</option>
            <option>Ksh 100,000 - 500,000</option>
            <option>Ksh 500,000 - 1,000,000</option>
            <option>Ksh 1,000,000 - 5,000,000</option>
            <option>Over Ksh 5,000,000</option>
          </SelectField>
          <InputField label="Preferred start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <InputField label="Preferred end date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <InputField label="Creative assets / specifications" className="md:col-span-2" value={creativeAssets} onChange={(e) => setCreativeAssets(e.target.value)} placeholder="e.g. Banners & social images" hint="E.g., high-res banner PNGs, video links, specific campaign copy, or logo vectors" />
          <TextareaField label="Campaign description" className="md:col-span-2" value={campaignDescription} onChange={(e) => setCampaignDescription(e.target.value)} placeholder="e.g. Promote domestic travel packages with social posts, display placements, and app push reminders." />
          
        </CardBody>
      </Card>

      <Card id="step-products" className="scroll-mt-24">
        <CardHeader>
          <h3 className="text-lg font-bold text-ink">3. Product configurator</h3>
          <p className="mt-1 text-sm text-slate-500">Expandable product clusters and locked rate-card prices from the DAB reference.</p>
        </CardHeader>
        <CardBody className="space-y-3">
          {groupedProducts.map((group) => {
            const isOpen = openCategory === group.category;
            const selectedCount = selectedProducts.filter((line) => line.category === group.category).length;
            return (
              <section key={group.category} className="overflow-hidden rounded-lg border border-slate-200">
                <button
                  type="button"
                  className={clsx('flex min-h-16 w-full items-center justify-between gap-4 px-4 text-left transition', isOpen ? 'bg-navy/10 text-navy' : 'bg-slate-50 text-ink hover:bg-slate-100')}
                  onClick={() => setOpenCategory(isOpen ? null : group.category)}
                >
                  <div>
                    <p className="font-bold">{group.category}</p>
                    <p className="mt-1 text-xs text-slate-500">{group.products.length} rate-card options {selectedCount ? `• ${selectedCount} selected` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedCount ? <Badge tone="teal">{selectedCount} selected</Badge> : null}
                    <ChevronDown className={clsx('transition', isOpen && 'rotate-180')} size={20} />
                  </div>
                </button>
                {isOpen ? (
                  <div className="border-t border-slate-200 bg-white p-4 space-y-4">
                    {group.spec ? (
                      <div className="rounded-lg border border-gold/30 bg-gold/10 p-3 mb-4">
                        <p className="text-sm font-bold text-ink">{group.spec.title}</p>
                        <p className="mt-1 text-xs font-semibold text-[#73510f]">Materials due: {group.spec.deadline}</p>
                      </div>
                    ) : null}
                    {renderConfiguratorForm(group.category)}
                  </div>
                ) : null}
              </section>
            );
          })}
        </CardBody>
      </Card>

      <Card id="step-review" className="scroll-mt-24">
        <CardHeader>
          <h3 className="text-lg font-bold text-ink">4. Review Enquiry Summary</h3>
          <p className="mt-1 text-sm text-slate-500">Please review the details below before submitting the booking enquiry.</p>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="grid gap-6 rounded-lg border border-slate-200 bg-slate-50/50 p-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Organisation</p>
              <p className="mt-1 text-sm font-bold text-ink">{organisation || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">KRA PIN</p>
              <p className="mt-1 text-sm font-bold text-ink">{kraPin || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Industry</p>
              <p className="mt-1 text-sm font-bold text-ink">{industry || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Booking type</p>
              <p className="mt-1 text-sm font-bold text-ink">{bookingType || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Contact</p>
              <p className="mt-1 text-sm font-bold text-ink">{contactName ? `${contactName} (${contactJobTitle})` : '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</p>
              <p className="mt-1 text-sm font-bold text-ink">{email || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Phone</p>
              <p className="mt-1 text-sm font-bold text-ink">{phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Campaign goal</p>
              <p className="mt-1 text-sm font-bold text-ink">{campaignGoal || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Target audience</p>
              <p className="mt-1 text-sm font-bold text-ink">{targetAudience || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Geography</p>
              <p className="mt-1 text-sm font-bold text-ink">{geography || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Start date</p>
              <p className="mt-1 text-sm font-bold text-ink">{startDate || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">End date</p>
              <p className="mt-1 text-sm font-bold text-ink">{endDate || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Budget range</p>
              <p className="mt-1 text-sm font-bold text-ink">{budgetRange || '—'}</p>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Creative assets</p>
              <p className="mt-1 text-sm font-bold text-ink">{creativeAssets || '—'}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Selected products</p>
            {selectedProducts.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                No products selected. Please add products using the Product Configurator (Section 3).
              </p>
            ) : (
              selectedProducts.map((line) => (
                <div key={line.id} className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
                  <div>
                    <Badge tone="neutral">{line.category}</Badge>
                    <p className="mt-2 font-bold text-ink">{line.name}</p>
                    <p className="text-sm text-slate-500">{line.platform ? `Platform: ${line.platform}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Qty:</span>
                    <span className="text-sm font-bold text-ink">{line.quantity}</span>
                    <span className="text-sm text-slate-500">{line.unit}</span>
                  </div>
                  <Badge tone="teal">Locked rate</Badge>
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-navy md:text-right min-w-[100px]">{money.format(lineTotal(line))}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardBody>
      </Card>

      <Card id="step-order-sheet" className="scroll-mt-24">
        <CardHeader>
          <h3 className="text-lg font-bold text-ink">5. Declaration and order handoff</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 text-sm font-semibold text-slate-700">
            <input type="checkbox" className="mt-0.5 h-5 w-5 rounded border-slate-300 text-navy focus:ring-gold" checked={dec1} onChange={(e) => setDec1(e.target.checked)} />
            <span>Information provided is accurate and authorised by the organisation.</span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 text-sm font-semibold text-slate-700">
            <input type="checkbox" className="mt-0.5 h-5 w-5 rounded border-slate-300 text-navy focus:ring-gold" checked={dec2} onChange={(e) => setDec2(e.target.checked)} />
            <span>Formal proposal, rate confirmation, and signed insertion order are required before launch.</span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 text-sm font-semibold text-slate-700">
            <input type="checkbox" className="mt-0.5 h-5 w-5 rounded border-slate-300 text-navy focus:ring-gold" checked={dec3} onChange={(e) => setDec3(e.target.checked)} />
            <span>Rates are subject to 16% VAT, and political content requires indemnity.</span>
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleSubmitEnquiry}>
              <Send size={18} />
              Submit enquiry
            </Button>
            <Button variant="secondary" onClick={handleSaveDraft}>Save draft</Button>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="text-navy" size={21} />
              <h3 className="text-lg font-bold text-ink">Campaign cost estimate</h3>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <PriceRow label="Subtotal" value={money.format(totals.subtotal)} />
            <PriceRow label="Discount" value={`-${money.format(totals.discount)}`} />
            <PriceRow label="VAT 16%" value={money.format(totals.vat)} />
            <div className="rounded-lg bg-gold/15 p-4">
              <p className="text-sm font-semibold text-slate-700">Total incl. VAT</p>
              <p className="mt-1 text-2xl font-bold text-[#73510f]">{money.format(totals.grandTotal)}</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-teal">
              <Check size={18} />
              Indicative estimate locked to mock rate card
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold text-ink">Master booking flow</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            {workflowStages.slice(0, 5).map((stage, index) => (
              <div key={stage.id} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">{index + 1}</span>
                <div>
                  <p className="text-sm font-bold text-ink">{stage.name}</p>
                  <p className="text-xs text-slate-500">SLA: {stage.sla}</p>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
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
