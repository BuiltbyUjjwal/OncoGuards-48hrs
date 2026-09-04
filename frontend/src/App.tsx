import React, { useState, useEffect } from 'react';
import { AssessmentProvider, useAssessment } from './context/AssessmentContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { LoginPage } from './LoginPage';
import { SignUpPage } from './SignUpPage';
import { DashboardPage } from './DashboardPage';
import { ProfilePage } from './ProfilePage';
import { RiskAssessmentIntroPage } from './RiskAssessmentIntroPage';
import { BasicInfoSectionPage } from './BasicInfoSectionPage';
import { LifestyleSectionPage } from './LifestyleSectionPage';
import { MedicalHistorySectionPage } from './MedicalHistorySectionPage';
import { WomenOnlySectionPage } from './WomenOnlySectionPage';
import { ScreeningHistorySectionPage } from './ScreeningHistorySectionPage';
import { SymptomsSectionPage } from './SymptomsSectionPage';
import { ReviewAnswersPage } from './ReviewAnswersPage';
import { SubmitAnalyzePage } from './SubmitAnalyzePage';
import { ResultsPage } from './ResultsPage';
import { DetailedReportPage } from './DetailedReportPage';
import { ReportsDashboardPage } from './ReportsDashboardPage';
import { ExplanationRecommendationsPage } from './ExplanationRecommendationsPage';
import { CancerAwarenessPage } from './CancerAwarenessPage';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { SettingsPage } from './SettingsPage';
import { AlertsPage } from './AlertsPage';
import { AIAssistantPage } from './AIAssistantPage';
import { DailySymptomHistoryPage } from './DailySymptomHistoryPage';
import { SpinnerIcon } from './assets/MedicalIcons';

type AppRoute =
  | 'login'
  | 'signup'
  | 'dashboard'
  | 'health-profile'
  | 'risk-assessment'
  | 'assessment-step1'
  | 'assessment-step2'
  | 'assessment-step3'
  | 'assessment-step4'
  | 'assessment-step-screening'
  | 'assessment-step5'
  | 'assessment-symptoms'
  | 'assessment-review'
  | 'health-profile-review'
  | 'assessment-analyzing'
  | 'assessment-results'
  | 'assessment-report'
  | 'assessment-explanation'
  | 'cancer-awareness'
  | 'health-awareness'
  | 'symptoms'
  | 'ai-assistant'
  | 'reports'
  | 'alerts'
  | 'profile'
  | 'settings'
  | 'forgot-password';

