import { useState } from 'react';
import { LoginForm } from './components/auth/LoginForm';
import { Dashboard } from './components/dashboard/Dashboard';
import { WorkOrderDetail } from './components/workorders/WorkOrderDetail';
import { CompleteWorkOrderForm } from './components/workorders/CompleteWorkOrderForm';
import { ProfileSettings } from './components/profile/ProfileSettings';
import { LeaveManagement } from './components/leave/LeaveManagement';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { useAuth } from './hooks/useAuth';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';

type AppView = 'dashboard' | 'work-orders' | 'leave' | 'profile';
type WorkOrderView = 'list' | 'detail' | 'complete';

function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<AppView>('dashboard');
  
  // Debug logging
  console.log('App component - user:', user, 'loading:', loading);
  const [workOrderView, setWorkOrderView] = useState<WorkOrderView>('list');
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string>('');
  const [selectedWorkOrderTitle, setSelectedWorkOrderTitle] = useState<string>('');

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

  // Show loading state only during initial load
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

  // If not loading and no user, show login form
  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">CMMS Login</h1>
            <LoginForm />
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;