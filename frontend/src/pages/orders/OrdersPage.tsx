import { Download, Lock, Printer, Share2, ChevronDown } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { campaigns } from '../../data/mockData';
import { OrderSheetContent } from '../../components/campaigns/OrderSheetContent';

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  const campaign = campaigns.find((item) => item.id === campaignId) || campaigns[0];

  const handleCampaignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams({ campaignId: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">Order sheet preview</h2>
          <p className="mt-1 text-sm text-slate-500">Signed-ready, non-editable Order Sheet content for server-side PDF generation.</p>
        </div>
        <div className="relative min-w-[240px]">
          <label className="sr-only">Select Campaign</label>
          <select
            className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
            value={campaign.id}
            onChange={handleCampaignChange}
          >
            {campaigns.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.dabRef})
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <Card>
        <CardBody className="p-6 sm:p-8 bg-slate-50/50 rounded-lg">
          <OrderSheetContent campaign={campaign} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="text-navy" size={20} />
            <h3 className="text-lg font-bold text-ink">Locked PDF actions</h3>
          </div>
          <p className="mt-1 text-sm text-slate-500">{campaign.dabRef}</p>
        </CardHeader>
        <CardBody className="grid gap-3 sm:grid-cols-3">
          <Button>
            <Download size={18} />
            Download PDF
          </Button>
          <Button variant="secondary">
            <Printer size={18} />
            Print PDF
          </Button>
          <Button variant="secondary">
            <Share2 size={18} />
            Share PDF
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
