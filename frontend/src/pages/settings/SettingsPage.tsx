import { ShieldCheck, UserCog } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { roles, type Role } from '../../data/mockData';

type SettingsPageProps = {
  role: Role;
};

export function SettingsPage({ role }: SettingsPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Settings</h2>
        <p className="mt-1 text-sm text-slate-500">Mock role configuration. Authentication UI is intentionally excluded.</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserCog className="text-navy" size={22} />
            <h3 className="text-lg font-bold text-ink">User roles</h3>
          </div>
        </CardHeader>
        <CardBody className="grid gap-3 md:grid-cols-2">
          {roles.map((item) => (
            <div key={item} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-navy" size={20} />
                <p className="font-semibold text-ink">{item}</p>
              </div>
              {item === role ? <Badge tone="gold">Current</Badge> : <Badge>Mock</Badge>}
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
