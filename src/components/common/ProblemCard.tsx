import React from 'react';
import { Problem } from '../../types';
import { useApp } from '../../context/AppContext';
import { Pushpin } from './Pushpin';
import { RubberStamp } from './RubberStamp';
import {
  MapPin,
  Flame,
  Eye,
  MessageSquare,
  ThumbsUp,
  Link2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/dateUtils';

interface ProblemCardProps {
  problem: Problem;
  rotation?: number;
  showActions?: boolean;
}

export const ProblemCard: React.FC<ProblemCardProps> = ({
  problem,
  rotation = 0,
  showActions = true,
}) => {
  const {
    navigateTo,
    toggleUpvote,
    toggleAdopt,
    upvotedProblemIds,
    adoptedProblemIds,
    userRole,
  } = useApp();

  const isUpvoted = upvotedProblemIds.includes(problem.id);
  const isAdopted = adoptedProblemIds.includes(problem.id);

  const getPinColor = () => {
    if (problem.status === 'SOLVED') return 'teal';
    if (problem.status === 'IN_PROGRESS') return 'mustard';
    return 'rust';
  };

  const handleCardClick = () => {
    navigateTo('problem-detail', problem.id);
  };

  return (
    <div
      style={{ transform: `rotate(${rotation}deg)` }}
      className="relative bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-xl p-4 shadow-[0_4px_14px_rgba(43,38,34,0.08)] hover:shadow-[0_8px_20px_rgba(43,38,34,0.14)] hover:rotate-0 transition-all duration-200 group cursor-pointer"
      onClick={handleCardClick}
    >
      {/* 3D Pushpin on top center */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <Pushpin color={getPinColor()} size="md" />
      </div>

      {/* Top Meta Line: Rubber Stamp + Category + Urgent Flag */}
      <div className="flex items-center justify-between gap-2 pt-1 mb-2.5">
        <RubberStamp status={problem.status} size="sm" />

        <div className="flex items-center gap-1.5">
          {problem.urgent && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FFDBD1] text-[#A03818] border border-[#A03818]/30 text-[10px] font-['Epilogue'] font-black uppercase tracking-wider animate-pulse">
              <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
              <span>Urgent</span>
            </span>
          )}

          <span className="text-[11px] font-['Epilogue'] font-bold px-2 py-0.5 rounded-full bg-[#FCF2EB] text-[#57423C] border border-[#DEC0B8]">
            {problem.category}
          </span>
        </div>
      </div>

      {/* Main Content & Thumbnail */}
      <div className="flex gap-3">
        {/* Photo thumbnail with paper border */}
        {problem.photoUrl && (
          <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 border-[#DEC0B8] shadow-xs bg-[#FAF6ED]">
            <img
              src={problem.photoUrl}
              alt={problem.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {problem.status === 'SOLVED' && (
              <div className="absolute inset-0 bg-[#1B4B43]/30 flex items-center justify-center">
                <span className="text-white text-xs font-black drop-shadow-md">✓</span>
              </div>
            )}
          </div>
        )}

        {/* Text Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-['Epilogue'] font-extrabold text-sm sm:text-base text-[#1F1B17] line-clamp-2 leading-snug group-hover:text-[#A03818] transition-colors">
            {problem.title}
          </h3>

          <p className="text-xs text-[#6E5A4E] line-clamp-2 mt-1 leading-normal">
            {problem.description}
          </p>

          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-medium text-[#7C695E]">
            <MapPin className="w-3.5 h-3.5 text-[#A03818] shrink-0" />
            <span className="truncate">{problem.location}</span>
          </div>
        </div>
      </div>

      {/* Linked Reports indicator & Squad Assignment Note */}
      <div className="mt-3 pt-2.5 border-t border-[#F1E6E0] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {problem.linkedDuplicatesCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#7B5300] bg-[#FFDDAE]/60 px-1.5 py-0.5 rounded font-bold">
              <Link2 className="w-3 h-3" />
              <span>+{problem.linkedDuplicatesCount} similar reports</span>
            </span>
          )}

          {problem.assignedSquad && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1B4B43] bg-[#B8EADE]/60 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" />
              <span>{problem.assignedSquad}</span>
            </span>
          )}
        </div>

        <span
          className="inline-flex items-center gap-1 text-[11px] text-[#7C695E] font-medium tracking-tight"
          title={problem.createdAt}
        >
          <Clock className="w-3 h-3 text-[#A8988D] shrink-0" />
          <span>{formatRelativeTime(problem.createdAt)}</span>
        </span>
      </div>

      {/* Action Footer: Upvote & Adopt Buttons */}
      {showActions && (
        <div
          className="mt-2.5 pt-2 border-t border-[#DEC0B8]/60 flex items-center justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Agreement / Upvote */}
          <button
            onClick={() => toggleUpvote(problem.id)}
            className={`touch-target min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-['Epilogue'] font-bold transition-all cursor-pointer ${
              isUpvoted
                ? 'bg-[#A03818] text-white border-[#842504] shadow-xs'
                : 'bg-[#FFFDF8] text-[#57423C] border-[#DEC0B8] hover:bg-[#FFDBD1]/40'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${isUpvoted ? 'fill-white' : ''}`} />
            <span>{problem.upvotes}</span>
            <span className="hidden sm:inline font-normal text-[11px] opacity-80">
              I Agree
            </span>
          </button>

          <div className="flex items-center gap-1.5">
            {/* Watch problem */}
            <button
              onClick={() => toggleAdopt(problem.id)}
              className={`touch-target min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-['Epilogue'] font-medium transition-all cursor-pointer ${
                isAdopted
                  ? 'bg-[#FFDBD1]/80 text-[#A03818] border-[#A03818]'
                  : 'bg-[#FFFDF8] text-[#57423C] border-[#DEC0B8] hover:bg-[#FAF6ED]'
              }`}
              title="Watch this problem to get updates"
            >
              <Eye className="w-4 h-4 text-[#A03818]" />
              <span>{problem.adoptersCount}</span>
              <span className="text-[10px] text-[#57423C]">watching</span>
            </button>

            {/* Comments badge */}
            <button
              onClick={handleCardClick}
              className="touch-target min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium text-[#7C695E] hover:text-[#A03818] cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-[#A03818]" />
              <span>{problem.comments.length}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
