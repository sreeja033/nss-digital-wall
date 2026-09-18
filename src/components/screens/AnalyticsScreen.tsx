import React from 'react';
import { useApp } from '../../context/AppContext';
import { Pushpin } from '../common/Pushpin';
import { RubberStamp } from '../common/RubberStamp';
import { WashiTape } from '../common/WashiTape';
import { VolunteerAvatar } from '../common/VolunteerAvatar';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  CheckCircle2,
  Users,
  MapPin,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  UserCheck,
  Clock,
  AlertTriangle,
  Flame,
  ArrowRight,
} from 'lucide-react';

export const AnalyticsScreen: React.FC = () => {
  const { problems, provisionedVolunteers, navigateTo } = useApp();

  const total = problems.length;
  const solved = problems.filter((p) => p.status === 'SOLVED').length;
  const inProgress = problems.filter((p) => p.status === 'IN_PROGRESS').length;
  const reported = problems.filter((p) => p.status === 'REPORTED').length;

  const solvedPercent = total ? Math.round((solved / total) * 100) : 0;
  const progressPercent = total ? Math.round((inProgress / total) * 100) : 0;
  const reportedPercent = total ? Math.round((reported / total) * 100) : 0;

  // Stalled tasks: Reports that are unassigned or in progress with minimal recent action
  const stalledTasks = problems.filter((p) => {
    if (p.status === 'SOLVED') return false;
    // Unassigned report awaiting review
    if (p.status === 'REPORTED' && !p.assignedLead) return true;
    // Pending coordinator assignment not accepted yet
    if (p.assignmentStatus === 'PENDING') return true;
    // In progress with 1 or fewer timeline updates
    if (p.status === 'IN_PROGRESS' && p.updates.length <= 1) return true;
    return false;
  });

  // Volunteer Task Loads calculated strictly from real state
  const volunteerTaskLoads = provisionedVolunteers.map((v) => {
    const activeTasks = problems.filter(
      (p) =>
        p.status === 'IN_PROGRESS' &&
        (p.assignedToVolunteerId === v.id ||
          p.assignedLead?.toLowerCase() === v.name.toLowerCase() ||
          p.assignedVolunteers?.some((name) => name.toLowerCase() === v.name.toLowerCase()))
    );

    const solvedTasks = problems.filter(
      (p) =>
        p.status === 'SOLVED' &&
        (p.assignedToVolunteerId === v.id ||
          p.assignedLead?.toLowerCase() === v.name.toLowerCase() ||
          p.assignedVolunteers?.some((name) => name.toLowerCase() === v.name.toLowerCase()))
    );

    const pendingTasks = problems.filter(
      (p) =>
        p.assignmentStatus === 'PENDING' &&
        (p.assignedToVolunteerId === v.id ||
          p.assignedLead?.toLowerCase() === v.name.toLowerCase())
    );

    return {
      ...v,
      activeCount: activeTasks.length,
      solvedCount: solvedTasks.length + (v.civicWins || 0),
      pendingCount: pendingTasks.length,
      totalLoad: activeTasks.length + pendingTasks.length,
    };
  }).sort((a, b) => b.totalLoad - a.totalLoad);

  // Category counts from real state
  const categories = [
    { name: 'Garbage & Waste', match: ['Garbage', 'Waste', 'Sanitation'], color: '#A03818' },
    { name: 'Streetlights & Electrical', match: ['Streetlights', 'Electrical'], color: '#E8A93A' },
    { name: 'Roads & Pavements', match: ['Roads', 'Pavements'], color: '#C1502E' },
    { name: 'Water & Supply', match: ['Water', 'Standpipes'], color: '#38665E' },
    { name: 'Greenery & Parks', match: ['Greenery', 'Parks'], color: '#1B4B43' },
  ];

  const categoryCounts = categories.map((cat) => {
    const count = problems.filter((p) =>
      cat.match.some((m) => p.category.toLowerCase().includes(m.toLowerCase()))
    ).length;
    return {
      ...cat,
      count,
      pct: total ? Math.round((count / total) * 100) : 0,
    };
  });

  return (
    <div className="flex-1 w-full max-w-xl mx-auto px-4 pt-3 pb-6 space-y-4">
      {/* Header */}
      <div className="relative bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-2xl p-4 sm:p-5 shadow-[0_4px_14px_rgba(43,38,34,0.07)] -rotate-0.5 mt-4">
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <Pushpin color="rust" size="lg" />
        </div>
        <div className="absolute -top-2.5 left-6 -rotate-6 z-10">
          <WashiTape color="yellow" width="w-16" />
        </div>
        <div className="absolute -top-2.5 right-6 rotate-6 z-10">
          <WashiTape color="mint" width="w-16" />
        </div>

        <div className="text-center pt-3 sm:pt-4">
          <span className="text-[10px] font-['Epilogue'] font-black tracking-widest text-[#A03818] uppercase">
            NSS Civic Operations
          </span>
          <h1 className="font-['Epilogue'] font-black text-2xl text-[#1F1B17] tracking-tight">
            Coordinator Analytics
          </h1>
          <p className="text-xs text-[#57423C] max-w-md mx-auto mt-0.5">
            Real-time tracking of civic notices, volunteer task allocation, and resolution progress.
          </p>

          {/* Big Progress Bar */}
          <div className="mt-4 pt-3 border-t border-[#DEC0B8] space-y-2">
            <div className="flex items-center justify-between text-xs font-['Epilogue'] font-bold">
              <span className="text-[#1B4B43]">
                {solvedPercent}% Solved ({solved})
              </span>
              <span className="text-[#7B5300]">
                {progressPercent}% In Progress ({inProgress})
              </span>
              <span className="text-[#A03818]">
                {reportedPercent}% Reported ({reported})
              </span>
            </div>

            <div className="h-3 w-full rounded-full bg-[#EBE1DA] overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${solvedPercent}%` }}
                className="bg-[#38665E] h-full transition-all duration-500"
                title={`Solved: ${solved}`}
              />
              <div
                style={{ width: `${progressPercent}%` }}
                className="bg-[#E8A93A] h-full transition-all duration-500"
                title={`In Progress: ${inProgress}`}
              />
              <div
                style={{ width: `${reportedPercent}%` }}
                className="bg-[#A03818] h-full transition-all duration-500"
                title={`Reported: ${reported}`}
              />
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="p-2.5 rounded-xl bg-[#FAF6ED] border border-[#DEC0B8]">
            <div className="font-['Epilogue'] font-black text-xl text-[#A03818]">{reported}</div>
            <div className="text-[10px] font-bold text-[#6E5A4E] uppercase">Reported</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF6ED] border border-[#DEC0B8]">
            <div className="font-['Epilogue'] font-black text-xl text-[#7B5300]">{inProgress}</div>
            <div className="text-[10px] font-bold text-[#6E5A4E] uppercase">In Progress</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF6ED] border border-[#DEC0B8]">
            <div className="font-['Epilogue'] font-black text-xl text-[#1B4B43]">{solved}</div>
            <div className="text-[10px] font-bold text-[#6E5A4E] uppercase">Solved</div>
          </div>
        </div>
      </div>

      {/* SECTION: Volunteer Task Loads */}
      <div className="bg-[#FFFDF8] border-2 border-[#B8EADE] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#B8EADE] pb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#1B4B43]" />
            <h2 className="font-['Epilogue'] font-black text-base text-[#1B4B43]">
              Volunteer Task Loads
            </h2>
          </div>
          <span className="text-[11px] font-mono font-bold text-[#38665E]">
            {provisionedVolunteers.length} Provisioned Cadets
          </span>
        </div>

        <p className="text-xs text-[#57423C]">
          Live workload distribution across active NSS volunteers showing active missions and verified resolutions.
        </p>

        <div className="space-y-2.5 pt-1">
          {volunteerTaskLoads.map((vol) => (
            <div
              key={vol.id}
              className="p-3 rounded-xl bg-[#FAF6ED] border border-[#DEC0B8] flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <VolunteerAvatar
                  avatar={vol.avatar}
                  name={vol.name}
                  size="sm"
                  className="shrink-0 rounded-lg border border-[#DEC0B8]"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-[#1F1B17] truncate">{vol.name}</span>
                    <span className={`text-[9px] font-mono px-1 rounded font-semibold ${
                      vol.status === 'ACTIVE'
                        ? 'bg-[#B8EADE] text-[#1B4B43]'
                        : 'bg-[#FFDBD1] text-[#A03818]'
                    }`}>
                      {vol.status}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-[#7C695E] truncate">
                    {vol.id} • {vol.role}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-right">
                <div>
                  <div className="font-['Epilogue'] font-black text-sm text-[#C1502E]">
                    {vol.activeCount}
                  </div>
                  <div className="text-[9px] font-bold text-[#6E5A4E] uppercase">Active</div>
                </div>

                <div>
                  <div className="font-['Epilogue'] font-black text-sm text-[#1B4B43]">
                    {vol.solvedCount}
                  </div>
                  <div className="text-[9px] font-bold text-[#6E5A4E] uppercase">Solved</div>
                </div>

                <div>
                  <div className="font-['Epilogue'] font-black text-sm text-[#7B5300]">
                    {vol.hoursCompleted || 0}h
                  </div>
                  <div className="text-[9px] font-bold text-[#6E5A4E] uppercase">Hours</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION: Stalled Tasks (Unassigned or stalled in progress) */}
      <div className="bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#DEC0B8] pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#A03818]" />
            <h2 className="font-['Epilogue'] font-black text-base text-[#A03818]">
              Attention Needed: Stalled Tasks ({stalledTasks.length})
            </h2>
          </div>
          <span className="text-[11px] font-mono font-bold text-[#A03818]">
            Urgent Attention
          </span>
        </div>

        <p className="text-xs text-[#57423C]">
          Problems that are either unassigned, awaiting cadet acceptance, or in progress with only initial notes.
        </p>

        {stalledTasks.length === 0 ? (
          <div className="p-4 bg-[#FAF6ED] rounded-xl text-center text-xs text-[#1B4B43] font-semibold border border-[#B8EADE]">
            ✓ No stalled tasks detected! All civic reports are actively moving forward.
          </div>
        ) : (
          <div className="space-y-2.5">
            {stalledTasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-xl bg-[#FFF5F2] border border-[#DEC0B8] space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-xs text-[#1F1B17] line-clamp-1">{task.title}</h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#7C695E] mt-0.5">
                      <MapPin className="w-3 h-3 text-[#A03818]" />
                      <span>{task.location}</span>
                    </div>
                  </div>
                  <RubberStamp status={task.status} size="sm" />
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#DEC0B8]/60 text-[11px]">
                  <span className="text-[#A03818] font-medium">
                    {task.status === 'REPORTED'
                      ? '⚠️ Unassigned to any volunteer'
                      : task.assignmentStatus === 'PENDING'
                      ? '⏳ Assignment pending volunteer acceptance'
                      : '⚡ In progress (needs field progress photo)'}
                  </span>
                  <button
                    onClick={() => navigateTo('problem-detail', task.id)}
                    className="font-bold text-[#C1502E] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#F1E6E0] pb-2">
          <div className="flex items-center gap-2">
            <Pushpin color="mustard" size="sm" />
            <h2 className="font-['Epilogue'] font-black text-base text-[#1F1B17]">
              Reports by Category
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#7C695E]">{total} Total Reports</span>
        </div>

        <div className="space-y-2.5 pt-1">
          {categoryCounts.map((cat) => (
            <div key={cat.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#1F1B17]">{cat.name}</span>
                <span className="font-mono text-[#7C695E]">
                  {cat.count} ({cat.pct}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#FAF6ED] border border-[#DEC0B8]/60 overflow-hidden">
                <div
                  style={{ width: `${cat.pct}%`, backgroundColor: cat.color }}
                  className="h-full rounded-full transition-all duration-300"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
