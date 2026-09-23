import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Pushpin } from '../common/Pushpin';
import { RubberStamp } from '../common/RubberStamp';
import { WashiTape } from '../common/WashiTape';
import { VolunteerAvatar } from '../common/VolunteerAvatar';
import { NSS_SEAL_URL } from '../../data/mockData';
import { ProvisionedVolunteer, Problem } from '../../types';
import { AdminLoginScreen } from './AdminLoginScreen';
import {
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
  ClipboardList,
  BarChart3,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  X,
  Bell,
  Trash2,
  RefreshCw,
  MapPin,
  Send,
  Radio,
  AlertOctagon,
  KeyRound,
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/dateUtils';

export const AdminScreen: React.FC = () => {
  const {
    isAdminLoggedIn,
    provisionedVolunteers,
    provisionNewVolunteer,
    toggleVolunteerStatus,
    revokeVolunteerId,
    problems,
    approveProblem,
    rejectProblem,
    assignProblemToVolunteer,
    reassignProblem,
    deleteProblem,
    sendVolunteerNudge,
    navigateTo,
    showToast,
    adminTab,
    setAdminTab,
    adminData,
    updateAdminData,
  } = useApp();

  if (!isAdminLoggedIn) {
    return <AdminLoginScreen />;
  }

  // Synchronize activeTab with AppContext adminTab
  const activeTab = adminTab;
  const setActiveTab = setAdminTab;

  const [broadcastText, setBroadcastText] = useState(
    adminData?.broadcastNote || 'Notice: Heavy rain expected this week. Check drainage hotspots and prioritize road safety notices.'
  );

  useEffect(() => {
    if (adminData?.broadcastNote) {
      setBroadcastText(adminData.broadcastNote);
    }
  }, [adminData?.broadcastNote]);
  const [moderationSearch, setModerationSearch] = useState('');
  const [moderationFilter, setModerationFilter] = useState<'PENDING' | 'ALL' | 'URGENT' | 'AI_FLAGGED'>('PENDING');

  // Search and Filter states
  const [volunteerSearch, setVolunteerSearch] = useState('');
  const [volunteerStatusFilter, setVolunteerStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'ASSIGNED' | 'SOLVED'>('ALL');
  const [taskSearch, setTaskSearch] = useState('');

  // Provisioning Modal State
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [newVolunteerName, setNewVolunteerName] = useState('');
  const [newVolunteerUnit, setNewVolunteerUnit] = useState('Ward 4 Civic Unit');
  const [newVolunteerRole, setNewVolunteerRole] = useState('Volunteer');
  const [newVolunteerEmail, setNewVolunteerEmail] = useState('');
  const [newVolunteerPhone, setNewVolunteerPhone] = useState('');
  const [customVolunteerId, setCustomVolunteerId] = useState('');

  const generateRandomId = () => {
    const randNum = Math.floor(1000 + Math.random() * 9000);
    setCustomVolunteerId(`NSS-2026-ND-${randNum}`);
  };

  // Assignment Modal State
  const [assigningProblem, setAssigningProblem] = useState<Problem | null>(null);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [materialsNeeded, setMaterialsNeeded] = useState('');

  // Reassign Modal State
  const [reassigningProblem, setReassigningProblem] = useState<Problem | null>(null);
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [reassignReason, setReassignReason] = useState('');

  // Nudge Modal State
  const [nudgingVolunteer, setNudgingVolunteer] = useState<ProvisionedVolunteer | null>(null);
  const [nudgeMessage, setNudgeMessage] = useState('');

  // Copied badge feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = (id: string) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    showToast(`Volunteer ID "${id}" copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCreateVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVolunteerName.trim()) {
      showToast('Volunteer name is required.');
      return;
    }

    let finalId = customVolunteerId.trim();
    // If user enters 4 raw digits (e.g. 7421), format cleanly as NSS-2026-ND-7421
    if (finalId && /^\d{4}$/.test(finalId)) {
      finalId = `NSS-2026-ND-${finalId}`;
    }

    const res = await provisionNewVolunteer({
      name: newVolunteerName.trim(),
      unit: newVolunteerUnit?.trim() || 'Ward Civic Unit',
      role: 'Volunteer',
      email: `${newVolunteerName.toLowerCase().replace(/\s+/g, '.')}@nss.org`,
      phone: '',
      id: finalId || undefined,
    });

    if (res.success) {
      setIsProvisionModalOpen(false);
      setNewVolunteerName('');
      setNewVolunteerEmail('');
      setNewVolunteerPhone('');
      setCustomVolunteerId('');
      showToast(`Volunteer created successfully! ID: ${res.volunteer?.id || finalId}`);
    } else {
      showToast(res.error || 'Failed to add volunteer.');
    }
  };

  const handleOpenAssign = (problem: Problem) => {
    setAssigningProblem(problem);
    const firstActive = provisionedVolunteers.find((v) => v.status === 'ACTIVE');
    setSelectedVolunteerId(firstActive ? firstActive.id : '');
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setTargetDate(d.toISOString().split('T')[0]);
    setMaterialsNeeded('Trash tongs, safety gloves, waste bags');
  };

  const handleConfirmAssign = () => {
    if (!assigningProblem || !selectedVolunteerId) {
      showToast('Please select a volunteer to assign.');
      return;
    }
    const volunteer = provisionedVolunteers.find((v) => v.id === selectedVolunteerId);
    if (!volunteer) return;

    assignProblemToVolunteer(assigningProblem.id, {
      leadVolunteerId: volunteer.id,
      leadVolunteerName: volunteer.name,
      squadName: volunteer.unit,
      targetDate: targetDate || 'Within 48 hours',
      materialsNeeded: materialsNeeded || 'Standard kit',
      coordinatorName: 'Dr. R. Verma',
    });

    setAssigningProblem(null);
    showToast(`Task assigned to ${volunteer.name}!`);
  };

  const handleOpenReassign = (problem: Problem) => {
    setReassigningProblem(problem);
    const otherVolunteer = provisionedVolunteers.find(
      (v) => v.status === 'ACTIVE' && v.id !== problem.assignedToVolunteerId
    );
    setNewAssigneeId(otherVolunteer ? otherVolunteer.id : '');
    setReassignReason('Workload balancing');
  };

  const handleConfirmReassign = () => {
    if (!reassigningProblem || !newAssigneeId) {
      showToast('Please select a volunteer.');
      return;
    }
    reassignProblem(reassigningProblem.id, newAssigneeId, reassignReason);
    setReassigningProblem(null);
    showToast('Task successfully reassigned!');
  };

  const handleOpenNudge = (volunteer: ProvisionedVolunteer) => {
    setNudgingVolunteer(volunteer);
    setNudgeMessage(`Hi ${volunteer.name.split(' ')[0]}, just checking in on your assigned task. Let us know if you need any help or tools!`);
  };

  const handleSendNudge = () => {
    if (!nudgingVolunteer) return;
    sendVolunteerNudge(nudgingVolunteer.id, 'Assigned Tasks', nudgeMessage);
    setNudgingVolunteer(null);
    showToast(`Reminder sent to ${nudgingVolunteer.name}!`);
  };

  // Filtered Volunteers (strictly deduplicated by ID to prevent duplicate React keys)
  const filteredVolunteers = useMemo(() => {
    const seen = new Set<string>();
    const deduplicated = provisionedVolunteers.filter((v) => {
      if (!v || !v.id || seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });

    return deduplicated.filter((v) => {
      const matchesSearch =
        v.name.toLowerCase().includes(volunteerSearch.toLowerCase()) ||
        v.id.toLowerCase().includes(volunteerSearch.toLowerCase()) ||
        v.unit.toLowerCase().includes(volunteerSearch.toLowerCase());
      const matchesStatus =
        volunteerStatusFilter === 'ALL' || v.status === volunteerStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [provisionedVolunteers, volunteerSearch, volunteerStatusFilter]);

  // Deduplicated active volunteers list for modals
  const activeVolunteersList = useMemo(() => {
    const seen = new Set<string>();
    return provisionedVolunteers.filter((v) => {
      if (!v || !v.id || v.status !== 'ACTIVE' || seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });
  }, [provisionedVolunteers]);

  // Filtered Tasks
  // Filtered Tasks: ONLY show reports that are ALREADY assigned (In Progress or Solved)
  const filteredTasks = useMemo(() => {
    return problems.filter((p) => {
      const isAssigned = Boolean(p.assignedLead) || p.status === 'IN_PROGRESS' || p.status === 'SOLVED';
      if (!isAssigned) return false;

      const matchesSearch =
        p.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
        p.location.toLowerCase().includes(taskSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(taskSearch.toLowerCase()) ||
        (p.assignedLead && p.assignedLead.toLowerCase().includes(taskSearch.toLowerCase()));

      if (!matchesSearch) return false;

      if (taskFilter === 'ASSIGNED') {
        return p.status === 'IN_PROGRESS';
      }
      if (taskFilter === 'SOLVED') {
        return p.status === 'SOLVED';
      }
      return true;
    });
  }, [problems, taskSearch, taskFilter]);

  // Analytics Computations
  const analyticsData = useMemo(() => {
    const totalVolunteers = provisionedVolunteers.length;
    const activeVolunteers = provisionedVolunteers.filter((v) => v.status === 'ACTIVE').length;
    const totalTasks = problems.length;
    const unassignedTasks = problems.filter((p) => p.status === 'REPORTED' && !p.assignedLead).length;
    const inProgressTasks = problems.filter((p) => p.status === 'IN_PROGRESS').length;
    const solvedTasks = problems.filter((p) => p.status === 'SOLVED').length;

    const volunteerStats = provisionedVolunteers.map((v) => {
      const assignedProblems = problems.filter(
        (p) =>
          p.assignedToVolunteerId === v.id ||
          p.assignedLead === v.name ||
          p.assignedVolunteers?.includes(v.name)
      );
      const activeProblems = assignedProblems.filter((p) => p.status === 'IN_PROGRESS');
      const pendingProblems = assignedProblems.filter((p) => p.assignmentStatus === 'PENDING');
      const solvedProblems = assignedProblems.filter((p) => p.status === 'SOLVED');

      let accountability: 'ACTIVE' | 'PENDING' | 'IDLE' | 'STALLED' = 'IDLE';
      if (pendingProblems.length > 0) {
        accountability = 'PENDING';
      } else if (activeProblems.length > 0) {
        const hasNoUpdates = activeProblems.some((p) => p.updates.length <= 1);
        accountability = hasNoUpdates ? 'STALLED' : 'ACTIVE';
      } else {
        accountability = 'IDLE';
      }

      return {
        ...v,
        assignedCount: assignedProblems.length,
        activeCount: activeProblems.length,
        solvedCount: solvedProblems.length,
        pendingCount: pendingProblems.length,
        accountability,
        assignedProblems,
      };
    });

    return {
      totalVolunteers,
      activeVolunteers,
      totalTasks,
      unassignedTasks,
      inProgressTasks,
      solvedTasks,
      volunteerStats,
    };
  }, [provisionedVolunteers, problems]);

  // Filtered Moderation Problems: ONLY show reports that are NOT yet assigned (pending review or waiting for first assignment)
  const filteredModerationProblems = useMemo(() => {
    return problems.filter((p) => {
      const isAssigned = Boolean(p.assignedLead) || p.status === 'IN_PROGRESS' || p.status === 'SOLVED';
      if (isAssigned) return false;

      const isPendingGate = p.status === 'PENDING_REVIEW' || p.moderationStatus === 'PENDING' || !p.isApproved || p.reflaggedByCommunity;
      if (moderationFilter === 'PENDING' && !isPendingGate) return false;
      if (moderationFilter === 'URGENT' && !p.urgent) return false;
      if (moderationFilter === 'AI_FLAGGED' && !(p.aiPhotoFlagged || p.aiPhotoMatchResult === 'MISMATCH')) return false;
      if (moderationSearch.trim()) {
        const q = moderationSearch.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => {
      // Prioritize reports with AI mismatch or warning confirmed so coordinators can inspect them first
      const aMismatch = Boolean(a.aiPhotoFlagged || a.aiPhotoMatchResult === 'MISMATCH');
      const bMismatch = Boolean(b.aiPhotoFlagged || b.aiPhotoMatchResult === 'MISMATCH');
      if (aMismatch && !bMismatch) return -1;
      if (!aMismatch && bMismatch) return 1;
      return 0;
    });
  }, [problems, moderationFilter, moderationSearch]);

  const unassignedCount = problems.filter((p) => !p.assignedLead && p.status !== 'IN_PROGRESS' && p.status !== 'SOLVED').length;
  const activeTasksCount = problems.filter((p) => p.status === 'IN_PROGRESS' || Boolean(p.assignedLead)).length;

  return (
    <div className="flex-1 w-full max-w-xl mx-auto px-4 pt-4 sm:pt-6 pb-8 space-y-4">
      {/* TAB 0: COORDINATOR HOME / HUB (ONLY screen with the full profile card) */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Full Detailed Profile Card (ONLY on Coordinator Home) */}
          <div className="relative bg-[#FFFDF8] border-2 border-[#1D4ED8] rounded-2xl p-4 sm:p-5 shadow-[0_4px_14px_rgba(43,38,34,0.08)] mt-2 sm:mt-3">
            <div className="absolute -top-3 left-8 z-10">
              <Pushpin color="navy" size="md" />
            </div>
            <div className="absolute -top-2 right-6 rotate-3 z-10">
              <WashiTape color="blue" width="w-20" />
            </div>

            <div className="flex items-center gap-3.5 pt-2 sm:pt-2.5">
              <div className="w-14 h-14 rounded-xl border-2 border-[#1D4ED8] shadow-xs overflow-hidden p-0.5 bg-[#FAF6ED] shrink-0">
                <img
                  src={NSS_SEAL_URL}
                  alt="Coordinator Seal"
                  className="w-full h-full rounded-lg object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-['Epilogue'] font-black text-lg text-[#1F1B17] truncate">
                    {adminData?.officerName || 'Prof. S. R. Verma'}
                  </h1>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EBF3FF] text-[#1D4ED8] border border-[#93C5FD]">
                    Coordinator
                  </span>
                </div>
                <p className="text-[11px] font-mono text-[#1D4ED8] font-bold">
                  ID: {adminData?.officerId || 'OFFICER-NSS-01'} • {adminData?.unit || 'CMRIT NSS Unit 1'}
                </p>
                <p className="text-xs text-[#57423C]">Helps organize volunteers and track fixes</p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-1.5 mt-4 pt-3 border-t border-[#DEC0B8] text-center">
              <div className="bg-[#FAF6ED] p-1.5 rounded-lg border border-[#DEC0B8]">
                <div className="font-['Epilogue'] font-black text-base text-[#1B4B43]">
                  {analyticsData.totalVolunteers}
                </div>
                <div className="text-[9px] font-bold text-[#6E5A4E] uppercase">Volunteers</div>
              </div>

              <div className="bg-[#FAF6ED] p-1.5 rounded-lg border border-[#DEC0B8]">
                <div className="font-['Epilogue'] font-black text-base text-[#1D4ED8]">
                  {analyticsData.unassignedTasks}
                </div>
                <div className="text-[9px] font-bold text-[#6E5A4E] uppercase">Unassigned</div>
              </div>

              <div className="bg-[#FAF6ED] p-1.5 rounded-lg border border-[#DEC0B8]">
                <div className="font-['Epilogue'] font-black text-base text-[#1D4ED8]">
                  {analyticsData.inProgressTasks}
                </div>
                <div className="text-[9px] font-bold text-[#6E5A4E] uppercase">In Progress</div>
              </div>

              <div className="bg-[#FAF6ED] p-1.5 rounded-lg border border-[#DEC0B8]">
                <div className="font-['Epilogue'] font-black text-base text-[#1D4ED8]">
                  {analyticsData.solvedTasks}
                </div>
                <div className="text-[9px] font-bold text-[#6E5A4E] uppercase">Solved</div>
              </div>
            </div>
          </div>

          {/* Urgent Dispatch Callout */}
          {analyticsData.unassignedTasks > 0 && (
            <div className="bg-[#EFF6FF] border-2 border-[#BFDBFE] rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertOctagon className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-['Epilogue'] font-bold text-sm text-[#1E40AF]">
                    {analyticsData.unassignedTasks} Report{analyticsData.unassignedTasks > 1 ? 's' : ''} Waiting for Volunteers
                  </h4>
                  <p className="text-xs text-[#6E5A4E] mt-0.5">
                    Neighbors reported issues that need an assigned volunteer and target completion date.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('moderation')}
                className="px-3.5 py-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-['Epilogue'] font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>Review & Assign</span>
              </button>
            </div>
          )}

          {/* Quick Actions Grid */}
          <div className="bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="font-['Epilogue'] font-bold text-xs text-[#57423C] uppercase tracking-wider">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              <button
                onClick={() => setActiveTab('volunteers')}
                className="p-3 rounded-xl bg-[#FAF6ED] border border-[#DEC0B8] hover:border-[#1D4ED8] text-left transition-all cursor-pointer group shadow-2xs hover:bg-[#FFFDF8]"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EBF3FF] text-[#1D4ED8] border border-[#93C5FD] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#1D4ED8]">
                    {provisionedVolunteers.length} Active
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
                onClick={() => setActiveTab('tasks')}
                className="p-3 rounded-xl bg-[#FAF6ED] border border-[#DEC0B8] hover:border-[#1D4ED8] text-left transition-all cursor-pointer group shadow-2xs hover:bg-[#FFFDF8]"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EBF3FF] text-[#1D4ED8] border border-[#93C5FD] flex items-center justify-center">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#1D4ED8]">
                    {analyticsData.inProgressTasks} Active
                  </span>
                </div>
                <div className="font-['Epilogue'] font-bold text-xs text-[#1F1B17] group-hover:text-[#1D4ED8]">
                  Assign Tasks
                </div>
                <p className="text-[11px] text-[#7C695E] mt-0.5">
                  Track in-progress tasks and reassign active work
                </p>
              </button>

              <button
                onClick={() => setActiveTab('moderation')}
                className="p-3 rounded-xl bg-[#FAF6ED] border border-[#DEC0B8] hover:border-[#1D4ED8] text-left transition-all cursor-pointer group shadow-2xs hover:bg-[#FFFDF8]"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FAF6ED] text-[#7B5300] flex items-center justify-center border border-[#DEC0B8]">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#7B5300]">
                    {unassignedCount} New
                  </span>
                </div>
                <div className="font-['Epilogue'] font-bold text-xs text-[#1F1B17] group-hover:text-[#1D4ED8]">
                  Review Reports
                </div>
                <p className="text-[11px] text-[#7C695E] mt-0.5">
                  Review new reports, assign volunteers, remove spam
                </p>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className="p-3 rounded-xl bg-[#FAF6ED] border border-[#DEC0B8] hover:border-[#1D4ED8] text-left transition-all cursor-pointer group shadow-2xs hover:bg-[#FFFDF8]"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FAF6ED] text-[#1B4B43] border border-[#DEC0B8] flex items-center justify-center">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#1B4B43]">
                    {analyticsData.solvedTasks} Solved
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
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                placeholder="Write a note to share with volunteers and neighbors..."
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-[#FAF6ED] border border-[#DEC0B8] text-[#1F1B17] focus:outline-hidden focus:border-[#1D4ED8]"
              />
              <button
                onClick={() => {
                  updateAdminData({ broadcastNote: broadcastText });
                  showToast('Notice saved and pinned to community bulletin board.');
                }}
                className="px-3.5 py-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-['Epilogue'] font-bold cursor-pointer shrink-0"
              >
                Post Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: VOLUNTEER IDS */}
      {activeTab === 'volunteers' && (
        <div className="space-y-4">
          {/* Header & Actions */}
          <div className="bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-['Epilogue'] font-black text-sm sm:text-base text-[#1F1B17]">
                Volunteer IDs
              </h2>
              <p className="text-xs text-[#6E5A4E]">
                Create a login ID for each new volunteer. They can only sign in using an ID you give them.
              </p>
            </div>

            <button
              onClick={() => setIsProvisionModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-['Epilogue'] font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Volunteer</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8C7A70] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={volunteerSearch}
                onChange={(e) => setVolunteerSearch(e.target.value)}
                placeholder="Search by volunteer name, ID, or unit..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#FFFDF8] border border-[#DEC0B8] text-[#1F1B17] focus:outline-hidden focus:border-[#1D4ED8]"
              />
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                onClick={() => setVolunteerStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-['Epilogue'] font-bold border cursor-pointer ${
                  volunteerStatusFilter === 'ALL'
                    ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                    : 'bg-white text-[#57423C] border-[#DEC0B8]'
                }`}
              >
                All ({provisionedVolunteers.length})
              </button>
              <button
                onClick={() => setVolunteerStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-['Epilogue'] font-bold border cursor-pointer ${
                  volunteerStatusFilter === 'ACTIVE'
                    ? 'bg-[#1B4B43] text-white border-[#1B4B43]'
                    : 'bg-white text-[#57423C] border-[#DEC0B8]'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setVolunteerStatusFilter('SUSPENDED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-['Epilogue'] font-bold border cursor-pointer ${
                  volunteerStatusFilter === 'SUSPENDED'
                    ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                    : 'bg-white text-[#57423C] border-[#DEC0B8]'
                }`}
              >
                Suspended
              </button>
            </div>
          </div>

          {/* Volunteer Roster Cards */}
          <div className="space-y-3">
            {filteredVolunteers.length === 0 ? (
              <div className="p-8 text-center bg-[#FFFDF8] border border-dashed border-[#DEC0B8] rounded-xl text-xs text-[#7C695E]">
                No volunteer records matched your search query.
              </div>
            ) : (
              filteredVolunteers.map((cadet) => {
                const assignedTasks = problems.filter(
                  (p) =>
                    p.assignedToVolunteerId === cadet.id ||
                    p.assignedLead === cadet.name ||
                    p.assignedVolunteers?.includes(cadet.name)
                );
                const activeTasks = assignedTasks.filter((p) => p.status === 'IN_PROGRESS');

                return (
                  <div
                    key={cadet.id}
                    className={`bg-[#FFFDF8] border-2 rounded-xl p-3.5 sm:p-4 shadow-xs transition-all space-y-3 ${
                      cadet.status === 'ACTIVE' ? 'border-[#DEC0B8]' : 'border-[#BFDBFE] bg-[#EFF6FF]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <VolunteerAvatar
                          avatar={cadet.avatar}
                          name={cadet.name}
                          size="md"
                          className="rounded-xl border border-[#DEC0B8]"
                        />

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-['Epilogue'] font-bold text-sm text-[#1F1B17]">
                              {cadet.name}
                            </h3>
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                cadet.status === 'ACTIVE'
                                  ? 'bg-[#B8EADE] text-[#1B4B43]'
                                  : 'bg-[#EFF6FF] text-[#1E40AF]'
                              }`}
                            >
                              {cadet.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#57423C]">
                            {cadet.role} • {cadet.unit}
                          </p>
                        </div>
                      </div>

                      {/* Volunteer ID Stamp & Copy Button */}
                      <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#FAF6ED] px-2.5 py-1 rounded-lg border border-[#DEC0B8]">
                        <span className="text-[10px] text-[#7C695E] uppercase font-bold">ID:</span>
                        <code className="text-xs font-mono font-bold text-[#1D4ED8]">
                          {cadet.id}
                        </code>
                        <button
                          onClick={() => handleCopyId(cadet.id)}
                          title="Copy ID to give to volunteer"
                          className="p-1 text-[#57423C] hover:text-[#1D4ED8] cursor-pointer"
                        >
                          {copiedId === cadet.id ? (
                            <Check className="w-3.5 h-3.5 text-[#1B4B43]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Metrics and Status details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#F1E6E0] text-xs text-[#57423C]">
                      <div>
                        <span className="text-[10px] text-[#7C695E] uppercase block">Assigned Tasks</span>
                        <strong className="font-mono text-sm text-[#1F1B17]">
                          {assignedTasks.length} ({activeTasks.length} active)
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#7C695E] uppercase block">Service Hours</span>
                        <strong className="font-mono text-sm text-[#1B4B43]">
                          {cadet.hoursCompleted} hrs
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#7C695E] uppercase block">Solved</span>
                        <strong className="font-mono text-sm text-[#1B4B43]">
                          {cadet.civicWins} solved
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#7C695E] uppercase block">Date Added</span>
                        <span className="font-mono text-xs">{cadet.dateProvisioned}</span>
                      </div>
                    </div>

                    {/* Action Bar for this Volunteer */}
                    <div className="pt-2 border-t border-[#F1E6E0] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <button
                          onClick={() => handleOpenNudge(cadet)}
                          className="px-2.5 py-1 rounded-lg bg-[#FAF6ED] hover:bg-[#DEC0B8]/40 border border-[#DEC0B8] text-[#57423C] flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                        >
                          <Bell className="w-3 h-3 text-[#7B5300]" />
                          <span>Send Reminder</span>
                        </button>

                        <button
                          onClick={() => toggleVolunteerStatus(cadet.id)}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                            cadet.status === 'ACTIVE'
                              ? 'border-[#DEC0B8] text-[#1D4ED8] hover:bg-[#EFF6FF]'
                              : 'border-[#38665E] text-[#1B4B43] hover:bg-[#B8EADE]/30'
                          }`}
                        >
                          {cadet.status === 'ACTIVE' ? 'Suspend ID' : 'Activate ID'}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveTab('moderation');
                          }}
                          className="px-3 py-1 bg-[#1D4ED8] text-white hover:bg-[#1E40AF] rounded-lg text-xs font-['Epilogue'] font-bold cursor-pointer"
                        >
                          Review & Assign →
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete volunteer ID ${cadet.id} (${cadet.name})?`)) {
                              revokeVolunteerId(cadet.id);
                            }
                          }}
                          className="p-1.5 text-[#8C7A70] hover:text-[#1D4ED8] cursor-pointer"
                          title="Delete ID"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ASSIGN TASKS (TRACK & REASSIGN ACTIVE WORK) */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-['Epilogue'] font-black text-sm sm:text-base text-[#1F1B17]">
                Track & Reassign Tasks
              </h2>
              <p className="text-xs text-[#6E5A4E]">
                Monitor active assignments, check updates from volunteers, and reassign ongoing tasks when needed.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8C7A70] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Search active tasks by title, location, category..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#FFFDF8] border border-[#DEC0B8] text-[#1F1B17] focus:outline-hidden focus:border-[#1D4ED8]"
              />
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto overflow-x-auto no-scrollbar">
              <button
                onClick={() => setTaskFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-['Epilogue'] font-bold border cursor-pointer shrink-0 ${
                  taskFilter === 'ALL'
                    ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                    : 'bg-white text-[#57423C] border-[#DEC0B8]'
                }`}
              >
                All Assigned ({filteredTasks.length})
              </button>
              <button
                onClick={() => setTaskFilter('ASSIGNED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-['Epilogue'] font-bold border cursor-pointer shrink-0 ${
                  taskFilter === 'ASSIGNED'
                    ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                    : 'bg-white text-[#57423C] border-[#DEC0B8]'
                }`}
              >
                In Progress ({analyticsData.inProgressTasks})
              </button>
              <button
                onClick={() => setTaskFilter('SOLVED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-['Epilogue'] font-bold border cursor-pointer shrink-0 ${
                  taskFilter === 'SOLVED'
                    ? 'bg-[#1B4B43] text-white border-[#1B4B43]'
                    : 'bg-white text-[#57423C] border-[#DEC0B8]'
                }`}
              >
                Solved ({analyticsData.solvedTasks})
              </button>
            </div>
          </div>

          {/* Task Dispatch Cards */}
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center bg-[#FFFDF8] border border-dashed border-[#DEC0B8] rounded-xl text-xs text-[#7C695E] space-y-1">
                <p className="font-semibold text-[#1F1B17]">No active assigned tasks found.</p>
                <p>New reports can be reviewed and given their first assignment in the <strong>Review Reports</strong> screen.</p>
              </div>
            ) : (
              filteredTasks.map((problem) => {
                return (
                  <div
                    key={problem.id}
                    className="bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-xl p-4 shadow-xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <RubberStamp status={problem.status} size="sm" />
                        <span className="text-[11px] font-['Epilogue'] font-bold px-2 py-0.5 rounded-full bg-[#FAF6ED] text-[#57423C] border border-[#DEC0B8]">
                          {problem.category}
                        </span>
                        {problem.urgent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]">
                            URGENT
                          </span>
                        )}
                      </div>

                      {/* Assignment status badge */}
                      <div className="text-xs font-mono font-bold text-[#1B4B43] bg-[#E0F3EE] border border-[#B8EADE] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1B4B43]" />
                        <span>Assigned: {problem.assignedLead || 'Volunteer'}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-['Epilogue'] font-bold text-sm text-[#1F1B17]">
                        {problem.title}
                      </h3>
                      <p className="text-xs text-[#6E5A4E] mt-0.5 line-clamp-2">
                        {problem.description}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-[#7C695E] mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#1D4ED8]" />
                        <span>{problem.location}</span>
                      </div>
                    </div>

                    {/* Metadata if assigned */}
                    {(problem.targetDate || problem.materialsNeeded) && (
                      <div className="p-2.5 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] text-xs text-[#57423C] flex flex-wrap gap-x-4 gap-y-1">
                        {problem.targetDate && (
                          <div>
                            Target Date: <strong>{problem.targetDate}</strong>
                          </div>
                        )}
                        {problem.materialsNeeded && (
                          <div>
                            Tools Needed: <strong>{problem.materialsNeeded}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Task Actions */}
                    <div className="pt-2 border-t border-[#F1E6E0] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigateTo('problem-detail', problem.id)}
                          className="text-xs text-[#7C695E] hover:text-[#1F1B17] underline cursor-pointer"
                        >
                          View Full Notice
                        </button>
                        <span className="text-xs text-[#DEC0B8]">•</span>
                        <span className="text-xs text-[#7C695E]">
                          {problem.updates.length} Updates logged
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenReassign(problem)}
                          className="px-3 py-1.5 bg-[#FAF6ED] hover:bg-[#DEC0B8]/40 border border-[#DEC0B8] text-[#57423C] text-xs font-['Epilogue'] font-bold rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-[#1D4ED8]" />
                          <span>Reassign</span>
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm('Delete this report permanently?')) {
                              deleteProblem(problem.id);
                            }
                          }}
                          className="p-1.5 text-[#8C7A70] hover:text-[#1D4ED8] cursor-pointer"
                          title="Delete inappropriate report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: REVIEW REPORTS (MODERATION & FIRST-TIME ASSIGNMENT) */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          <div className="bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-['Epilogue'] font-black text-sm sm:text-base text-[#1F1B17]">
                Review Reports
              </h2>
              <p className="text-xs text-[#6E5A4E]">
                Review new community reports, assign them to volunteers, or remove spam. Assigned reports move automatically to Active Tasks.
              </p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8C7A70] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={moderationSearch}
                onChange={(e) => setModerationSearch(e.target.value)}
                placeholder="Search reports to review by title or location..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#FFFDF8] border border-[#DEC0B8] text-[#1F1B17] focus:outline-hidden focus:border-[#1D4ED8]"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setModerationFilter('PENDING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-['Epilogue'] font-bold border cursor-pointer shrink-0 ${
                  moderationFilter === 'PENDING'
                    ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                    : 'bg-white text-[#57423C] border-[#DEC0B8]'
                }`}
              >
                Pending Review ({problems.filter((p) => (!p.assignedLead && p.status !== 'IN_PROGRESS' && p.status !== 'SOLVED') && (p.status === 'PENDING_REVIEW' || p.moderationStatus === 'PENDING' || !p.isApproved || p.reflaggedByCommunity)).length})
              </button>
              <button
                onClick={() => setModerationFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-['Epilogue'] font-bold border cursor-pointer shrink-0 ${
                  moderationFilter === 'ALL'
                    ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                    : 'bg-white text-[#57423C] border-[#DEC0B8]'
                }`}
              >
                All Unassigned ({unassignedCount})
              </button>
              <button
                onClick={() => setModerationFilter('URGENT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-['Epilogue'] font-bold border cursor-pointer shrink-0 ${
                  moderationFilter === 'URGENT'
                    ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                    : 'bg-white text-[#57423C] border-[#DEC0B8]'
                }`}
              >
                Urgent ({problems.filter((p) => (!p.assignedLead && p.status !== 'IN_PROGRESS' && p.status !== 'SOLVED') && p.urgent).length})
              </button>
              <button
                onClick={() => setModerationFilter('AI_FLAGGED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-['Epilogue'] font-bold border cursor-pointer shrink-0 flex items-center gap-1 ${
                  moderationFilter === 'AI_FLAGGED'
                    ? 'bg-[#DC2626] text-white border-[#DC2626]'
                    : 'bg-white text-[#DC2626] border-[#FECACA] hover:bg-[#FEF2F2]'
                }`}
              >
                <span>⚠️ AI Mismatch</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/10">
                  {problems.filter((p) => (!p.assignedLead && p.status !== 'IN_PROGRESS' && p.status !== 'SOLVED') && (p.aiPhotoFlagged || p.aiPhotoMatchResult === 'MISMATCH')).length}
                </span>
              </button>
            </div>
          </div>

          {/* Moderation Notices List */}
          <div className="space-y-3">
            {filteredModerationProblems.length === 0 ? (
              <div className="p-8 text-center bg-[#FFFDF8] border border-dashed border-[#DEC0B8] rounded-xl text-xs text-[#7C695E]">
                No pending or unassigned reports match the current filter. All clear!
              </div>
            ) : (
              filteredModerationProblems.map((problem) => (
                <div
                  key={problem.id}
                  className="bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1 max-w-lg">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAF6ED] text-[#57423C] border border-[#DEC0B8]">
                          {problem.category}
                        </span>
                        {problem.urgent && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]">
                            Urgent
                          </span>
                        )}
                        {problem.linkedDuplicatesCount > 0 && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E0F3EE] text-[#1B4B43] border border-[#B8EADE]">
                            +{problem.linkedDuplicatesCount} Linked Reports
                          </span>
                        )}
                        {(problem.status === 'PENDING_REVIEW' || problem.moderationStatus === 'PENDING' || !problem.isApproved) && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EBF3FF] text-[#1D4ED8] border border-[#BFDBFE]">
                            Pending Review
                          </span>
                        )}
                        {(problem.reflaggedByCommunity || (problem.flagCount || 0) > 0) && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                            🚩 Flagged ({problem.flagCount || 1})
                          </span>
                        )}
                        {problem.possibleReusedPhoto && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]" title="Perceptual hash match with a previously uploaded photo">
                            ⚠️ Possible Reused Photo
                          </span>
                        )}
                        {problem.aiPhotoFlagged && (
                          <span
                            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] flex items-center gap-1"
                            title={problem.aiPhotoRawResponse ? `AI Vision check: ${problem.aiPhotoRawResponse}` : 'AI flagged: photo may not match category'}
                          >
                            <span>⚠️</span>
                            <span>AI flagged: photo may not match category</span>
                          </span>
                        )}
                        {!problem.aiPhotoFlagged && problem.aiPhotoMatchResult === 'MISMATCH' && (
                          <span
                            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] flex items-center gap-1"
                            title={problem.aiPhotoRawResponse ? `AI Vision check: ${problem.aiPhotoRawResponse}` : 'AI: possible mismatch'}
                          >
                            <span>⚠️</span>
                            <span>AI: possible mismatch</span>
                          </span>
                        )}
                        {problem.aiPhotoMatchResult === 'UNCLEAR' && (
                          <span
                            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]"
                            title={problem.aiPhotoRawResponse ? `AI Vision check: ${problem.aiPhotoRawResponse}` : 'AI check was inconclusive'}
                          >
                            AI: unclear match
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-[#7C695E]">
                          {formatRelativeTime(problem.createdAt)}
                        </span>
                      </div>
                      <h3 className="font-['Epilogue'] font-black text-sm text-[#1F1B17]">
                        {problem.title}
                      </h3>
                      <p className="text-xs text-[#57423C] line-clamp-2">
                        {problem.description}
                      </p>
                      {problem.photoUrl && (
                        <div className="pt-1">
                          <img
                            src={problem.photoUrl}
                            alt="Report evidence"
                            className="w-20 h-14 object-cover rounded-md border border-[#DEC0B8]"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <p className="text-[11px] text-[#7C695E]">
                        📍 {problem.location} {problem.landmark ? `• Near ${problem.landmark}` : ''} • Reported by {problem.anonymous ? 'Anonymous Neighbor' : (problem.reporterName || 'Neighbor')}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
                      {(problem.status === 'PENDING_REVIEW' || problem.moderationStatus === 'PENDING' || !problem.isApproved || problem.reflaggedByCommunity) ? (
                        <>
                          <button
                            onClick={() => approveProblem(problem.id)}
                            className="px-2.5 py-1.5 text-xs font-['Epilogue'] font-bold rounded-lg bg-[#1B4B43] hover:bg-[#153a34] text-white cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Approve report and publish to public problem wall"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleOpenAssign(problem)}
                            className="px-2.5 py-1.5 text-xs font-['Epilogue'] font-bold rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Approve & Assign to Volunteer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Assign</span>
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Remove and reject spam report "${problem.title}"? This permanently keeps it off the public wall.`)) {
                                rejectProblem(problem.id, 'Marked as spam during coordinator review');
                              }
                            }}
                            className="px-2.5 py-1.5 text-xs font-['Epilogue'] font-bold rounded-lg bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Remove spam and permanently exclude from public wall"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Spam</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleOpenAssign(problem)}
                            className="px-2.5 py-1.5 text-xs font-['Epilogue'] font-bold rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Assign</span>
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Permanently delete this report "${problem.title}"?`)) {
                                deleteProblem(problem.id);
                              }
                            }}
                            className="px-2.5 py-1.5 text-xs font-['Epilogue'] font-bold rounded-lg bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1D4ED8] border border-[#DEC0B8] cursor-pointer flex items-center gap-1"
                            title="Delete Spam"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Spam</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: VOLUNTEER STATS */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-xl p-3 sm:p-4 shadow-xs">
            <h2 className="font-['Epilogue'] font-black text-sm sm:text-base text-[#1F1B17]">
              Check on Your Volunteers
            </h2>
            <p className="text-xs text-[#6E5A4E]">
              See who hasn't started yet, check their photos, and send a quick reminder.
            </p>
          </div>

          {/* Performance Table / Roster Matrix */}
          <div className="bg-[#FFFDF8] border-2 border-[#DEC0B8] rounded-xl overflow-hidden shadow-xs">
            <div className="p-3 border-b border-[#E3D4BE] flex items-center justify-between">
              <span className="font-['Epilogue'] font-bold text-xs text-[#1F1B17]">
                Volunteer Overview ({analyticsData.volunteerStats.length} Volunteers)
              </span>
              <span className="text-[11px] text-[#7C695E]">Live status</span>
            </div>

            <div className="divide-y divide-[#F1E6E0]">
              {analyticsData.volunteerStats.map((cadet) => {
                return (
                  <div key={cadet.id} className="p-3.5 hover:bg-[#FAF6ED]/50 transition-colors space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <VolunteerAvatar
                          avatar={cadet.avatar}
                          name={cadet.name}
                          size="sm"
                          className="rounded-lg border border-[#DEC0B8]"
                        />

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-['Epilogue'] font-bold text-xs text-[#1F1B17]">
                              {cadet.name}
                            </h4>
                            <span className="text-[10px] font-mono text-[#1D4ED8]">
                              [{cadet.id}]
                            </span>
                          </div>
                          <p className="text-[11px] text-[#7C695E]">
                            {cadet.unit} • {cadet.role}
                          </p>
                        </div>
                      </div>

                      {/* Status Chip */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {cadet.accountability === 'ACTIVE' && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#B8EADE] text-[#1B4B43] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1B4B43] animate-pulse" />
                            <span>In-Field & Updating</span>
                          </span>
                        )}
                        {cadet.accountability === 'PENDING' && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Waiting to Start</span>
                          </span>
                        )}
                        {cadet.accountability === 'STALLED' && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#1D4ED8] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Needs a Reminder</span>
                          </span>
                        )}
                        {cadet.accountability === 'IDLE' && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FAF6ED] text-[#7C695E] border border-[#DEC0B8]">
                            Available / 0 Active Tasks
                          </span>
                        )}

                        <button
                          onClick={() => handleOpenNudge(cadet)}
                          className="px-2.5 py-1 text-[11px] font-['Epilogue'] font-bold rounded-lg bg-white border border-[#DEC0B8] text-[#57423C] hover:bg-[#FAF6ED] cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Send Reminder"
                        >
                          <Bell className="w-3 h-3 text-[#7B5300]" />
                          <span>Send Reminder</span>
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar & Assigned Task Preview */}
                    <div className="bg-[#FAF6ED] p-2.5 rounded-lg border border-[#DEC0B8] space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-[#57423C]">
                        <span>
                          Workload: <strong>{cadet.activeCount} active</strong> • {cadet.solvedCount} solved
                        </span>
                        <span className="font-mono text-[#1B4B43] font-bold">
                          {cadet.hoursCompleted} hours verified
                        </span>
                      </div>

                      {cadet.assignedProblems.length > 0 ? (
                        <div className="space-y-1 pt-1 border-t border-[#DEC0B8]/60">
                          {cadet.assignedProblems.map((prob) => (
                            <div
                              key={prob.id}
                              className="flex items-center justify-between text-xs bg-white px-2 py-1 rounded border border-[#DEC0B8]/70"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <RubberStamp status={prob.status} size="sm" />
                                <span className="font-medium text-[#1F1B17] truncate max-w-[200px] sm:max-w-xs">
                                  {prob.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] font-mono text-[#7C695E]">
                                  {prob.updates.length} updates
                                </span>
                                <button
                                  onClick={() => navigateTo('problem-detail', prob.id)}
                                  className="text-[10px] font-bold text-[#1D4ED8] hover:underline cursor-pointer"
                                >
                                  View Details →
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10.5px] text-[#7C695E] italic">
                          No tasks currently assigned to this volunteer.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW VOLUNTEER */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="relative bg-[#FFFDF8] border-3 border-[#DEC0B8] rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E3D4BE] pb-2">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#1D4ED8]" />
                <h3 className="font-['Epilogue'] font-black text-base text-[#1F1B17]">
                  Add New Volunteer
                </h3>
              </div>
              <button
                onClick={() => setIsProvisionModalOpen(false)}
                className="text-[#8C7A70] hover:text-[#1F1B17] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#6E5A4E]">
              Create an ID so the volunteer can log in to their dashboard.
            </p>

            <form onSubmit={handleCreateVolunteer} className="space-y-3 text-xs">
              <div>
                <label className="block font-['Epilogue'] font-bold text-[#1F1B17] mb-1">
                  Volunteer Name *
                </label>
                <input
                  type="text"
                  required
                  value={newVolunteerName}
                  onChange={(e) => setNewVolunteerName(e.target.value)}
                  placeholder="e.g. Ankit Sengupta"
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] text-[#1F1B17] text-sm focus:outline-hidden focus:border-[#1D4ED8]"
                />
              </div>

              {/* Dedicated Volunteer ID Field */}
              <div className="bg-[#FAF6ED] p-3 rounded-xl border-2 border-[#DEC0B8] space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-['Epilogue'] font-bold text-[#1F1B17] text-xs flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#1D4ED8]" />
                    <span>Volunteer ID (Login ID)</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomId}
                    className="text-[11px] font-['Epilogue'] font-bold text-[#1D4ED8] hover:text-[#1E40AF] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Auto-Generate ID</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={customVolunteerId}
                  onChange={(e) => setCustomVolunteerId(e.target.value.toUpperCase())}
                  placeholder="e.g. NSS-2026-ND-8492 or VOL-01 (or leave blank)"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#DEC0B8] text-[#1F1B17] focus:outline-hidden focus:border-[#1D4ED8] font-mono text-xs font-semibold uppercase tracking-wider"
                />
                <p className="text-[10.5px] text-[#6E5A4E] leading-relaxed">
                  Enter the volunteer login ID, or click <strong>Auto-Generate ID</strong>. The volunteer uses this exact ID to sign in.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] text-[11px] text-[#57423C] flex items-center justify-between">
                <span>Final Login ID Preview:</span>
                <strong className="font-mono text-[#1D4ED8] font-bold text-xs">
                  {customVolunteerId.trim() || 'Auto-generated on save (e.g. NSS-2026-ND-XXXX)'}
                </strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#7C695E] hover:underline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1D4ED8] text-white text-xs font-['Epilogue'] font-bold shadow-xs hover:bg-[#1E40AF] cursor-pointer"
                >
                  Save Volunteer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN TASK TO VOLUNTEER */}
      {assigningProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="relative bg-[#FFFDF8] border-3 border-[#DEC0B8] rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E3D4BE] pb-2">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#1D4ED8]" />
                <h3 className="font-['Epilogue'] font-black text-base text-[#1F1B17]">
                  Assign Task to Volunteer
                </h3>
              </div>
              <button
                onClick={() => setAssigningProblem(null)}
                className="text-[#8C7A70] hover:text-[#1F1B17] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 bg-[#FAF6ED] rounded-xl border border-[#DEC0B8] space-y-1 text-xs">
              <div className="font-['Epilogue'] font-bold text-[#1F1B17]">
                {assigningProblem.title}
              </div>
              <div className="text-[#6E5A4E] text-[11px]">{assigningProblem.location}</div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-['Epilogue'] font-bold text-[#1F1B17] mb-1">
                  Select Volunteer *
                </label>
                <select
                  value={selectedVolunteerId}
                  onChange={(e) => setSelectedVolunteerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] text-[#1F1B17] focus:outline-hidden focus:border-[#1D4ED8]"
                >
                  {provisionedVolunteers
                    .filter((v) => v.status === 'ACTIVE')
                    .map((cadet) => {
                      const activeCount = problems.filter(
                        (p) =>
                          p.status === 'IN_PROGRESS' &&
                          (p.assignedToVolunteerId === cadet.id || p.assignedLead === cadet.name)
                      ).length;
                      return (
                        <option key={cadet.id} value={cadet.id}>
                          {cadet.name} ({cadet.id}) — {activeCount} active tasks
                        </option>
                      );
                    })}
                </select>
              </div>

              <div>
                <label className="block font-['Epilogue'] font-bold text-[#1F1B17] mb-1">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] text-[#1F1B17] focus:outline-hidden focus:border-[#1D4ED8]"
                />
              </div>

              <div>
                <label className="block font-['Epilogue'] font-bold text-[#1F1B17] mb-1">
                  Tools or Items Needed
                </label>
                <input
                  type="text"
                  value={materialsNeeded}
                  onChange={(e) => setMaterialsNeeded(e.target.value)}
                  placeholder="e.g. Trash tongs, gloves, 50L waste bags"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] text-[#1F1B17] focus:outline-hidden focus:border-[#1D4ED8]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningProblem(null)}
                  className="px-3 py-1.5 text-xs text-[#7C695E] hover:underline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAssign}
                  className="px-4 py-2 rounded-xl bg-[#1D4ED8] text-white text-xs font-['Epilogue'] font-bold shadow-xs hover:bg-[#1E40AF] cursor-pointer"
                >
                  Assign Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REASSIGN TASK */}
      {reassigningProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="relative bg-[#FFFDF8] border-3 border-[#DEC0B8] rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E3D4BE] pb-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-[#1D4ED8]" />
                <h3 className="font-['Epilogue'] font-black text-base text-[#1F1B17]">
                  Reassign Task
                </h3>
              </div>
              <button
                onClick={() => setReassigningProblem(null)}
                className="text-[#8C7A70] hover:text-[#1F1B17] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 bg-[#FAF6ED] rounded-xl border border-[#DEC0B8] text-xs space-y-1">
              <div className="font-bold text-[#1F1B17]">{reassigningProblem.title}</div>
              <div className="text-[11px] text-[#1D4ED8]">
                Currently assigned to: <strong>{reassigningProblem.assignedLead || 'Unassigned'}</strong>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block font-['Epilogue'] font-bold text-[#1F1B17] mb-1">
                  Reassign to Volunteer *
                </label>
                <select
                  value={newAssigneeId}
                  onChange={(e) => setNewAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] text-[#1F1B17] focus:outline-hidden focus:border-[#1D4ED8]"
                >
                  {provisionedVolunteers
                    .filter((v) => v.status === 'ACTIVE' && v.id !== reassigningProblem.assignedToVolunteerId)
                    .map((cadet) => (
                      <option key={cadet.id} value={cadet.id}>
                        {cadet.name} ({cadet.id}) — {cadet.unit}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-['Epilogue'] font-bold text-[#1F1B17] mb-1">
                  Reason for Reassigning
                </label>
                <input
                  type="text"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="e.g. Volunteer schedule conflict, expedited response"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] text-[#1F1B17] focus:outline-hidden focus:border-[#1D4ED8]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReassigningProblem(null)}
                  className="px-3 py-1.5 text-xs text-[#7C695E] hover:underline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReassign}
                  className="px-4 py-2 rounded-xl bg-[#1D4ED8] text-white text-xs font-['Epilogue'] font-bold shadow-xs hover:bg-[#1E40AF] cursor-pointer"
                >
                  Confirm Reassignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: SEND REMINDER */}
      {nudgingVolunteer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="relative bg-[#FFFDF8] border-3 border-[#DEC0B8] rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E3D4BE] pb-2">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#7B5300]" />
                <h3 className="font-['Epilogue'] font-black text-base text-[#1F1B17]">
                  Send a Reminder
                </h3>
              </div>
              <button
                onClick={() => setNudgingVolunteer(null)}
                className="text-[#8C7A70] hover:text-[#1F1B17] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#6E5A4E]">
              Send a friendly reminder to{' '}
              <strong>{nudgingVolunteer.name}</strong> ({nudgingVolunteer.id}) to check in or share progress.
            </p>

            <div className="space-y-2 text-xs">
              <label className="block font-['Epilogue'] font-bold text-[#1F1B17]">
                Reminder Message
              </label>
              <textarea
                rows={3}
                value={nudgeMessage}
                onChange={(e) => setNudgeMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#FAF6ED] border border-[#DEC0B8] text-[#1F1B17] focus:outline-hidden focus:border-[#1D4ED8]"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNudgingVolunteer(null)}
                  className="px-3 py-1.5 text-xs text-[#7C695E] hover:underline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendNudge}
                  className="px-4 py-2 rounded-xl bg-[#1D4ED8] text-white text-xs font-['Epilogue'] font-bold shadow-xs hover:bg-[#1E40AF] cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Reminder</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
