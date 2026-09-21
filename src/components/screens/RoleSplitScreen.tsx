import React from 'react';
import { useApp } from '../../context/AppContext';
import { Pushpin } from '../common/Pushpin';
import { WashiTape } from '../common/WashiTape';
import {
  Users,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Check,
  Eye,
  Camera,
  HeartHandshake,
  Lock,
  UserPlus,
  LogIn,
  PlusCircle,
} from 'lucide-react';

export const RoleSplitScreen: React.FC = () => {
  const {
    navigateTo,
    setUserRole,
    isVolunteerLoggedIn,
    isAdminLoggedIn,
    isCommunityLoggedIn,
    currentCommunityMember,
    provisionedVolunteers,
    volunteerRoster,
  } = useApp();

  const volunteerCount = provisionedVolunteers?.length ?? volunteerRoster?.length ?? 0;

  const handleChooseVolunteer = () => {
    setUserRole('volunteer');
    if (isVolunteerLoggedIn) {
      navigateTo('volunteer-dashboard');
    } else {
      navigateTo('volunteer-signin');
    }
  };

  const handleChooseAdmin = () => {
    setUserRole('admin');
    if (isAdminLoggedIn) {
      navigateTo('admin');
    } else {
      navigateTo('admin-login');
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col justify-center px-4 py-4 max-w-md mx-auto w-full">
      {/* Header */}
      <div className="text-center space-y-1 relative mb-3.5">
        <div className="inline-block relative">
          <span className="font-['Caveat'] text-xl text-[#A03818] font-bold block -rotate-3">
            Community Board
          </span>
          <div className="absolute -top-2.5 -right-5">
            <Pushpin color="mustard" size="sm" />
          </div>
        </div>
        <h1 className="font-['Epilogue'] font-black text-2xl text-[#1F1B17] tracking-tight">
          How are you joining today?
        </h1>
        <p className="text-xs text-[#6E5A4E]">
          Select your portal to continue.
        </p>
      </div>

      {/* The Two Main Cards */}
      <div className="space-y-3.5 w-full">
        {/* Community Card */}
        <div className="relative bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-xl p-4 shadow-[0_4px_12px_rgba(43,38,34,0.07)] -rotate-0.5 hover:rotate-0 transition-transform">
          {/* Pushpin at top right */}
          <div className="absolute -top-2.5 right-6">
            <Pushpin color="rust" size="sm" />
          </div>
          {/* Washi tape at top left */}
          <div className="absolute -top-2 left-4 -rotate-6">
            <WashiTape color="peach" width="w-16" />
          </div>

          <div className="flex items-center gap-2.5 mb-2 pt-0.5">
            <div className="w-9 h-9 rounded-lg bg-[#FFDBD1] border border-[#A03818]/40 flex items-center justify-center text-[#A03818] shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-['Epilogue'] font-extrabold text-base text-[#1F1B17] leading-tight">
                Community Resident
              </h2>
              <span className="text-[10px] font-semibold text-[#A03818] uppercase tracking-wider">
                {isCommunityLoggedIn
                  ? `Signed in: ${currentCommunityMember?.fullName}`
                  : 'Neighbors & Citizens'}
              </span>
            </div>
          </div>

          <div className="space-y-0.5 mb-3">
            <p className="font-['Epilogue'] font-bold text-xs text-[#A03818]">
              Snap, pin, post & track.
            </p>
            <p className="text-xs text-[#57423C] leading-snug">
              Report civic problems, upvote neighborhood priorities, and receive updates when volunteers take action.
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                setUserRole('community');
                if (isCommunityLoggedIn) {
                  navigateTo('report-problem');
                } else {
                  navigateTo('community-login');
                }
              }}
              className="w-full py-3 px-4 rounded-xl font-['Epilogue'] font-black text-xs tracking-wide cork-btn-primary flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Voice a Problem</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {isCommunityLoggedIn && (
              <button
                onClick={() => {
                  setUserRole('community');
                  navigateTo('home');
                }}
                className="w-full py-2 px-3 rounded-lg text-xs font-['Epilogue'] font-bold text-[#A03818] bg-[#FFF8F5] border border-[#DEC0B8] hover:bg-[#FFDBD1]/30 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Browse Community Noticeboard</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Volunteer Card */}
        <div className="relative bg-[#FFFDF8] border-2 border-[#B8EADE] rounded-xl p-4 shadow-[0_4px_12px_rgba(43,38,34,0.07)] rotate-0.5 hover:rotate-0 transition-transform">
          {/* Pushpin at top left */}
          <div className="absolute -top-2.5 left-6">
            <Pushpin color="teal" size="sm" />
          </div>
          {/* Washi tape at top right */}
          <div className="absolute -top-2 right-4 rotate-6">
            <WashiTape color="mint" width="w-16" />
          </div>

          <div className="flex items-center justify-between gap-2 mb-2 pt-0.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#B8EADE] border border-[#38665E]/40 flex items-center justify-center text-[#1B4B43] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-['Epilogue'] font-extrabold text-base text-[#1F1B17] leading-tight">
                  NSS Volunteer
                </h2>
                <span className="text-[10px] font-semibold text-[#1B4B43] uppercase tracking-wider">
                  Student & community cadets
                </span>
              </div>
            </div>

            
          </div>

          {/* Volunteer Count Highlight Strip Under Header */}
         
          <p className="text-xs text-[#57423C] leading-snug mb-2">
            Complete officer-assigned tasks, clean up local spots, post photo proof, and log hours.
          </p>

          <div className="space-y-1 mb-3 text-xs font-medium text-[#1F1B17]">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#B8EADE] text-[#1B4B43] flex items-center justify-center text-[9px] shrink-0">
                ✓
              </span>
              <span>Execute assigned problems and organize cleanup drives</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#B8EADE] text-[#1B4B43] flex items-center justify-center text-[9px] shrink-0">
                ✓
              </span>
              <span>Post before-and-after photos when done</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#B8EADE] text-[#1B4B43] flex items-center justify-center text-[9px] shrink-0">
                ✓
              </span>
              <span>Earn volunteer hours and badges</span>
            </div>
          </div>

          <button
            onClick={handleChooseVolunteer}
            className="w-full py-2.5 px-4 rounded-xl font-['Epilogue'] font-bold text-xs cork-btn-teal flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>
              {isVolunteerLoggedIn ? 'Open Volunteer Hub' : 'Sign In as Volunteer'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Admin / Programme Officer Login Footer Access */}
      <div className="text-center mt-3 pt-2.5 border-t border-[#DEC0B8]/40 space-y-1">
        <button
          onClick={handleChooseAdmin}
          className="inline-flex items-center gap-1.5 text-xs text-[#7C695E] hover:text-[#1F1B17] font-medium transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-[#FAF6ED]"
        >
          <Lock className="w-3.5 h-3.5 text-[#A03818]" />
          <span>
            {isAdminLoggedIn
              ? 'Open Programme Officer Panel'
              : 'NSS Programme Officer Login (Admin)'}
          </span>
          <ArrowRight className="w-3 h-3 text-[#7C695E]" />
        </button>
        <p className="text-[9.5px] text-[#8C7A70]">
          Restricted to verified NSS Programme Officers & Coordinators
        </p>
      </div>
    </div>
  );
};

