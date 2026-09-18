import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProblemCard } from '../common/ProblemCard';
import { Pushpin } from '../common/Pushpin';
import { RubberStamp } from '../common/RubberStamp';
import {
  Search,
  SlidersHorizontal,
  Map as MapIcon,
  ListFilter,
  Plus,
  AlertTriangle,
  Flame,
  CheckCircle,
  MapPin,
  Eye,
  Info,
} from 'lucide-react';
import { ProblemCategory, ProblemStatus } from '../../types';

export const ProblemWallScreen: React.FC = () => {
  const {
    problems,
    myReportedProblemIds,
    filterCategory,
    setFilterCategory,
    searchQuery,
    setSearchQuery,
    navigateTo,
    isCommunityLoggedIn,
    currentCommunityMember,
    clearSampleData,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'ALL' | ProblemStatus | 'URGENT' | 'MY_REPORTS'>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedMapProblemId, setSelectedMapProblemId] = useState<string | null>(null);

  // Filter problems: only exclude explicitly rejected notices
  const filteredProblems = problems.filter((p) => {
    if (p.moderationStatus === 'REJECTED') {
      return false;
    }

    // My reports filter
    if (statusFilter === 'MY_REPORTS') {
      if (myReportedProblemIds && myReportedProblemIds.includes(p.id)) return true;
      if (!currentCommunityMember?.id) return false;
      return (
        p.reportedByUserId === currentCommunityMember.id ||
        (currentCommunityMember.fullName &&
          p.reportedByAuthor &&
          p.reportedByAuthor.toLowerCase() === currentCommunityMember.fullName.toLowerCase())
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchLoc = p.location.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc && !matchCat) return false;
    }

    // Category filter
    if (filterCategory !== 'All' && p.category !== filterCategory) {
      return false;
    }

    // Status filter
    if (statusFilter === 'URGENT') {
      return p.urgent;
    }
    if (statusFilter !== 'ALL' && p.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const defaultCategories = [
    'Garbage',
    'Streetlights',
    'Roads',
    'Water',
    'Greenery',
    'School',
    'Accessibility',
    'Sanitation',
    'Electrical',
  ];

  // Dynamically include any custom category submitted by neighbors
  const customCategories: string[] = Array.from(
    new Set(problems.map((p) => String(p.category)).filter((c) => !defaultCategories.includes(c)))
  );

  const categories: string[] = ['All', ...defaultCategories, ...customCategories];

  return (
    <div className="flex-1 w-full max-w-xl mx-auto px-4 pt-3 pb-6 space-y-3">
      {/* Header with notice count & list/map toggle */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="flex items-center gap-2">
            <Pushpin color="rust" size="sm" />
            <h1 className="font-['Epilogue'] font-black text-xl text-[#1F1B17] tracking-tight">
              All Problems
            </h1>
          </div>
          <p className="text-xs text-[#6E5A4E]">
            {filteredProblems.length} problems posted in our neighborhood
          </p>
        </div>

        {/* List / Map Toggle */}
        <div className="flex items-center p-1 bg-[#FFFDF8] border border-[#DEC0B8] rounded-xl shadow-xs">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-['Epilogue'] font-bold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-[#A03818] text-white shadow-xs'
                : 'text-[#6E5A4E] hover:text-[#A03818]'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>List</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-['Epilogue'] font-bold transition-all cursor-pointer ${
              viewMode === 'map'
                ? 'bg-[#A03818] text-white shadow-xs'
                : 'text-[#6E5A4E] hover:text-[#A03818]'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Map</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#A03818] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery || ''}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by problem, place, or street..."
          className="w-full pl-9.5 pr-4 py-2 bg-[#FFFDF8] border border-[#DEC0B8] rounded-xl text-sm text-[#1F1B17] placeholder:text-[#9E8B80] shadow-xs focus:outline-none focus:border-[#A03818]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8C7A70] hover:text-[#A03818] cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Status Filter Tabs (Rubber stamp styled) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-3 py-1 rounded-lg text-xs font-['Epilogue'] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-[#A03818] text-white shadow-xs'
              : 'bg-[#FFFDF8] border border-[#DEC0B8] text-[#57423C]'
          }`}
        >
          All ({problems.length})
        </button>

        <button
          onClick={() => setStatusFilter('URGENT')}
          className={`px-2.5 py-1 rounded-lg text-xs font-['Epilogue'] font-extrabold uppercase transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
            statusFilter === 'URGENT'
              ? 'bg-[#DC2626] text-white shadow-xs'
              : 'bg-[#FEE2E2] border border-[#FCA5A5] text-[#DC2626]'
          }`}
        >
          <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
          <span>Urgent</span>
        </button>

        <button
          onClick={() => setStatusFilter('REPORTED')}
          className={`px-2.5 py-1 rounded-lg text-xs font-['Epilogue'] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
            statusFilter === 'REPORTED'
              ? 'bg-[#A03818] text-white shadow-xs'
              : 'bg-[#FFDBD1]/50 border border-[#DEC0B8] text-[#A03818]'
          }`}
        >
          New
        </button>

        <button
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`px-2.5 py-1 rounded-lg text-xs font-['Epilogue'] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
            statusFilter === 'IN_PROGRESS'
              ? 'bg-[#B45309] text-white shadow-xs'
              : 'bg-[#FEF3C7] border border-[#FCD34D] text-[#B45309]'
          }`}
        >
          In Progress
        </button>

        <button
          onClick={() => setStatusFilter('SOLVED')}
          className={`px-2.5 py-1 rounded-lg text-xs font-['Epilogue'] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
            statusFilter === 'SOLVED'
              ? 'bg-[#A03818] text-white shadow-xs'
              : 'bg-[#FFDBD1]/40 border border-[#DEC0B8] text-[#A03818]'
          }`}
        >
          Solved ✓
        </button>

        {isCommunityLoggedIn && (
          <button
            onClick={() => setStatusFilter(statusFilter === 'MY_REPORTS' ? 'ALL' : 'MY_REPORTS')}
            className={`px-2.5 py-1 rounded-lg text-xs font-['Epilogue'] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'MY_REPORTS'
                ? 'bg-[#A03818] text-white shadow-xs'
                : 'bg-[#FCF2EB] border border-[#DEC0B8] text-[#A03818]'
            }`}
          >
            My Reports ({problems.filter((p) => (myReportedProblemIds && myReportedProblemIds.includes(p.id)) || p.reportedByUserId === currentCommunityMember?.id).length})
          </button>
        )}
      </div>

      {/* Category Dropdown Ribbon */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-['Epilogue'] font-semibold transition-all whitespace-nowrap cursor-pointer ${
              filterCategory === cat
                ? 'bg-[#A03818] text-white'
                : 'bg-[#FAF6ED] text-[#6E5A4E] border border-[#DEC0B8]/60 hover:bg-[#FFDBD1]/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* MAIN VIEW: LIST OR MAP */}
      {viewMode === 'list' ? (
        <div className="space-y-4 pt-1">
          {filteredProblems.length === 0 ? (
            <div className="bg-[#FFFDF8] border-2 border-dashed border-[#DEC0B8] rounded-xl p-8 text-center space-y-2">
              <Pushpin color="mustard" size="md" />
              <h3 className="font-['Epilogue'] font-bold text-base text-[#1F1B17]">
                No problems found
              </h3>
              <p className="text-xs text-[#6E5A4E]">
                Try clearing your search or tap All in the filter ribbons above.
              </p>
            </div>
          ) : (
            filteredProblems.map((problem, index) => (
              <ProblemCard
                key={problem.id}
                problem={problem}
                rotation={index % 3 === 0 ? -0.8 : index % 3 === 1 ? 0.7 : -0.3}
              />
            ))
          )}
        </div>
      ) : (
        /* MAP VIEW: Hand-illustrated Community Corkboard Map */
        <div className="space-y-3">
          <div className="relative w-full aspect-4/3 bg-[#E8DFC9] border-2 border-[#C1B296] rounded-2xl overflow-hidden shadow-inner p-3">
            {/* Map Grid and streets representation */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#d8cdb4_1px,transparent_1px),linear-gradient(to_bottom,#d8cdb4_1px,transparent_1px)] bg-[size:40px_40px] opacity-70" />

            {/* Neighborhood Street Labels */}
            <div className="absolute top-4 left-6 text-[10px] font-mono font-bold text-[#7C695E] uppercase tracking-wider">
              North Avenue • Main District
            </div>
            <div className="absolute bottom-6 right-8 text-[10px] font-mono font-bold text-[#7C695E] uppercase tracking-wider">
              Main Bazaar Road
            </div>
            <div className="absolute top-1/2 left-8 -rotate-90 text-[10px] font-mono font-bold text-[#7C695E] uppercase tracking-wider">
              Elm Street
            </div>

            {/* NSS Volunteer Office Flag */}
            <div className="absolute top-6 right-6 bg-[#38665E] text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-md flex items-center gap-1 z-10">
              <span>★</span>
              <span>NSS Volunteer Office</span>
            </div>

            {/* Interactive Pins on Map */}
            {filteredProblems.map((p, idx) => {
              // Deterministic positions based on idx
              const positions = [
                { top: '35%', left: '42%' },
                { top: '22%', left: '25%' },
                { top: '65%', left: '70%' },
                { top: '75%', left: '30%' },
                { top: '48%', left: '78%' },
                { top: '82%', left: '60%' },
                { top: '28%', left: '65%' },
                { top: '55%', left: '20%' },
                { top: '40%', left: '50%' },
              ];
              const pos = positions[idx % positions.length];
              const isSelected = selectedMapProblemId === p.id;

              const pinColor =
                p.status === 'SOLVED'
                  ? 'teal'
                  : p.status === 'IN_PROGRESS'
                  ? 'mustard'
                  : 'rust';

              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedMapProblemId(p.id)}
                  style={{ top: pos.top, left: pos.left }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-transform duration-200 z-20 ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                  }`}
                >
                  <Pushpin color={pinColor} size={isSelected ? 'lg' : 'md'} />
                  {p.urgent && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border border-white animate-ping" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Pin Details Box */}
          {selectedMapProblemId ? (
            <div>
              {(() => {
                const sel = problems.find((p) => p.id === selectedMapProblemId);
                if (!sel) return null;
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-['Epilogue'] font-bold text-[#A03818]">
                      <span>Selected Problem:</span>
                      <button
                        onClick={() => setSelectedMapProblemId(null)}
                        className="underline text-[#7C695E] cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                    <ProblemCard problem={sel} />
                  </div>
                );
              })()}
            </div>
          ) : (
            <p className="text-center text-xs text-[#7C695E]">
              Tap any pin on the map to see details.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
