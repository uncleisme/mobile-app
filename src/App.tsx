import { useState } from 'react';
import { LoginForm } from './components/auth/LoginForm';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Dashboard } from './components/dashboard/Dashboard';
import { WorkOrderDetail } from './components/workorders/WorkOrderDetail';
import { CompleteWorkOrderForm } from './components/workorders/CompleteWorkOrderForm';
import { ProfileSettings } from './components/profile/ProfileSettings';
import { LeaveManagement } from './components/leave/LeaveManagement';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';

type AppView = 'dashboard' | 'work-orders' | 'leave' | 'profile';
type WorkOrderView = 'list' | 'detail' | 'complete';

// Main App Content Component (wrapped by AuthProvider)
function AppContent() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<AppView>('dashboard');
  const [workOrderView, setWorkOrderView] = useState<WorkOrderView>('list');
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string>('');
  const [selectedWorkOrderTitle, setSelectedWorkOrderTitle] = useState<string>('');

  // Debug logging
  console.log('App component - user:', user, 'loading:', loading, 'isAuthenticated:', isAuthenticated);

  const handleWorkOrderClick = (workOrderId: string) => {
    setSelectedWorkOrderId(workOrderId);
    setWorkOrderView('detail');
  };

  const handleCompleteWorkOrder = (workOrderId: string, title: string) => {
    setSelectedWorkOrderId(workOrderId);
    setSelectedWorkOrderTitle(title);
    setWorkOrderView('complete');
  };

  const handleWorkOrderCompleted = () => {
    setWorkOrderView('list');
    setSelectedWorkOrderId('');
    setSelectedWorkOrderTitle('');
    setActiveTab('dashboard');
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
    if (activeTab === 'work-orders' || (activeTab === 'dashboard' && workOrderView !== 'list')) {
      switch (workOrderView) {
        case 'detail':
          return (
            <WorkOrderDetail
              workOrderId={selectedWorkOrderId}
              onBack={handleBackToList}
              onCompleteWorkOrder={(id) => {
                const workOrder = { id, title: selectedWorkOrderTitle };
                handleCompleteWorkOrder(id, workOrder.title);
              }}
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
          return <Dashboard onWorkOrderClick={handleWorkOrderClick} />;
      }
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onWorkOrderClick={handleWorkOrderClick} />;
      case 'leave':
        return <LeaveManagement />;
      case 'profile':
        return <ProfileSettings />;
      default:
        return <Dashboard onWorkOrderClick={handleWorkOrderClick} />;
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
      <div className="min-h-screen bg-gray-50">
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