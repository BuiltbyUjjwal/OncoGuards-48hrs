import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrandLogo } from './BrandLogo';
import {
  DashboardGridIcon,
  AssessmentIcon,
  SymptomsIcon,
  ReportsFileIcon,
  AlertsBellIcon,
  UserIcon,
  SettingsGearIcon,
  LogOutIcon,
} from '../assets/MedicalIcons';
import './Sidebar.css';

export type SidebarItemKey =
  | 'dashboard'
  | 'health-profile'
  | 'risk-assessment'
  | 'symptoms'
  | 'ai-assistant'
  | 'reports'
  | 'alerts'
  | 'profile'
  | 'settings';

interface SidebarProps {
  activeItem: SidebarItemKey | string;
  onNavigate: (item: SidebarItemKey) => void;
  onLogout: () => void;
  unreadAlertsCount?: number;
}

interface MenuItem {
  key: SidebarItemKey;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeItem,
  onNavigate,
  onLogout,
  unreadAlertsCount = 0,
}) => {
  const { t } = useTranslation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile drawer on route change or resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems: MenuItem[] = [
    { key: 'dashboard', label: t('nav.dashboard', 'Dashboard'), icon: <DashboardGridIcon size={20} /> },
    { key: 'health-profile', label: t('nav.healthProfile', 'Assessment'), icon: <AssessmentIcon size={20} /> },
    { key: 'symptoms', label: t('nav.symptoms', 'Symptoms Tracker'), icon: <SymptomsIcon size={20} /> },
    { key: 'reports', label: t('nav.reports', 'Reports'), icon: <ReportsFileIcon size={20} /> },
    {
      key: 'alerts',
      label: t('nav.alerts', 'Alerts'),
      icon: <AlertsBellIcon size={20} />,
      badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined,
    },
    { key: 'profile', label: t('nav.profile', 'Profile'), icon: <UserIcon size={20} /> },
    { key: 'settings', label: t('nav.settings', 'Settings'), icon: <SettingsGearIcon size={20} /> },
  ];

  const handleItemClick = (key: SidebarItemKey) => {
    setIsMobileOpen(false);
    onNavigate(key);
  };

  const handleLogoutClick = () => {
    setIsMobileOpen(false);
    onLogout();
  };

  return (
    <>
      {/* Mobile Top Header Bar (< 768px) */}
      <div className="mobile-app-header">
        <BrandLogo size="normal" showTagline={false} />
        <button
          type="button"
          className="mobile-hamburger-btn"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          aria-label={isMobileOpen ? 'Close Menu' : 'Open Menu'}
          aria-expanded={isMobileOpen}
        >
          <span className={`hamburger-bar ${isMobileOpen ? 'open-1' : ''}`} />
          <span className={`hamburger-bar ${isMobileOpen ? 'open-2' : ''}`} />
          <span className={`hamburger-bar ${isMobileOpen ? 'open-3' : ''}`} />
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="mobile-sidebar-backdrop"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar (Desktop + Mobile Slideout Drawer) */}
      <aside
        className={`app-sidebar ${isMobileOpen ? 'mobile-drawer-open' : ''}`}
        aria-label="Main Navigation"
      >
        {/* Top Logo Section */}
        <div className="sidebar-header">
          <BrandLogo size="normal" showTagline={false} />
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <div className="sidebar-menu-list">
            {menuItems.map((item) => {
              const isActive =
                activeItem === item.key ||
                (item.key === 'health-profile' && (activeItem === 'risk-assessment' || (typeof activeItem === 'string' && activeItem.startsWith('assessment-step'))));
              const isAlertsItem = item.key === 'alerts';
              const hasActiveAlerts = isAlertsItem && unreadAlertsCount > 0;

              return (
                <button
                  key={item.key}
                  type="button"
                  className={`sidebar-menu-btn ${isActive ? 'active' : ''} ${hasActiveAlerts ? 'alerts-has-active' : ''}`}
                  onClick={() => handleItemClick(item.key)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="sidebar-btn-icon" aria-hidden="true">
                    {isAlertsItem && hasActiveAlerts ? (
                      <AlertsBellIcon size={20} color="#DC2626" />
                    ) : (
                      item.icon
                    )}
                  </span>
                  <span className="sidebar-btn-label">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`sidebar-badge ${isAlertsItem ? 'badge-red-alert' : ''}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Need Help? AI Assistant Card */}
          <div className="sidebar-need-help-card">
            <h4 className="need-help-title">{t('nav.needHelp', 'Need Help?')}</h4>
            <p className="need-help-desc">
              {t('nav.needHelpDesc', 'Our AI Assistant is available 24/7 to answer your health questions.')}
            </p>
            <button
              type="button"
              className="btn-open-assistant"
              onClick={() => {
                setIsMobileOpen(false);
                onNavigate('ai-assistant');
              }}
            >
              <span>{t('nav.openAssistant', 'Open Assistant')}</span>
              <span className="btn-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </nav>

        {/* Bottom Logout */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogoutClick}
            aria-label="Logout of OncoGuards"
          >
            <span className="sidebar-btn-icon" aria-hidden="true">
              <LogOutIcon size={18} />
            </span>
            <span className="sidebar-btn-label">{t('nav.logout', 'Logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
