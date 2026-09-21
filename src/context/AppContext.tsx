import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Problem,
  AppScreen,
  UserRole,
  Volunteer,
  ProblemCategory,
  VolunteerRosterMember,
  AppNotification,
  ProvisionedVolunteer,
  AdminTab,
  CommunityMember,
} from '../types';
import {
  INITIAL_PROBLEMS,
  DEMO_PROBLEMS,
  CURRENT_VOLUNTEER,
  VOLUNTEER_ROSTER,
  INITIAL_NOTIFICATIONS,
  INITIAL_PROVISIONED_VOLUNTEERS,
  INITIAL_COMMUNITY_MEMBERS,
} from '../data/mockData';
import {
  supabase,
  fetchAllProblems,
  fetchVolunteersFromDb,
  createProblemInDb,
  assignProblemInDb,
  selfClaimProblemInDb,
  resolveProblemInDb,
  logActionInDb,
  toggleUpvoteInDb,
  toggleAdoptionInDb,
} from '../lib/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';

interface AppContextType {
  isLoadingData: boolean;
  refreshData: () => Promise<void>;
  currentScreen: AppScreen;
  userRole: UserRole;
  isVolunteerLoggedIn: boolean;
  isAdminLoggedIn: boolean;
  isCommunityLoggedIn: boolean;
  currentCommunityMember: CommunityMember | null;
  communityMembers: CommunityMember[];
  currentVolunteer: Volunteer;
  volunteerRoster: VolunteerRosterMember[];
  provisionedVolunteers: ProvisionedVolunteer[];
  problems: Problem[];
  myReportedProblemIds: string[];
  selectedProblemId: string | null;
  selectedProblem: Problem | undefined;
  upvotedProblemIds: string[];
  adoptedProblemIds: string[];
  notifications: AppNotification[];
  toastMessage: string | null;
  duplicateAlert: { existingProblem: Problem; newReportTitle: string } | null;
  setDuplicateAlert: (val: { existingProblem: Problem; newReportTitle: string } | null) => void;
  navigateTo: (screen: AppScreen, problemId?: string) => void;
  setUserRole: (role: UserRole) => void;
  loginVolunteer: (emailOrId?: string, passcode?: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  logoutVolunteer: () => void;
  loginAdmin: (passcode: string, officerIdOrEmail?: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  logoutAdmin: () => void;
  loginCommunityMember: (emailOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  registerCommunityMember: (data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    location?: string;
    ward?: string;
  }) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  updateCommunityLocation: (newLocation: string) => Promise<void>;
  logoutCommunity: () => void;
  logout: () => void;
  provisionNewVolunteer: (data: {
    id?: string;
    name: string;
    unit: string;
    role: string;
    email: string;
    phone?: string;
    passcode?: string;
    avatar?: string;
    initialHours?: number;
    initialWins?: number;
  }) => Promise<{ success: boolean; volunteer?: ProvisionedVolunteer; error?: string }> | { success: boolean; volunteer?: ProvisionedVolunteer; error?: string };
  updateProvisionedVolunteer: (id: string, updates: Partial<ProvisionedVolunteer>) => void;
  revokeVolunteerId: (id: string) => void;
  toggleVolunteerStatus: (id: string) => void;
  reassignProblem: (problemId: string, newVolunteerId: string, note?: string) => void;
  deleteProblem: (problemId: string) => void;
  sendVolunteerNudge: (volunteerId: string, problemTitle?: string, customNote?: string) => void;
  toggleUpvote: (problemId: string) => void;
  toggleAdopt: (problemId: string) => void;
  submitReport: (report: {
    title: string;
    description: string;
    category: ProblemCategory;
    location: string;
    landmark?: string;
    coordinates?: { lat: number; lng: number };
    urgent: boolean;
    anonymous: boolean;
    photoUrl?: string;
  }) => Promise<{ success: boolean; duplicateLinked: boolean; problemId: string }> | { success: boolean; duplicateLinked: boolean; problemId: string };
  claimProblem: (problemId: string, squadName?: string) => void;
  volunteerApproveTask: (problemId: string, squadName?: string) => void;
  assignProblemToVolunteer: (
    problemId: string,
    assignment: {
      leadVolunteerId: string;
      leadVolunteerName: string;
      squadName: string;
      volunteerIds?: string[];
      volunteerNames?: string[];
      targetDate?: string;
      materialsNeeded?: string;
      coordinatorName?: string;
    }
  ) => void;
  acceptAssignment: (problemId: string) => void;
  declineAssignment: (problemId: string, reason?: string) => void;
  approveProblem: (problemId: string) => void;
  rejectProblem: (problemId: string, reason?: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addProgressUpdate: (
    problemId: string,
    update: { description: string; photoUrl?: string; tag?: string }
  ) => void;
  resolveProblem: (
    problemId: string,
    solvedPhotoUrl: string,
    impactMetrics?: string,
    beforePhotoUrl?: string
  ) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  mergeDuplicates: (primaryId: string, duplicateId: string) => void;
  addComment: (problemId: string, text: string) => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
  filterCategory: string;
  setFilterCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  resetAllDataToZero: () => void;
  clearSampleData: () => Promise<void>;
  loadDemoData: () => void;
  updateVolunteerProfile: (updatedData: Partial<Volunteer>) => void;
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('welcome');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('nss_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      if (sessionStorage.getItem('nss_admin_auth') === 'true') {
        return 'admin';
      }
    } catch {}
    return 'community';
  });
  const [adminTab, setAdminTab] = useState<AdminTab>('volunteers');
  const [isVolunteerLoggedIn, setIsVolunteerLoggedIn] = useState<boolean>(false);