const AppContent: React.FC = () => {
  const getRouteFromHash = (): AppRoute => {
    const hash = window.location.hash.toLowerCase().replace('#', '');
    if (hash === 'signup') return 'signup';
    if (hash === 'dashboard') return 'dashboard';
    if (hash === 'health-profile' || hash === 'risk-assessment' || hash === 'assessment-intro') return 'health-profile';
    if (hash === 'assessment-step1') return 'assessment-step1';
    if (hash === 'assessment-step2') return 'assessment-step2';
    if (hash === 'assessment-step3') return 'assessment-step3';
    if (hash === 'assessment-step4') return 'assessment-step4';
    if (hash === 'assessment-step-screening') return 'assessment-step-screening';
    if (hash === 'assessment-symptoms' || hash === 'assessment-step5') return 'assessment-symptoms';
    if (hash === 'assessment-review' || hash === 'health-profile-review') return 'health-profile-review';
    if (hash === 'assessment-analyzing') return 'assessment-analyzing';
    if (hash === 'assessment-results') return 'assessment-results';
    if (hash === 'assessment-report') return 'assessment-report';
    if (hash === 'assessment-explanation') return 'assessment-explanation';
    if (hash === 'cancer-awareness' || hash === 'health-awareness' || hash === 'awareness') return 'cancer-awareness';
    if (hash === 'symptoms') return 'symptoms';
    if (hash === 'ai-assistant') return 'ai-assistant';
    if (hash === 'reports') return 'reports';
    if (hash === 'alerts') return 'alerts';
    if (hash === 'profile') return 'profile';
    if (hash === 'settings') return 'settings';
    if (hash === 'forgot-password') return 'forgot-password';
    return 'login';
  };

  const [currentRoute, setCurrentRoute] = useState<AppRoute>(getRouteFromHash());
  const { currentUser, logout, loading: authLoading } = useAuth();
  const { state: assessmentState, isHydrated } = useAssessment();
  const currentUserEmail = currentUser?.email || 'patient@oncoguards.ai';
  const hasSavedProfile = Boolean(
    assessmentState.hasCompletedProfile ||
    (assessmentState.basicInfo?.fullName?.trim() && assessmentState.basicInfo?.age && (assessmentState.basicInfo?.biologicalSex || assessmentState.basicInfo?.biological_sex))
  );

  // Protect routes that require authentication
  useEffect(() => {
    const publicRoutes = ['login', 'signup', 'forgot-password'];

    // 1. Wait for Firebase Auth initialization to resolve
    if (authLoading) return;

    // 2. If unauthenticated and on a protected route, route to login
    if (!currentUser && !publicRoutes.includes(currentRoute)) {
      navigateTo('login');
      return;
    }

    // 3. If authenticated and on login/signup, wait for assessment hydration before deciding destination
    if (currentUser && (currentRoute === 'login' || currentRoute === 'signup' || currentRoute === 'forgot-password')) {
      if (!isHydrated) return; // Wait until UID data is fully loaded from Firestore / storage

      const destination = assessmentState.hasCompletedAssessment || hasSavedProfile
        ? 'dashboard'
        : 'health-profile';
      navigateTo(destination);
    }
  }, [currentUser, authLoading, isHydrated, currentRoute, assessmentState.hasCompletedAssessment, assessmentState.hasCompletedProfile, hasSavedProfile]);

  // Synchronize route with hash changes (supports back/forward browser navigation)
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(getRouteFromHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // PWA Install Prompt Logic
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const navigateTo = (route: string) => {
    let normalized = route;
    if (route === 'risk-assessment') normalized = 'health-profile';
    if (route === 'assessment-step5' || route === 'assessment-symptoms') normalized = 'assessment-symptoms';
    if (route === 'assessment-review') normalized = 'health-profile-review';

    window.location.hash = normalized;
    setCurrentRoute(normalized as AppRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = () => {
    if (!isHydrated) {
      // If hydration is still in flight, navigate to dashboard by default and let the hydration effect refine
      navigateTo('dashboard');
      return;
    }
    const destination = assessmentState.hasCompletedAssessment || hasSavedProfile
      ? 'dashboard'
      : 'health-profile';
    navigateTo(destination);
  };

  const handleLogout = async () => {
    await logout();
    navigateTo('login');
  };

  if (currentUser && !isHydrated) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <SpinnerIcon size={32} />
      </div>
    );
  }

  return (
    <>
      {/* 1. Login Page */}
      {currentRoute === 'login' && (
        <LoginPage
          onNavigateToDashboard={handleLoginSuccess}
          onNavigateToSignUp={() => navigateTo('signup')}
          onNavigateToForgotPassword={() => navigateTo('forgot-password')}
        />
      )}

      {/* 2. Sign Up Page */}
      {currentRoute === 'signup' && (
        <SignUpPage
          onNavigateToSignIn={() => navigateTo('login')}
          onNavigateToDashboard={handleLoginSuccess}
        />
      )}

      {/* 3. Forgot Password Page */}
      {currentRoute === 'forgot-password' && (
        <ForgotPasswordPage
          onNavigateToLogin={() => navigateTo('login')}
        />
      )}

      {/* 4. Dashboard Main Hub */}
      {currentRoute === 'dashboard' && (
        <DashboardPage
          onNavigate={(route) => navigateTo(route)}
          onLogout={handleLogout}
          userEmail={currentUserEmail}
        />
      )}

      {/* 5. User Profile & Assessment History Page */}
      {currentRoute === 'profile' && (
        <ProfilePage
          onNavigate={(route) => navigateTo(route)}
          onLogout={handleLogout}
        />
      )}

      {/* 6. Health Profile Intro Overview */}
      {(currentRoute === 'health-profile' || currentRoute === 'risk-assessment') && (
        <RiskAssessmentIntroPage
          onNavigate={(route) => navigateTo(route)}
          onLogout={handleLogout}
        />
      )}

      {/* 7. Step 1: Basic Information */}
      {currentRoute === 'assessment-step1' && (
        <BasicInfoSectionPage
          onNavigate={(route) => navigateTo(route)}
          onLogout={handleLogout}
        />
      )}

      {/* 8. Step 2: Lifestyle */}
      {currentRoute === 'assessment-step2' && (
        <LifestyleSectionPage
          onNavigate={(route) => navigateTo(route)}
          onLogout={handleLogout}
        />
      )}

      {/* 9. Step 3: Medical & Family History */}
      {currentRoute === 'assessment-step3' && (
        <MedicalHistorySectionPage
          onNavigate={(route) => navigateTo(route)}
          onLogout={handleLogout}
        />
      )}

      {/* 10. Step 4 (Female only): Women's Health */}
      {currentRoute === 'assessment-step4' && (
        <WomenOnlySectionPage
          onNavigate={(route) => navigateTo(route)}
          onLogout={handleLogout}
        />
      )}

      {/* 11. Step 5 (Female) / Step 4 (Male): Screening History */}
      {currentRoute === 'assessment-step-screening' && (
        <ScreeningHistorySectionPage
          onNavigate={(route) => navigateTo(route)}
          onLogout={handleLogout}
        />
      )}

      {/* 12. Health Profile Review & Summary */}
      {(currentRoute === 'health-profile-review' || currentRoute === 'assessment-review') && (
        <ReviewAnswersPage
          onNavigate={(route) => navigateTo(route)}
          onLogout={handleLogout}
        />
      )}

      {/* 13. Current Symptoms Section (Assessment Flow Step) */}
      {(currentRoute === 'assessment-symptoms' || currentRoute === 'assessment-step5') && (
        <SymptomsSectionPage
          onNavigate={(route) => navigateTo(route)}
          onLogout={handleLogout}
        />
      )}

      {/* 13b. Daily Symptom History Page (Symptoms Tracker Sidebar & Timeline destination) */}
      {currentRoute === 'symptoms' && (
        <DailySymptomHistoryPage
          onNavigate={(route) => navigateTo(route)}
          onLogout={handleLogout}
        />
      )}

      {/* 14. Multi-Stage AI Analyzing / Submission Screen */}
      {currentRoute === 'assessment-analyzing' && (
        <SubmitAnalyzePage
          onAnalysisComplete={() => navigateTo('assessment-results')}
          onNavigate={(route) => navigateTo(route)}
        />
      )}

      {/* 15. Assessment Results Page (with Semi-Circular Risk Gauge) */}
      {currentRoute === 'assessment-results' && (
        <ResultsPage
          onNavigate={(route) => navigateTo(route)}
          onLogout={handleLogout}
        />
      )}

      {/* 16. Detailed Health Risk Assessment Report Page */}
      {currentRoute === 'assessment-report' && (
        <DetailedReportPage
          onNavigate={(route) => navigateTo(route)}
          onLogout={handleLogout}
        />
      )}

      {/* 17. Explanation & Recommendations Page */}
      {currentRoute === 'assessment-explanation' && (
        <ExplanationRecommendationsPage
          onNavigate={(route) => navigateTo(route)}
          onLogout={handleLogout}
        />
      )}

      {/* 18. Cancer Awareness & Health Guidelines Hub */}
      {(currentRoute === 'cancer-awareness' || currentRoute === 'health-awareness') && (
        <CancerAwarenessPage
          onNavigate={(route) => navigateTo(route)}
          onLogout={handleLogout}
        />
      )}

      {/* 19. Reports Hub */}
      {currentRoute === 'reports' && (
        <ReportsDashboardPage
          onNavigate={(route) => navigateTo(route)}
          onLogout={handleLogout}
        />
      )}

      {/* 20. Alerts Hub */}
      {currentRoute === 'alerts' && (
        <AlertsPage
          onNavigate={(route) => navigateTo(route)}
          onLogout={handleLogout}
        />
      )}

      {/* 21. Settings & Preferences */}
      {currentRoute === 'settings' && (
        <SettingsPage
          onNavigate={(route) => navigateTo(route)}
          onLogout={handleLogout}
          userEmail={currentUserEmail}
        />
      )}

      {/* 22. AI Assistant */}
      {currentRoute === 'ai-assistant' && (
        <AIAssistantPage
          onNavigate={(route) => navigateTo(route)}
          onLogout={handleLogout}
        />
      )}

      {/* PWA Install Prompt UI */}
      {showInstallPrompt && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#2563EB',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '999px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 9999,
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <span style={{ fontWeight: 500, fontSize: '15px' }}>Install OncoGuards App</span>
          <button 
            onClick={handleInstallClick}
            style={{
              backgroundColor: 'white',
              color: '#2563EB',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '999px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Install
          </button>
          <button 
            onClick={() => setShowInstallPrompt(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '20px',
              cursor: 'pointer',
              marginLeft: '4px'
            }}
          >
            &times;
          </button>
        </div>
      )}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ThemeProvider>
          <AssessmentProvider>
            <AppContent />
          </AssessmentProvider>
        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;

