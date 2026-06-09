import { useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
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

export default function App() {
  const [role, setRole] = useState<Role>('Sales');

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
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}
