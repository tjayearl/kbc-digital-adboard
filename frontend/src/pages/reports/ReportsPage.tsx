import { useEffect, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { BarChart3, Download, Upload, Trash2, FileText, CheckCircle, Eye } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { campaignTotals, money, type Role, type Campaign } from '../../data/mockData';
import { getCampaigns, updateCampaign, getCampaignReports, downloadReportPdf } from '../../services/api';

export function ReportsPage() {
  const { role } = useOutletContext<{ role: Role }>();
  const [searchParams] = useSearchParams();
  const [campaignList, setCampaignList] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateCount, setUpdateCount] = useState(0);
  
  // State for generated reports
  const [generatedReports, setGeneratedReports] = useState<Record<string, any[]>>({});
  const [loadingReports, setLoadingReports] = useState<Record<string, boolean>>({});
  const [downloading, setDownloading] = useState<string | null>(null);

  // Check if we came from report generation
  const reportId = searchParams.get('reportId');
  const campaignName = searchParams.get('campaign');

  useEffect(() => {
    // Show success message if coming from report generation
    if (reportId && campaignName) {
      setTimeout(() => {
        alert(`✅ Report generated successfully for "${campaignName}"!\nReport ID: ${reportId}`);
      }, 500);
    }
  }, [reportId, campaignName]);

  useEffect(() => {
    getCampaigns()
      .then((data) => {
        setCampaignList(data);
        setLoading(false);
        // Fetch reports for each campaign
        data.forEach(campaign => {
          fetchCampaignReports(campaign.id);
        });
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [updateCount]);

  // Fetch generated reports for a campaign
  const fetchCampaignReports = async (campaignId: string) => {
    setLoadingReports(prev => ({ ...prev, [campaignId]: true }));
    try {
      const reports = await getCampaignReports(campaignId);
      setGeneratedReports(prev => ({
        ...prev,
        [campaignId]: reports
      }));
    } catch (err) {
      console.error(`Failed to fetch reports for ${campaignId}:`, err);
    } finally {
      setLoadingReports(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  // Download a generated report PDF
  const handleDownloadGeneratedReport = async (campaignId: string, reportId: string) => {
    setDownloading(reportId);
    try {
      const blob = await downloadReportPdf(campaignId, reportId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_${reportId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download report:', err);
      alert('Failed to download report. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  // View a generated report (opens in new tab)
  const handleViewGeneratedReport = async (campaignId: string, reportId: string) => {
    try {
      const blob = await downloadReportPdf(campaignId, reportId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error('Failed to view report:', err);
      alert('Failed to view report. Please try again.');
    }
  };

  const handleFileUpload = (campaignId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const campaign = campaignList.find((c) => c.id === campaignId);
      if (campaign) {
        updateCampaign(campaignId, { ...campaign, reportFile: file.name })
          .then(() => {
            setUpdateCount(prev => prev + 1);
            alert(`Report "${file.name}" uploaded successfully for campaign "${campaign.name}"!`);
          })
          .catch((err) => {
            console.error(err);
            alert(`Failed to upload report: ${err.message || err}`);
          });
      }
    }
  };

  const handleRemoveFile = (campaignId: string) => {
    const campaign = campaignList.find((c) => c.id === campaignId);
    if (campaign) {
      updateCampaign(campaignId, { ...campaign, reportFile: undefined })
        .then(() => {
          setUpdateCount(prev => prev + 1);
          alert(`Report removed for campaign "${campaign.name}".`);
        })
        .catch((err) => {
          console.error(err);
          alert(`Failed to remove report: ${err.message || err}`);
        });
    }
  };
const handleExportReport = async (campaign: Campaign) => {
  const reports = generatedReports[campaign.id];

  if (!reports || reports.length === 0) {
    alert("No generated report available for this campaign");
    return;
  }

  const latestReport = reports[reports.length - 1];

  setDownloading(latestReport.id);

  try {
    const blob = await downloadReportPdf(
      campaign.id,
      latestReport.id
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${campaign.dabRef}_Performance_Report.pdf`;

    document.body.appendChild(link);
    link.click();

    link.remove();
    URL.revokeObjectURL(url);

  } catch (err) {
    console.error("Failed to export report:", err);
    alert("Failed to export report");
  } finally {
    setDownloading(null);
  }
};

  const canUpload = role === 'digitalOps' || role === 'admin' || role === 'sales';

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

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
          {campaignList.map((campaign) => {
            const reports = generatedReports[campaign.id] || [];
            const isLoadingReports = loadingReports[campaign.id];

            return (
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
                  
                  {/* Generated Reports Section */}
                  {reports.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-semibold text-slate-500">📄 Generated Reports:</p>
                      {reports.map((report) => (
                        <div key={report.id} className="flex items-center gap-2">
                          <FileText size={14} className="text-teal" />
                          <span className="text-xs text-slate-600">
                            {new Date(report.generatedAt).toLocaleDateString()} 
                            {report.deliveredItems && ` • ${report.deliveredItems.length} items`}
                          </span>
                          <Button
                            variant="secondary"
                            className="h-7 min-h-0 text-xs px-2 py-1"
                            onClick={() => handleViewGeneratedReport(campaign.id, report.id)}
                            disabled={downloading === report.id}
                          >
                            <Eye size={12} className="mr-1" />
                            View
                          </Button>
                          <Button
                            variant="secondary"
                            className="h-7 min-h-0 text-xs px-2 py-1"
                            onClick={() => handleDownloadGeneratedReport(campaign.id, report.id)}
                            disabled={downloading === report.id}
                          >
                            <Download size={12} className="mr-1" />
                            {downloading === report.id ? '...' : 'PDF'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {isLoadingReports && (
                    <div className="mt-2">
                      <span className="text-xs text-slate-400">Loading reports...</span>
                    </div>
                  )}

                  {/* Existing uploaded file display */}
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
            );
          })}
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