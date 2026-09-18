import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { ProblemCard } from '../../common/ProblemCard';
import { Pushpin } from '../../common/Pushpin';
import { WashiTape } from '../../common/WashiTape';
import { RubberStamp } from '../../common/RubberStamp';
import {
  PlusCircle,
  ArrowRight,
  Trash2,
  Lightbulb,
  Cone,
  Droplets,
  Trees,
  GraduationCap,
  Accessibility,
  HeartHandshake,
  MapPin,
  Pencil,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Inbox,
  LayoutGrid,
} from 'lucide-react';
import { ProblemCategory } from '../../../types';

export const CommunityHomeView: React.FC = () => {
  const {
    problems,
    myReportedProblemIds,
    navigateTo,
    setFilterCategory,
    isCommunityLoggedIn,
    currentCommunityMember,
    clearSampleData,
    loadDemoData,
    updateCommunityLocation,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'bulletin' | 'my_reports'>('bulletin');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editedLocation, setEditedLocation] = useState('');
  const [isClearingSample, setIsClearingSample] = useState(false);

  const approvedProblems = problems.filter((p) => {
    // Show all reports on bulletin unless explicitly rejected
    if (p.moderationStatus === 'REJECTED') return false;
    return true;
  });
  const reportedAndInProgress = approvedProblems.filter((p) => p.status !== 'SOLVED');
  const solvedProblems = problems.filter((p) => p.status === 'SOLVED');

  // Reports specifically authored by the currently logged-in user or posted during this session
  const myReports = problems.filter((p) => {
    if (myReportedProblemIds && myReportedProblemIds.includes(p.id)) return true;
    if (!currentCommunityMember?.id) return false;
    return (
      p.reportedByUserId === currentCommunityMember.id ||
      (currentCommunityMember.fullName &&
        p.reportedByAuthor &&
        p.reportedByAuthor.toLowerCase() === currentCommunityMember.fullName.toLowerCase())
    );
  });

  const hasSampleNotices = problems.some(
    (p) => /^prob-[0-9]+$/.test(p.id)
  );

  // Priority problem for bulletin
  const priorityProblem =
    approvedProblems.find((p) => p.urgent && p.status === 'IN_PROGRESS') ||
    approvedProblems.find((p) => p.status === 'IN_PROGRESS') ||
    approvedProblems[0];

  const categories: { label: ProblemCategory; icon: React.ReactNode; color: string }[] = [
    { label: 'Garbage', icon: <Trash2 className="w-4 h-4 text-[#A03818]" />, color: '#FFDBD1' },
    { label: 'Streetlights', icon: <Lightbulb className="w-4 h-4 text-[#842504]" />, color: '#FFDDAE' },
    { label: 'Roads', icon: <Cone className="w-4 h-4 text-[#A03818]" />, color: '#FFDDAE' },
    { label: 'Water', icon: <Droplets className="w-4 h-4 text-[#A03818]" />, color: '#FFE6D8' },
    { label: 'Greenery', icon: <Trees className="w-4 h-4 text-[#842504]" />, color: '#FFEEDD' },
    { label: 'School', icon: <GraduationCap className="w-4 h-4 text-[#842504]" />, color: '#FFDBD1' },
    { label: 'Accessibility', icon: <Accessibility className="w-4 h-4 text-[#A03818]" />, color: '#FCF2EB' },
  ];

  const handleCategoryClick = (cat: string) => {
    setFilterCategory(cat);
    navigateTo('problem-wall');
  };

  const handleSaveLocation = async () => {
    const clean = editedLocation.trim();
    if (!clean) return;
    await updateCommunityLocation(clean);
    setIsEditingLocation(false);
  };

  const handleClearSampleData = async () => {
    setIsClearingSample(true);
    try {
      await clearSampleData();
      showToast('Sample community notices cleared. Bulletin board is now clean!');
    } finally {
      setIsClearingSample(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hero Noticeboard Question Card */}
      <div className="relative bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-2xl p-4 shadow-[0_4px_14px_rgba(43,38,34,0.07)] -rotate-0.5 mt-2">
        {/* Top Pushpin */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <Pushpin color="rust" size="lg" />
        </div>
        {/* Washi tape accents */}
        <div className="absolute -top-2.5 left-4 -rotate-6 z-10">
          <WashiTape color="yellow" width="w-16" />
        </div>
        <div className="absolute -top-2.5 right-4 rotate-6 z-10">
          <WashiTape color="mint" width="w-16" />
        </div>

        <div className="pt-3 text-center">
          <span className="font-['Caveat'] text-xl sm:text-2xl text-[#A03818] font-bold block -rotate-2">
            Neighborhood Noticeboard
          </span>
          <h1 className="font-['Epilogue'] font-black text-2xl sm:text-3xl text-[#1F1B17] tracking-tight mt-1 leading-snug">
            “If you could change ONE thing in your neighborhood, what would it be?”
          </h1>
          <p className="text-xs sm:text-sm text-[#57423C] max-w-md mx-auto mt-1.5 leading-relaxed">
            See a broken street lamp, uncovered manhole, or garbage pile? Post it here. NSS student volunteers take direct civic action and post verified photo proof.
          </p>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <button
              onClick={() => {
                if (isCommunityLoggedIn) {
                  navigateTo('report-problem');
                } else {
                  navigateTo('community-login');
                }
              }}
              className="touch-target w-full sm:w-auto min-h-[48px] py-2.5 px-5 rounded-xl font-['Epilogue'] font-extrabold text-sm cork-btn-primary flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <PlusCircle className="w-4.5 h-4.5 stroke-[2.5]" />
              <span>Voice a Problem</span>
            </button>

            <button
              onClick={() => navigateTo('problem-wall')}
              className="touch-target w-full sm:w-auto min-h-[48px] py-2.5 px-4 rounded-xl font-['Epilogue'] font-bold text-xs bg-[#FFF8F5] border border-[#DEC0B8] text-[#57423C] hover:bg-[#FAF0E1] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>See All Notices ({reportedAndInProgress.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Community Member Status Strip */}
      {isCommunityLoggedIn ? (
        <div className="bg-[#FFFDF8] border border-[#DEC0B8] rounded-xl p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{currentCommunityMember?.avatar || '🏡'}</span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-['Epilogue'] font-bold text-[#1F1B17]">
                    {currentCommunityMember?.fullName}
                  </p>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#FCF2EB] text-[#A03818] font-bold border border-[#FFDBD1]">
                    Resident Account Active
                  </span>
                </div>

                {/* Location with inline editing */}
                {isEditingLocation ? (
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="text"
                      value={editedLocation}
                      onChange={(e) => setEditedLocation(e.target.value)}
                      placeholder="Enter your location manually..."
                      className="text-xs px-2 py-0.5 border border-[#DEC0B8] rounded-md bg-white focus:outline-none focus:border-[#A03818]"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveLocation}
                      className="text-xs p-1 bg-[#A03818] hover:bg-[#842504] text-white rounded cursor-pointer transition-colors"
                      title="Save location"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setIsEditingLocation(false)}
                      className="text-xs p-1 bg-gray-200 text-[#1F1B17] rounded cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#57423C] mt-0.5">
                    <MapPin className="w-3 h-3 text-[#A03818] shrink-0" />
                    <span className="font-medium text-[#1F1B17]">
                      {currentCommunityMember?.location || currentCommunityMember?.ward || 'Location not set'}
                    </span>
                    <button
                      onClick={() => {
                        setEditedLocation(currentCommunityMember?.location || currentCommunityMember?.ward || '');
                        setIsEditingLocation(true);
                      }}
                      className="text-[10px] text-[#A03818] hover:underline inline-flex items-center gap-0.5 cursor-pointer ml-1 font-semibold"
                      title="Edit manual location"
                    >
                      <Pencil className="w-2.5 h-2.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-1 rounded-lg bg-[#FCF2EB] text-[#A03818] font-bold border border-[#FFDBD1]">
                My Reports: {myReports.length}
              </span>
              <button
                onClick={() => navigateTo('report-problem')}
                className="text-xs font-['Epilogue'] font-bold px-2.5 py-1 rounded-lg bg-[#A03818] text-white hover:bg-[#7A2B12] transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>+ Report</span>
              </button>
            </div>
          </div>

          {/* View Tab Switcher: Neighborhood Corkboard vs My Reports */}
          <div className="flex items-center p-1 bg-[#FAF6ED] rounded-xl border border-[#DEC0B8]">
            <button
              onClick={() => setActiveTab('bulletin')}
              className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-2.5 rounded-lg text-xs font-['Epilogue'] font-bold transition-all cursor-pointer ${
                activeTab === 'bulletin'
                  ? 'bg-white text-[#1F1B17] shadow-xs border border-[#DEC0B8]'
                  : 'text-[#6E5A4E] hover:text-[#1F1B17]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-[#A03818]" />
                <span>Neighborhood Bulletin</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${activeTab === 'bulletin' ? 'bg-[#FCF2EB] text-[#A03818]' : 'bg-[#E3D4BE]/50 text-[#6E5A4E]'}`}>
                {reportedAndInProgress.length} Community Reports
              </span>
            </button>

            <button
              onClick={() => setActiveTab('my_reports')}
              className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-2.5 rounded-lg text-xs font-['Epilogue'] font-bold transition-all cursor-pointer ${
                activeTab === 'my_reports'
                  ? 'bg-white text-[#1F1B17] shadow-xs border border-[#DEC0B8]'
                  : 'text-[#6E5A4E] hover:text-[#1F1B17]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Inbox className="w-3.5 h-3.5 text-[#A03818]" />
                <span>My Voiced Issues</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${activeTab === 'my_reports' ? 'bg-[#FCF2EB] text-[#A03818]' : 'bg-[#E3D4BE]/50 text-[#6E5A4E]'}`}>
                {myReports.length} {myReports.length === 1 ? 'Mine' : 'Mine'}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#FAF6ED] border border-[#DEC0B8] rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-['Epilogue'] font-bold text-[#1F1B17]">
              Are you a neighborhood resident?
            </p>
            <p className="text-[10.5px] text-[#7C695E]">
              Sign in or register to enter your location and track your reported problems.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateTo('community-login')}
              className="touch-target min-h-[32px] text-xs font-['Epilogue'] font-bold px-3 py-1 rounded-lg bg-[#A03818] text-white hover:bg-[#7A2B12] transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => navigateTo('community-register')}
              className="touch-target min-h-[32px] text-xs font-['Epilogue'] font-bold px-3 py-1 rounded-lg bg-white border border-[#DEC0B8] text-[#A03818] hover:bg-[#FFF5F2] transition-colors cursor-pointer hidden xs:inline-block"
            >
              Register
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: MY VOICED ISSUES (For logged-in community resident) */}
      {isCommunityLoggedIn && activeTab === 'my_reports' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Pushpin color="rust" size="sm" />
              <h2 className="font-['Epilogue'] font-black text-base text-[#1F1B17] tracking-tight">
                Problems Voiced by Your Account
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-[#57423C] bg-[#FFF8F5] px-2 py-0.5 rounded border border-[#DEC0B8]">
              {myReports.length} {myReports.length === 1 ? 'Notice' : 'Notices'}
            </span>
          </div>

          {myReports.length === 0 ? (
            <div className="bg-[#FFFDF8] border-2 border-dashed border-[#DEC0B8] rounded-2xl p-5 sm:p-6 text-center space-y-3.5">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FFDBD1]/50 border border-[#A03818]/20 flex items-center justify-center text-2xl">
                🏡
              </div>
              <div className="space-y-1">
                <h3 className="font-['Epilogue'] font-black text-base text-[#1F1B17]">
                  You Haven't Voiced Any Issues Yet
                </h3>
                <p className="text-xs text-[#6E5A4E] max-w-md mx-auto leading-relaxed">
                  Welcome, <span className="font-bold text-[#1F1B17]">{currentCommunityMember?.fullName}</span>! This tab displays civic issues submitted by your account.
                </p>
              </div>

              {/* Guide on how to view other neighbors' reports */}
              <div className="p-3.5 bg-[#FAF6ED] border border-[#DEC0B8] rounded-xl max-w-md mx-auto text-left space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#A03818] shrink-0" />
                  <h4 className="font-['Epilogue'] font-bold text-xs text-[#1F1B17]">
                    Looking for reports posted by other neighbors?
                  </h4>
                </div>
                <p className="text-[11px] text-[#57423C] leading-snug">
                  All civic issues submitted by other residents across the ward are on the <strong>Neighborhood Bulletin</strong> and the <strong>All Problems</strong> board. You can upvote them and track NSS volunteer progress!
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    onClick={() => setActiveTab('bulletin')}
                    className="flex-1 py-2 px-3 rounded-lg bg-[#A03818] hover:bg-[#842504] text-white text-xs font-['Epilogue'] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>View Neighborhood Bulletin ({reportedAndInProgress.length})</span>
                  </button>
                  <button
                    onClick={() => navigateTo('problem-wall')}
                    className="py-2 px-3 rounded-lg bg-white border border-[#DEC0B8] hover:bg-[#FFF5F2] text-[#57423C] text-xs font-['Epilogue'] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Browse All Ward Notices</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-center">
                <button
                  onClick={() => navigateTo('report-problem')}
                  className="touch-target px-4 py-2 rounded-xl font-['Epilogue'] font-bold text-xs cork-btn-primary inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Voice a Problem in {currentCommunityMember?.location || 'Your Neighborhood'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {myReports.map((prob) => (
                <ProblemCard key={prob.id} problem={prob} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: NEIGHBORHOOD BULLETIN BOARD */
        <>
          {/* Community Bulletin Explanation Header */}
          <div className="p-2.5 bg-[#FAF6ED] border border-[#DEC0B8] rounded-xl flex items-center justify-between gap-2 text-xs text-[#57423C]">
            <div className="flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-[#A03818] shrink-0" />
              <span>
                <strong>Neighborhood Corkboard:</strong> Showing all {reportedAndInProgress.length} civic notices posted by neighbors across the ward.
              </span>
            </div>
            {isCommunityLoggedIn && (
              <button
                onClick={() => setActiveTab('my_reports')}
                className="text-[11px] font-bold text-[#A03818] hover:underline shrink-0"
              >
                My Reports ({myReports.length}) →
              </button>
            )}
          </div>
          {/* Noticeboard Zero State when empty */}
          {reportedAndInProgress.length === 0 && (
            <div className="bg-[#FAF6ED] border border-[#DEC0B8] rounded-xl p-3 text-center text-xs text-[#57423C]">
              Noticeboard is clean (0 active civic notices). Use the button below to voice a community concern.
            </div>
          )}

          {/* Category Ribbon / Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#A03818]" />
                <h2 className="font-['Epilogue'] font-bold text-xs uppercase tracking-wider text-[#57423C]">
                  Browse by Civic Category
                </h2>
              </div>
              <button
                onClick={() => {
                  setFilterCategory('All');
                  navigateTo('problem-wall');
                }}
                className="touch-target min-h-[44px] flex items-center text-xs font-['Epilogue'] font-bold text-[#A03818] hover:underline cursor-pointer"
              >
                See All →
              </button>
            </div>

            {/* Horizontal scrollable category pill chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
              {categories.map((cat) => {
                const count = problems.filter((p) => p.category === cat.label).length;
                return (
                  <button
                    key={cat.label}
                    onClick={() => handleCategoryClick(cat.label)}
                    className="touch-target min-h-[44px] shrink-0 flex items-center gap-2 py-2 px-3.5 rounded-xl bg-[#FFFDF8] border border-[#DEC0B8] shadow-xs hover:border-[#A03818] hover:bg-[#FFF8F5] active:translate-y-0.5 transition-all cursor-pointer group"
                  >
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#1F1B17] shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.icon}
                    </span>
                    <span className="text-xs font-['Epilogue'] font-bold text-[#1F1B17] whitespace-nowrap">
                      {cat.label}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#FCF2EB] text-[#7C695E] font-bold">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Priority Civic Focus (Active in Progress) */}
          {priorityProblem && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pushpin color="mustard" size="sm" />
                  <h2 className="font-['Epilogue'] font-black text-base text-[#1F1B17] tracking-tight">
                    Needs Urgent Attention
                  </h2>
                </div>
                <span className="text-[11px] font-mono font-bold text-[#7B5300] bg-[#FFDDAE]/60 px-2 py-0.5 rounded">
                  In Progress
                </span>
              </div>

              <ProblemCard problem={priorityProblem} rotation={0.5} />
            </div>
          )}

          {/* Section: Recent Community Notices */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pushpin color="rust" size="sm" />
                <h2 className="font-['Epilogue'] font-black text-base text-[#1F1B17] tracking-tight">
                  Recent Neighborhood Problems
                </h2>
              </div>
              <button
                onClick={() => navigateTo('problem-wall')}
                className="text-xs font-['Epilogue'] font-bold text-[#A03818] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>All Problems</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {reportedAndInProgress.length === 0 ? (
                <div className="bg-[#FFFDF8] border-2 border-dashed border-[#DEC0B8] rounded-2xl p-6 text-center space-y-2.5">
                  <Pushpin color="mustard" size="md" />
                  <h3 className="font-['Epilogue'] font-black text-base text-[#1F1B17]">
                    0 Active Reports
                  </h3>
                  <p className="text-xs text-[#57423C] max-w-sm mx-auto leading-relaxed">
                    The community noticeboard is currently clear! If you see a broken light, open pothole, or garbage pile, tap below to report it.
                  </p>
                  <button
                    onClick={() => navigateTo('report-problem')}
                    className="mt-1 touch-target min-h-[44px] px-4 py-2 rounded-xl font-['Epilogue'] font-extrabold text-xs cork-btn-primary inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Report the First Problem</span>
                  </button>
                </div>
              ) : (
                reportedAndInProgress.slice(0, 3).map((problem, idx) => (
                  <ProblemCard
                    key={problem.id}
                    problem={problem}
                    rotation={idx % 2 === 0 ? -0.8 : 0.8}
                  />
                ))
              )}
            </div>
          </div>

          {/* Section: "The Wins" / Recently Solved Highlights */}
          {solvedProblems.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#FFDBD1] text-[#A03818] flex items-center justify-center text-xs font-bold">
                    ✓
                  </div>
                  <h2 className="font-['Epilogue'] font-black text-base text-[#1F1B17] tracking-tight">
                    Recently Solved by NSS Cadets
                  </h2>
                </div>
                <button
                  onClick={() => navigateTo('impact-gallery')}
                  className="text-xs font-['Epilogue'] font-bold text-[#A03818] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>View All Wins</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Solved Highlight Card with Before/After peek */}
              {solvedProblems.slice(0, 2).map((solved) => (
                <div
                  key={solved.id}
                  onClick={() => navigateTo('problem-detail', solved.id)}
                  className="relative bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-xl p-4 shadow-[0_4px_14px_rgba(43,38,34,0.07)] hover:shadow-md transition-all cursor-pointer -rotate-0.5"
                >
                  {/* Rust Pushpin */}
                  <div className="absolute -top-3 right-6">
                    <Pushpin color="rust" size="md" />
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <RubberStamp status="SOLVED" size="sm" />
                    <span className="text-xs font-['Epilogue'] font-extrabold text-[#A03818] bg-[#FFDBD1]/70 px-2 py-0.5 rounded-full">
                      {solved.impactMetrics || 'Fixed'}
                    </span>
                  </div>

                  <h3 className="font-['Epilogue'] font-bold text-sm sm:text-base text-[#1F1B17]">
                    {solved.title}
                  </h3>

                  <p className="text-xs text-[#6E5A4E] mt-1 line-clamp-2">
                    {solved.description}
                  </p>

                  {/* Before and After Photo split peek */}
                  {(solved.beforePhotoUrl || solved.photoUrl) && solved.solvedPhotoUrl && (
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-[#DEC0B8]/50">
                      <div className="space-y-1">
                        <div className="text-[10px] font-['Epilogue'] font-extrabold text-[#A03818] uppercase tracking-wider">
                          Before
                        </div>
                        <div className="h-24 rounded-lg overflow-hidden border border-[#DEC0B8] bg-[#FAF6ED]">
                          <img
                            src={solved.beforePhotoUrl || solved.photoUrl}
                            alt="Before"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-['Epilogue'] font-extrabold text-[#A03818] uppercase tracking-wider">
                          After (Fixed ✓)
                        </div>
                        <div className="h-24 rounded-lg overflow-hidden border border-[#DEC0B8] bg-[#FAF6ED]">
                          <img
                            src={solved.solvedPhotoUrl}
                            alt="After"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Quick Community Assurance Pin */}
          <div className="bg-[#FFF8F5] border border-[#DEC0B8] rounded-xl p-4 text-center text-xs text-[#6E5A4E] space-y-1">
            <div className="font-['Epilogue'] font-bold text-[#1F1B17] text-sm flex items-center justify-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-[#A03818]" />
              <span>National Service Scheme • Neighborhood Civic Cadre</span>
            </div>
            <p>
              All citizen posts can be submitted anonymously. NSS student volunteers review noticeboards and coordinate with local civic squads weekly.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
