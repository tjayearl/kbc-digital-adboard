import { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';
import { AppShell } from './components/layout/AppShell';
import { type Role } from './data/mockData';
import { ApprovalsPage } from './pages/approvals/ApprovalsPage';
import { CampaignDetails } from './pages/campaigns/CampaignDetails';
import { CampaignsPage } from './pages/campaigns/CampaignsPage';
import { CampaignWizard } from './pages/campaigns/CampaignWizard';
import { Dashboard } from './pages/dashboard/Dashboard';
import { ManagementPage } from './pages/management/ManagementPage';
import { OperationsPage } from './pages/operations/OperationsPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import Login from "./pages/auth/Login";

export default function App() {
  const [role, setRole] = useState<Role>('sales');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      // Read role from localStorage when user is authenticated
      if (currentUser) {
        const savedRole = localStorage.getItem('role') as Role | null;
        if (savedRole && ['sales', 'adManager', 'digitalOps', 'finance', 'admin'].includes(savedRole)) {
          setRole(savedRole);
        } else {
          setRole('sales');
        }
      }
      
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const router = createBrowserRouter([
    {
      path: '/',
      element: <AppShell role={role} onRoleChange={setRole} />,
      children: [
        { index: true, element: <Dashboard role={role} /> },
        { path: 'campaigns', element: <CampaignsPage /> },
        { path: 'campaigns/new', element: <CampaignWizard /> },
        { path: 'campaigns/:campaignId', element: <CampaignDetails /> },
        { path: 'orders', element: <OrdersPage /> },
        { path: 'approvals', element: <ApprovalsPage /> },
        { path: 'operations', element: <OperationsPage /> },
        { path: 'reports', element: <ReportsPage /> },
        { path: 'management', element: <ManagementPage /> },
        { path: 'settings', element: <SettingsPage role={role} /> },
        { path: 'login', element: <Login /> }
      ],
    },
  ]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-canvas">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <RouterProvider router={router} />;
}
