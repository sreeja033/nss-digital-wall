import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NSS_SEAL_URL } from '../../data/mockData';
import { VolunteerAvatar } from './VolunteerAvatar';
import { ArrowLeft, ShieldCheck, LogOut, Bell, Check, ExternalLink, LogIn, Users } from 'lucide-react';
import { formatRelativeTime } from '../../utils/dateUtils';

export const Header: React.FC = () => {
  const {
    currentScreen,
    navigateTo,
    userRole,
    isVolunteerLoggedIn,
    isAdminLoggedIn,
    isCommunityLoggedIn,
    currentCommunityMember,
    currentVolunteer,
    logoutVolunteer,
    logoutAdmin,
    logoutCommunity,
    logout,
    notifications,
    markNotificationAsRead,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const canGoBack =
    currentScreen !== 'welcome' &&
    currentScreen !== 'role-split' &&
    currentScreen !== 'home' &&
    currentScreen !== 'volunteer-dashboard';

  const handleBack = () => {
    if (currentScreen === 'admin' && !isAdminLoggedIn) {
      navigateTo('role-split');
    } else if (
      currentScreen === 'problem-detail' ||
      currentScreen === 'report-problem'
    ) {
      navigateTo('problem-wall');
    } else if (
      currentScreen === 'action-tracker' ||
      currentScreen === 'reports-management' ||
      currentScreen === 'analytics' ||
      currentScreen === 'volunteer-profile'
    ) {
      navigateTo('volunteer-dashboard');
    } else if (
      currentScreen === 'community-login' ||
      currentScreen === 'community-register'
    ) {
      navigateTo('home');
    } else {
      navigateTo('home');
    }
  };

  if (currentScreen === 'welcome' || currentScreen === 'role-split') {
    return null; // The welcome & role-split screens have custom top branding
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#FFFDF8] border-b-2 border-[#E3D4BE] shadow-[0_2px_8px_rgba(31,27,23,0.06)] px-3 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] transition-all">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Left: Back button or NSS Seal */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {canGoBack ? (
            <button
              onClick={handleBack}
              aria-label="Back"
              className="touch-target w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FFFDF8] border border-[#D5C2AA] text-[#1F1B17] flex items-center justify-center shadow-xs active:translate-y-0.5 hover:bg-[#FAF0E1] transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft className={`w-4 h-4 sm:w-5 sm:h-5 ${userRole === 'admin' ? 'text-[#1D4ED8]' : userRole === 'volunteer' ? 'text-[#1B4B43]' : 'text-[#A03818]'}`} />
            </button>
          ) : (
            <button
              onClick={() => navigateTo('about')}
              title="About Us"
              aria-label="About Us"
              className="touch-target w-9 h-9 sm:w-10 sm:h-10 group cursor-pointer flex items-center justify-center shrink-0"
            >
              <img
                src={NSS_SEAL_URL}
                alt="NSS Emblem"
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-1.5 shadow-xs ${userRole === 'admin' ? 'border-[#1D4ED8]' : userRole === 'volunteer' ? 'border-[#1B4B43]' : 'border-[#A03818]'}`}
              />
            </button>
          )}

          <button
            onClick={() => navigateTo('home')}
            className="text-left cursor-pointer group py-0.5 min-w-0"
          >
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className={`font-['Epilogue'] font-black text-sm sm:text-base leading-tight tracking-tight text-[#1F1B17] transition-colors shrink-0 ${userRole === 'admin' ? 'group-hover:text-[#1D4ED8]' : userRole === 'volunteer' ? 'group-hover:text-[#1B4B43]' : 'group-hover:text-[#A03818]'}`}>
                NSS Voice
              </span>
              <span className={`text-[9px] sm:text-[10px] font-['Epilogue'] font-bold tracking-wider px-1.5 py-0.2 rounded text-white uppercase shrink-0 hidden xs:inline-block ${userRole === 'admin' ? 'bg-[#1D4ED8]' : userRole === 'volunteer' ? 'bg-[#1B4B43]' : 'bg-[#A03818]'}`}>
                Noticeboard
              </span>
            </div>
            <p className="text-[10px] font-sans font-medium text-[#7C695E] leading-none mt-0.5 truncate hidden sm:block">
              Community • NSS Volunteers
            </p>
          </button>
        </div>

        {/* Right: Notifications, Profile & Logout */}
        <div className="flex items-center gap-1.5 shrink-0">
          {userRole === 'volunteer' && isVolunteerLoggedIn && (
            <div className="relative shrink-0">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                title="Updates"
                aria-label="Updates"
                className="touch-target w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FFFDF8] border border-[#DEC0B8] text-[#57423C] flex items-center justify-center shadow-xs hover:border-[#1B4B43] transition-all cursor-pointer relative"
              >
                <Bell className="w-4 h-4 text-[#57423C]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#1B4B43] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 max-w-[calc(100vw-24px)] bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-xl shadow-xl z-50 p-3 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-[#F1E6E0] pb-2">
                    <span className="font-['Epilogue'] font-bold text-xs text-[#1F1B17]">
                      Updates ({notifications.length})
                    </span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-[11px] text-[#1B4B43] hover:underline cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 text-xs">
                    {notifications.length === 0 ? (
                      <p className="text-center text-[#7C695E] py-3 text-[11px]">
                        No updates right now.
                      </p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markNotificationAsRead(notif.id);
                            if (notif.problemId) {
                              navigateTo('volunteer-dashboard');
                            }
                            setShowNotifications(false);
                          }}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                            notif.read
                              ? 'bg-[#FAF6ED] border-[#DEC0B8]/60 text-[#7C695E]'
                              : 'bg-[#F0FAF7] border-[#B8EADE] text-[#1F1B17] font-medium'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="font-bold text-[#1B4B43] uppercase font-mono">
                              {notif.type}
                            </span>
                            <span className="text-[#8C7A70]">{formatRelativeTime(notif.createdAt)}</span>
                          </div>
                          <div className="font-bold text-xs">{notif.title}</div>
                          <p className="text-[11px] text-[#57423C] mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {userRole === 'admin' ? (
            isAdminLoggedIn ? (
              <div className="flex items-center gap-1.5 shrink-0">
                {currentScreen !== 'admin' ? (
                  <button
                    onClick={() => navigateTo('admin')}
                    className="touch-target min-h-[38px] flex items-center gap-1.5 bg-[#EBF3FF] border border-[#93C5FD] py-1 px-2.5 rounded-lg shadow-2xs hover:border-[#1D4ED8] transition-all cursor-pointer shrink-0"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#1D4ED8]" />
                    <span className="text-xs font-['Epilogue'] font-bold text-[#1D4ED8] hidden sm:inline">
                      Coordinator Panel
                    </span>
                    <span className="text-xs font-['Epilogue'] font-bold text-[#1D4ED8] sm:hidden">
                      Admin
                    </span>
                  </button>
                ) : (
                  <div className="hidden sm:flex items-center gap-1.5 bg-[#EBF3FF] border border-[#93C5FD] py-1 px-2.5 rounded-lg shadow-2xs shrink-0">
                    <span className="w-2 h-2 rounded-full bg-[#1D4ED8]" />
                    <span className="text-xs font-['Epilogue'] font-bold text-[#1D4ED8]">
                      Coordinator
                    </span>
                  </div>
                )}
                <button
                  onClick={logoutAdmin}
                  title="Coordinator Sign Out"
                  aria-label="Coordinator Sign Out"
                  className="touch-target min-h-[38px] text-xs font-['Epilogue'] font-bold px-3 py-1.5 rounded-lg bg-[#FFFDF8] border border-[#DEC0B8] text-[#1D4ED8] shadow-xs hover:bg-[#EBF3FF] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" />
                  <span className="whitespace-nowrap">Exit</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigateTo('admin-login')}
                className="touch-target min-h-[38px] text-xs font-['Epilogue'] font-bold px-3 py-1.5 rounded-lg bg-[#1D4ED8] text-white shadow-xs hover:bg-[#1E40AF] transition-all cursor-pointer flex items-center gap-1 shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Officer Login</span>
              </button>
            )
          ) : userRole === 'volunteer' ? (
            isVolunteerLoggedIn ? (
              <button
                onClick={() => navigateTo('volunteer-profile')}
                title="My Profile & Sign Out"
                className="touch-target min-h-[38px] flex items-center gap-1.5 bg-[#FFFDF8] border border-[#B8EADE] py-1 px-2.5 rounded-full shadow-2xs hover:border-[#38665E] transition-all cursor-pointer shrink-0"
              >
                <VolunteerAvatar
                  avatar={currentVolunteer.avatar}
                  name={currentVolunteer.displayName || currentVolunteer.name}
                  size="xs"
                  className="rounded-full"
                />
                <span className="text-xs font-['Epilogue'] font-bold text-[#1B4B43] truncate max-w-[120px]">
                  {currentVolunteer.displayName || currentVolunteer.name}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => navigateTo('volunteer-signin')}
                  className="touch-target min-h-[38px] text-xs font-['Epilogue'] font-bold px-3 py-1.5 rounded-lg bg-[#1B4B43] text-white shadow-xs hover:bg-[#143731] transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={logout}
                  title="Exit"
                  aria-label="Exit"
                  className="touch-target min-h-[38px] text-xs font-['Epilogue'] font-bold px-3 py-1.5 rounded-lg bg-[#FFFDF8] border border-[#B8EADE] text-[#1B4B43] shadow-xs hover:bg-[#F0FAF7] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#1B4B43] shrink-0" />
                  <span className="whitespace-nowrap">Exit</span>
                </button>
              </div>
            )
          ) : isCommunityLoggedIn ? (
            /* Community Role: Signed in member */
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="touch-target min-h-[36px] flex items-center gap-1.5 bg-[#FFFDF8] border border-[#DEC0B8] py-1 px-2 rounded-full shadow-2xs">
                <span className="text-xs">{currentCommunityMember?.avatar || '🏡'}</span>
                <span className="text-xs font-['Epilogue'] font-bold text-[#1F1B17] truncate max-w-[100px] hidden sm:inline">
                  {currentCommunityMember?.fullName}
                </span>
              </div>
              <button
                onClick={logoutCommunity}
                title="Sign Out"
                aria-label="Sign Out"
                className="touch-target min-h-[36px] text-xs font-['Epilogue'] font-bold px-2.5 py-1 rounded-lg bg-[#FFFDF8] border border-[#DEC0B8] text-[#A03818] shadow-xs hover:bg-[#FFF5F2] active:scale-95 transition-all cursor-pointer flex items-center gap-1 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 text-[#A03818] shrink-0" />
                <span className="whitespace-nowrap">Sign Out</span>
              </button>
            </div>
          ) : (
            /* Community Role: Not Signed In */
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => navigateTo('community-login')}
                className="touch-target min-h-[36px] text-xs font-['Epilogue'] font-bold px-2.5 py-1 rounded-lg bg-[#A03818] text-white shadow-xs hover:bg-[#7A2B12] active:scale-95 transition-all cursor-pointer flex items-center gap-1 shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => navigateTo('community-register')}
                className="touch-target min-h-[36px] text-xs font-['Epilogue'] font-bold px-2.5 py-1 rounded-lg bg-[#FFFDF8] border border-[#DEC0B8] text-[#A03818] shadow-xs hover:bg-[#FFF5F2] active:scale-95 transition-all cursor-pointer hidden sm:flex items-center gap-1 shrink-0"
              >
                <span>Register</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
