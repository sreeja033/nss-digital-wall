import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Pushpin } from '../../common/Pushpin';
import { RubberStamp } from '../../common/RubberStamp';
import { WashiTape } from '../../common/WashiTape';
import { VolunteerAvatar } from '../../common/VolunteerAvatar';
import {
  ShieldCheck,
  CheckCircle2,
  Users,
  MapPin,
  ClipboardCheck,
  Check,
  X,
  Wrench,
  AlertTriangle,
  ArrowRight,
  Clock,
  Trophy,
  Calendar,
  Radio,
  FileCheck,
  Sparkles,
  LogIn,
} from 'lucide-react';
import { formatRelativeTime } from '../../../utils/dateUtils';

export const VolunteerHomeView: React.FC = () => {
  const {
    currentVolunteer,
    problems,
    acceptAssignment,
    declineAssignment,
    navigateTo,
    isVolunteerLoggedIn,
    loginVolunteer,
    provisionedVolunteers,
    showToast,
  } = useApp();

  const [declinePromptId, setDeclinePromptId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  // Assigned directly to this cadet
  const assignedToMe = problems.filter(
    (p) =>
      (p.assignedToVolunteerId === currentVolunteer.id ||
        p.assignedLead === currentVolunteer.name ||
        p.assignedVolunteers?.includes(currentVolunteer.name) ||
        (p.assignedLead &&
          p.assignedLead.toLowerCase() ===
            (currentVolunteer.displayName || currentVolunteer.name).toLowerCase())) &&
      p.assignmentStatus !== 'DECLINED' &&
      p.status !== 'SOLVED'
  );

  const pendingAssigned = assignedToMe.filter((p) => p.assignmentStatus === 'PENDING');
  const unassignedProblems = problems.filter((p) => p.status === 'REPORTED' && !p.assignedLead);
  const inProgressProblems = problems.filter(
    (p) =>
      p.status === 'IN_PROGRESS' &&
      (p.assignedToVolunteerId === currentVolunteer.id ||
        p.assignedLead === currentVolunteer.name ||
        p.assignedVolunteers?.includes(currentVolunteer.name))
  );
  const solvedProblems = problems.filter((p) => p.status === 'SOLVED');

  const handleConfirmDecline = (problemId: string) => {
    declineAssignment(problemId, declineReason || 'Cadet schedule conflict');
    setDeclinePromptId(null);
    setDeclineReason('');
  };

  return (
    <div className="space-y-4">
      {/* Cadet Auth State Prompt if not logged in */}
      {!isVolunteerLoggedIn ? (
        <div className="relative bg-[#FFFDF8] border-2 border-[#B8EADE] rounded-2xl p-5 shadow-[0_4px_14px_rgba(43,38,34,0.08)] -rotate-0.5 mt-2 space-y-4">
          <div className="absolute -top-3.5 left-8 z-10">
            <Pushpin color="teal" size="md" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#B8EADE] text-[#1B4B43] flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-['Epilogue'] font-black text-lg text-[#1F1B17]">
                  NSS Volunteer & Cadet Mission Hub
                </h2>
                <p className="text-xs text-[#57423C]">
                  Sign in with your authorized NSS Cadet ID to view assigned missions & log hours.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateTo('volunteer-signin')}
                className="px-3.5 py-2 rounded-xl bg-[#1B4B43] hover:bg-[#153a34] text-white font-['Epilogue'] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In ID</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#DEC0B8]/60 text-xs text-[#57423C]">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#B8EADE] text-[#1B4B43] flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
              <span>Officer task dispatches & field gear</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#B8EADE] text-[#1B4B43] flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
              <span>Upload before & after photo proof</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#B8EADE] text-[#1B4B43] flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
              <span>Accumulate NSS graduation hours</span>
            </div>
          </div>
        </div>
      ) : (
        /* Cadet ID Badge Summary Card */
        <div className="relative bg-[#FFFDF8] border-2 border-[#B8EADE] rounded-2xl p-4 shadow-[0_4px_14px_rgba(43,38,34,0.08)] -rotate-0.5 mt-2">
          <div className="absolute -top-3.5 left-8 z-10">
            <Pushpin color="teal" size="md" />
          </div>
          <div className="absolute -top-2.5 right-6 rotate-6 z-10">
            <WashiTape color="mint" width="w-20" />
          </div>

          <div className="flex items-center gap-3.5 pt-2 sm:pt-2.5">
            <VolunteerAvatar
              avatar={currentVolunteer.avatar}
              name={currentVolunteer.displayName || currentVolunteer.name}
              size="lg"
              className="w-14 h-14 rounded-xl border-2 border-[#38665E] shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-['Epilogue'] font-black text-lg text-[#1F1B17] truncate">
                  {currentVolunteer.displayName || currentVolunteer.name}
                </h1>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#B8EADE] text-[#1B4B43]">
                  Volunteer
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#1B4B43] font-bold">
                ID: {currentVolunteer.id}
              </p>
              <p className="text-xs text-[#57423C] font-semibold">{currentVolunteer.role}</p>
              <p className="text-[11px] text-[#7C695E]">{currentVolunteer.unit}</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-1.5 mt-4 pt-3 border-t border-[#B8EADE] text-center">
            <div className="bg-[#FAF6ED] p-1.5 rounded-lg border border-[#DEC0B8]">
              <div className="font-['Epilogue'] font-black text-base text-[#1B4B43]">
                {currentVolunteer.hoursCompleted}
              </div>
              <div className="text-[9px] font-bold text-[#6E5A4E] uppercase">Hours</div>
            </div>

            <div className="bg-[#FAF6ED] p-1.5 rounded-lg border border-[#DEC0B8]">
              <div className="font-['Epilogue'] font-black text-base text-[#1B4B43]">
                {currentVolunteer.civicWins}
              </div>
              <div className="text-[9px] font-bold text-[#6E5A4E] uppercase">Solved</div>
            </div>

            <div className="bg-[#FAF6ED] p-1.5 rounded-lg border border-[#DEC0B8]">
              <div className="font-['Epilogue'] font-black text-base text-[#1B4B43]">
                {assignedToMe.length}
              </div>
              <div className="text-[9px] font-bold text-[#6E5A4E] uppercase">Assigned</div>
            </div>

            <div className="bg-[#FAF6ED] p-1.5 rounded-lg border border-[#DEC0B8]">
              <div className="font-['Epilogue'] font-black text-base text-[#7B5300]">
                {inProgressProblems.length}
              </div>
              <div className="text-[9px] font-bold text-[#6E5A4E] uppercase">Active</div>
            </div>
          </div>
        </div>
      )}

      {/* Field Operations Advisory Bulletin */}
      <div className="bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-xl p-3 sm:p-4 shadow-xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#B8EADE] text-[#1B4B43] flex items-center justify-center shrink-0">
          <Radio className="w-4.5 h-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-['Epilogue'] font-bold text-xs text-[#1F1B17]">
              Officer Field Dispatch Notice
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#B8EADE] text-[#1B4B43]">
              Active Unit Bulletin
            </span>
          </div>
          <p className="text-[11px] text-[#57423C] truncate">
            Monsoon Readiness: Shivaji Nagar squads prioritize drainage & pothole safety notices.
          </p>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => {
            const el = document.getElementById('volunteer-assigned-tasks');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="p-3 rounded-xl bg-[#FFFDF8] border-2 border-[#B8EADE] shadow-xs text-left hover:border-[#38665E] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1">
            <ClipboardCheck className="w-5 h-5 text-[#1B4B43]" />
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#B8EADE] text-[#1B4B43]">
              {assignedToMe.length}
            </span>
          </div>
          <div className="font-['Epilogue'] font-bold text-xs text-[#1F1B17]">
            My Assignments
          </div>
          <div className="text-[10px] text-[#7C695E]">Officer missions</div>
        </button>

        <button
          onClick={() => navigateTo('action-tracker')}
          className="p-3 rounded-xl bg-[#FFFDF8] border-2 border-[#B8EADE] shadow-xs text-left hover:border-[#38665E] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1">
            <CheckCircle2 className="w-5 h-5 text-[#38665E]" />
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#B8EADE] text-[#1B4B43]">
              {inProgressProblems.length}
            </span>
          </div>
          <div className="font-['Epilogue'] font-bold text-xs text-[#1F1B17]">
            Action Tracker
          </div>
          <div className="text-[10px] text-[#7C695E]">Submit photo proof</div>
        </button>

        <button
          onClick={() => navigateTo('reports-management')}
          className="p-3 rounded-xl bg-[#FFFDF8] border-2 border-[#DEC0B8] shadow-xs text-left hover:border-[#A03818] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1">
            <FileCheck className="w-5 h-5 text-[#A03818]" />
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FFDBD1] text-[#A03818]">
              {problems.length}
            </span>
          </div>
          <div className="font-['Epilogue'] font-bold text-xs text-[#1F1B17]">
            All Notices
          </div>
          <div className="text-[10px] text-[#7C695E]">Squad overview</div>
        </button>

        <button
          onClick={() => navigateTo('volunteer-profile')}
          className="p-3 rounded-xl bg-[#FFFDF8] border-2 border-[#DEC0B8] shadow-xs text-left hover:border-[#38665E] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1">
            <Trophy className="w-5 h-5 text-[#B45309]" />
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#B45309]">
              {currentVolunteer.civicWins}
            </span>
          </div>
          <div className="font-['Epilogue'] font-bold text-xs text-[#1F1B17]">
            Cadet Profile
          </div>
          <div className="text-[10px] text-[#7C695E]">Hours & badges</div>
        </button>
      </div>

      {/* SECTION: Assigned to You (Officer Direct Assignments) */}
      <div id="volunteer-assigned-tasks" className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pushpin color="teal" size="sm" />
            <h2 className="font-['Epilogue'] font-black text-base text-[#1F1B17] flex items-center gap-1.5">
              <span>Assigned to You</span>
              {pendingAssigned.length > 0 && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#B8EADE] text-[#1B4B43] border border-[#38665E]/30 animate-pulse">
                  {pendingAssigned.length} New
                </span>
              )}
            </h2>
          </div>
          <span className="text-xs text-[#1B4B43] font-semibold">Officer Direct Assignments</span>
        </div>

        {assignedToMe.length === 0 ? (
          <div className="p-4 bg-[#FFFDF8] border-2 border-dashed border-[#DEC0B8] rounded-xl text-center space-y-1 text-xs text-[#7C695E]">
            <p className="font-semibold text-[#1F1B17]">No active tasks assigned right now.</p>
            <p className="text-[11px]">
              All civic tasks are assigned by the NSS Programme Officer. When a task is assigned to you, it will appear here with target date and safety requirements.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignedToMe.map((problem) => (
              <div
                key={problem.id}
                className="bg-[#FFFDF8] border-2 border-[#38665E]/40 rounded-xl p-4 shadow-sm space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#B8EADE] text-[#1B4B43] font-bold">
                        Officer Assignment
                      </span>
                      {problem.urgent && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFDBD1] text-[#A03818] font-bold">
                          Urgent Priority
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-[#7C695E]">
                        Target: {problem.targetCompletionDate || 'This Weekend'}
                      </span>
                    </div>
                    <h3 className="font-['Epilogue'] font-black text-sm sm:text-base text-[#1F1B17]">
                      {problem.title}
                    </h3>
                    <p className="text-xs text-[#57423C] line-clamp-2">
                      {problem.description}
                    </p>
                    <p className="text-[11px] text-[#7C695E]">
                      📍 {problem.location} {problem.landmark ? `• Near ${problem.landmark}` : ''}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <span
                      className={`text-[10px] font-mono px-2 py-1 rounded font-bold uppercase ${
                        problem.assignmentStatus === 'PENDING'
                          ? 'bg-[#FEF3C7] text-[#B45309]'
                          : 'bg-[#B8EADE] text-[#1B4B43]'
                      }`}
                    >
                      {problem.assignmentStatus || 'IN PROGRESS'}
                    </span>
                  </div>
                </div>

                {/* Assignment Notes & Safety Details */}
                <div className="bg-[#FAF6ED] border border-[#DEC0B8] rounded-lg p-2.5 text-xs text-[#57423C] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#1F1B17]">
                    <Wrench className="w-3.5 h-3.5 text-[#A03818]" />
                    <span>Required Gear & Squad Protocol</span>
                  </div>
                  <p className="text-[11px] text-[#6E5A4E]">
                    {problem.materialsNeeded || 'Standard safety vests, sturdy gloves, and mobile camera for proof.'}
                  </p>
                  {problem.assignedCoordinator && (
                    <p className="text-[10px] text-[#7C695E]">
                      Assigned by Officer: {problem.assignedCoordinator}
                    </p>
                  )}
                </div>

                {/* Accept / Decline or Action buttons */}
                {problem.assignmentStatus === 'PENDING' ? (
                  <div className="space-y-2 pt-1 border-t border-[#DEC0B8]">
                    {declinePromptId === problem.id ? (
                      <div className="space-y-2 bg-[#FFF5F2] border border-[#FFDBD1] rounded-lg p-3">
                        <p className="text-xs font-bold text-[#A03818]">
                          Reason for declining task assignment:
                        </p>
                        <input
                          type="text"
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                          placeholder="e.g., Exam schedule conflict, not in sector..."
                          className="w-full text-xs p-2 rounded border border-[#DEC0B8] bg-white text-[#1F1B17]"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConfirmDecline(problem.id)}
                            className="px-3 py-1.5 rounded bg-[#A03818] text-white text-xs font-bold cursor-pointer"
                          >
                            Confirm Decline
                          </button>
                          <button
                            onClick={() => setDeclinePromptId(null)}
                            className="px-3 py-1.5 rounded border border-[#DEC0B8] text-xs text-[#57423C] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDeclinePromptId(problem.id)}
                          className="px-3 py-1.5 text-xs font-['Epilogue'] font-bold rounded-lg border border-[#DEC0B8] text-[#7C695E] hover:text-[#A03818] cursor-pointer flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                        <button
                          onClick={() => {
                            acceptAssignment(problem.id);
                            navigateTo('action-tracker', problem.id);
                          }}
                          className="px-3.5 py-1.5 text-xs font-['Epilogue'] font-bold rounded-lg bg-[#1B4B43] hover:bg-[#143731] text-white cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept & Work on Task</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-2 border-t border-[#DEC0B8]">
                    <span className="text-[11px] text-[#1B4B43] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Assignment Active</span>
                    </span>
                    <button
                      onClick={() => navigateTo('action-tracker', problem.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#1B4B43] text-white text-xs font-['Epilogue'] font-bold flex items-center gap-1 shadow-xs cursor-pointer hover:bg-[#143731]"
                    >
                      <span>Work on Task</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION: Active In-Progress Field Work */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pushpin color="mustard" size="sm" />
            <h2 className="font-['Epilogue'] font-black text-base text-[#1F1B17]">
              Field Work in Progress ({inProgressProblems.length})
            </h2>
          </div>
          <button
            onClick={() => navigateTo('action-tracker')}
            className="text-xs font-['Epilogue'] font-bold text-[#1B4B43] hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>All Field Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {inProgressProblems.slice(0, 3).map((prob) => (
            <div
              key={prob.id}
              onClick={() => navigateTo('action-tracker', prob.id)}
              className="bg-[#FFFDF8] border-2 border-[#B8EADE] rounded-xl p-3 shadow-xs flex items-center justify-between gap-3 hover:border-[#1B4B43] transition-all cursor-pointer"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FAF6ED] text-[#57423C] border border-[#DEC0B8]">
                    {prob.category}
                  </span>
                  <span className="text-xs text-[#7C695E] truncate">📍 {prob.location}</span>
                </div>
                <h4 className="font-['Epilogue'] font-bold text-xs sm:text-sm text-[#1F1B17] truncate">
                  {prob.title}
                </h4>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-[#1B4B43] shrink-0">
                <span>Work on Task</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION: Unassigned Community Reports Peek */}
      {unassignedProblems.length > 0 && (
        <div className="bg-[#FFF8F5] border-2 border-[#DEC0B8] rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#A03818]" />
              <h3 className="font-['Epilogue'] font-bold text-xs sm:text-sm text-[#1F1B17]">
                Community Reports Ready for Action ({unassignedProblems.length})
              </h3>
            </div>
            <button
              onClick={() => navigateTo('reports-management')}
              className="text-xs font-['Epilogue'] font-bold text-[#A03818] hover:underline cursor-pointer"
            >
              Take Up Tasks →
            </button>
          </div>
          <p className="text-xs text-[#6E5A4E]">
            These neighborhood issues were reported by citizens and are open for volunteers. Approve any report to start field remediation and log proof.
          </p>
        </div>
      )}
    </div>
  );
};
