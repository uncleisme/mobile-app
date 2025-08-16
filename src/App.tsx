import { useState, useEffect } from 'react';
import { LoginForm } from './components/auth/LoginForm';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Dashboard } from './components/dashboard/Dashboard';
import { WorkOrderDetail } from './components/workorders/WorkOrderDetail';
import { CompleteWorkOrderForm } from './components/workorders/CompleteWorkOrderForm';
import { WorkOrdersList } from './components/workorders/WorkOrdersList';
import { ProfileSettings } from './components/profile/ProfileSettings';
import { SettingsPage } from './components/settings/Settings';
import { LeaveManagement } from './components/leave/LeaveManagement';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PushService } from './services/PushService';
import { FIREBASE_WEB_CONFIG } from './config/firebase';

type AppView = 'dashboard' | 'work-orders' | 'leave' | 'profile' | 'settings';
type WorkOrderView = 'list' | 'detail' | 'complete';

// Main App Content Component (wrapped by AuthProvider)
function AppContent() {
  const { loading, user } = useAuth();
  const [activeTab, setActiveTab] = useState<AppView>('dashboard');
  const [workOrderView, setWorkOrderView] = useState<WorkOrderView>('list');
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string>('');
  const [selectedWorkOrderTitle, setSelectedWorkOrderTitle] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [pushRegistered, setPushRegistered] = useState(false);
  const [toast, setToast] = useState<{ title: string; body?: string } | null>(null);

  // Initialize theme (dark/light) on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = saved ? saved === 'dark' : prefersDark;
      document.documentElement.classList.toggle('dark', isDark);
    } catch {}
  }, []);

  // Register Web Push after authentication
  useEffect(() => {
    const canUsePush = () =>
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      (window.isSecureContext || window.location.hostname === 'localhost');

    (async () => {
      try {
        if (!user || loading || pushRegistered) return;
        if (!canUsePush()) return;
        // Guard against placeholder config
        if (!FIREBASE_WEB_CONFIG.apiKey || FIREBASE_WEB_CONFIG.apiKey === 'YOUR_API_KEY') return;
        await PushService.registerForPush(FIREBASE_WEB_CONFIG, user.id);
        setPushRegistered(true);
      } catch (e) {
        console.warn('Push registration failed:', e);
      }
    })();
  }, [user, loading, pushRegistered]);

  // Foreground FCM toast listener
  useEffect(() => {
    const unsubscribe = PushService.addForegroundListener((payload: any) => {
      const title = payload?.notification?.title || payload?.data?.title || 'Notification';
      const body = payload?.notification?.body || payload?.data?.body || '';
      setToast({ title, body });
      // auto-hide after 4s
      setTimeout(() => setToast(null), 4000);
    });
    return unsubscribe;
  }, []);

  const handleWorkOrderClick = (workOrderId: string) => {
    setSelectedWorkOrderId(workOrderId);
    setWorkOrderView('detail');
  };

  const handleWorkOrderCompleted = () => {
    setWorkOrderView('list');
    setSelectedWorkOrderId('');
    setSelectedWorkOrderTitle('');
    setActiveTab('dashboard');
    setRefreshKey((k) => k + 1);
  };

  const handleStartComplete = (workOrderId: string, title?: string) => {
    setSelectedWorkOrderId(workOrderId);
    setSelectedWorkOrderTitle(title || '');
    setWorkOrderView('complete');
  };

  const handleBackToList = () => {
    setWorkOrderView('list');
    setSelectedWorkOrderId('');
    setSelectedWorkOrderTitle('');
  };

  const handleLoginSuccess = () => {
    // Reset any navigation state on successful login
    setActiveTab('dashboard');
    setWorkOrderView('list');
    setSelectedWorkOrderId('');
    setSelectedWorkOrderTitle('');
  };

  const renderMainContent = () => {
    // Distinct Work Orders list page
    if (activeTab === 'work-orders' && workOrderView === 'list') {
      return <WorkOrdersList onWorkOrderClick={handleWorkOrderClick} refreshKey={refreshKey} />;
    }

    if (activeTab === 'work-orders' || (activeTab === 'dashboard' && workOrderView !== 'list')) {
      switch (workOrderView) {
        case 'detail':
          return (
            <WorkOrderDetail
              workOrderId={selectedWorkOrderId}
              onBack={handleBackToList}
              onCompleteClick={handleStartComplete}
            />
          );
        case 'complete':
          return (
            <CompleteWorkOrderForm
              workOrderId={selectedWorkOrderId}
              workOrderTitle={selectedWorkOrderTitle}
              onBack={() => setWorkOrderView('detail')}
              onComplete={handleWorkOrderCompleted}
            />
          );
        default:
          return <Dashboard onWorkOrderClick={handleWorkOrderClick} refreshKey={refreshKey} />;
      }
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onWorkOrderClick={handleWorkOrderClick} refreshKey={refreshKey} />;
      case 'leave':
        return <LeaveManagement />;
      case 'profile':
        return <ProfileSettings onOpenSettings={() => setActiveTab('settings')} />;
      case 'settings':
        return <SettingsPage onBack={() => setActiveTab('profile')} />;
      default:
        return <Dashboard onWorkOrderClick={handleWorkOrderClick} refreshKey={refreshKey} />;
    }
  };

  const shouldShowBottomNav = workOrderView === 'list';

  // Show loading state during authentication check
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <LoadingSpinner size="md" />
          </div>
          <p className="text-gray-600">Loading CMMS...</p>
        </div>
      </div>
    );
  }

  // Show login form for unauthenticated users
  return (
    <ProtectedRoute
      fallback={<LoginForm onLoginSuccess={handleLoginSuccess} />}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
        {renderMainContent()}
        
        {shouldShowBottomNav && (
          <BottomNavigation
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab as AppView);
              setWorkOrderView('list');
            }}
          />
        )}

        {/* Minimal toast for foreground FCM messages */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] sm:w-auto">
            <div className="rounded-lg shadow-lg px-4 py-3 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
              <div className="font-medium">{toast.title}</div>
              {toast.body && <div className="text-sm opacity-80 mt-1">{toast.body}</div>}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

// Main App component that wraps everything with AuthProvider
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;