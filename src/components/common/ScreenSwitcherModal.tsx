import React from 'react';
import { useApp } from '../../context/AppContext';
import { AppScreen } from '../../types';
import { X, ExternalLink, Check, Eye } from 'lucide-react';
import { Pushpin } from './Pushpin';

interface ScreenSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SCREENS: { id: AppScreen; title: string; subtitle: string; path: 'Community' | 'Volunteer' | 'Admin' | 'Shared'; iconColor: 'rust' | 'teal' | 'mustard' | 'navy' }[] = [
  { id: 'welcome', title: '1. Welcome', subtitle: 'Welcome message and intro', path: 'Shared', iconColor: 'rust' },
  { id: 'role-split', title: '2. Choose Role', subtitle: 'Join as neighbor or volunteer', path: 'Shared', iconColor: 'mustard' },
  { id: 'community-login', title: '3. Community Sign In', subtitle: 'Neighbor / resident sign in', path: 'Community', iconColor: 'rust' },
  { id: 'community-register', title: '4. Community Register', subtitle: 'Create resident account', path: 'Community', iconColor: 'mustard' },
  { id: 'home', title: '5. Home Noticeboard', subtitle: 'Categories and top issues', path: 'Community', iconColor: 'rust' },
  { id: 'report-problem', title: '6. Post Problem', subtitle: 'Report a neighborhood issue', path: 'Community', iconColor: 'rust' },
  { id: 'problem-wall', title: '7. All Problems', subtitle: 'Browse all local issues', path: 'Community', iconColor: 'rust' },
  { id: 'problem-detail', title: '8. Problem Details', subtitle: 'Photos, notes, and progress', path: 'Community', iconColor: 'mustard' },
  { id: 'impact-gallery', title: '9. Solved Wall', subtitle: 'Before and after photos', path: 'Community', iconColor: 'teal' },
  { id: 'about', title: '10. About Us', subtitle: 'Who we are and how to reach us', path: 'Community', iconColor: 'teal' },
  { id: 'volunteer-signin', title: '11. Volunteer Sign In', subtitle: 'Log in with your ID', path: 'Volunteer', iconColor: 'teal' },
  { id: 'volunteer-dashboard', title: '12. Volunteer Hub', subtitle: 'Your tasks and open problems', path: 'Volunteer', iconColor: 'teal' },
  { id: 'reports-management', title: '13. Problem List', subtitle: 'Review and assign tasks', path: 'Volunteer', iconColor: 'mustard' },
  { id: 'action-tracker', title: '14. Action Tracker', subtitle: 'Add proof and mark solved', path: 'Volunteer', iconColor: 'teal' },
  { id: 'volunteer-profile', title: '15. My Profile', subtitle: 'Your hours and badges', path: 'Volunteer', iconColor: 'teal' },
  { id: 'analytics', title: '16. Stats & Numbers', subtitle: 'Local numbers and charts', path: 'Volunteer', iconColor: 'rust' },
  { id: 'admin-login', title: '17. Admin Login', subtitle: 'Programme officer credentials & PIN', path: 'Admin', iconColor: 'navy' },
  { id: 'admin', title: '18. Coordinator Panel', subtitle: 'Organize volunteers and assign tasks', path: 'Admin', iconColor: 'rust' },
];

export const ScreenSwitcherModal: React.FC<ScreenSwitcherModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentScreen, navigateTo, setUserRole } = useApp();

  if (!isOpen) return null;

  const handleSelect = (screen: AppScreen, path: 'Community' | 'Volunteer' | 'Admin' | 'Shared') => {
    if (path === 'Volunteer') {
      setUserRole('volunteer');
    } else if (path === 'Community') {
      setUserRole('community');
    } else if (path === 'Admin') {
      setUserRole('admin');
    }
    navigateTo(screen);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#FFFDF8] border-3 border-[#DEC0B8] rounded-xl shadow-2xl p-5 max-h-[85vh] flex flex-col">
        {/* Top Pushpin */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Pushpin color="rust" size="lg" />
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-[#E3D4BE]">
          <div>
            <h3 className="font-['Epilogue'] font-black text-lg text-[#1F1B17] tracking-tight">
              All Screens
            </h3>
            <p className="text-xs text-[#7C695E]">
              Tap any screen to visit it.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FCF2EB] border border-[#DEC0B8] flex items-center justify-center text-[#57423C] hover:bg-[#FFDBD1] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Screen List */}
        <div className="overflow-y-auto space-y-2 py-3 flex-1 pr-1">
          {SCREENS.map((s) => {
            const isActive = currentScreen === s.id;
            return (
              <button
                key={s.id}
                onClick={() => handleSelect(s.id, s.path)}
                className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                  isActive
                    ? 'bg-[#FFF8F5] border-[#A03818] shadow-sm ring-1 ring-[#A03818]/30'
                    : 'bg-[#FFFDF8] border-[#E8DFC9] hover:bg-[#FAF6ED] hover:border-[#DEC0B8]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Pushpin color={s.iconColor} size="sm" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-['Epilogue'] font-bold text-sm text-[#1F1B17]">
                        {s.title}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                          s.path === 'Volunteer'
                            ? 'bg-[#B8EADE]/60 text-[#1B4B43]'
                            : s.path === 'Admin'
                            ? 'bg-[#FFDBD1]/60 text-[#C1502E]'
                            : s.path === 'Community'
                            ? 'bg-[#FFDBD1]/60 text-[#A03818]'
                            : 'bg-[#FCBB4A]/30 text-[#7B5300]'
                        }`}
                      >
                        {s.path}
                      </span>
                    </div>
                    <p className="text-xs text-[#7C695E] mt-0.5">{s.subtitle}</p>
                  </div>
                </div>

                {isActive ? (
                  <span className="w-6 h-6 rounded-full bg-[#A03818] text-white flex items-center justify-center text-xs">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <ExternalLink className="w-4 h-4 text-[#DEC0B8]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-[#E3D4BE] text-center">
          <p className="text-[11px] text-[#7C695E] font-medium">
            Tap any screen to switch views.
          </p>
        </div>
      </div>
    </div>
  );
};
