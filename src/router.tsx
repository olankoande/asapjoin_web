import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import SearchPage from '@/pages/SearchPage';
import TripDetailPage from '@/pages/TripDetailPage';
import CreateTripPage from '@/pages/CreateTripPage';
import BookingDetailPage from '@/pages/BookingDetailPage';
import AccountPage from '@/pages/AccountPage';
import DashboardPage from '@/pages/DashboardPage';
import DeliveriesPage from '@/pages/DeliveriesPage';
import WalletPage from '@/pages/WalletPage';
import MessagesPage from '@/pages/MessagesPage';
import SendParcelPage from '@/pages/SendParcelPage';
import OfflinePage from '@/pages/OfflinePage';
import VehiclesPage from '@/pages/VehiclesPage';
import DriverTripsPage from '@/pages/DriverTripsPage';
import MyDisputesPage from '@/pages/MyDisputesPage';
import DisputeDetailPage from '@/pages/DisputeDetailPage';
import ContractAcceptancePage from '@/pages/ContractAcceptancePage';

export const router = createBrowserRouter([
  // Auth pages (no shell)
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/offline', element: <OfflinePage /> },

  // App shell pages
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/search" replace /> },
      { path: '/search', element: <SearchPage /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/trips/:id', element: <TripDetailPage /> },
      { path: '/driver/trips/new', element: <CreateTripPage /> },
      { path: '/driver/trips', element: <DriverTripsPage /> },
      { path: '/booking/:id', element: <BookingDetailPage /> },
      { path: '/trips/:tripId/send-parcel', element: <SendParcelPage /> },
      { path: '/deliveries', element: <DeliveriesPage /> },
      { path: '/messages', element: <MessagesPage /> },
      { path: '/wallet', element: <WalletPage /> },
      { path: '/account', element: <AccountPage /> },
      { path: '/contract/accept', element: <ContractAcceptancePage /> },
      { path: '/vehicles', element: <VehiclesPage /> },
      { path: '/history', element: <DashboardPage /> },
      { path: '/my-disputes', element: <MyDisputesPage /> },
      { path: '/disputes/:id', element: <DisputeDetailPage /> },
    ],
  },

  // Catch-all
  { path: '*', element: <Navigate to="/search" replace /> },
]);
