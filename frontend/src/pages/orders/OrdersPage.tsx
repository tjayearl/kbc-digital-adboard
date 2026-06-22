import { useEffect, useState } from 'react';
import { Download, Lock, Printer, Share2, ChevronDown, FileText } from 'lucide-react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { campaignTotals, money, type Role, type Campaign } from '../../data/mockData';
import { OrderSheetContent } from '../../components/campaigns/OrderSheetContent';
import { getCampaigns, uploadSignedSheet, downloadOrderSheetPdf } from '../../services/api';
import { downloadBlob, orderSheetFilename, printBlob, shareOrderSheet } from '../../utils/pdfActions';

export function OrdersPage() {
  const { role } = useOutletContext<{ role: Role }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [campaignList, setCampaignList] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateCount, setUpdateCount] = useState(0);
  const [airtimeSerial, setAirtimeSerial] = useState('');
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [uploadingSigned, setUploadingSigned] = useState(false);

  useEffect(() => {
    getCampaigns()
      .then((data) => {
        setCampaignList(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [updateCount]);

  if (role === 'digitalOps') {
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

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  const campaignId = searchParams.get('campaignId');
  const campaign = campaignList.find((item) => item.id === campaignId) || campaignList[0];

  if (!campaign) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center p-6 bg-white rounded-lg border border-slate-200 shadow-soft animate-in fade-in duration-200">
        <h3 className="text-xl font-bold text-ink">No Campaigns Available</h3>
        <p className="mt-2 text-sm text-slate-500 max-w-sm leading-relaxed">
          There are no campaigns registered in the system yet. Please create a campaign from the Campaigns page first.
        </p>
      </div>
    );
  }

  const handleCampaignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams({ campaignId: e.target.value });
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
            {campaignList.map((item) => (
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
          {campaign.orderSheetPdfUrl ? (
            <>
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
            </>
          ) : (
            <div className="col-span-3 text-center py-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm font-semibold text-amber-800">
                Order Sheet PDF has not been generated yet for this campaign.
              </p>
            </div>
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
              <a 
                href={campaign.signedSheetUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center text-sm font-bold text-navy hover:underline"
              >
                <FileText size={16} className="mr-1.5" /> View Signed Order Sheet PDF
              </a>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
