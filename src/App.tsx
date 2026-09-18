import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { RoleSplitScreen } from './components/screens/RoleSplitScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { ReportProblemModal } from './components/screens/ReportProblemModal';
import { ProblemWallScreen } from './components/screens/ProblemWallScreen';
import { ProblemDetailScreen } from './components/screens/ProblemDetailScreen';
import { ImpactGalleryScreen } from './components/screens/ImpactGalleryScreen';
import { AboutTrustScreen } from './components/screens/AboutTrustScreen';
import { VolunteerSignInScreen } from './components/screens/VolunteerSignInScreen';
import { VolunteerDashboardScreen } from './components/screens/VolunteerDashboardScreen';
import { ReportsManagementScreen } from './components/screens/ReportsManagementScreen';
import { ActionTrackerScreen } from './components/screens/ActionTrackerScreen';
import { VolunteerProfileScreen } from './components/screens/VolunteerProfileScreen';
import { AnalyticsScreen } from './components/screens/AnalyticsScreen';
import { AdminScreen } from './components/screens/AdminScreen';
import { AdminLoginScreen } from './components/screens/AdminLoginScreen';
import { CommunityLoginScreen } from './components/screens/CommunityLoginScreen';
import { CommunityRegisterScreen } from './components/screens/CommunityRegisterScreen';
import { X } from 'lucide-react';
import { Pushpin } from './components/common/Pushpin';

const MainContent: React.FC = () => {
  const { currentScreen, toastMessage, clearToast } = useApp();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'role-split':
        return <RoleSplitScreen />;
      case 'home':
        return <HomeScreen />;
      case 'report-problem':
        return <ReportProblemModal />;
      case 'problem-wall':
        return <ProblemWallScreen />;
      case 'problem-detail':
        return <ProblemDetailScreen />;
      case 'impact-gallery':
        return <ImpactGalleryScreen />;
      case 'about':
        return <AboutTrustScreen />;
      case 'community-login':
        return <CommunityLoginScreen />;
      case 'community-register':
        return <CommunityRegisterScreen />;
      case 'admin-login':
        return <AdminLoginScreen />;
      case 'volunteer-signin':
        return <VolunteerSignInScreen />;
      case 'volunteer-dashboard':
        return <VolunteerDashboardScreen />;
      case 'reports-management':
        return <ReportsManagementScreen />;
      case 'action-tracker':
        return <ActionTrackerScreen />;
      case 'volunteer-profile':
        return <VolunteerProfileScreen />;
      case 'analytics':
        return <AnalyticsScreen />;
      case 'admin':
        return <AdminScreen />;
      default:
        return <HomeScreen />;
    }
  };

  const isAuthScreen =
    currentScreen === 'welcome' ||
    currentScreen === 'role-split' ||
    currentScreen === 'volunteer-signin' ||
    currentScreen === 'admin-login' ||
    currentScreen === 'community-login' ||
    currentScreen === 'community-register';

  const hasHeader = !isAuthScreen;
  const hasNav = !isAuthScreen && currentScreen !== 'report-problem';

  return (
    <div className="min-h-screen flex flex-col relative text-[#1F1B17]">
      {/* Top Header - Fixed at top */}
      {hasHeader && <Header />}

      {/* Main Screen View with top/bottom padding to prevent overlap with fixed header/footer */}
      <main
        className={`flex-1 w-full flex flex-col ${
          hasHeader
            ? 'pt-[calc(4.75rem+env(safe-area-inset-top,0px))] sm:pt-[calc(5rem+env(safe-area-inset-top,0px))]'
            : 'pt-[calc(1.5rem+env(safe-area-inset-top,0px))]'
        } ${
          hasNav
            ? 'pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))]'
            : 'pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]'
        }`}
      >
        {renderScreen()}
      </main>

      {/* Bottom Corkboard Navigation Bar - Fixed at bottom */}
      {hasNav && <BottomNav />}

      {/* Floating Pinned Toast Notification */}
      {toastMessage && (
        <div className="fixed top-[calc(3.75rem+env(safe-area-inset-top,0px))] left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm animate-in slide-in-from-top-4 duration-200">
          <div className="relative bg-[#FFFDF8] border-2 border-[#A03818] rounded-xl p-3 shadow-xl flex items-center justify-between gap-2">
            <div className="absolute -top-2 left-4">
              <Pushpin color="rust" size="sm" />
            </div>
            <p className="text-xs font-['Epilogue'] font-bold text-[#1F1B17] pl-4">
              {toastMessage}
            </p>
            <button
              onClick={clearToast}
              className="text-[#8C7A70] hover:text-black shrink-0 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
