import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Trophy,
  Info,
  ShieldCheck,
  CheckCircle2,
  BarChart3,
  UserCheck,
  Users,
  Send,
  ShieldAlert,
} from 'lucide-react';
import { Pushpin } from './Pushpin';
import { AdminTab } from '../../types';

export const BottomNav: React.FC = () => {
  const {
    currentScreen,
    navigateTo,
    userRole,
    isAdminLoggedIn,
    isCommunityLoggedIn,
    adminTab,
    setAdminTab,
    problems,
  } = useApp();

  // Hide bottom nav on welcome, role-split, report form, volunteer-signin, or unauthenticated admin login
  if (
    currentScreen === 'welcome' ||
    currentScreen === 'role-split' ||
    currentScreen === 'report-problem' ||
    currentScreen === 'volunteer-signin' ||
    (currentScreen === 'admin' && !isAdminLoggedIn)
  ) {
    return null;
  }

  // Strictly identify admin mode: on admin screen, logged in as admin, or userRole is admin
  const isAdmin = userRole === 'admin' || currentScreen === 'admin' || isAdminLoggedIn;
  const isVolunteer = !isAdmin && userRole === 'volunteer';

  const unassignedTasksCount = problems.filter(
    (p) => p.status === 'REPORTED' && !p.assignedLead
  ).length;

  const handleAdminNav = (tab: AdminTab) => {
    setAdminTab(tab);
    if (currentScreen !== 'admin') {
      navigateTo('admin');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF8] border-t-2 border-[#DEC0B8] shadow-[0_-4px_16px_rgba(43,38,34,0.08)] pt-1.5 px-2 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]">
      <div className="max-w-xl mx-auto flex items-center justify-around">
        {/* Navigation Items */}
        {isAdmin ? (
          <>
            {/* 1. Home */}
            <button
              onClick={() => handleAdminNav('overview')}
              className={`touch-target min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-all cursor-pointer ${
                (currentScreen === 'admin' && adminTab === 'overview') || (currentScreen === 'home' && userRole === 'admin')
                  ? 'text-[#1D4ED8] font-bold scale-105'
                  : 'text-[#7C695E] hover:text-[#1D4ED8]'
              }`}
              title="Coordinator Home"
            >
              <div className="relative">
                <ShieldCheck className="w-5 h-5" />
                {((currentScreen === 'admin' && adminTab === 'overview') || (currentScreen === 'home' && userRole === 'admin')) && (
                  <span className="absolute -top-1.5 -right-2">
                    <Pushpin color="navy" size="sm" />
                  </span>
                )}
              </div>
              <span className="text-[10px] font-['Epilogue'] tracking-tight mt-0.5 whitespace-nowrap">
                Home
              </span>
            </button>

            {/* 2. Volunteers */}
            <button
              onClick={() => handleAdminNav('volunteers')}
              className={`touch-target min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-all cursor-pointer ${
                currentScreen === 'admin' && adminTab === 'volunteers'
                  ? 'text-[#1D4ED8] font-bold scale-105'
                  : 'text-[#7C695E] hover:text-[#1D4ED8]'
              }`}
              title="Volunteer IDs & Roster"
            >
              <div className="relative">
                <Users className="w-5 h-5" />
                {currentScreen === 'admin' && adminTab === 'volunteers' && (
                  <span className="absolute -top-1.5 -right-2">
                    <Pushpin color="navy" size="sm" />
                  </span>
                )}
              </div>
              <span className="text-[10px] font-['Epilogue'] tracking-tight mt-0.5 whitespace-nowrap">
                Volunteers
              </span>
            </button>

            {/* 3. Assign Tasks */}
            <button
              onClick={() => handleAdminNav('tasks')}
              className={`touch-target min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-all cursor-pointer ${
                currentScreen === 'admin' && adminTab === 'tasks'
                  ? 'text-[#1D4ED8] font-bold scale-105'
                  : 'text-[#7C695E] hover:text-[#1D4ED8]'
              }`}
              title="Assign Tasks"
            >
              <div className="relative">
                <Send className="w-5 h-5" />
                {currentScreen === 'admin' && adminTab === 'tasks' && (
                  <span className="absolute -top-1.5 -right-2">
                    <Pushpin color="navy" size="sm" />
                  </span>
                )}
              </div>
              <span className="text-[10px] font-['Epilogue'] tracking-tight mt-0.5 whitespace-nowrap">
                Assign
              </span>
            </button>

            {/* 4. Reports */}
            <button
              onClick={() => handleAdminNav('moderation')}
              className={`touch-target min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-all cursor-pointer ${
                currentScreen === 'admin' && adminTab === 'moderation'
                  ? 'text-[#1D4ED8] font-bold scale-105'
                  : 'text-[#7C695E] hover:text-[#1D4ED8]'
              }`}
              title="Review Reports"
            >
              <div className="relative">
                <ShieldAlert className="w-5 h-5" />
                {unassignedTasksCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-3.5 h-3.5 px-0.5 bg-[#1D4ED8] text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                    {unassignedTasksCount}
                  </span>
                )}
                {currentScreen === 'admin' && adminTab === 'moderation' && (
                  <span className="absolute -top-1.5 -right-2">
                    <Pushpin color="navy" size="sm" />
                  </span>
                )}
              </div>
              <span className="text-[10px] font-['Epilogue'] tracking-tight mt-0.5 whitespace-nowrap">
                Reports
              </span>
            </button>

            {/* 5. Stats */}
            <button
              onClick={() => handleAdminNav('analytics')}
              className={`touch-target min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-all cursor-pointer ${
                currentScreen === 'admin' && adminTab === 'analytics'
                  ? 'text-[#1D4ED8] font-bold scale-105'
                  : 'text-[#7C695E] hover:text-[#1D4ED8]'
              }`}
              title="Volunteer Stats & Progress"
            >
              <div className="relative">
                <BarChart3 className="w-5 h-5" />
                {currentScreen === 'admin' && adminTab === 'analytics' && (
                  <span className="absolute -top-1.5 -right-2">
                    <Pushpin color="navy" size="sm" />
                  </span>
                )}
              </div>
              <span className="text-[10px] font-['Epilogue'] tracking-tight mt-0.5 whitespace-nowrap">
                Stats
              </span>
            </button>
          </>
        ) : !isVolunteer ? (
          <>
            {/* Home */}
            <button
              onClick={() => navigateTo('home')}
              className={`touch-target min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all cursor-pointer ${
                currentScreen === 'home'
                  ? 'text-[#A03818] font-bold scale-105'
                  : 'text-[#7C695E] hover:text-[#A03818]'
              }`}
            >
              <div className="relative">
                <LayoutDashboard className="w-5 h-5" />
                {currentScreen === 'home' && (
                  <span className="absolute -top-1.5 -right-2">
                    <Pushpin color="rust" size="sm" />
                  </span>
                )}
              </div>
              <span className="text-[11px] font-['Epilogue'] tracking-tight mt-0.5">
                Home
              </span>
            </button>

            {/* Public Problem Wall */}
            <button
              onClick={() => navigateTo('problem-wall')}
              className={`touch-target min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all cursor-pointer ${
                currentScreen === 'problem-wall' || currentScreen === 'problem-detail'
                  ? 'text-[#A03818] font-bold scale-105'
                  : 'text-[#7C695E] hover:text-[#A03818]'
              }`}
            >
              <div className="relative">
                <ClipboardList className="w-5 h-5" />
                {(currentScreen === 'problem-wall' || currentScreen === 'problem-detail') && (
                  <span className="absolute -top-1.5 -right-2">
                    <Pushpin color="rust" size="sm" />
                  </span>
                )}
              </div>
              <span className="text-[11px] font-['Epilogue'] tracking-tight mt-0.5">
                All Problems
              </span>
            </button>

            {/* CENTER ACTION: Report a Problem */}
            <button
              onClick={() => {
                if (isCommunityLoggedIn) {
                  navigateTo('report-problem');
                } else {
                  navigateTo('community-login');
                }
              }}
              className="touch-target min-h-[48px] relative -top-3 flex flex-col items-center group cursor-pointer"
              aria-label="Report a Problem"
            >
              <div className="w-12 h-12 rounded-full bg-[#A03818] border-2 border-[#FFFDF8] shadow-[0_4px_10px_rgba(160,56,24,0.35)] flex items-center justify-center text-[#FFFDF8] group-hover:bg-[#842504] group-active:scale-95 transition-all">
                <PlusCircle className="w-6.5 h-6.5 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-['Epilogue'] font-black text-[#A03818] tracking-tight mt-0.5">
                Report
              </span>
            </button>

            {/* The Wins / Impact Gallery */}
            <button
              onClick={() => navigateTo('impact-gallery')}
              className={`touch-target min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all cursor-pointer ${
                currentScreen === 'impact-gallery'
                  ? 'text-[#A03818] font-bold scale-105'
                  : 'text-[#7C695E] hover:text-[#A03818]'
              }`}
            >
              <div className="relative">
                <Trophy className="w-5 h-5" />
                {currentScreen === 'impact-gallery' && (
                  <span className="absolute -top-1.5 -right-2">
                    <Pushpin color="rust" size="sm" />
                  </span>
                )}
              </div>
              <span className="text-[11px] font-['Epilogue'] tracking-tight mt-0.5">
                Solved
              </span>
            </button>

            {/* About / Trust */}
            <button
              onClick={() => navigateTo('about')}
              className={`touch-target min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all cursor-pointer ${
                currentScreen === 'about'
                  ? 'text-[#A03818] font-bold scale-105'
                  : 'text-[#7C695E] hover:text-[#A03818]'
              }`}
            >
              <Info className="w-5 h-5" />
              <span className="text-[11px] font-['Epilogue'] tracking-tight mt-0.5">
                About
              </span>
            </button>
          </>
        ) : (
          /* Volunteer Mode Navigation */
          <>
            {/* Volunteer Dashboard */}
            <button
              onClick={() => navigateTo('home')}
              className={`touch-target min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-all cursor-pointer ${
                currentScreen === 'home' || currentScreen === 'volunteer-dashboard'
                  ? 'text-[#1B4B43] font-bold scale-105'
                  : 'text-[#7C695E] hover:text-[#1B4B43]'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] font-['Epilogue'] tracking-tight mt-0.5">
                Home
              </span>
            </button>

            {/* Reports & Volunteer Tasks */}
            <button
              onClick={() => navigateTo('reports-management')}
              className={`touch-target min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-all cursor-pointer ${
                currentScreen === 'reports-management'
                  ? 'text-[#1B4B43] font-bold scale-105'
                  : 'text-[#7C695E] hover:text-[#1B4B43]'
              }`}
              title="Civic Reports & Tasks"
            >
              <div className="relative">
                <ClipboardList className="w-5 h-5" />
                {unassignedTasksCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-[#A03818] text-white rounded-full text-[9px] font-bold flex items-center justify-center font-mono">
                    {unassignedTasksCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-['Epilogue'] tracking-tight mt-0.5">
                Tasks
              </span>
            </button>

            {/* Action Field Tracker */}
            <button
              onClick={() => navigateTo('action-tracker')}
              className={`touch-target min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-all cursor-pointer ${
                currentScreen === 'action-tracker'
                  ? 'text-[#1B4B43] font-bold scale-105'
                  : 'text-[#7C695E] hover:text-[#1B4B43]'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-[#1B4B43] text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
              <span className="text-[10px] font-['Epilogue'] font-bold text-[#1B4B43] tracking-tight mt-0.5">
                Tracker
              </span>
            </button>

            {/* Analytics */}
            <button
              onClick={() => navigateTo('analytics')}
              className={`touch-target min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-all cursor-pointer ${
                currentScreen === 'analytics'
                  ? 'text-[#1B4B43] font-bold scale-105'
                  : 'text-[#7C695E] hover:text-[#1B4B43]'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-[10px] font-['Epilogue'] tracking-tight mt-0.5">
                Stats
              </span>
            </button>

            {/* Cadet Profile */}
            <button
              onClick={() => navigateTo('volunteer-profile')}
              className={`touch-target min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-all cursor-pointer ${
                currentScreen === 'volunteer-profile'
                  ? 'text-[#1B4B43] font-bold scale-105'
                  : 'text-[#7C695E] hover:text-[#1B4B43]'
              }`}
            >
              <UserCheck className="w-5 h-5" />
              <span className="text-[10px] font-['Epilogue'] tracking-tight mt-0.5">
                Profile
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
