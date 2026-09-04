import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DashboardGridIcon,
  AssessmentIcon,
  SymptomsIcon,
  ReportsFileIcon,
  UserIcon,
} from '../assets/MedicalIcons';
import './MobileBottomNav.css';

export type MobileNavKey = 'dashboard' | 'risk-assessment' | 'symptoms' | 'reports' | 'profile';

interface MobileBottomNavProps {
  activeItem: string;
  onNavigate: (route: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeItem,
  onNavigate,
}) => {
  const { t } = useTranslation();

  const navItems = [
    { key: 'dashboard', label: t('nav.home', 'Home'), icon: <DashboardGridIcon size={20} /> },
    { key: 'risk-assessment', label: t('common.assessment', 'Assessment'), icon: <AssessmentIcon size={20} /> },
    { key: 'symptoms', label: t('common.symptomsShort', 'Symptoms'), icon: <SymptomsIcon size={20} /> },
    { key: 'reports', label: t('common.reports', 'Reports'), icon: <ReportsFileIcon size={20} /> },
    { key: 'profile', label: t('common.profile', 'Profile'), icon: <UserIcon size={20} /> },
  ];

  const getIsActive = (key: string) => {
    if (key === 'dashboard' && activeItem === 'dashboard') return true;
    if (key === 'risk-assessment' && activeItem.startsWith('assessment-') && activeItem !== 'assessment-report') return true;
    if (key === 'risk-assessment' && activeItem === 'risk-assessment') return true;
    if (key === 'symptoms' && activeItem === 'symptoms') return true;
    if (key === 'reports' && (activeItem === 'reports' || activeItem === 'assessment-report' || activeItem === 'assessment-results')) return true;
    if (key === 'profile' && activeItem === 'profile') return true;
    return activeItem === key;
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation Bar">
      {navItems.map((item) => {
        const isActive = getIsActive(item.key);
        return (
          <button
            key={item.key}
            type="button"
            className={`mobile-nav-btn ${isActive ? 'is-active' : ''}`}
            onClick={() => onNavigate(item.key)}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
