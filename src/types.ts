export type ProblemCategory =
  | 'Garbage'
  | 'Water'
  | 'Streetlights'
  | 'Roads'
  | 'Greenery'
  | 'School'
  | 'Accessibility'
  | 'Sanitation'
  | 'Electrical'
  | (string & {});

export type ProblemStatus = 'REPORTED' | 'IN_PROGRESS' | 'SOLVED';

export interface ProgressUpdate {
  id: string;
  author: string;
  role: string;
  timestamp: string;
  description: string;
  photoUrl?: string;
  tag?: string;
}

export interface CommunityComment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  badge?: string;
  bgColor?: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  category: ProblemCategory;
  status: ProblemStatus;
  location: string;
  landmark?: string;
  coordinates?: { lat: number; lng: number };
  createdAt: string;
  urgent: boolean;
  anonymous: boolean;
  photoUrl?: string;
  solvedPhotoUrl?: string;
  beforePhotoUrl?: string;
  upvotes: number;
  adoptersCount: number; // "Being watched by N people"
  assignedSquad?: string;
  assignedLead?: string;
  assignedVolunteers?: string[];
  assignedToVolunteerId?: string;
  assignedBy?: string | null; // null if volunteer self-claimed, or coordinator's ID/name if admin assignment
  assignmentStatus?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  targetDate?: string;
  materialsNeeded?: string;
  updates: ProgressUpdate[];
  comments: CommunityComment[];
  linkedDuplicatesCount: number; // Duplicates merged or auto-linked
  duplicateOf?: string;
  flaggedReason?: string;
  impactMetrics?: string; // e.g. "480kg Waste Cleared & 14 Planters Installed"
  isProblemOfTheMonth?: boolean;
  moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  isApproved?: boolean;
  reportedByUserId?: string | null;
  reportedByAuthor?: string;
}

export interface VolunteerRosterMember {
  id: string;
  name: string;
  unit: string;
  role: string;
  avatar?: string;
  activeTaskCount: number;
  email?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  problemId?: string;
  type: 'ASSIGNMENT' | 'GENERAL';
}

export interface Volunteer {
  id: string;
  name: string;
  displayName?: string;
  bio?: string;
  email: string;
  phone?: string;
  role: string;
  unit: string;
  sector: string;
  avatar: string;
  hoursCompleted: number;
  drivesLed: number;
  civicWins: number;
  badgesCount: number;
}

export interface ProvisionedVolunteer {
  id: string;
  name: string;
  unit: string;
  role: string;
  email: string;
  phone?: string;
  passcode?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  dateProvisioned: string;
  avatar?: string;
  hoursCompleted: number;
  civicWins: number;
}

export interface CommunityMember {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  location?: string;
  ward?: string;
  neighborhood?: string;
  joinedDate: string;
  avatar?: string;
}

export type AppScreen =
  | 'welcome'
  | 'role-split'
  | 'home'
  | 'problem-wall'
  | 'problem-detail'
  | 'report-problem'
  | 'impact-gallery'
  | 'about'
  | 'volunteer-signin'
  | 'volunteer-dashboard'
  | 'reports-management'
  | 'action-tracker'
  | 'volunteer-profile'
  | 'analytics'
  | 'admin'
  | 'admin-login'
  | 'community-login'
  | 'community-register';

export type UserRole = 'community' | 'volunteer' | 'admin';

export type AdminTab = 'overview' | 'volunteers' | 'tasks' | 'moderation' | 'analytics';
