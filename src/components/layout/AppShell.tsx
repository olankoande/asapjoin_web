import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import { useAuth } from '@/lib/auth-context';

export default function AppShell() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    const requiresAcceptance = Boolean(user?.contract_acceptance_required);
    const onContractPage = location.pathname === '/contract/accept';

    if (requiresAcceptance && !onContractPage) {
      navigate('/contract/accept', { replace: true });
      return;
    }

    if (!requiresAcceptance && onContractPage) {
      navigate('/search', { replace: true });
    }
  }, [loading, user?.contract_acceptance_required, location.pathname, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background bg-mesh">
      <TopBar />
      <main className="flex-1 pb-20 md:pb-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
