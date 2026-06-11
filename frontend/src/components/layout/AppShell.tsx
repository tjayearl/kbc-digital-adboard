import clsx from 'clsx';
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  ShieldAlert,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { roles, usersList, type Role, type UserItem } from '../../data/mockData';

type AppShellProps = {
  role: Role;
  currentUserId: string;
  onUserChange: (userId: string) => void;
  users: UserItem[];
  setUsers: React.Dispatch<React.SetStateAction<UserItem[]>>;
};

const navItems = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, roles: ['Sales', 'Advertising Manager', 'Digital Operations', 'Admin'] },
  { label: 'Campaigns', to: '/campaigns', icon: BriefcaseBusiness, roles: ['Sales', 'Advertising Manager', 'Digital Operations', 'Admin'] },
  { label: 'Order Sheets', to: '/orders', icon: FileText, roles: ['Sales', 'Advertising Manager', 'Admin'] },
  { label: 'Approvals', to: '/approvals', icon: CheckCircle2, roles: ['Advertising Manager', 'Admin'] },
  { label: 'Digital Ops', to: '/operations', icon: ClipboardList, roles: ['Digital Operations', 'Admin'] },
  { label: 'Reports', to: '/reports', icon: BarChart3, roles: ['Sales', 'Advertising Manager', 'Digital Operations', 'Admin'] },
  { label: 'Management', to: '/management', icon: Users, roles: ['Admin'] },
  { label: 'Settings', to: '/settings', icon: Settings, roles: ['Sales', 'Advertising Manager', 'Digital Operations', 'Admin'] },
];

function Sidebar({ open, onClose, role }: { open: boolean; onClose: () => void; role: Role }) {
  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));
  return (
    <>
      <div className={clsx('fixed inset-0 z-30 bg-slate-950/30 lg:hidden', open ? 'block' : 'hidden')} onClick={onClose} />
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-navy text-white transition-transform lg:static lg:z-auto lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex min-h-20 items-center justify-between border-b border-white/10 px-5">
          <div className="flex flex-col justify-center">
            <img src="/logo.png" alt="KBC Logo" className="h-8 w-auto self-start mb-1" />
            <p className="text-lg font-bold">Digital AdBoard</p>
          </div>
          <button className="rounded-lg p-2 hover:bg-white/10 lg:hidden" onClick={onClose} aria-label="Close navigation">
            <X size={22} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-5">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition',
                  isActive ? 'bg-white text-navy' : 'text-white/82 hover:bg-white/10 hover:text-white',
                )
              }
            >
              <item.icon size={20} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

export function AppShell({ role, currentUserId, onUserChange, users, setUsers }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));
  const mobileItems = filteredNavItems.slice(0, 5);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} role={role} />
      <div className="min-w-0 flex-1 pb-20 lg:pb-0">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-20 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open navigation">
              <Menu size={24} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">Phase 1</p>
              <h1 className="truncate text-xl font-bold text-ink sm:text-2xl">Digital advertising orders</h1>
            </div>
            <button className="hidden h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 sm:flex" aria-label="Notifications">
              <Bell size={20} />
            </button>
            <label className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 sm:flex">
              <ShieldCheck size={18} className="text-navy" aria-hidden="true" />
              <span className="sr-only">Mock user</span>
              <select
                className="bg-transparent text-sm font-semibold text-slate-700 outline-none max-w-[200px]"
                value={currentUserId}
                onChange={(event) => onUserChange(event.target.value)}
              >
                {users.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.role}){item.status === 'Suspended' ? ' [Suspended]' : ''}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to sign out?")) {
                  signOut(auth);
                }
              }}
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-red-600 transition"
            >
              Sign out
            </button>
            <UserCircle className="text-slate-500" size={30} aria-hidden="true" />
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          {currentUser.status === 'Suspended' ? (
            <div className="flex h-[60vh] flex-col items-center justify-center text-center p-6 bg-white rounded-lg border border-slate-200 shadow-soft">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger mb-4">
                <ShieldAlert size={28} />
              </div>
              <h3 className="text-xl font-bold text-ink">Account Suspended</h3>
              <p className="mt-2 text-sm text-slate-500 max-w-sm leading-relaxed">
                Your account ({currentUser.name}) has been suspended by the administrator. Please contact your manager or Admin to restore access.
              </p>
            </div>
          ) : (
            <Outlet context={{ role, currentUser, users, setUsers }} />
          )}
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-slate-200 bg-white lg:hidden">
        {mobileItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              clsx('flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold', isActive ? 'text-navy' : 'text-slate-500')
            }
          >
            <item.icon size={21} aria-hidden="true" />
            {item.label === 'Order Sheets' ? 'Orders' : item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
