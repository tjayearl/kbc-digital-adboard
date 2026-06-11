import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Archive, Edit3, Plus, ShieldAlert, UserPlus, Users, Trash2, ShieldCheck, ClipboardList, CheckSquare } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { InputField, SelectField } from '../../components/ui/Field';
import { money, rateCard as mockRateCard, usersList as mockUsers, productCatalog, type Role, type RateCardItem, type UserItem, type ProductCategory } from '../../data/mockData';

const categories: ProductCategory[] = [
  'Social Media',
  'Livestream Coverage',
  'Display',
  'Rich Media',
  'Content',
  'Mobile App',
  'Push & SMS',
  'Production'
];

export function ManagementPage() {
  const { role, users, setUsers } = useOutletContext<{
    role: Role;
    users: UserItem[];
    setUsers: React.Dispatch<React.SetStateAction<UserItem[]>>;
  }>();
  const [activeTab, setActiveTab] = useState<'Rate Card' | 'Users'>('Rate Card');
  const [rateItems, setRateItems] = useState<RateCardItem[]>(mockRateCard);

  // Rate card modal state
  const [showRateModal, setShowRateModal] = useState(false);
  const [editingRateItem, setEditingRateItem] = useState<RateCardItem | null>(null);
  const [rateName, setRateName] = useState('');
  const [rateCategory, setRateCategory] = useState<ProductCategory>('Social Media');
  const [rateUnit, setRateUnit] = useState('post');
  const [rateUnitPrice, setRateUnitPrice] = useState(0);
  const [rateVersion, setRateVersion] = useState('2026.1');

  // User modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserItem, setEditingUserItem] = useState<UserItem | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<Role>('sales');

  if (role !== 'admin') {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center p-6 bg-white rounded-lg border border-slate-200 shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger mb-4">
          <ShieldAlert size={28} />
        </div>
        <h3 className="text-xl font-bold text-ink">Access Denied</h3>
        <p className="mt-2 text-sm text-slate-500 max-w-sm leading-relaxed">
          You do not have permission to view the Management settings. This page is restricted to Admin users.
        </p>
      </div>
    );
  }

  // --- Rate Card Actions ---
  const handleOpenAddRateModal = () => {
    setEditingRateItem(null);
    setRateName('');
    setRateCategory('Social Media');
    setRateUnit('unit');
    setRateUnitPrice(0);
    setRateVersion('2026.1');
    setShowRateModal(true);
  };

  const handleOpenEditRateModal = (item: RateCardItem) => {
    setEditingRateItem(item);
    setRateName(item.name);
    setRateCategory(item.category);
    setRateUnit(item.unit);
    setRateUnitPrice(item.unitPrice);
    setRateVersion(item.version);
    setShowRateModal(true);
  };

  const handleSubmitRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRateItem) {
      // Edit
      const item = mockRateCard.find((r) => r.id === editingRateItem.id);
      if (item) {
        item.name = rateName;
        item.category = rateCategory;
        item.unit = rateUnit;
        item.unitPrice = rateUnitPrice;
        item.version = rateVersion;
        item.updatedAt = new Date().toISOString().split('T')[0];
      }
      // Sync with productCatalog
      const catId = editingRateItem.id.startsWith('rc-') ? editingRateItem.id.replace('rc-', '') : editingRateItem.id;
      const catalogItem = productCatalog.find(p => p.id === catId || `rc-${p.id}` === editingRateItem.id);
      if (catalogItem) {
        catalogItem.name = rateName;
        catalogItem.category = rateCategory;
        catalogItem.unit = rateUnit;
        catalogItem.unitPrice = rateUnitPrice;
      }
    } else {
      // Add
      const newId = `rc-${Date.now()}`;
      const newItem: RateCardItem = {
        id: newId,
        name: rateName,
        category: rateCategory,
        unit: rateUnit,
        unitPrice: rateUnitPrice,
        version: rateVersion,
        updatedAt: new Date().toISOString().split('T')[0],
        status: 'Active',
      };
      mockRateCard.push(newItem);

      // Add to productCatalog
      productCatalog.push({
        id: newId.replace('rc-', ''),
        category: rateCategory,
        name: rateName,
        unit: rateUnit,
        unitPrice: rateUnitPrice,
        description: `Custom item: ${rateName}`,
        fields: ['Quantity', 'Description'],
      });
    }
    setRateItems([...mockRateCard]);
    setShowRateModal(false);
  };

  const handleToggleArchiveRate = (id: string) => {
    const item = mockRateCard.find((r) => r.id === id);
    if (item) {
      item.status = item.status === 'Active' ? 'Archived' : 'Active';
      setRateItems([...mockRateCard]);
      alert(`Rate item status changed to ${item.status}.`);
    }
  };

  // --- User Actions ---
  const handleOpenAddUserModal = () => {
    setEditingUserItem(null);
    setUserName('');
    setUserEmail('');
    setUserRole('sales');
    setShowUserModal(true);
  };

  const handleOpenEditUserModal = (user: UserItem) => {
    setEditingUserItem(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserRole(user.role);
    setShowUserModal(true);
  };

  const handleSubmitUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUserItem) {
      // Edit
      const updatedUsers = users.map((u) => {
        if (u.id === editingUserItem.id) {
          const original = mockUsers.find(x => x.id === u.id);
          if (original) {
            original.name = userName;
            original.email = userEmail;
            original.role = userRole;
          }
          return { ...u, name: userName, email: userEmail, role: userRole };
        }
        return u;
      });
      setUsers(updatedUsers);
    } else {
      // Register
      const newUser: UserItem = {
        id: `usr-${Date.now()}`,
        name: userName,
        email: userEmail,
        role: userRole,
        status: 'Active',
      };
      mockUsers.push(newUser);
      setUsers([...mockUsers]);
    }
    setShowUserModal(false);
  };

  const handleToggleSuspendUser = (id: string) => {
    const updatedUsers = users.map((u) => {
      if (u.id === id) {
        const newStatus: 'Active' | 'Suspended' = u.status === 'Active' ? 'Suspended' : 'Active';
        const original = mockUsers.find(x => x.id === u.id);
        if (original) {
          original.status = newStatus;
        }
        return { ...u, status: newStatus };
      }
      return u;
    });
    setUsers(updatedUsers);
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const idx = mockUsers.findIndex((user) => user.id === id);
      if (idx !== -1) {
        mockUsers.splice(idx, 1);
      }
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">Management</h2>
          <p className="mt-1 text-sm text-slate-500">Admin system configuration, rate card controls, and user directory.</p>
        </div>
        {activeTab === 'Rate Card' ? (
          <Button onClick={handleOpenAddRateModal}>
            <Plus size={18} />
            Add Rate Item
          </Button>
        ) : (
          <Button onClick={handleOpenAddUserModal}>
            <UserPlus size={18} />
            Add User
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2">
        <button
          onClick={() => setActiveTab('Rate Card')}
          className={`min-h-11 shrink-0 rounded-lg px-4 text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'Rate Card' ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardList size={18} />
          Rate Card
        </button>
        <button
          onClick={() => setActiveTab('Users')}
          className={`min-h-11 shrink-0 rounded-lg px-4 text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'Users' ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users size={18} />
          User Management
        </button>
      </div>

      {/* Rate Card Tab */}
      {activeTab === 'Rate Card' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold text-ink">Rate card management</h3>
          </CardHeader>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Product Name</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Unit</th>
                  <th className="px-5 py-3">Unit Price</th>
                  <th className="px-5 py-3">Version</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rateItems.map((item) => (
                  <tr key={item.id} className={item.status === 'Archived' ? 'opacity-60 bg-slate-50/55' : ''}>
                    <td className="px-5 py-4 font-bold text-ink">{item.name}</td>
                    <td className="px-5 py-4"><Badge tone="neutral">{item.category}</Badge></td>
                    <td className="px-5 py-4 text-slate-500">{item.unit}</td>
                    <td className="px-5 py-4 font-semibold text-ink">{money.format(item.unitPrice)}</td>
                    <td className="px-5 py-4 text-slate-500">{item.version}</td>
                    <td className="px-5 py-4">
                      <Badge tone={item.status === 'Active' ? 'teal' : 'neutral'}>{item.status}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" className="h-9 px-3" onClick={() => handleOpenEditRateModal(item)} aria-label={`Edit ${item.name}`}><Edit3 size={15} /> Edit</Button>
                        <Button variant="secondary" className="h-9 px-3" onClick={() => handleToggleArchiveRate(item.id)} aria-label={`Archive ${item.name}`}>
                          <Archive size={15} /> {item.status === 'Active' ? 'Archive' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <CardBody className="grid gap-3 lg:hidden">
            {rateItems.map((item) => (
              <article key={item.id} className={`rounded-lg border border-slate-200 p-4 ${item.status === 'Archived' ? 'opacity-60 bg-slate-50/55' : ''}`}>
                <div className="flex justify-between items-start gap-2">
                  <Badge tone="neutral">{item.category}</Badge>
                  <Badge tone={item.status === 'Active' ? 'teal' : 'neutral'}>{item.status}</Badge>
                </div>
                <h3 className="mt-3 font-bold text-ink">{item.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{money.format(item.unitPrice)} per {item.unit} • v{item.version}</p>
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={() => handleOpenEditRateModal(item)}><Edit3 size={15} /> Edit</Button>
                  <Button variant="secondary" className="flex-1" onClick={() => handleToggleArchiveRate(item.id)}>
                    <Archive size={15} /> {item.status === 'Active' ? 'Archive' : 'Activate'}
                  </Button>
                </div>
              </article>
            ))}
          </CardBody>
        </Card>
      )}

      {/* User Management Tab */}
      {activeTab === 'Users' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold text-ink">User Directory</h3>
          </CardHeader>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Full Name</th>
                  <th className="px-5 py-3">Email Address</th>
                  <th className="px-5 py-3">Access Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((item) => (
                  <tr key={item.id} className={item.status === 'Suspended' ? 'opacity-60 bg-slate-50/55' : ''}>
                    <td className="px-5 py-4 font-bold text-ink">{item.name}</td>
                    <td className="px-5 py-4 text-slate-600">{item.email}</td>
                    <td className="px-5 py-4">
                      <Badge tone={item.role === 'admin' ? 'gold' : item.role === 'adManager' ? 'navy' : 'teal'}>
                        {item.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={item.status === 'Active' ? 'teal' : 'danger'}>{item.status}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" className="h-9 px-3" onClick={() => handleOpenEditUserModal(item)}><Edit3 size={15} /> Edit</Button>
                        <Button variant="secondary" className="h-9 px-3" onClick={() => handleToggleSuspendUser(item.id)}>
                          {item.status === 'Active' ? 'Suspend' : 'Activate'}
                        </Button>
                        <Button variant="danger" className="h-9 px-3" onClick={() => handleDeleteUser(item.id)}><Trash2 size={15} /> Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <CardBody className="grid gap-3 lg:hidden">
            {users.map((item) => (
              <article key={item.id} className={`rounded-lg border border-slate-200 p-4 ${item.status === 'Suspended' ? 'opacity-60 bg-slate-50/55' : ''}`}>
                <div className="flex justify-between items-start gap-2">
                  <Badge tone={item.role === 'admin' ? 'gold' : item.role === 'adManager' ? 'navy' : 'teal'}>{item.role}</Badge>
                  <Badge tone={item.status === 'Active' ? 'teal' : 'danger'}>{item.status}</Badge>
                </div>
                <h3 className="mt-3 font-bold text-ink">{item.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{item.email}</p>
                <div className="mt-4 flex gap-2 flex-wrap">
                  <Button variant="secondary" className="flex-1 min-w-[80px]" onClick={() => handleOpenEditUserModal(item)}><Edit3 size={15} /> Edit</Button>
                  <Button variant="secondary" className="flex-1 min-w-[80px]" onClick={() => handleToggleSuspendUser(item.id)}>
                    {item.status === 'Active' ? 'Suspend' : 'Activate'}
                  </Button>
                  <Button variant="danger" className="flex-1 min-w-[80px]" onClick={() => handleDeleteUser(item.id)}><Trash2 size={15} /> Delete</Button>
                </div>
              </article>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Rate Card Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <h3 className="text-lg font-bold text-ink">
                {editingRateItem ? 'Edit Rate Item' : 'Add Rate Item'}
              </h3>
              <button
                type="button"
                onClick={() => setShowRateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRate} className="mt-4 flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto pr-1.5 space-y-3.5 pb-2 min-h-0">
                <InputField
                  required
                  label="Product Name"
                  value={rateName}
                  onChange={(e) => setRateName(e.target.value)}
                />
                <SelectField
                  label="Category"
                  value={rateCategory}
                  onChange={(e) => setRateCategory(e.target.value as ProductCategory)}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </SelectField>
                <InputField
                  required
                  label="Unit (e.g. post, hour, day)"
                  value={rateUnit}
                  onChange={(e) => setRateUnit(e.target.value)}
                />
                <InputField
                  required
                  type="number"
                  label="Unit Price (KES)"
                  value={rateUnitPrice}
                  onChange={(e) => setRateUnitPrice(Math.max(0, parseInt(e.target.value) || 0))}
                />
                <InputField
                  required
                  label="Version"
                  value={rateVersion}
                  onChange={(e) => setRateVersion(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-3.5 shrink-0 mt-2">
                <Button type="button" variant="secondary" onClick={() => setShowRateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRateItem ? 'Save Changes' : 'Add Item'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <h3 className="text-lg font-bold text-ink">
                {editingUserItem ? 'Edit User details' : 'Register New User'}
              </h3>
              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="mt-4 flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto pr-1.5 space-y-3.5 pb-2 min-h-0">
                <InputField
                  required
                  label="Full Name"
                  placeholder="e.g. Grace Mwangi"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
                <InputField
                  required
                  type="email"
                  label="Email Address"
                  placeholder="e.g. grace@kbc.example"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                />
                <SelectField
                  label="Access Role"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as Role)}
                >
                  <option value="sales">Sales</option>
                  <option value="adManager">Advertising Manager</option>
                  <option value="digitalOps">Digital Operations</option>
                  <option value="admin">Admin</option>
                </SelectField>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-3.5 shrink-0 mt-2">
                <Button type="button" variant="secondary" onClick={() => setShowUserModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingUserItem ? 'Save Changes' : 'Register User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
