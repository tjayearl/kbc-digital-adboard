import { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';
import { AppShell } from './components/layout/AppShell';
import { type Role, type UserItem, usersList } from './data/mockData';
import { ApprovalsPage } from './pages/approvals/ApprovalsPage';
import { CampaignDetails } from './pages/campaigns/CampaignDetails';
import { CampaignsPage } from './pages/campaigns/CampaignsPage';
import { CampaignWizard } from './pages/campaigns/CampaignWizard';
import { Dashboard } from './pages/dashboard/Dashboard';
import { ManagementPage } from './pages/management/ManagementPage';
import { OperationsPage } from './pages/operations/OperationsPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import Login from "./pages/auth/Login";

export default function App() {
  const [users, setUsers] = useState<UserItem[]>(usersList);
  const [currentUserId, setCurrentUserId] = useState<string>('usr-1');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];
  const role = currentUser.role;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const checkUser = async () => {
          const matchingUser = usersList.find(
            (u) => u.email.toLowerCase() === firebaseUser.email?.toLowerCase()
          );
          
          if (matchingUser) {
            setCurrentUserId(matchingUser.id);
          } else {
            const tokenResult = await firebaseUser.getIdTokenResult();
            const roleClaim = tokenResult.claims.role as Role | undefined;
            if (roleClaim) {
              const tempUser: UserItem = {
                id: `usr-fb-${firebaseUser.uid}`,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Authenticated User',
                email: firebaseUser.email || '',
                role: roleClaim,
                status: 'Active'
              };
              setUsers(prev => {
                if (prev.some(u => u.email.toLowerCase() === tempUser.email.toLowerCase())) {
                  return prev;
                }
                return [...prev, tempUser];
              });
              setCurrentUserId(tempUser.id);
            }
          }
          setLoading(false);
        };
        checkUser();
      } else {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const router = createBrowserRouter([
    {
      path: '/',
      element: (
        <AppShell
          role={role}
          currentUserId={currentUserId}
          users={users}
          setUsers={setUsers}
        />
      ),
      children: [
        { index: true, element: <Dashboard role={role} /> },
        { path: 'campaigns', element: <CampaignsPage /> },
        { path: 'campaigns/new', element: <CampaignWizard /> },
        { path: 'campaigns/:campaignId', element: <CampaignDetails /> },
        { path: 'campaigns/:campaignId/edit', element: <CampaignWizard /> },
        { path: 'orders', element: <OrdersPage /> },
        { path: 'approvals', element: <ApprovalsPage /> },
        { path: 'operations', element: <OperationsPage /> },
        { path: 'reports', element: <ReportsPage /> },
        { path: 'management', element: <ManagementPage /> },
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
