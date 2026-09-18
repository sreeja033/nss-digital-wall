import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Pushpin } from '../../common/Pushpin';
import { WashiTape } from '../../common/WashiTape';
import {
  ShieldCheck,
  Users,
  Send,
  ShieldAlert,
  BarChart3,
  Radio,
  AlertOctagon,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { formatRelativeTime } from '../../../utils/dateUtils';

const NSS_SEAL_URL =
  'https://images.unsplash.com/photo-1532629345422-7515f3d16bb9?auto=format&fit=crop&w=150&q=80';

export const AdminHomeView: React.FC = () => {
  const {
    problems,
    provisionedVolunteers,
    navigateTo,
    showToast,
    deleteProblem,
    setAdminTab,
  } = useApp();

  const [broadcastMessage, setBroadcastMessage] = useState(
    'Notice: Heavy rain expected this week. Check drainage hotspots and prioritize road safety notices.'
  );

  const unassignedTasks = problems.filter((p) => p.status === 'REPORTED' && !p.assignedLead);
  const activeTasks = problems.filter((p) => p.status === 'IN_PROGRESS');
  const solvedTasks = problems.filter((p) => p.status === 'SOLVED');
  const activeVolunteers = provisionedVolunteers.filter((v) => v.status === 'ACTIVE');

  const handleOpenAdminSection = (tab: 'overview' | 'volunteers' | 'tasks' | 'moderation' | 'analytics') => {
    setAdminTab(tab);
    navigateTo('admin');
  };

  return (
    <div className="space-y-4">
      {/* Coordinator Dashboard Profile Card */}
      <div className="relative bg-[#FFFDF8] border-2 border-[#1D4ED8] rounded-2xl p-4 sm:p-5 shadow-[0_4px_14px_rgba(43,38,34,0.08)] mt-2 sm:mt-3 space-y-4">
        <div className="absolute -top-3 left-8 z-10">
          <Pushpin color="navy" size="md" />
        </div>
        <div className="absolute -top-2 right-8 rotate-2 z-10">
          <WashiTape color="blue" width="w-20" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-b border-[#F1E6E0] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl border-2 border-[#1D4ED8] shadow-xs overflow-hidden p-0.5 bg-[#FAF6ED] shrink-0">
              <img
                src={NSS_SEAL_URL}
                alt="Coordinator Seal"
                className="w-full h-full rounded-lg object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Epilogue'] font-black text-base sm:text-lg text-[#1F1B17]">
                  Coordinator Dashboard
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EBF3FF] text-[#1D4ED8] border border-[#93C5FD]">
                  Coordinator
                </span>
              </div>
              <p className="text-xs text-[#57423C]">
                Helps organize volunteers and track fixes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#1D4ED8] bg-[#EBF3FF] px-2.5 py-1 rounded-full flex items-center gap-1.5 font-bold border border-[#93C5FD]">
              <span className="w-2 h-2 rounded-full bg-[#1D4ED8] animate-pulse" />
              You're signed in
            </span>
          </div>
        </div>

        {/* 4 Stat Numbers Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="bg-[#FAF6ED] p-2.5 rounded-xl border border-[#DEC0B8]">
            <div className="font-['Epilogue'] font-black text-lg text-[#1B4B43]">
              {activeVolunteers.length}
            </div>
            <div className="text-[10px] font-bold text-[#6E5A4E] uppercase">Volunteers</div>
            <div className="text-[9px] text-[#8C7A70]">Active accounts</div>
          </div>

          <div className="bg-[#FAF6ED] p-2.5 rounded-xl border border-[#DEC0B8]">
            <div className="font-['Epilogue'] font-black text-lg text-[#1D4ED8]">
              {unassignedTasks.length}
            </div>
            <div className="text-[10px] font-bold text-[#6E5A4E] uppercase">Unassigned</div>
            <div className="text-[9px] text-[#8C7A70]">Needs volunteer</div>
          </div>

          <div className="bg-[#FAF6ED] p-2.5 rounded-xl border border-[#DEC0B8]">
            <div className="font-['Epilogue'] font-black text-lg text-[#1D4ED8]">
              {activeTasks.length}
            </div>
            <div className="text-[10px] font-bold text-[#6E5A4E] uppercase">In Progress</div>
            <div className="text-[9px] text-[#8C7A70]">Ongoing work</div>
          </div>

          <div className="bg-[#FAF6ED] p-2.5 rounded-xl border border-[#DEC0B8]">
            <div className="font-['Epilogue'] font-black text-lg text-[#1D4ED8]">
              {solvedTasks.length}
            </div>
            <div className="text-[10px] font-bold text-[#6E5A4E] uppercase">Solved</div>
            <div className="text-[9px] text-[#8C7A70]">Confirmed fixes</div>
          </div>
        </div>
      </div>

      {/* Urgent Dispatch Callout */}
      {unassignedTasks.length > 0 && (
        <div className="bg-[#EFF6FF] border-2 border-[#BFDBFE] rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-['Epilogue'] font-bold text-sm text-[#1E40AF]">
                {unassignedTasks.length} Report{unassignedTasks.length > 1 ? 's' : ''} Waiting for Volunteers
              </h4>
              <p className="text-xs text-[#6E5A4E] mt-0.5">
                Neighbors reported issues that need an assigned volunteer and target date.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenAdminSection('moderation')}
            className="px-3.5 py-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-['Epilogue'] font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>Review & Assign</span>
          </button>
        </div>
      )}

      {/* Notice Bulletin Card */}
      <div className="bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#1D4ED8]" />
            <h3 className="font-['Epilogue'] font-bold text-xs sm:text-sm text-[#1F1B17]">
              Notice to Volunteers & Community
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#7C695E]">Pinned on Board</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            placeholder="Write a note to share with volunteers and neighbors..."
            className="flex-1 px-3 py-2 text-xs rounded-xl bg-[#FAF6ED] border border-[#DEC0B8] text-[#1F1B17] focus:outline-hidden focus:border-[#1D4ED8]"
          />
          <button
            onClick={() => showToast('Notice updated on community board.')}
            className="px-3.5 py-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-['Epilogue'] font-bold cursor-pointer shrink-0"
          >
            Post Note
          </button>
        </div>
      </div>

      {/* Quick Actions Navigation Grid */}
      <div>
        <h3 className="font-['Epilogue'] font-bold text-xs text-[#57423C] uppercase tracking-wider mb-2.5">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          <button
            onClick={() => handleOpenAdminSection('volunteers')}
            className="p-3 rounded-xl bg-[#FFFDF8] border-2 border-[#DEC0B8] hover:border-[#1D4ED8] text-left transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-[#EBF3FF] text-[#1D4ED8] border border-[#93C5FD] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold text-[#1D4ED8]">
                {activeVolunteers.length} Active
              </span>
            </div>
            <div className="font-['Epilogue'] font-bold text-xs text-[#1F1B17] group-hover:text-[#1D4ED8]">
              Volunteers
            </div>
            <p className="text-[11px] text-[#7C695E] mt-0.5">
              Manage volunteer logins and active status
            </p>
          </button>

          <button
            onClick={() => handleOpenAdminSection('tasks')}
            className="p-3 rounded-xl bg-[#FFFDF8] border-2 border-[#DEC0B8] hover:border-[#1D4ED8] text-left transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-[#EBF3FF] text-[#1D4ED8] border border-[#93C5FD] flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#EBF3FF] text-[#1D4ED8]">
                {activeTasks.length} Active
              </span>
            </div>
            <div className="font-['Epilogue'] font-bold text-xs text-[#1F1B17] group-hover:text-[#1D4ED8]">
              Assign Tasks
            </div>
            <p className="text-[11px] text-[#7C695E] mt-0.5">
              Track active tasks and reassign volunteers
            </p>
          </button>

          <button
            onClick={() => handleOpenAdminSection('moderation')}
            className="p-3 rounded-xl bg-[#FFFDF8] border-2 border-[#DEC0B8] hover:border-[#1D4ED8] text-left transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-[#FAF6ED] text-[#7B5300] flex items-center justify-center border border-[#DEC0B8]">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold text-[#7B5300]">
                {unassignedTasks.length} Pending
              </span>
            </div>
            <div className="font-['Epilogue'] font-bold text-xs text-[#1F1B17] group-hover:text-[#1D4ED8]">
              Review Reports
            </div>
            <p className="text-[11px] text-[#7C695E] mt-0.5">
              Check new reports, assign to volunteers, or reject spam
            </p>
          </button>

          <button
            onClick={() => handleOpenAdminSection('analytics')}
            className="p-3 rounded-xl bg-[#FFFDF8] border-2 border-[#DEC0B8] hover:border-[#1D4ED8] text-left transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-[#FAF6ED] text-[#1B4B43] border border-[#DEC0B8] flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold text-[#1B4B43]">
                {solvedTasks.length} Solved
              </span>
            </div>
            <div className="font-['Epilogue'] font-bold text-xs text-[#1F1B17] group-hover:text-[#1D4ED8]">
              Volunteer Stats
            </div>
            <p className="text-[11px] text-[#7C695E] mt-0.5">
              See hours, check ongoing tasks, and view stats
            </p>
          </button>
        </div>
      </div>

      {/* Recent Citizen Reports Stream */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pushpin color="navy" size="sm" />
            <h3 className="font-['Epilogue'] font-bold text-sm text-[#1F1B17]">
              Recent Reports
            </h3>
          </div>
          <button
            onClick={() => handleOpenAdminSection('moderation')}
            className="text-xs font-['Epilogue'] font-bold text-[#1D4ED8] hover:underline cursor-pointer"
          >
            Review All ({problems.length}) →
          </button>
        </div>

        <div className="space-y-2.5">
          {problems.slice(0, 3).map((problem) => (
            <div
              key={problem.id}
              className="bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF6ED] text-[#57423C] border border-[#DEC0B8]">
                    {problem.category}
                  </span>
                  {problem.urgent && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]">
                      Urgent
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-[#7C695E]">
                    {formatRelativeTime(problem.createdAt)}
                  </span>
                </div>
                <h4 className="font-['Epilogue'] font-black text-xs sm:text-sm text-[#1F1B17] truncate">
                  {problem.title}
                </h4>
                <p className="text-xs text-[#7C695E] truncate">
                  📍 {problem.location} • Status: {problem.status === 'SOLVED' ? 'Solved' : problem.status === 'IN_PROGRESS' ? 'In Progress' : 'Reported'} • {problem.assignedLead ? `Assigned to ${problem.assignedLead}` : 'Unassigned'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!problem.assignedLead && problem.status !== 'IN_PROGRESS' && problem.status !== 'SOLVED' ? (
                  <button
                    onClick={() => handleOpenAdminSection('moderation')}
                    className="px-3 py-1.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-['Epilogue'] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Review</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenAdminSection('tasks')}
                    className="px-3 py-1.5 rounded-lg bg-[#FAF6ED] hover:bg-[#DEC0B8]/40 border border-[#DEC0B8] text-[#57423C] text-xs font-['Epilogue'] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#1D4ED8]" />
                    <span>Track</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    if (window.confirm(`Delete report "${problem.title}"?`)) {
                      deleteProblem(problem.id);
                    }
                  }}
                  className="p-1.5 rounded-lg border border-[#DEC0B8] text-[#7C695E] hover:text-[#1D4ED8] hover:bg-[#EFF6FF] cursor-pointer"
                  title="Remove Spam"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
