import { Download, Lock, Printer, Share2, ChevronDown } from 'lucide-react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { campaigns, campaignTotals, money, type Role } from '../../data/mockData';
import { OrderSheetContent } from '../../components/campaigns/OrderSheetContent';

export function OrdersPage() {
  const { role } = useOutletContext<{ role: Role }>();
  const [searchParams, setSearchParams] = useSearchParams();

  if (role === 'Digital Operations') {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center p-6 bg-white rounded-lg border border-slate-200 shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger mb-4">
          <Lock size={28} />
        </div>
        <h3 className="text-xl font-bold text-ink">Access Denied</h3>
        <p className="mt-2 text-sm text-slate-500 max-w-sm leading-relaxed">
          You do not have permission to view this page. Order Sheets are only visible to Sales, Ad Managers, and Admins.
        </p>
      </div>
    );
  }
  const campaignId = searchParams.get('campaignId');
  const campaign = campaigns.find((item) => item.id === campaignId) || campaigns[0];

  const handleCampaignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams({ campaignId: e.target.value });
  };

  const handleDownloadPDF = () => {
    alert(`Downloading PDF for ${campaign.dabRef}...`);
    const docText = `KBC Digital AdBoard Order Sheet - ${campaign.dabRef}\n` +
      `==================================================\n` +
      `Client Company: ${campaign.clientCompany}\n` +
      `Client Contact: ${campaign.clientName}\n` +
      `Campaign Name: ${campaign.name}\n` +
      `Start Date: ${campaign.startDate}\n` +
      `End Date: ${campaign.endDate}\n` +
      `--------------------------------------------------\n` +
      `Products Ordered:\n` +
      campaign.products.map(p => ` - ${p.name}: ${p.quantity} ${p.unit} @ ${money.format(p.unitPrice)}`).join('\n') +
      `\n--------------------------------------------------\n` +
      `Subtotal: ${money.format(campaignTotals(campaign).subtotal)}\n` +
      `VAT (16%): ${money.format(campaignTotals(campaign).vat)}\n` +
      `Grand Total: ${money.format(campaignTotals(campaign).grandTotal)}\n`;
    
    const blob = new Blob([docText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${campaign.dabRef}_Order_Sheet.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleSharePDF = () => {
    const email = prompt("Enter email address to share the Order Sheet PDF with:", campaign.clientEmail);
    if (email) {
      alert(`Order Sheet PDF for ${campaign.dabRef} shared successfully with ${email}!`);
    }
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
          <Button onClick={handleDownloadPDF}>
            <Download size={18} />
            Download PDF
          </Button>
          <Button variant="secondary" onClick={handlePrintPDF}>
            <Printer size={18} />
            Print PDF
          </Button>
          <Button variant="secondary" onClick={handleSharePDF}>
            <Share2 size={18} />
            Share PDF
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
