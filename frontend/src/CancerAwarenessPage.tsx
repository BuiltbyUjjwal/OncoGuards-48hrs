import React from 'react';
import { Sidebar, SidebarItemKey } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { HealthAwareness } from './components/HealthAwareness';

interface CancerAwarenessPageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

export const CancerAwarenessPage: React.FC<CancerAwarenessPageProps> = ({
  onNavigate,
  onLogout,
}) => {
  const handleSidebarNavigate = (itemKey: SidebarItemKey) => {
    onNavigate(itemKey);
  };

  return (
    <div className="dashboard-layout-root" style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeItem="dashboard"
        onNavigate={handleSidebarNavigate}
        onLogout={onLogout}
        unreadAlertsCount={0}
      />

      {/* Main Awareness Content Area */}
      <main className="dashboard-main-area" style={{ padding: '0', background: '#FFFFFF' }}>
        <HealthAwareness onNavigateToDashboard={() => onNavigate('dashboard')} />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav activeItem="dashboard" onNavigate={onNavigate} />
    </div>
  );
};

export default CancerAwarenessPage;
