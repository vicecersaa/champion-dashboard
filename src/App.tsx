import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import type { PageKey } from './components/layout/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { OrdersPage } from './pages/OrdersPage';
import { BannersPage } from './pages/BannersPage';
import { CouponsPage } from './pages/CouponsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { SettingsPage } from './pages/SettingsPage';
import { GaransiPage } from './pages/GaransiPage';
import { Homepage } from './pages/Homepage';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [page, setPage] = useState<PageKey>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-8 w-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage />;
      case 'homepage': return <Homepage />;
      case 'products': return <ProductsPage />;
      case 'orders': return <OrdersPage />;
      case 'banners': return <BannersPage />;
      case 'coupons': return <CouponsPage />;
      case 'categories': return <CategoriesPage />;
      case 'settings': return <SettingsPage />;
      case 'garansi': return <GaransiPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <Layout current={page} onNavigate={setPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
