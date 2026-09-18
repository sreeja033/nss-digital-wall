import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Pushpin } from '../common/Pushpin';
import { RubberStamp } from '../common/RubberStamp';
import { WashiTape } from '../common/WashiTape';
import {
  MapPin,
  ThumbsUp,
  Eye,
  MessageSquare,
  Share2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Camera,
  Send,
  Link2,
  ArrowRight,
  UserCheck,
  Calendar,
  Wrench,
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/dateUtils';

export const ProblemDetailScreen: React.FC = () => {
  const {
    selectedProblem,
    toggleUpvote,
    toggleAdopt,
    upvotedProblemIds,
    adoptedProblemIds,
    addComment,
    userRole,
    isVolunteerLoggedIn,
    currentVolunteer,
    volunteerApproveTask,
    navigateTo,
    setUserRole,
  } = useApp();

  const [commentText, setCommentText] = useState('');

  if (!selectedProblem) {
    return (
      <div className="min-h-screen p-8 text-center max-w-md mx-auto space-y-3">
        <p className="text-sm text-[#7C695E]">No problem selected.</p>
        <button
          onClick={() => navigateTo('problem-wall')}
          className="px-4 py-2 bg-[#A03818] text-white rounded-lg text-sm font-bold cursor-pointer"
        >
          Back to Problems
        </button>
      </div>
    );
  }

  const isUpvoted = upvotedProblemIds.includes(selectedProblem.id);
  const isAdopted = adoptedProblemIds.includes(selectedProblem.id);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(selectedProblem.id, commentText);
    setCommentText('');
  };

  const getPinColor = () => {
    if (selectedProblem.status === 'SOLVED') return 'teal';
    if (selectedProblem.status === 'IN_PROGRESS') return 'mustard';
    return 'rust';
  };

  return (
    <div className="pb-24 px-4 pt-3 max-w-xl mx-auto space-y-4">
      {/* Main Notice Sheet */}
      <div className="relative bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-2xl p-4 sm:p-5 shadow-[0_4px_16px_rgba(43,38,34,0.08)] mt-4">
        {/* Top Pushpin */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <Pushpin color={getPinColor()} size="lg" />
        </div>
        {/* Washi tape accents */}
        <div className="absolute -top-2.5 left-4 -rotate-6 z-10">
          <WashiTape color="yellow" width="w-16" />
        </div>
        <div className="absolute -top-2.5 right-4 rotate-6 z-10">
          <WashiTape color="mint" width="w-16" />
        </div>

        {/* Rubber stamp, Origin Tag & Category */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 sm:pt-2.5 mb-3">
          <RubberStamp status={selectedProblem.status} size="md" />

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Origin Tag: Assigned vs Self-Claimed */}
            {selectedProblem.assignedBy ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-['Epilogue'] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF0E6] text-[#C1502E] border border-[#F5C2A5]">
                <UserCheck className="w-3 h-3" />
                <span>Assigned by {selectedProblem.assignedBy}</span>
              </span>
            ) : selectedProblem.assignedLead ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-['Epilogue'] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF6ED] text-[#7C695E] border border-[#DEC0B8]">
                <ShieldCheck className="w-3 h-3 text-[#A03818]" />
                <span>Claimed by volunteer</span>
              </span>
            ) : null}

            {selectedProblem.urgent && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FFDBD1] text-[#A03818] border border-[#A03818]/30 text-xs font-['Epilogue'] font-black uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Urgent</span>
              </span>
            )}
            {selectedProblem.linkedDuplicatesCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF0E6] text-[#C1502E] border border-[#F5C2A5] text-xs font-['Epilogue'] font-bold">
                <Link2 className="w-3.5 h-3.5" />
                <span>+{selectedProblem.linkedDuplicatesCount} Linked Reports</span>
              </span>
            )}
            <span className="text-xs font-['Epilogue'] font-bold px-2.5 py-1 rounded-full bg-[#FCF2EB] text-[#57423C] border border-[#DEC0B8]">
              {selectedProblem.category}
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-['Epilogue'] font-black text-xl sm:text-2xl text-[#1F1B17] tracking-tight leading-snug">
          {selectedProblem.title}
        </h1>

        {/* Meta info: Location, landmark, date */}
        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-2 text-xs text-[#7C695E] pb-3 border-b border-[#F1E6E0]">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#A03818]" />
            <span className="font-medium text-[#1F1B17]">{selectedProblem.location}</span>
          </div>
          {selectedProblem.landmark && (
            <span className="text-[#8C7A70]">({selectedProblem.landmark})</span>
          )}
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <Clock className="w-3 h-3" />
            <span>Posted {formatRelativeTime(selectedProblem.createdAt)}</span>
          </div>
        </div>

        {/* Main Photo (or Solved Before/After Comparison) */}
        {selectedProblem.status === 'SOLVED' && selectedProblem.solvedPhotoUrl ? (
          <div className="my-4 space-y-2">
            <div className="text-xs font-['Epilogue'] font-black text-[#1B4B43] uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#1B4B43]" />
              <span>Before and After Photos</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <span className="text-[10px] font-['Epilogue'] font-bold text-[#A03818] uppercase">
                  Before
                </span>
                <div className="h-32 rounded-xl overflow-hidden border-2 border-[#DEC0B8] shadow-xs bg-[#FAF6ED]">
                  <img
                    src={selectedProblem.beforePhotoUrl || selectedProblem.photoUrl}
                    alt="Before"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-['Epilogue'] font-bold text-[#1B4B43] uppercase">
                  After (Fixed ✓)
                </span>
                <div className="h-32 rounded-xl overflow-hidden border-2 border-[#B8EADE] shadow-xs bg-[#FAF6ED]">
                  <img
                    src={selectedProblem.solvedPhotoUrl}
                    alt="After"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          selectedProblem.photoUrl && (
            <div className="my-4 rounded-xl overflow-hidden border-2 border-[#DEC0B8] shadow-sm max-h-64 bg-[#FAF6ED]">
              <img
                src={selectedProblem.photoUrl}
                alt={selectedProblem.title}
                className="w-full h-full object-cover"
              />
            </div>
          )
        )}

        {/* Description Body */}
        <div className="space-y-2 text-sm text-[#3E342F] leading-relaxed">
          <p>{selectedProblem.description}</p>
        </div>

        {/* Linked Duplicates & Assigned Squad Info */}
        {(selectedProblem.linkedDuplicatesCount > 0 || selectedProblem.assignedSquad) && (
          <div className="mt-4 p-3 bg-[#FAF6ED] rounded-xl border border-[#DEC0B8] space-y-2">
            {selectedProblem.linkedDuplicatesCount > 0 && (
              <div className="flex items-center gap-2 text-xs font-medium text-[#7B5300]">
                <Link2 className="w-4 h-4 text-[#7B5300] shrink-0" />
                <span>
                  <strong>+{selectedProblem.linkedDuplicatesCount} similar reports</strong>{' '}
                  from neighbors were linked to this problem.
                </span>
              </div>
            )}
            {selectedProblem.assignedSquad && (
              <div className="space-y-2 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#1B4B43]">
                    <ShieldCheck className="w-4 h-4 text-[#1B4B43] shrink-0" />
                    <span>
                      Team: <strong>{selectedProblem.assignedSquad}</strong>
                      {selectedProblem.assignedLead ? ` • Lead: ${selectedProblem.assignedLead}` : ''}
                    </span>
                  </div>

                  {selectedProblem.assignedBy ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFF0E6] text-[#C1502E] border border-[#F5C2A5]">
                      Assigned by {selectedProblem.assignedBy}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFFDF8] text-[#57423C] border border-[#DEC0B8]">
                      Claimed by volunteer
                    </span>
                  )}
                </div>

                {(selectedProblem.targetDate || selectedProblem.materialsNeeded) && (
                  <div className="pt-2 border-t border-[#DEC0B8]/60 text-xs space-y-1.5 text-[#57423C]">
                    {selectedProblem.targetDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#C1502E]" />
                        <span>Planned date: <strong>{selectedProblem.targetDate}</strong></span>
                      </div>
                    )}
                    {selectedProblem.materialsNeeded && (
                      <div className="flex items-start gap-1.5 text-[#6E5A4E]">
                        <Wrench className="w-3.5 h-3.5 text-[#7B5300] shrink-0 mt-0.5" />
                        <span>Supplies: <strong>{selectedProblem.materialsNeeded}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="mt-5 pt-3 border-t border-[#DEC0B8] flex items-center justify-between gap-2">
          {/* Upvote Button */}
          <button
            onClick={() => toggleUpvote(selectedProblem.id)}
            className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-['Epilogue'] font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
              isUpvoted
                ? 'bg-[#A03818] text-white border-[#842504] shadow-sm'
                : 'bg-[#FFF8F5] text-[#57423C] border-[#DEC0B8] hover:bg-[#FFDBD1]/50'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${isUpvoted ? 'fill-white' : ''}`} />
            <span>I Agree ({selectedProblem.upvotes})</span>
          </button>

          {/* "Watch this" Follow Button */}
          <button
            onClick={() => toggleAdopt(selectedProblem.id)}
            className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-['Epilogue'] font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
              isAdopted
                ? 'bg-[#FFDBD1] text-[#A03818] border-[#A03818] shadow-sm'
                : 'bg-[#FFF8F5] text-[#57423C] border-[#DEC0B8] hover:bg-[#FFDBD1]/40'
            }`}
            title="Watch this problem to get updates"
          >
            <Eye className="w-4 h-4 text-[#A03818]" />
            <span>
              {isAdopted ? 'Watching ✓' : 'Watch'} ({selectedProblem.adoptersCount})
            </span>
          </button>
        </div>

        <p className="text-[11px] text-[#8C7A70] text-center mt-2">
          Watched by {selectedProblem.adoptersCount} neighbors. No login needed.
        </p>
      </div>

      {/* Volunteer / Admin Status Card */}
      {userRole === 'volunteer' && (
        <div className="bg-[#FAF6ED] border-2 border-[#B8EADE] rounded-xl p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#1B4B43]" />
              <div>
                <div className="font-['Epilogue'] font-bold text-xs text-[#1F1B17]">
                  Cadet Task Assignment
                </div>
                <div className="text-[11px] text-[#57423C]">
                  {selectedProblem.assignedLead
                    ? `Assigned Lead: ${selectedProblem.assignedLead}`
                    : 'Open civic report • Available for volunteer action'}
                </div>
              </div>
            </div>

            {(selectedProblem.assignedToVolunteerId === currentVolunteer.id ||
              selectedProblem.assignedLead === currentVolunteer.name ||
              selectedProblem.assignedLead === currentVolunteer.displayName) ? (
              <button
                onClick={() => navigateTo('action-tracker', selectedProblem.id)}
                className="px-3.5 py-1.5 rounded-lg bg-[#1B4B43] text-white text-xs font-['Epilogue'] font-bold shadow-xs flex items-center gap-1.5 cursor-pointer hover:bg-[#153a34]"
              >
                <span>Work on Task</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : selectedProblem.status === 'REPORTED' && !selectedProblem.assignedLead ? (
              <button
                onClick={() => {
                  volunteerApproveTask(selectedProblem.id);
                  navigateTo('action-tracker', selectedProblem.id);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#A03818] text-white text-xs font-['Epilogue'] font-bold shadow-xs flex items-center gap-1.5 cursor-pointer hover:bg-[#842504] transition-all"
              >
                <span>Approve & Work on Task</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF6ED] text-[#57423C] border border-[#DEC0B8] font-bold">
                Assigned to {selectedProblem.assignedLead}
              </span>
            )}
          </div>

          <p className="text-[10.5px] text-[#7C695E] border-t border-[#DEC0B8]/60 pt-2">
            Volunteers can approve open community reports to start field remediation immediately. Log progress photos and mark resolved in the Action Tracker.
          </p>
        </div>
      )}

      {userRole === 'admin' && (
        <div className="bg-[#FFF0E6] border-2 border-[#F5C2A5] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="font-['Epilogue'] font-bold text-xs text-[#C1502E]">
              Officer Control Panel
            </div>
            <div className="text-[11px] text-[#57423C]">
              Currently assigned: {selectedProblem.assignedLead || 'Unassigned'}
            </div>
          </div>
          <button
            onClick={() => navigateTo('admin')}
            className="px-3 py-1.5 rounded-lg bg-[#C1502E] text-white text-xs font-['Epilogue'] font-bold shadow-xs hover:bg-[#A03818] cursor-pointer"
          >
            Assign in Admin Portal →
          </button>
        </div>
      )}

      {/* Verification & Action Timeline */}
      <div className="bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-2xl p-5 shadow-[0_4px_14px_rgba(43,38,34,0.06)] space-y-3">
        <div className="flex items-center justify-between border-b border-[#F1E6E0] pb-2">
          <div className="flex items-center gap-2">
            <Pushpin color="mustard" size="sm" />
            <h3 className="font-['Epilogue'] font-black text-base text-[#1F1B17]">
              Progress Updates
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#7C695E]">
            {selectedProblem.updates.length} updates
          </span>
        </div>

        {selectedProblem.updates.length === 0 ? (
          <p className="text-xs text-[#7C695E] py-2">
            No updates yet. When volunteers start working, updates will appear here.
          </p>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#DEC0B8]">
            {selectedProblem.updates.map((update, idx) => (
              <div key={update.id} className="relative space-y-1">
                {/* Timeline node icon */}
                <div className="absolute -left-6 top-1 w-4.5 h-4.5 rounded-full bg-[#FFFDF8] border-2 border-[#A03818] flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#A03818]" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-['Epilogue'] font-bold text-xs text-[#1F1B17]">
                      {update.author}
                    </span>
                    <span className="text-[10px] font-semibold text-[#7C695E] px-1.5 py-0.2 rounded bg-[#FCF2EB] border border-[#DEC0B8]/60">
                      {update.role}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#8C7A70]">{update.timestamp}</span>
                </div>

                <p className="text-xs text-[#57423C] leading-normal">{update.description}</p>

                {update.photoUrl && (
                  <div className="mt-1.5 rounded-lg overflow-hidden border border-[#DEC0B8] max-h-40 bg-[#FAF6ED]">
                    <img
                      src={update.photoUrl}
                      alt="Update evidence"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Community Sticky Notes Thread */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pushpin color="rust" size="sm" />
            <h3 className="font-['Epilogue'] font-black text-base text-[#1F1B17]">
              Neighbor Notes ({selectedProblem.comments.length})
            </h3>
          </div>
          <span className="text-[10px] font-['Caveat'] text-base text-[#A03818] font-bold -rotate-3">
            Leave a note
          </span>
        </div>

        {/* Existing Sticky Notes */}
        <div className="space-y-3">
          {selectedProblem.comments.map((c, idx) => (
            <div
              key={c.id}
              style={{
                backgroundColor: c.bgColor || (idx % 2 === 0 ? '#FFF7D6' : '#FFDBD1'),
                transform: `rotate(${idx % 2 === 0 ? -1 : 1}deg)`,
              }}
              className="relative p-3.5 rounded-xl border border-black/10 shadow-xs space-y-1 transition-transform hover:rotate-0"
            >
              {/* Pushpin at top left */}
              <div className="absolute -top-2 left-4">
                <Pushpin color={idx % 2 === 0 ? 'mustard' : 'rust'} size="sm" />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-['Epilogue'] font-bold text-xs text-[#1F1B17]">
                    {c.author}
                  </span>
                  {c.badge && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#38665E] text-white font-bold">
                      {c.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-black/50">{c.timestamp}</span>
              </div>

              <p className="text-xs text-[#2B2622] font-medium leading-relaxed">{c.content}</p>
            </div>
          ))}
        </div>

        {/* Pin a Note Input Form */}
        <form
          onSubmit={handlePostComment}
          className="relative bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-xl p-3 shadow-xs space-y-2 mt-2"
        >
          <div className="flex items-center gap-2 text-xs font-['Epilogue'] font-bold text-[#57423C]">
            <MessageSquare className="w-3.5 h-3.5 text-[#A03818]" />
            <span>Leave a note for neighbors</span>
          </div>

          <textarea
            rows={2}
            value={commentText || ''}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write an update, note, or thank-you..."
            className="w-full px-3 py-2 text-xs rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] text-[#1F1B17] placeholder:text-[#9E8B80] focus:outline-none focus:border-[#A03818]"
          />

          <div className="flex justify-between items-center pt-1">
            <span className="text-[10px] text-[#8C7A70]">
              {isVolunteerLoggedIn ? 'Posting as Volunteer' : 'Anonymous note'}
            </span>
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="px-3 py-1.5 rounded-lg cork-btn-primary text-xs font-['Epilogue'] font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <span>Post Note</span>
              <Send className="w-3 h-3" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
