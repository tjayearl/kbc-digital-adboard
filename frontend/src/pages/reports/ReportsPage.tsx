import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BarChart3, Download, Upload, Trash2, FileText, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { campaigns, campaignTotals, money, type Role, type Campaign } from '../../data/mockData';

export function ReportsPage() {
  const { role } = useOutletContext<{ role: Role }>();
  const [campaignList, setCampaignList] = useState<Campaign[]>(campaigns);

  const handleFileUpload = (campaignId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const campaign = campaigns.find((c) => c.id === campaignId);
      if (campaign) {
        campaign.reportFile = file.name;
        setCampaignList([...campaigns]);
        alert(`Report "${file.name}" uploaded successfully for campaign "${campaign.name}"!`);
      }
    }
  };

  const handleRemoveFile = (campaignId: string) => {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (campaign) {
      campaign.reportFile = undefined;
      setCampaignList([...campaigns]);
      alert(`Report removed for campaign "${campaign.name}".`);
    }
  };

  const handleExportReport = (campaign: Campaign) => {
    const totals = campaignTotals(campaign);
    alert(`Exporting report summary for ${campaign.dabRef}...`);

    const reportContent = `KBC Digital AdBoard - Campaign Performance Report\n` +
      `=============================================================\n` +
      `Campaign Reference: ${campaign.dabRef}\n` +
      `Campaign Name:      ${campaign.name}\n` +
      `Client Company:     ${campaign.clientCompany}\n` +
      `Client Name:        ${campaign.clientName}\n` +
      `Owner / Representative: ${campaign.owner}\n` +
      `Campaign Schedule:  ${campaign.startDate} to ${campaign.endDate}\n` +
      `Workflow Status:    ${campaign.status}\n` +
      `-------------------------------------------------------------\n` +
      `Uploaded Report:    ${campaign.reportFile || 'No custom report file uploaded (using standard scaffold)'}\n` +
      `-------------------------------------------------------------\n` +
      `Deliverables Summary:\n` +
      campaign.products.map(p => ` - [${p.category}] ${p.name}: ${p.quantity} ${p.unit} (Value: ${money.format(p.quantity * p.unitPrice)})`).join('\n') +
      `\n-------------------------------------------------------------\n` +
      `Financial Summary:\n` +
      ` - Subtotal:           ${money.format(totals.subtotal)}\n` +
      ` - Discount (${campaign.discountPercent}%):    ${money.format(totals.discount)}\n` +
      ` - VAT (16%):          ${money.format(totals.vat)}\n` +
      ` - Grand Total:        ${money.format(totals.grandTotal)}\n` +
      `=============================================================\n` +
      `Generated on: ${new Date().toLocaleString()}\n` +
      `Kenya Broadcasting Corporation - Digital AdBoard Services\n`;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${campaign.dabRef}_Performance_Report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const canUpload = role === 'digitalOps' || role === 'admin' || role === 'sales';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">Reports</h2>
          <p className="mt-1 text-sm text-slate-500">Auto-filled campaign report scaffolds for management and clients.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="text-navy" size={20} />
            <h3 className="text-lg font-bold text-ink">Campaign execution reports</h3>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {canUpload 
              ? "As a Digital Operations / Admin, you can upload performance reports and export summaries."
              : "View and export campaign performance reports."
            }
          </p>
        </CardHeader>
        <CardBody className="grid gap-4">
          {campaignList.map((campaign) => (
            <article 
              key={campaign.id} 
              className="grid gap-4 rounded-lg border border-slate-200 p-4 lg:grid-cols-[1fr_auto] lg:items-center bg-white hover:shadow-soft transition-shadow duration-200"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-bold text-ink text-base">{campaign.name}</h4>
                  <Badge tone={campaign.status === 'Brief Unlocked' ? 'teal' : 'neutral'}>
                    {campaign.status}
                  </Badge>
                  <Badge tone="navy">{campaign.dabRef}</Badge>
                </div>
                <p className="text-sm text-slate-500">{campaign.clientCompany} • representative: {campaign.owner}</p>
                <div className="flex items-center gap-2 mt-1">
                  <FileText size={16} className="text-slate-400" />
                  <span className="text-xs font-semibold text-slate-600">
                    {campaign.reportFile ? (
                      <span className="text-teal font-bold flex items-center gap-1">
                        <CheckCircle size={14} /> Custom Report: {campaign.reportFile}
                      </span>
                    ) : (
                      <span className="text-slate-450 italic">No custom report file uploaded</span>
                    )}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {canUpload && (
                  <div className="relative">
                    <input
                      type="file"
                      id={`file-upload-${campaign.id}`}
                      className="hidden"
                      onChange={(e) => handleFileUpload(campaign.id, e)}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                    <Button 
                      variant="secondary" 
                      className="h-10 text-xs px-3"
                      onClick={() => document.getElementById(`file-upload-${campaign.id}`)?.click()}
                    >
                      <Upload size={15} />
                      {campaign.reportFile ? "Update Report" : "Upload Report"}
                    </Button>
                  </div>
                )}

                {canUpload && campaign.reportFile && (
                  <Button 
                    variant="danger" 
                    className="h-10 text-xs px-3"
                    onClick={() => handleRemoveFile(campaign.id)}
                  >
                    <Trash2 size={15} />
                    Remove
                  </Button>
                )}

                <Button 
                  className="h-10 text-xs px-3"
                  onClick={() => handleExportReport(campaign)}
                >
                  <Download size={15} />
                  Export Report
                </Button>
              </div>
            </article>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg">
          <BarChart3 className="text-navy" size={24} />
          <p className="text-sm font-semibold text-slate-700">
            Real-time analytics and performance metrics dashboard will automatically load when the analytics microservice goes live.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
