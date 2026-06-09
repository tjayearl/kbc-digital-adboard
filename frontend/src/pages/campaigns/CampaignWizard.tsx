import clsx from 'clsx';
import { Check, ChevronDown, FileText, Plus, Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { InputField, SelectField, TextareaField } from '../../components/ui/Field';
import { campaigns, campaignTotals, lineTotal, materialSpecs, money, productCatalog, workflowStages, type ProductCategory } from '../../data/mockData';

const enquirySteps = ['Client details', 'Campaign brief', 'Products', 'Review', 'Order sheet'];
const draft = campaigns[0];
const totals = campaignTotals(draft);

const categoryOrder: ProductCategory[] = ['Social Media', 'Livestream Coverage', 'Display', 'Rich Media', 'Content', 'Mobile App', 'Push & SMS', 'Production'];

export function CampaignWizard() {
  const [openCategory, setOpenCategory] = useState<ProductCategory>('Social Media');

  const groupedProducts = useMemo(
    () =>
      categoryOrder
        .map((category) => ({
          category,
          products: productCatalog.filter((item) => item.category === category),
          spec: materialSpecs.find((item) => item.category === category),
        }))
        .filter((group) => group.products.length > 0),
    [],
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-ink">New KBC Digital booking</h2>
          <p className="mt-1 text-sm text-slate-500">Client enquiry, campaign brief, product configuration, and order sheet preparation.</p>
        </div>

        <Card>
          <CardBody>
            <ol className="grid gap-3 md:grid-cols-5">
              {enquirySteps.map((step, index) => (
                <li key={step} className={clsx('flex items-center gap-2 rounded-lg px-3 py-2', index < 3 ? 'bg-navy/10 text-navy' : 'bg-slate-50 text-slate-600')}>
                  <span className={clsx('flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold', index < 3 ? 'bg-navy text-white' : 'bg-slate-200 text-slate-600')}>{index + 1}</span>
                  <span className="text-sm font-semibold">{step}</span>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold text-ink">1. Organisation and primary contact</h3>
            <p className="mt-1 text-sm text-slate-500">Fields align to the DAB enquiry reference.</p>
          </CardHeader>
          <CardBody className="grid gap-4 md:grid-cols-2">
            <InputField label="Company / organisation name" defaultValue="Kenya Tourism Board" />
            <InputField label="KRA PIN / registration no." defaultValue="P051234567M" />
            <SelectField label="Industry / sector" defaultValue="Hospitality & tourism">
              <option>Telecommunications</option>
              <option>Banking & finance</option>
              <option>Government / public sector</option>
              <option>Hospitality & tourism</option>
              <option>Retail</option>
              <option>Technology</option>
            </SelectField>
            <SelectField label="Booking type" defaultValue="Direct client">
              <option>Direct client</option>
              <option>Through advertising agency</option>
              <option>Through media buying agency</option>
              <option>Government / LPO basis</option>
            </SelectField>
            <InputField label="Full name" defaultValue="Amina Wekesa" />
            <InputField label="Job title" defaultValue="Marketing Manager" />
            <InputField label="Email address" defaultValue="amina@ktb.example" />
            <InputField label="Phone / WhatsApp" defaultValue="+254 711 204 500" />
            <InputField label="Billing address / P.O. Box" className="md:col-span-2" defaultValue="P.O. Box 1234-00100, Nairobi" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold text-ink">2. Campaign brief</h3>
            <p className="mt-1 text-sm text-slate-500">Plain-language inputs for sales teams and client approvals.</p>
          </CardHeader>
          <CardBody className="grid gap-4 md:grid-cols-2">
            <SelectField label="Primary campaign goal" defaultValue="Brand awareness / reach">
              <option>Brand awareness / reach</option>
              <option>Product or service launch</option>
              <option>Lead generation</option>
              <option>Event promotion</option>
              <option>Sales / conversion</option>
              <option>Corporate reputation / PR</option>
              <option>Political campaign</option>
            </SelectField>
            <SelectField label="Primary audience" defaultValue="General public (all adults)">
              <option>General public (all adults)</option>
              <option>Youth (18-34)</option>
              <option>Adults 35-54</option>
              <option>Senior adults (55+)</option>
              <option>Business decision-makers</option>
              <option>Parents / families</option>
            </SelectField>
            <SelectField label="Geographic focus" defaultValue="National (all Kenya)">
              <option>National (all Kenya)</option>
              <option>Nairobi & Central</option>
              <option>Coast region</option>
              <option>Western Kenya</option>
              <option>Rift Valley</option>
              <option>Multiple regions</option>
            </SelectField>
            <SelectField label="Estimated budget" defaultValue="Ksh 500,000 - 1,000,000">
              <option>Under Ksh 50,000</option>
              <option>Ksh 50,000 - 150,000</option>
              <option>Ksh 150,000 - 500,000</option>
              <option>Ksh 500,000 - 1,000,000</option>
              <option>Over Ksh 1,000,000</option>
              <option>Flexible / open to recommendation</option>
            </SelectField>
            <InputField label="Preferred start date" type="date" defaultValue="2026-06-15" />
            <InputField label="Preferred end date" type="date" defaultValue="2026-07-15" />
            <TextareaField label="Campaign description" className="md:col-span-2" defaultValue="Promote domestic travel packages with social posts, display placements, and app push reminders." />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold text-ink">3. Product configurator</h3>
            <p className="mt-1 text-sm text-slate-500">Expandable product clusters and locked rate-card prices from the DAB reference.</p>
          </CardHeader>
          <CardBody className="space-y-3">
            {groupedProducts.map((group) => {
              const isOpen = openCategory === group.category;
              const selectedCount = draft.products.filter((line) => line.category === group.category).length;
              return (
                <section key={group.category} className="overflow-hidden rounded-lg border border-slate-200">
                  <button
                    type="button"
                    className={clsx('flex min-h-16 w-full items-center justify-between gap-4 px-4 text-left transition', isOpen ? 'bg-navy/10 text-navy' : 'bg-slate-50 text-ink hover:bg-slate-100')}
                    onClick={() => setOpenCategory(group.category)}
                  >
                    <div>
                      <p className="font-bold">{group.category}</p>
                      <p className="mt-1 text-xs text-slate-500">{group.products.length} rate-card options {selectedCount ? `• ${selectedCount} selected in mock order` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedCount ? <Badge tone="teal">{selectedCount} selected</Badge> : null}
                      <ChevronDown className={clsx('transition', isOpen && 'rotate-180')} size={20} />
                    </div>
                  </button>
                  {isOpen ? (
                    <div className="grid gap-3 border-t border-slate-200 bg-white p-4">
                      {group.spec ? (
                        <div className="rounded-lg border border-gold/30 bg-gold/10 p-3">
                          <p className="text-sm font-bold text-ink">{group.spec.title}</p>
                          <p className="mt-1 text-xs font-semibold text-[#73510f]">Materials due: {group.spec.deadline}</p>
                        </div>
                      ) : null}
                      {group.products.map((item) => (
                        <article key={item.id} className="rounded-lg border border-slate-200 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h4 className="font-bold text-ink">{item.name}</h4>
                              <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                              <p className="mt-2 text-sm font-bold text-navy">{money.format(item.unitPrice)} / {item.unit}</p>
                            </div>
                            <Button variant="secondary" className="shrink-0">
                              <Plus size={18} />
                              Add
                            </Button>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.fields.map((field) => (
                              <Badge key={field}>{field}</Badge>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold text-ink">4. Review selected products</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            {draft.products.map((line) => (
              <div key={line.id} className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <Badge tone="neutral">{line.category}</Badge>
                  <p className="mt-2 font-bold text-ink">{line.name}</p>
                  <p className="text-sm text-slate-500">{line.quantity.toLocaleString()} {line.unit}{line.platform ? ` • ${line.platform}` : ''}</p>
                </div>
                <Badge tone="teal">Locked rate</Badge>
                <p className="font-bold text-navy md:text-right">{money.format(lineTotal(line))}</p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold text-ink">5. Declaration and order handoff</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            {[
              'Information provided is accurate and authorised by the organisation.',
              'Formal proposal, rate confirmation, and signed insertion order are required before launch.',
              'Rates are subject to 16% VAT, and political content requires indemnity.',
            ].map((item) => (
              <label key={item} className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 text-sm font-semibold text-slate-700">
                <input type="checkbox" className="mt-0.5 h-5 w-5 rounded border-slate-300 text-navy focus:ring-gold" defaultChecked />
                <span>{item}</span>
              </label>
            ))}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button>
                <Send size={18} />
                Submit enquiry
              </Button>
              <Button variant="secondary">Save draft</Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
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
      </aside>
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