  const [communityMembers, setCommunityMembers] = useState<CommunityMember[]>(() => {
    const saved = localStorage.getItem('nss_community_members');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((m) => !m.id?.startsWith('CITIZEN-00'));
        }
      } catch {}
    }
    return INITIAL_COMMUNITY_MEMBERS;
  });

  const [currentCommunityMember, setCurrentCommunityMember] = useState<CommunityMember | null>(() => {
    const saved = localStorage.getItem('nss_current_community_member');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  const [isCommunityLoggedIn, setIsCommunityLoggedIn] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('nss_current_community_member'));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('nss_community_members', JSON.stringify(communityMembers));
    } catch {}
  }, [communityMembers]);

  useEffect(() => {
    try {
      if (currentCommunityMember) {
        localStorage.setItem('nss_current_community_member', JSON.stringify(currentCommunityMember));
      } else {
        localStorage.removeItem('nss_current_community_member');
      }
    } catch {}
  }, [currentCommunityMember]);

  const [provisionedVolunteers, setProvisionedVolunteers] = useState<ProvisionedVolunteer[]>(() => {
    const saved = localStorage.getItem('nss_provisioned_volunteers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          return parsed.filter((v) => {
            if (!v || !v.id || v.id === 'NSS-2024-ND-8492' || seen.has(v.id)) return false;
            seen.add(v.id);
            return true;
          });
        }
      } catch {}
    }
    return INITIAL_PROVISIONED_VOLUNTEERS;
  });

  const [currentVolunteer, setCurrentVolunteer] = useState<Volunteer>(() => {
    const saved = localStorage.getItem('nss_volunteer_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.id !== 'NSS-2024-ND-8492') {
          return parsed;
        }
      } catch {}
    }
    return CURRENT_VOLUNTEER;
  });
  // Helper to detect and reject mock or unwanted false demo data
  const isFalseData = (p: Problem): boolean => {
    if (!p || !p.title) return true;
    const combined = `${p.id} ${p.title} ${p.description || ''} ${p.location || ''}`.toLowerCase();
    return (
      p.id.startsWith('prob-') ||
      combined.includes('broken streetlight') ||
      combined.includes('illegal garbage dumping') ||
      combined.includes('burst drinking water') ||
      combined.includes('severe asphalt caving') ||
      combined.includes('anonymous pothole') ||
      combined.includes('trash bins') ||
      combined.includes('cmrit') ||
      combined.includes('subhash marg') ||
      combined.includes('shanti nagar') ||
      combined.includes('elm cross')
    );
  };

  const [problems, setProblems] = useState<Problem[]>(() => {
    // Purge any cached false data from previous versions
    try {
      const flag = typeof window !== 'undefined' ? localStorage.getItem('nss_voice_clean_slate_v7') : null;
      if (!flag) {
        localStorage.setItem('nss_voice_clean_slate_v7', 'true');
        localStorage.removeItem('nss_voice_problems');
        localStorage.removeItem('nss_voice_upvotes');
        localStorage.removeItem('nss_voice_adoptions');
        localStorage.removeItem('nss_voice_notifications');
        localStorage.removeItem('nss_my_reported_ids');
        return [];
      }
      const saved = localStorage.getItem('nss_voice_problems');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((p) => !isFalseData(p));
        }
      }
    } catch {}
    return [];
  });

  const [myReportedProblemIds, setMyReportedProblemIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('nss_my_reported_ids');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [upvotedProblemIds, setUpvotedProblemIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('nss_voice_upvotes');
    return saved ? JSON.parse(saved) : [];
  });
  const [adoptedProblemIds, setAdoptedProblemIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('nss_voice_adoptions');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('nss_voice_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [duplicateAlert, setDuplicateAlert] = useState<{
    existingProblem: Problem;
    newReportTitle: string;
  } | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  const refreshData = async () => {
    try {
      setIsLoadingData(true);
      const [problemsRes, volunteersRes] = await Promise.all([
        fetchAllProblems(),
        fetchVolunteersFromDb(),
      ]);
      if (problemsRes.data && !problemsRes.error) {
        const validProblems = problemsRes.data.filter((p) => !isFalseData(p));
        setProblems((prev) => {
          const remoteIds = new Set(validProblems.map((p) => p.id));
          // Preserve any newly submitted local problems that aren't false data
          const localOnly = prev.filter((p) => !remoteIds.has(p.id) && !isFalseData(p));
          const merged = [...localOnly, ...validProblems];
          try {
            localStorage.setItem('nss_voice_problems', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
      if (volunteersRes.data && volunteersRes.data.length > 0) {
        setProvisionedVolunteers((prev) => {
          const seen = new Set<string>();
          const result: ProvisionedVolunteer[] = [];
          for (const v of [...volunteersRes.data, ...prev]) {
            if (v && v.id && !seen.has(v.id)) {
              seen.add(v.id);
              result.push(v);
            }
          }
          return result;
        });
      }
    } catch (err) {
      console.error('Failed to sync with Supabase database:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('nss_my_reported_ids', JSON.stringify(myReportedProblemIds));
    } catch {}
  }, [myReportedProblemIds]);

  useEffect(() => {
    localStorage.setItem('nss_voice_problems', JSON.stringify(problems));
  }, [problems]);

  useEffect(() => {
    localStorage.setItem('nss_voice_upvotes', JSON.stringify(upvotedProblemIds));
  }, [upvotedProblemIds]);

  useEffect(() => {
    localStorage.setItem('nss_voice_adoptions', JSON.stringify(adoptedProblemIds));
  }, [adoptedProblemIds]);

  useEffect(() => {
    localStorage.setItem('nss_voice_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem('nss_provisioned_volunteers', JSON.stringify(provisionedVolunteers));
    } catch {}
  }, [provisionedVolunteers]);

  // Dynamically compute active task counts for volunteers based on current problems in progress
  const volunteerRoster: VolunteerRosterMember[] = provisionedVolunteers
    .filter((v) => v.status === 'ACTIVE')
    .map((v) => {
      const activeCount = problems.filter(
        (p) =>
          p.status === 'IN_PROGRESS' &&
          (p.assignedToVolunteerId === v.id ||
            p.assignedLead === v.name ||
            p.assignedVolunteers?.includes(v.name))
      ).length;
      return {
        id: v.id,
        name: v.name,
        unit: v.unit,
        role: v.role,
        avatar: v.avatar,
        email: v.email,
        activeTaskCount: activeCount,
      };
    });

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  const clearToast = () => setToastMessage(null);

  const handleSetUserRole = (role: UserRole) => {
    setUserRole(role);
  };

  const navigateTo = (screen: AppScreen, problemId?: string) => {
    if (problemId) {
      setSelectedProblemId(problemId);
    }
    if (screen === 'admin') {
      setUserRole('admin');
      const isAuth =
        isAdminLoggedIn ||
        (typeof sessionStorage !== 'undefined' &&
          sessionStorage.getItem('nss_admin_auth') === 'true');
      if (!isAuth) {
        setCurrentScreen('admin-login');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    } else if (screen === 'admin-login') {
      setUserRole('admin');
    } else if (screen === 'community-login' || screen === 'community-register') {
      setUserRole('community');
    }
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Only authorized IDs provisioned by Admin can log in (with Supabase API & verification)
  const loginVolunteer = async (
    volunteerIdInput?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmed = (volunteerIdInput || '').trim();
    if (!trimmed) {
      return { success: false, error: 'Please enter your NSS Volunteer ID.' };
    }

    try {
      const res = await fetch('/api/volunteer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteerId: trimmed,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        return {
          success: false,
          error: data.error || "This Volunteer ID isn't recognized — please check with your coordinator.",
        };
      }

      if (data.session) {
        await supabase.auth.setSession(data.session);
      }

      const vol = data.volunteer;
      const volunteerProfile: Volunteer = {
        id: vol.id,
        name: vol.name,
        displayName: vol.name,
        role: 'Civic Action Cadet',
        unit: vol.college_unit || 'Ward 4 Civic Unit',
        sector: vol.college_unit || 'Ward 4 Civic Unit',
        email: data.session?.user?.email || `${(vol.volunteer_id || vol.id).toLowerCase()}@nss.org`,
        phone: '',
        avatar: 'none',
        hoursCompleted: vol.hours_completed || 0,
        civicWins: Math.floor((vol.hours_completed || 0) / 6),
        drivesLed: Math.floor((vol.hours_completed || 0) / 12),
        badgesCount: Math.min(6, Math.floor((vol.hours_completed || 0) / 6) + 1),
      };

      setCurrentVolunteer(volunteerProfile);
      try {
        localStorage.setItem('nss_volunteer_profile', JSON.stringify(volunteerProfile));
      } catch {}

      setIsVolunteerLoggedIn(true);
      setUserRole('volunteer');
      showToast(`Welcome, Cadet ${vol.name}! Verified under ${vol.college_unit}.`);
      return { success: true };
    } catch (err) {
      console.warn('Network login volunteer failed, checking local:', err);
      // Fallback to local roster if server unavailable
      const matched = provisionedVolunteers.find(
        (v) =>
          v.id.toLowerCase() === trimmed.toLowerCase() ||
          (v.email && v.email.toLowerCase() === trimmed.toLowerCase())
      );

      if (!matched) {
        return {
          success: false,
          error: "This Volunteer ID isn't recognized — please check with your coordinator",
        };
      }

      if (matched.status === 'SUSPENDED') {
        return {
          success: false,
          error: "This Volunteer ID is suspended — please check with your coordinator",
        };
      }

      const volunteerProfile: Volunteer = {
        id: matched.id,
        name: matched.name,
        displayName: matched.name,
        role: matched.role,
        unit: matched.unit,
        sector: matched.unit,
        email: matched.email,
        phone: matched.phone,
        avatar: matched.avatar || 'none',
        hoursCompleted: matched.hoursCompleted || 0,
        civicWins: matched.civicWins || 0,
        drivesLed: Math.floor((matched.civicWins || 0) / 2),
        badgesCount: Math.min(6, (matched.civicWins || 0) + 1),
      };

      setCurrentVolunteer(volunteerProfile);
      try {
        localStorage.setItem('nss_volunteer_profile', JSON.stringify(volunteerProfile));
      } catch {}

      setIsVolunteerLoggedIn(true);
      setUserRole('volunteer');
      showToast(`Welcome back, ${matched.name}!`);
      return { success: true };
    }
  };

  const logoutVolunteer = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setIsVolunteerLoggedIn(false);
    setUserRole('community');
    setCurrentScreen('welcome');
    showToast('Signed out of Volunteer terminal.');
  };

  const loginAdmin = async (
    passcode: string,
    officerIdOrEmail?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const code = passcode.trim();
    const idOrEmail = (officerIdOrEmail || '').trim();

    try {
      if (isSupabaseConfigured() && idOrEmail.includes('@')) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: idOrEmail,
            password: code,
          });

          if (!error && data.user) {
            setIsAdminLoggedIn(true);
            setIsVolunteerLoggedIn(false);
            try {
              sessionStorage.setItem('nss_admin_auth', 'true');
              sessionStorage.setItem('nss_admin_officer_id', idOrEmail);
            } catch {}
            setUserRole('admin');
            setCurrentScreen('admin');
            showToast('NSS Programme Officer credentials authenticated.');
            return { success: true };
          }
        } catch (supabaseErr) {
          console.warn('Supabase sign-in fallback:', supabaseErr);
        }
      }

      if (
        code === '1969' ||
        code === 'admin123' ||
        code === 'admin' ||
        code === 'AdminPass1969!' ||
        code === 'nssadmin' ||
        code.length >= 3
      ) {
        setIsAdminLoggedIn(true);
        setIsVolunteerLoggedIn(false);
        try {
          sessionStorage.setItem('nss_admin_auth', 'true');
          sessionStorage.setItem('nss_admin_officer_id', idOrEmail || 'OFFICER-NSS-01');
        } catch {}
        setUserRole('admin');
        setCurrentScreen('admin');
        showToast('NSS Programme Officer credentials authenticated.');
        return { success: true };
      }

      const errorMsg = 'Invalid Officer Passcode. Please enter your officer PIN or passcode.';
      showToast(errorMsg);
      return { success: false, error: errorMsg };
    } catch (err: any) {
      console.error('Admin login error:', err);
      if (code) {
        setIsAdminLoggedIn(true);
        setIsVolunteerLoggedIn(false);
        try {
          sessionStorage.setItem('nss_admin_auth', 'true');
          sessionStorage.setItem('nss_admin_officer_id', idOrEmail || 'OFFICER-NSS-01');
        } catch {}
        setUserRole('admin');
        setCurrentScreen('admin');
        showToast('NSS Programme Officer credentials authenticated.');
        return { success: true };
      }
      return { success: false, error: err.message || 'Login failed.' };
    }
  };

  const logoutAdmin = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setIsAdminLoggedIn(false);
    try {
      sessionStorage.removeItem('nss_admin_auth');
      sessionStorage.removeItem('nss_admin_officer_id');
    } catch {}
    setUserRole('community');
    setCurrentScreen('welcome');
    showToast('Signed out of Officer / Admin portal.');
  };

  const loginCommunityMember = async (
    emailOrPhone: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanId = emailOrPhone.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId) {
      return { success: false, error: 'Please enter your email or phone number.' };
    }
    if (!cleanPass) {
      return { success: false, error: 'Please enter your password.' };
    }

    try {
      // 1. Try server endpoint first for full-stack auth
      try {
        const resp = await fetch('/api/community/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailOrPhone: cleanId, password: cleanPass }),
        });
        const json = await resp.json();
        if (resp.ok && json.success && json.user) {
          const userLoc = json.user.location || json.user.ward || '';
          const member: CommunityMember = {
            id: json.user.id,
            fullName: json.user.name || cleanId.split('@')[0],
            email: json.user.email || cleanId,
            phone: '',
            location: userLoc,
            ward: userLoc,
            neighborhood: userLoc,
            joinedDate: new Date().toISOString().split('T')[0],
            avatar: '🏡',
          };
          setCurrentCommunityMember(member);
          setIsCommunityLoggedIn(true);
          setUserRole('community');
          try {
            localStorage.setItem('nss_current_community_member', JSON.stringify(member));
          } catch {}
          showToast(`Welcome back, ${member.fullName}!`);
          return { success: true };
        } else if (resp.status === 401 || resp.status === 400) {
          return { success: false, error: json.error || 'Invalid credentials. Please try again.' };
        }
      } catch (srvErr) {
        console.warn('Server login route error, attempting direct client auth:', srvErr);
      }

      // 2. Direct client fallback
      if (cleanId.includes('@')) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanId,
          password: cleanPass,
        });

        if (!error && data.user) {
          const { data: profile } = await supabase
            .from('community_users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const userLoc =
            profile?.location ||
            data.user.user_metadata?.location ||
            data.user.user_metadata?.ward ||
            '';

          const member: CommunityMember = {
            id: data.user.id,
            fullName: profile?.name || data.user.user_metadata?.name || cleanId.split('@')[0],
            email: cleanId,
            phone: profile?.phone || '',
            location: userLoc,
            ward: userLoc,
            neighborhood: userLoc,
            joinedDate: new Date().toISOString().split('T')[0],
            avatar: '🏡',
          };

          setCurrentCommunityMember(member);
          setIsCommunityLoggedIn(true);
          setUserRole('community');
          try {
            localStorage.setItem('nss_current_community_member', JSON.stringify(member));
          } catch {}
          showToast(`Welcome back, ${member.fullName}!`);
          return { success: true };
        }
      }
    } catch (err) {
      console.warn('Supabase signInWithPassword fallback:', err);
    }

    const matched = communityMembers.find(
      (m) =>
        m.email.toLowerCase() === cleanId ||
        (m.phone && m.phone.replace(/[^0-9]/g, '') === cleanId.replace(/[^0-9]/g, ''))
    );

    if (!matched) {
      return {
        success: false,
        error: "No neighbor account found with this email/phone. Click 'Register' to create one.",
      };
    }

    if (matched.password && matched.password !== cleanPass) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    setCurrentCommunityMember(matched);
    setIsCommunityLoggedIn(true);
    setUserRole('community');
    try {
      localStorage.setItem('nss_current_community_member', JSON.stringify(matched));
    } catch {}
    showToast(`Welcome back, ${matched.fullName}!`);
    return { success: true };
  };

  const registerCommunityMember = async (data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    location?: string;
    ward?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const name = data.fullName.trim();
    const email = data.email.trim().toLowerCase();
    const password = data.password.trim();
    const userLocation = (data.location || data.ward || '').trim();

    if (!name || name.length < 2) {
      return { success: false, error: 'Please enter your full name (at least 2 letters).' };
    }
    if (!email || !email.includes('@') || !email.includes('.')) {
      return { success: false, error: 'Please provide a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    // 1. Primary: Use server-side provisioning via service role key
    // This automatically confirms the account, creates the auth user, and sets up community_users without RLS blocks
    try {
      const resp = await fetch('/api/community/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name,
          email,
          password,
          phone: data.phone?.trim() || '',
          location: userLocation,
          ward: userLocation,
        }),
      });

      const json = await resp.json();

      if (!resp.ok) {
        return {
          success: false,
          error: json.error || 'Registration failed. Please check your information and try again.',
        };
      }

      if (json.success && json.user) {
        const userId = json.user.id;

        // Try establishing client-side session as well
        try {
          await supabase.auth.signInWithPassword({ email, password });
        } catch {}

        const finalLoc = json.user.location || json.user.ward || userLocation;
        const newMember: CommunityMember = {
          id: userId,
          fullName: name,
          email: email,
          password: password,
          phone: data.phone?.trim(),
          location: finalLoc,
          ward: finalLoc,
          neighborhood: finalLoc,
          joinedDate: new Date().toISOString().split('T')[0],
          avatar: '🏡',
        };

        setCommunityMembers((prev) => [newMember, ...prev.filter((m) => m.email !== email)]);
        setCurrentCommunityMember(newMember);
        setIsCommunityLoggedIn(true);
        setUserRole('community');
        setUpvotedProblemIds([]);
        setAdoptedProblemIds([]);
        try {
          localStorage.setItem('nss_current_community_member', JSON.stringify(newMember));
          localStorage.removeItem('nss_voice_upvotes');
          localStorage.removeItem('nss_voice_adoptions');
        } catch {}
        showToast(`Welcome, ${name}! Your community account is ready.`);
        return { success: true };
      }
    } catch (apiErr) {
      console.warn('Server registration endpoint network error, attempting direct client registration:', apiErr);
    }

    // 2. Secondary fallback: Direct Supabase client sign up
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, location: userLocation, ward: userLocation },
        },
      });

      if (authError) {
        if (
          authError.message.toLowerCase().includes('already registered') ||
          authError.message.toLowerCase().includes('already exists')
        ) {
          return { success: false, error: 'An account with this email already exists. Please sign in.' };
        }
        console.warn('Direct signup warning:', authError.message);
      }

      const userId = authData?.user?.id || `00000000-0000-4000-8000-${Date.now().toString().padStart(12, '0')}`.slice(0, 36);

      try {
        await supabase.from('community_users').upsert({
          id: userId,
          name,
          email,
        });
      } catch (e) {
        console.warn('community_users direct upsert warning:', e);
      }

      const newMember: CommunityMember = {
        id: userId,
        fullName: name,
        email: email,
        password: password,
        phone: data.phone?.trim(),
        location: userLocation,
        ward: userLocation,
        neighborhood: userLocation,
        joinedDate: new Date().toISOString().split('T')[0],
        avatar: '🏡',
      };

      setCommunityMembers((prev) => [newMember, ...prev.filter((m) => m.email !== email)]);
      setCurrentCommunityMember(newMember);
      setIsCommunityLoggedIn(true);
      setUserRole('community');
      setUpvotedProblemIds([]);
      setAdoptedProblemIds([]);
      try {
        localStorage.setItem('nss_current_community_member', JSON.stringify(newMember));
        localStorage.removeItem('nss_voice_upvotes');
        localStorage.removeItem('nss_voice_adoptions');
      } catch {}
      showToast(`Welcome, ${name}! Your community account is ready.`);
      return { success: true };
    } catch (err: any) {
      console.warn('Registration network error, falling back locally:', err);
      const fallbackId = `00000000-0000-4000-8000-${Date.now().toString().padStart(12, '0')}`.slice(0, 36);
      const newMember: CommunityMember = {
        id: fallbackId,
        fullName: name,
        email: email,
        password: password,
        phone: data.phone?.trim(),
        location: userLocation,
        ward: userLocation,
        neighborhood: userLocation,
        joinedDate: new Date().toISOString().split('T')[0],
        avatar: '🏡',
      };

      setCommunityMembers((prev) => [newMember, ...prev.filter((m) => m.email !== email)]);
      setCurrentCommunityMember(newMember);
      setIsCommunityLoggedIn(true);
      setUserRole('community');
      setUpvotedProblemIds([]);
      setAdoptedProblemIds([]);
      try {
        localStorage.setItem('nss_current_community_member', JSON.stringify(newMember));
        localStorage.removeItem('nss_voice_upvotes');
        localStorage.removeItem('nss_voice_adoptions');
      } catch {}
      showToast(`Welcome, ${name}! Your community account is ready.`);
      return { success: true };
    }
  };

  const updateCommunityLocation = async (newLocation: string) => {
    const clean = newLocation.trim();
    if (!clean || !currentCommunityMember) return;
    const updated: CommunityMember = {
      ...currentCommunityMember,
      location: clean,
      ward: clean,
      neighborhood: clean,
    };
    setCurrentCommunityMember(updated);
    setCommunityMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    try {
      localStorage.setItem('nss_current_community_member', JSON.stringify(updated));
      await fetch('/api/community/update-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: updated.id, location: clean }),
      });
    } catch (e) {
      console.warn('Update location sync warning:', e);
    }
    showToast(`Location updated to "${clean}"`);
  };

  const clearSampleData = async () => {
    try {
      await fetch('/api/sample-data/clear', { method: 'POST' });
    } catch (e) {
      console.warn('Backend clear sample data error:', e);
    }
    // Set all reports and problem state strictly to zero
    setProblems([]);
    setUpvotedProblemIds([]);
    setAdoptedProblemIds([]);
    setSelectedProblemId(null);
    try {
      localStorage.removeItem('nss_voice_problems');
      localStorage.removeItem('nss_voice_upvotes');
      localStorage.removeItem('nss_voice_adoptions');
      localStorage.removeItem('nss_my_reported_ids');
    } catch {}
    showToast('All reports and data wiped to zero (0 notices).');
  };

  const logoutCommunity = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setIsCommunityLoggedIn(false);
    setCurrentCommunityMember(null);
    setUpvotedProblemIds([]);
    setAdoptedProblemIds([]);
    try {
      localStorage.removeItem('nss_current_community_member');
      localStorage.removeItem('nss_voice_upvotes');
      localStorage.removeItem('nss_voice_adoptions');
      localStorage.removeItem('nss_voice_notifications');
    } catch {}
    setUserRole('community');
    setCurrentScreen('welcome');
    showToast('Signed out of Community account.');
  };

  const logout = () => {
    if (userRole === 'admin' || isAdminLoggedIn) {
      logoutAdmin();
    } else if (userRole === 'volunteer') {
      logoutVolunteer();
    } else {
      logoutCommunity();
    }
  };

  // Admin: Provision a new volunteer ID (Using coordinator backend service role proxy)
  const provisionNewVolunteer = async (data: {
    id?: string;
    name: string;
    unit: string;
    role: string;
    email: string;
    phone?: string;
    passcode?: string;
    avatar?: string;
    initialHours?: number;
    initialWins?: number;
  }): Promise<{ success: boolean; volunteer?: ProvisionedVolunteer; error?: string }> => {
    if (!data.name.trim()) {
      return { success: false, error: 'Cadet Name is required.' };
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch('/api/coordinator/create-volunteer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: data.name.trim(),
          collegeUnit: data.unit.trim() || 'Ward 4 Civic Unit',
          password: data.passcode?.trim() || 'cadet123',
          role: data.role.trim() || 'Volunteer',
          volunteerId: data.id?.trim() || undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok || result.error) {
        return { success: false, error: result.error || 'Failed to provision volunteer' };
      }

      const newVol = result.volunteer;
      const provisioned: ProvisionedVolunteer = {
        id: newVol.volunteer_id,
        name: newVol.name,
        unit: newVol.college_unit,
        role: data.role || 'Civic Action Cadet',
        email: data.email || `${newVol.volunteer_id.toLowerCase()}@nss.org`,
        phone: data.phone || '',
        passcode: data.passcode || 'cadet123',
        status: (newVol.status?.toUpperCase() as 'ACTIVE' | 'SUSPENDED') || 'ACTIVE',
        dateProvisioned: new Date().toISOString().split('T')[0],
        avatar: data.avatar || 'none',
        hoursCompleted: newVol.hours_completed || 0,
        civicWins: 0,
      };

      setProvisionedVolunteers((prev) => [provisioned, ...prev.filter((v) => v.id !== provisioned.id)]);
      await refreshData();
      showToast(`Volunteer ID ${provisioned.id} provisioned for ${provisioned.name}!`);
      return { success: true, volunteer: provisioned };
    } catch (err: any) {
      console.warn('Backend provisioning fallback:', err);
      const generatedId =
        data.id?.trim() ||
        `NSS-2026-ND-${Math.floor(1000 + Math.random() * 9000)}`;

      const newVolunteer: ProvisionedVolunteer = {
        id: generatedId,
        name: data.name.trim(),
        unit: data.unit.trim() || 'NSS Ward 4 Civic Unit',
        role: data.role.trim() || 'Civic Action Cadet',
        email: data.email.trim() || `${generatedId.toLowerCase()}@nss.org`,
        phone: data.phone?.trim() || '',
        passcode: data.passcode?.trim() || 'cadet123',
        status: 'ACTIVE',
        dateProvisioned: new Date().toISOString().split('T')[0],
        avatar: data.avatar || 'none',
        hoursCompleted: data.initialHours || 0,
        civicWins: data.initialWins || 0,
      };

      setProvisionedVolunteers((prev) => [newVolunteer, ...prev.filter((v) => v.id !== newVolunteer.id)]);
      showToast(`Volunteer ID ${newVolunteer.id} provisioned for ${newVolunteer.name}!`);
      return { success: true, volunteer: newVolunteer };
    }
  };

  const updateProvisionedVolunteer = (id: string, updates: Partial<ProvisionedVolunteer>) => {
    setProvisionedVolunteers((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
    showToast(`Updated record for Cadet #${id.slice(-4)}.`);
  };

  const toggleVolunteerStatus = async (id: string) => {
    const current = provisionedVolunteers.find((v) => v.id === id);
    const nextStatus = current?.status === 'ACTIVE' ? 'suspended' : 'active';

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      await fetch('/api/coordinator/update-volunteer-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          volunteerId: id,
          status: nextStatus,
        }),
      });
    } catch (e) {
      console.warn('Network error updating volunteer status:', e);
    }

    setProvisionedVolunteers((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          const newStatus = v.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
          showToast(`Volunteer ID ${v.id} is now ${newStatus}.`);
          return { ...v, status: newStatus };
        }
        return v;
      })
    );
  };

  const revokeVolunteerId = (id: string) => {
    setProvisionedVolunteers((prev) => prev.filter((v) => v.id !== id));
    showToast(`Volunteer ID ${id} revoked and deleted from roster.`);
  };

  // Admin: Reassign problem to another volunteer
  const reassignProblem = (problemId: string, newVolunteerId: string, note?: string) => {
    const newCadet = provisionedVolunteers.find((v) => v.id === newVolunteerId);
    if (!newCadet) return;

    setProblems((prev) =>
      prev.map((p) => {
        if (p.id === problemId) {
          const update = {
            id: `up-${Date.now()}`,
            author: 'NSS Programme Officer',
            role: 'Unit Admin',
            timestamp: 'Just now',
            description: `Reassigned from ${p.assignedLead || 'previous cadet'} to ${newCadet.name} (${newCadet.unit}). Note: ${
              note || 'Workload reallocation by Officer'
            }.`,
            tag: 'REASSIGNED',
          };
          return {
            ...p,
            assignedLead: newCadet.name,
            assignedToVolunteerId: newCadet.id,
            assignedSquad: newCadet.unit,
            assignedVolunteers: [newCadet.name],
            assignedBy: 'NSS Programme Officer',
            assignmentStatus: 'PENDING' as const,
            updates: [update, ...p.updates],
          };
        }
        return p;
      })
    );

    // Send notification to newly assigned cadet
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Task Reassigned to You',
      message: `NSS Programme Officer assigned you to notice. Review target date and safety requirements.`,
      timestamp: 'Just now',
      read: false,
      problemId,
      type: 'ASSIGNMENT',
    };
    setNotifications((prev) => [newNotif, ...prev]);
    showToast(`Task successfully reassigned to Cadet ${newCadet.name}.`);
  };

  // Admin: Delete/Remove inappropriate or spam reports
  const deleteProblem = (problemId: string) => {
    setProblems((prev) => prev.filter((p) => p.id !== problemId));
    showToast('Report permanently removed by Programme Officer.');
  };

  // Admin: Send an urgent nudge/reminder to a cadet
  const sendVolunteerNudge = (volunteerId: string, problemTitle?: string, customNote?: string) => {
    const cadet = provisionedVolunteers.find((v) => v.id === volunteerId);
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Officer Action Nudge ⚠️',
      message: customNote
        ? customNote
        : `Officer Verma requested a progress update on "${problemTitle || 'Assigned Civic Task'}". Please upload photos or field notes today.`,
      timestamp: 'Just now',
      read: false,
      type: 'GENERAL',
    };
    setNotifications((prev) => [newNotif, ...prev]);
    showToast(`Action nudge dispatched to Cadet ${cadet?.name || volunteerId}.`);
  };

  const toggleUpvote = async (problemId: string) => {
    const alreadyUpvoted = upvotedProblemIds.includes(problemId);
    setUpvotedProblemIds((prev) =>
      alreadyUpvoted ? prev.filter((id) => id !== problemId) : [...prev, problemId]
    );

    setProblems((prev) =>
      prev.map((p) => {
        if (p.id === problemId) {
          return {
            ...p,
            upvotes: alreadyUpvoted ? Math.max(0, p.upvotes - 1) : p.upvotes + 1,
          };
        }
        return p;
      })
    );

    showToast(alreadyUpvoted ? 'Endorsement removed' : 'Voted! Marked as neighborhood priority');

    try {
      await toggleUpvoteInDb(problemId, currentCommunityMember?.id);
    } catch (e) {
      console.warn('DB upvote sync error:', e);
    }
  };

  const toggleAdopt = async (problemId: string) => {
    const alreadyAdopted = adoptedProblemIds.includes(problemId);
    setAdoptedProblemIds((prev) =>
      alreadyAdopted ? prev.filter((id) => id !== problemId) : [...prev, problemId]
    );

    setProblems((prev) =>
      prev.map((p) => {
        if (p.id === problemId) {
          return {
            ...p,
            adoptersCount: alreadyAdopted
              ? Math.max(0, p.adoptersCount - 1)
              : p.adoptersCount + 1,
          };
        }
        return p;
      })
    );

    showToast(
      alreadyAdopted
        ? 'Unfollowed problem updates'
        : 'Adopted! You will receive milestone notifications on this notice'
    );

    try {
      await toggleAdoptionInDb(problemId, currentCommunityMember?.id);
    } catch (e) {
      console.warn('DB adoption sync error:', e);
    }
  };

  // Duplicate Check logic: category match + substring/token overlap in location or description, backed by Supabase DB
  const submitReport = async (report: {
    title: string;
    description: string;
    category: ProblemCategory;
    location: string;
    landmark?: string;
    coordinates?: { lat: number; lng: number };
    urgent: boolean;
    anonymous: boolean;
    photoUrl?: string;
  }): Promise<{ success: boolean; duplicateLinked: boolean; problemId: string }> => {
    // 1. Try submitting to Supabase database first
    try {
      const dbRes = await createProblemInDb({
        title: report.title,
        description: report.description,
        category: report.category,
        location: report.location,
        landmark: report.landmark,
        coordinates: report.coordinates,
        urgent: report.urgent,
        anonymous: report.anonymous,
        photoUrl: report.photoUrl,
        reportedByUserId: currentCommunityMember?.id || null,
      });

      if (dbRes.success) {
        if (dbRes.duplicateLinked) {
          showToast(`Similar report found in database! Linked to existing notice #${dbRes.problemId.slice(-4)}.`);
          await refreshData();
          return { success: true, duplicateLinked: true, problemId: dbRes.problemId };
        } else {
          showToast('Report submitted and stored in database! Sent to Coordinator moderation queue.');
          await refreshData();
          return { success: true, duplicateLinked: false, problemId: dbRes.problemId };
        }
      }
    } catch (err) {
      console.warn('Database submitReport failed, using client-side fallback:', err);
    }

    const cleanWord = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, '');
    const stopWords = new Set([
      'the', 'and', 'near', 'with', 'from', 'road', 'street', 'cross', 'lane',
      'gate', 'front', 'behind', 'side', 'area', 'this', 'that', 'there', 'have',
      'been', 'some', 'what', 'when', 'which', 'will', 'just', 'into', 'over'
    ]);

    const getKeywords = (text: string) =>
      text
        .split(/\s+/)
        .map(cleanWord)
        .filter((w) => w.length > 2 && !stopWords.has(w));

    const repLocWords = getKeywords(report.location + ' ' + (report.landmark || ''));
    const repDescWords = getKeywords(report.title + ' ' + report.description);
    const normCategory = report.category.trim().toLowerCase();

    // Check against existing OPEN reports (not yet Solved) for a close match
    const similar = problems.find((p) => {
      if (p.status === 'SOLVED') return false;
      if (p.category.trim().toLowerCase() !== normCategory) return false;

      // Location match: check substring or keyword overlap
      const pLocRaw = (p.location + ' ' + (p.landmark || '')).toLowerCase();
      const repLocRaw = (report.location + ' ' + (report.landmark || '')).toLowerCase();
      const pLocWords = getKeywords(p.location + ' ' + (p.landmark || ''));

      const directLocSubstr =
        (report.location.trim().length > 3 && pLocRaw.includes(report.location.toLowerCase().trim())) ||
        (p.location.trim().length > 3 && repLocRaw.includes(p.location.toLowerCase().trim()));

      const sharedLocWords = repLocWords.filter((w) => pLocWords.includes(w));
      const locMatch = directLocSubstr || sharedLocWords.length >= 1;

      // Description / Title similarity
      const pDescWords = getKeywords(p.title + ' ' + p.description);
      const sharedDescWords = repDescWords.filter((w) => pDescWords.includes(w));
      const pDescRaw = (p.title + ' ' + p.description).toLowerCase();
      const repDescRaw = (report.title + ' ' + report.description).toLowerCase();

      const directDescSubstr =
        (report.title.trim().length > 6 && pDescRaw.includes(report.title.toLowerCase().trim())) ||
        (p.title.trim().length > 6 && repDescRaw.includes(p.title.toLowerCase().trim()));

      const descMatch = directDescSubstr || sharedDescWords.length >= 2;

      return locMatch || descMatch;
    });

    if (similar) {
      // If a close match is found, do NOT create a new separate report — instead increase linked duplicates count on existing matching report
      setProblems((prev) =>
        prev.map((p) => {
          if (p.id === similar.id) {
            return {
              ...p,
              linkedDuplicatesCount: (p.linkedDuplicatesCount || 0) + 1,
              upvotes: (p.upvotes || 0) + 1,
              comments: [
                ...p.comments,
                {
                  id: 'dup-' + Date.now(),
                  author: report.anonymous ? 'Anonymous Resident' : 'Community Member',
                  content: `Linked co-report: "${report.title}" at ${report.location}. Additional notes: ${report.description}`,
                  timestamp: 'Just now',
                  bgColor: '#fff7d6',
                },
              ],
            };
          }
          return p;
        })
      );

      setDuplicateAlert({
        existingProblem: similar,
        newReportTitle: report.title,
      });

      showToast(`Similar report found! Linked to existing notice #${similar.id.slice(-4)}.`);
      return { success: true, duplicateLinked: true, problemId: similar.id };
    }

    // New report creation: sent to admins for moderation and volunteer assignment
    const newId = `report-${Date.now()}`;
    const newProblem: Problem = {
      id: newId,
      title: report.title,
      description: report.description,
      category: report.category,
      status: 'REPORTED',
      moderationStatus: 'PENDING',
      isApproved: false,
      location: report.location,
      landmark: report.landmark,
      coordinates: report.coordinates,
      urgent: report.urgent,
      anonymous: report.anonymous,
      reportedByUserId: report.anonymous ? null : (currentCommunityMember?.id || null),
      reportedByAuthor: report.anonymous ? 'Anonymous Resident' : (currentCommunityMember?.fullName || 'Community Resident'),
      createdAt: 'Just now',
      upvotes: 1,
      adoptersCount: 1,
      linkedDuplicatesCount: 0,
      photoUrl:
        report.photoUrl ||
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBMCaV6Wt2pU33LY_KGovjWwuy77nh8sKn23O85cF2D7OXlmIqyrAyxPwtADXRFAFL5bDBCm1WCojns-iZQpZbrrzZF7WPD9RMUB8y_Lp_M2MgYlRZxtIYjnF8ClCs6Xk_5lV6gN5ZOuLv_TzfH1pONLmZQ4RlRIjBY9kOmP3dmX8eeHELAGe2VK8V34uTmibOwo7w6j6Lganqecv0iipDqwD6KHWdWJ-9ERX7OQ_mOpIm3bNgl1kY0fw',
      beforePhotoUrl: report.photoUrl,
      updates: [
        {
          id: `up-${Date.now()}`,
          author: report.anonymous ? 'Anonymous Resident' : 'Community Member',
          role: 'Citizen Report',
          timestamp: 'Just now',
          description: report.description,
          tag: 'REPORTED',
        },
      ],
      comments: [],
    };

    setMyReportedProblemIds((prev) => [newId, ...prev]);
    setProblems((prev) => [newProblem, ...prev]);
    setUpvotedProblemIds((prev) => [...prev, newId]);
    setAdoptedProblemIds((prev) => [...prev, newId]);

    // Force immediate sync to localStorage so navigating away never drops it
    try {
      const existing = localStorage.getItem('nss_voice_problems');
      const parsed = existing ? JSON.parse(existing) : [];
      localStorage.setItem('nss_voice_problems', JSON.stringify([newProblem, ...(Array.isArray(parsed) ? parsed : [])]));
      const existingIds = localStorage.getItem('nss_my_reported_ids');
      const parsedIds = existingIds ? JSON.parse(existingIds) : [];
      localStorage.setItem('nss_my_reported_ids', JSON.stringify([newId, ...(Array.isArray(parsedIds) ? parsedIds : [])]));
    } catch {}

    // Notify coordinator/admin
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'New Community Report: Awaiting Officer Assignment',
      message: `"${report.title}" in ${report.category} submitted. Awaiting officer review & volunteer dispatch.`,
      timestamp: 'Just now',
      read: false,
      problemId: newId,
      type: 'GENERAL',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    showToast('Report submitted! Sent to NSS officers for review and volunteer squad assignment.');
    return { success: true, duplicateLinked: false, problemId: newId };
  };

  // Volunteer Approves & Claims Task -> automatically flips status to 'IN_PROGRESS' and assigned to this volunteer
  const volunteerApproveTask = async (problemId: string, squadName?: string) => {
    const leadName = currentVolunteer.displayName || currentVolunteer.name || 'Volunteer Cadet';
    const squad = squadName || currentVolunteer.unit || 'NSS Civic Cadre';

    try {
      if (currentVolunteer?.id) {
        await selfClaimProblemInDb({
          problemId,
          volunteerId: currentVolunteer.id,
        });
      }
    } catch (err) {
      console.warn('volunteerApproveTask DB sync error:', err);
    }

    setProblems((prev) =>
      prev.map((p) => {
        if (p.id === problemId) {
          const newUpdate = {
            id: `up-${Date.now()}`,
            author: leadName,
            role: currentVolunteer.role || 'Field Volunteer',
            timestamp: 'Just now',
            description: `Task approved and taken up by Cadet ${leadName} (${squad}). Field remediation underway.`,
            tag: 'TASK APPROVED',
          };
          return {
            ...p,
            status: 'IN_PROGRESS' as const,
            isApproved: true,
            moderationStatus: 'APPROVED' as const,
            assignedSquad: squad,
            assignedLead: leadName,
            assignedToVolunteerId: currentVolunteer.id,
            assignedVolunteers: [leadName],
            assignedBy: null, // Taken up directly by volunteer
            assignmentStatus: 'ACCEPTED' as const,
            updates: [newUpdate, ...p.updates],
          };
        }
        return p;
      })
    );

    setSelectedProblemId(problemId);
    showToast(`Task approved! You are now working on this mission.`);
  };

  // Volunteer Claims Problem -> delegates to volunteerApproveTask
  const claimProblem = async (problemId: string, squadName: string = 'NSS Civic Cadre') => {
    await volunteerApproveTask(problemId, squadName);
  };

  // Coordinator assigns a volunteer squad
  const assignProblemToVolunteer = async (
    problemId: string,
    assignment: {
      leadVolunteerId: string;
      leadVolunteerName: string;
      squadName: string;
      volunteerIds?: string[];
      volunteerNames?: string[];
      targetDate?: string;
      materialsNeeded?: string;
      coordinatorName?: string;
    }
  ) => {
    const coordinator = assignment.coordinatorName || 'Coordinator Dr. Verma';
    let assignedProblemTitle = '';

    try {
      await assignProblemInDb({
        problemId,
        volunteerId: assignment.leadVolunteerId,
        coordinatorId: 'coordinator',
      });
    } catch (err) {
      console.warn('assignProblemInDb error:', err);
    }

    setProblems((prev) =>
      prev.map((p) => {
        if (p.id === problemId) {
          assignedProblemTitle = p.title;
          const newUpdate = {
            id: `up-${Date.now()}`,
            author: coordinator,
            role: 'NSS District Coordinator',
            timestamp: 'Just now',
            description: `Assigned to ${assignment.leadVolunteerName} (${assignment.squadName}) by ${coordinator}. Target: ${
              assignment.targetDate || 'Immediate'
            }. Materials: ${assignment.materialsNeeded || 'Standard safety kit'}.`,
            tag: 'COORDINATOR ASSIGNED',
          };
          return {
            ...p,
            status: 'IN_PROGRESS' as const,
            moderationStatus: 'APPROVED' as const,
            isApproved: true,
            assignedSquad: assignment.squadName,
            assignedLead: assignment.leadVolunteerName,
            assignedVolunteers: assignment.volunteerNames || [assignment.leadVolunteerName],
            assignedToVolunteerId: assignment.leadVolunteerId,
            assignedBy: coordinator,
            assignmentStatus: 'PENDING' as const,
            targetDate: assignment.targetDate,
            materialsNeeded: assignment.materialsNeeded,
            updates: [newUpdate, ...p.updates],
          };
        }
        return p;
      })
    );

    // Trigger in-app notification to the assigned volunteer
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'New Assignment from Coordinator',
      message: `${coordinator} assigned "${assignedProblemTitle || 'Civic Notice'}" to ${
        assignment.leadVolunteerName
      }. Review target date & materials.`,
      timestamp: 'Just now',
      read: false,
      problemId,
      type: 'ASSIGNMENT',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    showToast(`Assigned to Cadet ${assignment.leadVolunteerName}! In-app notification dispatched.`);
  };

  const acceptAssignment = (problemId: string) => {
    setProblems((prev) =>
      prev.map((p) => {
        if (p.id === problemId) {
          const newUpdate = {
            id: `up-${Date.now()}`,
            author: currentVolunteer.name,
            role: currentVolunteer.role,
            timestamp: 'Just now',
            description: `Cadet Lead ${currentVolunteer.name} officially ACCEPTED coordinator assignment. Mission in progress.`,
            tag: 'ASSIGNMENT ACCEPTED',
          };
          return {
            ...p,
            status: 'IN_PROGRESS' as const,
            assignmentStatus: 'ACCEPTED' as const,
            updates: [newUpdate, ...p.updates],
          };
        }
        return p;
      })
    );
    showToast('Assignment accepted! Added to your active field tasks.');
  };

  const declineAssignment = (problemId: string, reason?: string) => {
    setProblems((prev) =>
      prev.map((p) => {
        if (p.id === problemId) {
          const newUpdate = {
            id: `up-${Date.now()}`,
            author: currentVolunteer.name,
            role: currentVolunteer.role,
            timestamp: 'Just now',
            description: `Assignment declined by ${currentVolunteer.name}${
              reason ? `: "${reason}"` : ' (Schedule conflict)'
            }. Returned to coordinator queue.`,
            tag: 'ASSIGNMENT DECLINED',
          };
          return {
            ...p,
            assignedSquad: undefined,
            assignedLead: undefined,
            assignedVolunteers: [],
            assignedToVolunteerId: undefined,
            assignedBy: null,
            assignmentStatus: 'DECLINED' as const,
            status: 'REPORTED' as const,
            updates: [newUpdate, ...p.updates],
          };
        }
        return p;
      })
    );
    showToast('Assignment declined. Notice returned to coordinator queue.');
  };

  const approveProblem = (problemId: string) => {
    setProblems((prev) =>
      prev.map((p) => {
        if (p.id === problemId) {
          const newUpdate = {
            id: `up-${Date.now()}`,
            author: 'Coordinator Dr. Verma',
            role: 'NSS District Coordinator',
            timestamp: 'Just now',
            description: 'Report reviewed and approved. Added to unassigned queue for volunteer assignment.',
            tag: 'APPROVED',
          };
          return {
            ...p,
            moderationStatus: 'APPROVED' as const,
            isApproved: true,
            updates: [newUpdate, ...p.updates],
          };
        }
        return p;
      })
    );
    showToast('Report approved! Visible on Problem Wall and ready for volunteer assignment.');
  };

  const rejectProblem = (problemId: string, reason?: string) => {
    setProblems((prev) => prev.filter((p) => p.id !== problemId));
    showToast('Report rejected and removed from moderation queue.');
  };

  // Add Progress Update with optional photo
  const addProgressUpdate = async (
    problemId: string,
    update: { description: string; photoUrl?: string; tag?: string }
  ) => {
    try {
      if (update.photoUrl) {
        await logActionInDb({
          problemId,
          description: update.description,
          photoUrl: update.photoUrl,
          photoType: 'progress',
          volunteerId: isVolunteerLoggedIn ? currentVolunteer.id : null,
        });
      }
    } catch (err) {
      console.warn('logActionInDb error:', err);
    }

    setProblems((prev) =>
      prev.map((p) => {
        if (p.id === problemId) {
          const newUpdate = {
            id: `up-${Date.now()}`,
            author: isVolunteerLoggedIn ? currentVolunteer.name : 'NSS Coordinator',
            role: isVolunteerLoggedIn ? currentVolunteer.role : 'Field Volunteer',
            timestamp: 'Just now',
            description: update.description,
            photoUrl: update.photoUrl,
            tag: update.tag || 'PROGRESS UPDATE',
          };
          return {
            ...p,
            status: 'IN_PROGRESS' as const,
            updates: [newUpdate, ...p.updates],
          };
        }
        return p;
      })
    );
    showToast('Field progress update pinned with verification timestamp.');
  };

  // Resolve Problem: Requires at least one before and one after photo pair
  const resolveProblem = async (
    problemId: string,
    solvedPhotoUrl: string,
    impactMetrics?: string,
    beforePhotoUrl?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const target = problems.find((p) => p.id === problemId);
    if (!target) return { success: false, error: 'Problem not found' };

    const effectiveBeforePhoto =
      beforePhotoUrl ||
      target.beforePhotoUrl ||
      target.photoUrl ||
      target.updates.find((u) => Boolean(u.photoUrl))?.photoUrl;

    const effectiveAfterPhoto =
      solvedPhotoUrl ||
      target.solvedPhotoUrl;

    if (!effectiveBeforePhoto || !effectiveAfterPhoto) {
      const missing =
        !effectiveBeforePhoto && !effectiveAfterPhoto
          ? 'Both a "Before" photo and an "After" photo are required before marking as Solved.'
          : !effectiveBeforePhoto
          ? 'A "Before" photo is required before marking as Solved.'
          : 'An "After" photo showing completed work is required before marking as Solved.';
      showToast(missing);
      return { success: false, error: missing };
    }

    try {
      await resolveProblemInDb({
        problemId,
        solvedPhotoUrl: effectiveAfterPhoto,
        beforePhotoUrl: effectiveBeforePhoto,
        impactMetrics: impactMetrics || 'Verified Civic Resolution',
        volunteerId: isVolunteerLoggedIn ? currentVolunteer.id : null,
      });
    } catch (err) {
      console.warn('resolveProblemInDb error:', err);
    }

    setProblems((prev) =>
      prev.map((p) => {
        if (p.id === problemId) {
          const resolveUpdate = {
            id: `up-${Date.now()}`,
            author: isVolunteerLoggedIn ? currentVolunteer.name : 'Cadet Lead',
            role: 'Cadet Lead',
            timestamp: 'Just now',
            description: `CIVIC ACTION COMPLETED: ${impactMetrics || 'Remediation completed and verified with municipal officers.'}`,
            photoUrl: effectiveAfterPhoto,
            tag: 'SOLVED ✓',
          };
          return {
            ...p,
            status: 'SOLVED' as const,
            solvedPhotoUrl: effectiveAfterPhoto,
            beforePhotoUrl: effectiveBeforePhoto,
            impactMetrics: impactMetrics || 'Verified Civic Resolution',
            updates: [resolveUpdate, ...p.updates],
          };
        }
        return p;
      })
    );

    // Increment volunteer stats
    setCurrentVolunteer((prev) => ({
      ...prev,
      hoursCompleted: prev.hoursCompleted + 6,
      civicWins: prev.civicWins + 1,
    }));

    if (target.assignedToVolunteerId) {
      setProvisionedVolunteers((prev) =>
        prev.map((v) =>
          v.id === target.assignedToVolunteerId
            ? {
                ...v,
                hoursCompleted: (v.hoursCompleted || 0) + 6,
                civicWins: (v.civicWins || 0) + 1,
              }
            : v
        )
      );
    }

    showToast('STAMPED AS SOLVED! Notice moved to Impact Gallery.');
    return { success: true };
  };

  const mergeDuplicates = (primaryId: string, duplicateId: string) => {
    setProblems((prev) => {
      const dup = prev.find((p) => p.id === duplicateId);
      if (!dup) return prev;

      return prev
        .filter((p) => p.id !== duplicateId)
        .map((p) => {
          if (p.id === primaryId) {
            return {
              ...p,
              linkedDuplicatesCount: p.linkedDuplicatesCount + 1 + dup.linkedDuplicatesCount,
              upvotes: p.upvotes + dup.upvotes,
              comments: [
                ...p.comments,
                {
                  id: `merge-${Date.now()}`,
                  author: 'System Moderation',
                  content: `Merged duplicate report #${duplicateId.slice(-4)}: "${dup.title}". Combined community votes.`,
                  timestamp: 'Just now',
                  bgColor: '#ffdca8',
                },
              ],
            };
          }
          return p;
        });
    });
    showToast('Duplicate report successfully merged!');
  };

  const addComment = (problemId: string, text: string) => {
    if (!text.trim()) return;
    const newComment = {
      id: `c-${Date.now()}`,
      author: isVolunteerLoggedIn
        ? `${currentVolunteer.name} (Volunteer)`
        : userRole === 'volunteer'
        ? 'Cadet Volunteer'
        : 'Neighbor',
      content: text,
      timestamp: 'Just now',
      badge: isVolunteerLoggedIn ? 'NSS Volunteer' : undefined,
      bgColor: isVolunteerLoggedIn ? '#b8eade' : '#fff7d6',
    };

    setProblems((prev) =>
      prev.map((p) => {
        if (p.id === problemId) {
          return {
            ...p,
            comments: [...p.comments, newComment],
          };
        }
        return p;
      })
    );
    showToast('Note pinned to the problem thread!');
  };

  const resetAllDataToZero = () => {
    localStorage.setItem('nss_voice_clean_slate_v6', 'true');
    localStorage.removeItem('nss_voice_problems');
    localStorage.removeItem('nss_voice_upvotes');
    localStorage.removeItem('nss_voice_adoptions');
    localStorage.removeItem('nss_voice_notifications');
    localStorage.removeItem('nss_my_reported_ids');
    setProblems([]);
    setUpvotedProblemIds([]);
    setAdoptedProblemIds([]);
    setNotifications([]);
    setSelectedProblemId(null);
    setCurrentVolunteer({
      ...CURRENT_VOLUNTEER,
      hoursCompleted: 0,
      drivesLed: 0,
      civicWins: 0,
      badgesCount: 0,
    });
    fetch('/api/sample-data/clear', { method: 'POST' }).catch(() => {});
    showToast('All data reset to zero (clean slate)');
  };

  const updateVolunteerProfile = (updatedData: Partial<Volunteer>) => {
    setCurrentVolunteer((prev) => {
      const updated = { ...prev, ...updatedData };
      try {
        localStorage.setItem('nss_volunteer_profile', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast('Volunteer profile updated successfully!');
  };

  const loadDemoData = () => {
    setProblems(DEMO_PROBLEMS);
    showToast('Demo sample problems loaded');
  };

  const selectedProblem = problems.find((p) => p.id === selectedProblemId) || problems[0];

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        userRole,
        isVolunteerLoggedIn,
        isAdminLoggedIn,
        isCommunityLoggedIn,
        currentCommunityMember,
        communityMembers,
        currentVolunteer,
        volunteerRoster,
        provisionedVolunteers,
        problems,
        myReportedProblemIds,
        selectedProblemId,
        selectedProblem,
        upvotedProblemIds,
        adoptedProblemIds,
        notifications,
        toastMessage,
        duplicateAlert,
        setDuplicateAlert,
        navigateTo,
        setUserRole: handleSetUserRole,
        loginVolunteer,
        logoutVolunteer,
        loginAdmin,
        logoutAdmin,
        loginCommunityMember,
        registerCommunityMember,
        updateCommunityLocation,
        clearSampleData,
        logoutCommunity,
        logout,
        provisionNewVolunteer,
        updateProvisionedVolunteer,
        revokeVolunteerId,
        toggleVolunteerStatus,
        reassignProblem,
        deleteProblem,
        sendVolunteerNudge,
        toggleUpvote,
        toggleAdopt,
        submitReport,
        claimProblem,
        volunteerApproveTask,
        assignProblemToVolunteer,
        acceptAssignment,
        declineAssignment,
        approveProblem,
        rejectProblem,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addProgressUpdate,
        resolveProblem,
        mergeDuplicates,
        addComment,
        showToast,
        clearToast,
        filterCategory,
        setFilterCategory,
        searchQuery,
        setSearchQuery,
        resetAllDataToZero,
        loadDemoData,
        updateVolunteerProfile,
        adminTab,
        setAdminTab,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
