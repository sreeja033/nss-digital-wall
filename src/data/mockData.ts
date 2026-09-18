import { Problem, Volunteer, VolunteerRosterMember, AppNotification, ProvisionedVolunteer, CommunityMember } from '../types';

export const NSS_SEAL_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIS1W50g5ohPe5XFEUB3KP4r1zXkptyHMNr3hY44NcJQPk77ro52m9XM2jf8BzeJDKWHv371GyIlZ35Y14GmPeuf-pXfmAjt2d4s-BwYSVcMLu5U16n3tjRwc_K6lLPeBmxB4Atluj2hIF3SiUt4bYv9iiIqpRhY18drOAC28DkJk6htbaohc4isavAsj7MDo9tq_SWlWN9E2ZD0IMhujEDbgkwE6QP0FY1lncpDk8IByL5V9XTQWYrcxrK-ya-r5vbng';

export const PRIYA_AVATAR_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtA3We1XIhp4ESZgXkfDDL5FTNwGL8RUKOOlWJFA7un6Wz4_Jh7rFq1rm7hs-Kk6_emdChKO0Ph-TX3yY6ugQeHo7X6BmafJUT52pwQRyGInpgDTmXHVFF89A0-w5PLjzvSDlJhrzxZ6iMDdHncBQaZTSGXJ8MRcGMvGWZnCCiSvTELupdDZ4-oH0rX7EgiwoSPKkitX8V9KDkWO_0GukC5Why9bb1sEElraOXGVUEhP48yMufB1zebQ';

export const CURRENT_VOLUNTEER: Volunteer = {
  id: '',
  name: '',
  displayName: '',
  bio: '',
  email: '',
  role: 'Civic Action Cadet',
  unit: 'NSS Civic Unit',
  sector: 'Civic Unit Zone',
  avatar: 'none',
  hoursCompleted: 0,
  drivesLed: 0,
  civicWins: 0,
  badgesCount: 0,
};

export const INITIAL_PROBLEMS: Problem[] = [];

export const DEMO_PROBLEMS: Problem[] = [];

export const VOLUNTEER_ROSTER: VolunteerRosterMember[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export const INITIAL_PROVISIONED_VOLUNTEERS: ProvisionedVolunteer[] = [];

export const INITIAL_COMMUNITY_MEMBERS: CommunityMember[] = [];