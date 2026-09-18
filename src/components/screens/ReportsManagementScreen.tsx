import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Pushpin } from '../common/Pushpin';
import { RubberStamp } from '../common/RubberStamp';
import {
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ThumbsUp,
  Eye,
  MapPin,
  Clock,
  AlertTriangle,
  Play,
  Check,
  Wrench,
  Sparkles,
  Link2,
} from 'lucide-react';
import { Problem } from '../../types';
import { formatRelativeTime } from '../../utils/dateUtils';

export const ReportsManagementScreen: React.FC = () => {
  const {
    problems,
    currentVolunteer,
    volunteerApproveTask,
    userRole,
    navigateTo,
    isAdminLoggedIn,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNCLAIMED' | 'MY_TASKS' | 'IN_PROGRESS' | 'SOLVED'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = ['ALL', 'Sanitation', 'Roads', 'Water', 'Electricity', 'Public Safety', 'Parks'];

  const isAssignedToCurrentVolunteer = (p: Problem) => {
    return (
      (p.assignedToVolunteerId === currentVolunteer.id ||
        p.assignedLead === currentVolunteer.name ||
        p.assignedLead === currentVolunteer.displayName ||
        p.assignedVolunteers?.includes(currentVolunteer.name) ||
        (p.assignedLead &&
          p.assignedLead.toLowerCase() ===
            (currentVolunteer.displayName || currentVolunteer.name).toLowerCase())) &&
      p.assignmentStatus !== 'DECLINED'
    );
  };

  const displayedProblems = problems.filter((p) => {
    // Filter by tab
    if (activeFilter === 'UNCLAIMED' && (p.status !== 'REPORTED' || Boolean(p.assignedLead))) return false;
    if (activeFilter === 'MY_TASKS' && (!isAssignedToCurrentVolunteer(p) || p.status === 'SOLVED')) return false;
    if (activeFilter === 'IN_PROGRESS' && p.status !== 'IN_PROGRESS') return false;
    if (activeFilter === 'SOLVED' && p.status !== 'SOLVED') return false;

    // Filter by Category
    if (selectedCategory !== 'ALL' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleApproveAndWork = (problemId: string) => {
    volunteerApproveTask(problemId);
    navigateTo('action-tracker', problemId);
  };

  const unclaimedCount = problems.filter((p) => p.status === 'REPORTED' && !p.assignedLead).length;
  const myTasksCount = problems.filter((p) => isAssignedToCurrentVolunteer(p) && p.status !== 'SOLVED').length;
  const inProgressCount = problems.filter((p) => p.status === 'IN_PROGRESS').length;
  const solvedCount = problems.filter((p) => p.status === 'SOLVED').length;

  return (
    <div className="pb-24 px-4 pt-3 max-w-xl mx-auto space-y-4">
      {/* Screen Title & Role Notice */}
      <div className="pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pushpin color="teal" size="sm" />
            <h1 className="font-['Epilogue'] font-black text-xl text-[#1F1B17]">
              Civic Reports & Tasks
            </h1>
          </div>
          {isAdminLoggedIn && (
            <button
              onClick={() => navigateTo('admin')}
              className="text-xs font-['Epilogue'] font-bold text-[#A03818] bg-[#FFF0E6] border border-[#F5C2A5] px-2.5 py-1 rounded-lg hover:bg-[#FFE5D6] cursor-pointer"
            >
              Officer Portal →
            </button>
          )}
        </div>
        <p className="text-xs text-[#6E5A4E] mt-0.5">
          Review community-reported hazards, approve tasks to take them up, and log field remediation in the Action Tracker.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#7C695E]" />
        <input
          type="text"
          placeholder="Search by issue title, landmark, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-xl text-xs text-[#1F1B17] placeholder:text-[#8C7A70] focus:outline-none focus:border-[#1B4B43] shadow-xs"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-2.5 text-xs text-[#7C695E] hover:text-[#1F1B17] cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Main Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs font-['Epilogue'] font-bold">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
            activeFilter === 'ALL'
              ? 'bg-[#1B4B43] text-white shadow-xs'
              : 'bg-[#FFFDF8] border border-[#DEC0B8] text-[#57423C] hover:bg-[#FAF6ED]'
          }`}
        >
          All ({problems.length})
        </button>

        <button
          onClick={() => setActiveFilter('UNCLAIMED')}
          className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1 ${
            activeFilter === 'UNCLAIMED'
              ? 'bg-[#A03818] text-white shadow-xs'
              : 'bg-[#FFFDF8] border border-[#DEC0B8] text-[#A03818] hover:bg-[#FFDBD1]/30'
          }`}
        >
          <span>Open to Take Up</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">
            {unclaimedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('MY_TASKS')}
          className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1 ${
            activeFilter === 'MY_TASKS'
              ? 'bg-[#38665E] text-white shadow-xs'
              : 'bg-[#FFFDF8] border border-[#DEC0B8] text-[#1B4B43] hover:bg-[#B8EADE]/30'
          }`}
        >
          <span>My Tasks</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">
            {myTasksCount}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('IN_PROGRESS')}
          className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
            activeFilter === 'IN_PROGRESS'
              ? 'bg-[#7B5300] text-white shadow-xs'
              : 'bg-[#FFFDF8] border border-[#DEC0B8] text-[#7B5300] hover:bg-[#FFDDAE]/30'
          }`}
        >
          In Progress ({inProgressCount})
        </button>

        <button
          onClick={() => setActiveFilter('SOLVED')}
          className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
            activeFilter === 'SOLVED'
              ? 'bg-[#1B4B43] text-white shadow-xs'
              : 'bg-[#FFFDF8] border border-[#DEC0B8] text-[#1B4B43] hover:bg-[#B8EADE]/30'
          }`}
        >
          Solved ({solvedCount})
        </button>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
        <span className="text-[10px] font-mono text-[#7C695E] uppercase font-bold shrink-0">
          Category:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2 py-0.5 rounded-full border whitespace-nowrap cursor-pointer transition-all ${
              selectedCategory === cat
                ? 'bg-[#1F1B17] text-white border-[#1F1B17]'
                : 'bg-[#FFFDF8] text-[#57423C] border-[#DEC0B8] hover:bg-[#FAF6ED]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Problems List */}
      {displayedProblems.length === 0 ? (
        <div className="bg-[#FFFDF8] border-2 border-dashed border-[#DEC0B8] rounded-xl p-8 text-center space-y-2">
          <Pushpin color="mustard" size="md" />
          <h3 className="font-['Epilogue'] font-bold text-sm text-[#1F1B17]">
            No Reports Found
          </h3>
          <p className="text-xs text-[#6E5A4E]">
            {activeFilter === 'UNCLAIMED'
              ? 'All current civic notices have been taken up or resolved!'
              : activeFilter === 'MY_TASKS'
              ? "You don't have any active missions currently. Browse 'Open to Take Up' to approve a task and begin field action!"
              : 'No civic reports match your filter criteria.'}
          </p>
          {activeFilter !== 'ALL' && (
            <button
              onClick={() => {
                setActiveFilter('ALL');
                setSelectedCategory('ALL');
                setSearch('');
              }}
              className="mt-2 text-xs font-['Epilogue'] font-bold text-[#A03818] underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayedProblems.map((p) => {
            const isMine = isAssignedToCurrentVolunteer(p);
            const isOpenToTakeUp = p.status === 'REPORTED' && !p.assignedLead;

            return (
              <div
                key={p.id}
                className={`bg-[#FFFDF8] border-2 rounded-xl p-4 shadow-xs transition-all ${
                  isMine && p.status !== 'SOLVED'
                    ? 'border-[#1B4B43] bg-[#F7FBF9]'
                    : isOpenToTakeUp
                    ? 'border-[#DEC0B8] hover:border-[#A03818]'
                    : 'border-[#DEC0B8]'
                }`}
              >
                {/* Header: Rubber stamp, Category, Urgent badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <RubberStamp status={p.status} size="sm" />
                    <span className="text-[11px] font-['Epilogue'] font-bold text-[#57423C] bg-[#FAF6ED] px-2 py-0.5 rounded border border-[#DEC0B8]">
                      {p.category}
                    </span>
                    {p.urgent && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FFDBD1] text-[#A03818] border border-[#FCA5A5] uppercase animate-pulse">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Urgent
                      </span>
                    )}
                  </div>

                  {/* Assignment Badge */}
                  {p.status === 'SOLVED' ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#B8EADE] text-[#1B4B43] border border-[#96D6C8] font-bold">
                      Solved ✓
                    </span>
                  ) : isMine ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#B8EADE] text-[#1B4B43] border border-[#96D6C8] font-bold">
                      Assigned to You
                    </span>
                  ) : p.assignedLead ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAF6ED] text-[#7C695E] border border-[#DEC0B8] font-bold">
                      Assigned to {p.assignedLead}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FFDBD1] text-[#A03818] border border-[#F5C2A5] font-bold">
                      Open to Take Up
                    </span>
                  )}
                </div>

                {/* Main Content & Thumbnail */}
                <div className="mt-2.5 flex gap-3">
                  {p.photoUrl && (
                    <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-[#DEC0B8] bg-[#FAF6ED]">
                      <img
                        src={p.photoUrl}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-['Epilogue'] font-bold text-sm text-[#1F1B17] line-clamp-1">
                      {p.title}
                    </h3>
                    <p className="text-xs text-[#6E5A4E] line-clamp-2 mt-0.5">
                      {p.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#7C695E] mt-1.5">
                      <MapPin className="w-3 h-3 text-[#A03818] shrink-0" />
                      <span className="truncate">{p.location}</span>
                      <span className="text-[#DEC0B8]">•</span>
                      <Clock className="w-3 h-3 text-[#8C7A70] shrink-0" />
                      <span>{formatRelativeTime(p.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Duplicate note if present */}
                {p.linkedDuplicatesCount > 0 && (
                  <div className="mt-2 p-1.5 rounded bg-[#FFDDAE]/40 border border-[#7B5300]/20 text-[11px] text-[#7B5300] flex items-center gap-1.5">
                    <Link2 className="w-3 h-3 shrink-0" />
                    <span>
                      <strong>+{p.linkedDuplicatesCount} similar reports</strong> linked from neighbors.
                    </span>
                  </div>
                )}

                {/* Card Action Footer: Community metrics on left, Volunteer workflow action on right */}
                <div className="mt-3 pt-2.5 border-t border-[#F1E6E0] flex flex-wrap items-center justify-between gap-2">
                  {/* Community backing metric */}
                  <div className="flex items-center gap-2 text-xs text-[#7C695E]">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <ThumbsUp className="w-3.5 h-3.5 text-[#A03818]" />
                      <span>{p.upvotes} {p.upvotes === 1 ? 'endorsement' : 'endorsements'}</span>
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Eye className="w-3.5 h-3.5 text-[#1B4B43]" />
                      <span>{p.adoptersCount} watching</span>
                    </span>
                  </div>

                  {/* Actions for Volunteers */}
                  <div className="flex items-center gap-1.5">
                    {/* View Details Button */}
                    <button
                      onClick={() => navigateTo('problem-detail', p.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] text-xs font-['Epilogue'] font-bold text-[#57423C] hover:bg-[#F1E6E0] cursor-pointer transition-all"
                    >
                      View
                    </button>

                    {/* Primary Action Button based on task state */}
                    {p.status === 'SOLVED' ? (
                      <button
                        onClick={() => navigateTo('problem-detail', p.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#1B4B43] text-white text-xs font-['Epilogue'] font-bold flex items-center gap-1 shadow-xs hover:bg-[#153a34] cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>View Proof</span>
                      </button>
                    ) : isMine ? (
                      <button
                        onClick={() => navigateTo('action-tracker', p.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#1B4B43] text-white text-xs font-['Epilogue'] font-bold flex items-center gap-1.5 shadow-xs hover:bg-[#153a34] cursor-pointer"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Work on Task</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : isOpenToTakeUp ? (
                      <button
                        onClick={() => handleApproveAndWork(p.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#A03818] text-white text-xs font-['Epilogue'] font-bold flex items-center gap-1.5 shadow-xs hover:bg-[#842504] cursor-pointer transition-all"
                        title="Approve this task to take it up and log field action"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Approve & Work on Task</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#7C695E] font-medium px-2 py-1 bg-[#FAF6ED] rounded border border-[#DEC0B8]">
                        Squad active
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
