import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { campaigns, campaignTotals, money } from '../../data/mockData';

function statusTone(status: string) {
  if (status.includes('Pending')) return 'gold' as const;
  if (status.includes('Confirmed') || status.includes('Approved')) return 'teal' as const;
  if (status.includes('Draft')) return 'neutral' as const;
  return 'navy' as const;
}

export function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const allCampaigns = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return campaigns;
    return campaigns.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.clientCompany.toLowerCase().includes(query) ||
        item.dabRef.toLowerCase().includes(query)
    );
  }, [searchQuery]);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">Campaigns</h2>
          <p className="mt-1 text-sm text-slate-500">Search, sort, and open every digital advertising order.</p>
        </div>
        <Link to="/campaigns/new">
          <Button className="w-full sm:w-auto">New Campaign</Button>
        </Link>
      </div>

      <Card>
        <CardBody className="grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
            <input
              className="min-h-12 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm shadow-sm focus:border-gold focus:ring-2 focus:ring-gold/20"
              placeholder="Search by client, campaign, or DAB reference"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
          <Button variant="secondary">
            <SlidersHorizontal size={18} />
            Filters
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold text-ink">Pipeline</h3>
        </CardHeader>
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Campaign</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Dates</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500 bg-white">
                    No campaigns found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                allCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <Link to={`/campaigns/${campaign.id}`} className="font-bold text-navy">
                        {campaign.name}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">{campaign.dabRef}</p>
                    </td>
                    <td className="px-5 py-4">{campaign.clientCompany}</td>
                    <td className="px-5 py-4">{campaign.startDate} to {campaign.endDate}</td>
                    <td className="px-5 py-4">
                      <Badge tone={statusTone(campaign.status)}>{campaign.status}</Badge>
                    </td>
                    <td className="px-5 py-4 text-right font-bold">{money.format(campaignTotals(campaign).grandTotal)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <CardBody className="grid gap-3 lg:hidden">
          {allCampaigns.length === 0 ? (
            <p className="text-center py-6 text-sm text-slate-500">
              No campaigns found matching "{searchQuery}"
            </p>
          ) : (
            allCampaigns.map((campaign) => (
              <Link key={campaign.id} to={`/campaigns/${campaign.id}`} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">{campaign.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{campaign.clientCompany}</p>
                  </div>
                  <Badge tone={statusTone(campaign.status)}>{campaign.status}</Badge>
                </div>
                <p className="mt-3 text-sm font-semibold text-navy">{money.format(campaignTotals(campaign).grandTotal)}</p>
              </Link>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
