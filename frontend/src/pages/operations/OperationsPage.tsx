import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CalendarDays, CheckSquare, Clock3, UploadCloud, FileText } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { materialSpecs, type Role } from '../../data/mockData';

export function OperationsPage() {
  const navigate = useNavigate();

  // State for validation checkboxes
  const [validationChecked, setValidationChecked] = useState({
    Artwork: false,
    VideoAssets: false,
    SocialAssets: false
  });

  // State for POD upload
  const [podUploaded, setPodUploaded] = useState(false);
  const [podFileName, setPodFileName] = useState('');
  const [podPreview, setPodPreview] = useState('');

  // State for campaign
  const [currentCampaign] = useState({
    id: '1',
    name: 'Summer Sale Campaign'
  });

  const handleValidationToggle = (item: keyof typeof validationChecked) => {
    setValidationChecked(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const handleValidateAll = () => {
    setValidationChecked({
      Artwork: true,
      VideoAssets: true,
      SocialAssets: true
    });
  };

  const allValidationsChecked = Object.values(validationChecked).every(v => v === true);

  const handlePODUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a valid file (JPG, PNG, or PDF)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setPodFileName(file.name);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPodPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPodPreview('');
      }
      
      const podData = {
        campaignId: currentCampaign.id,
        campaignName: currentCampaign.name,
        fileName: file.name,
        fileType: file.type,
        uploadDate: new Date().toISOString(),
        fileData: URL.createObjectURL(file)
      };
      localStorage.setItem(`pod_${currentCampaign.id}`, JSON.stringify(podData));
      
      setPodUploaded(true);
      alert(`POD uploaded successfully: ${file.name}`);
    }
  };

  const handleGenerateReport = () => {
    if (!podUploaded) {
      alert('Please upload POD before generating report');
      return;
    }
    navigate(`/reports?campaign=${encodeURIComponent(currentCampaign.name)}&campaignId=${currentCampaign.id}`);
  };

  const canGenerateReport = podUploaded;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Digital operations</h2>
        <p className="mt-1 text-sm text-slate-500">Phase 1 placeholder for approved briefs moving into execution.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ready for Execution" value="4" detail="Approved briefs" icon={CheckSquare} />
        <StatCard label="Scheduled" value="3" detail="Calendar entries" icon={CalendarDays} />
        <StatCard label="Live" value="2" detail="Campaigns in market" icon={Clock3} />
        <StatCard label="Delivered" value="7" detail="Proof uploaded" icon={UploadCloud} />
      </section>

      {/* Material Validation Checklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-ink">Material validation checklist</h3>
              <p className="mt-1 text-sm text-slate-500">Digital Ops validates specs only after the brief unlocks.</p>
            </div>
            {!allValidationsChecked && (
              <button
                onClick={handleValidateAll}
                className="rounded-md border border-gold bg-white px-3 py-1.5 text-sm font-semibold text-navy transition hover:bg-gold/10"
              >
                Validate all
              </button>
            )}
          </div>
        </CardHeader>
        <CardBody className="grid gap-3 md:grid-cols-3">
          {['Artwork', 'Video Assets', 'Social Assets'].map((item) => {
            const itemKey = item.replace(' ', '') as keyof typeof validationChecked;
            return (
              <label key={item} className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 px-4">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-slate-300 text-navy focus:ring-gold"
                  checked={validationChecked[itemKey]}
                  onChange={() => handleValidationToggle(itemKey)}
                />
                <span className="font-semibold text-slate-700">{item}</span>
              </label>
            );
          })}
        </CardBody>
      </Card>

      {/* Material Specifications and Deadlines */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold text-ink">Material specifications and deadlines</h3>
          <p className="mt-1 text-sm text-slate-500">Pulled from the DAB UI prototype reference.</p>
        </CardHeader>
        <CardBody className="grid gap-4 xl:grid-cols-2">
          {materialSpecs.map((spec) => (
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
          ))}
        </CardBody>
      </Card>

      {/* Proof of Delivery (POD) Section */}
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
              className="hidden"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={handlePODUpload}
              disabled={!allValidationsChecked}
            />
            <label htmlFor="pod-upload">
              <Button 
                variant="secondary" 
                disabled={!allValidationsChecked}
                onClick={() => {}}
              >
                <UploadCloud size={18} className="mr-2" />
                {podUploaded ? 'Replace POD' : 'Upload POD'}
              </Button>
            </label>
            {!allValidationsChecked && (
              <p className="text-sm text-slate-500">Complete material validation first</p>
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

      {/* Campaign Report Section */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold text-ink">Campaign Report</h3>
          <p className="mt-1 text-sm text-slate-500">Generate performance report after POD is uploaded.</p>
        </CardHeader>
        <CardBody>
          <Button 
            onClick={handleGenerateReport} 
            disabled={!canGenerateReport}
            variant={canGenerateReport ? 'primary' : 'secondary'}
          >
            <FileText size={18} className="mr-2" />
            Generate Report
          </Button>
          {!canGenerateReport && (
            <p className="mt-2 text-sm text-slate-500">Upload POD to enable report generation</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
