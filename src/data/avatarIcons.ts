import { PRIYA_AVATAR_URL } from './mockData';

export interface AvatarIconOption {
  id: string;
  label: string;
  category: 'vector_icon' | 'cadet_portrait' | 'special';
  url: string;
  badgeBg?: string;
  badgeBorder?: string;
}

// Beautiful inline SVG Data URIs for pre-generated vector icons
const createSvgDataUri = (svgInner: string, bg = '#1B4B43') => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect width="100" height="100" rx="28" fill="${bg}"/>
    <g transform="translate(14, 14)">${svgInner}</g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const PRE_GENERATED_AVATAR_ICONS: AvatarIconOption[] = [
  // Vector Avatar Icons
  {
    id: 'icon-shield',
    label: 'Civic Guardian Shield',
    category: 'vector_icon',
    url: createSvgDataUri(
      `<path d="M36 4L8 16v20c0 24 28 34 28 34s28-10 28-34V16L36 4z" fill="#38665E" stroke="#FFDDAE" stroke-width="3"/>
       <path d="M36 18l5 12 13 1-10 9 3 13-11-7-11 7 3-13-10-9 13-1z" fill="#FFDDAE"/>`,
      '#1B4B43'
    ),
  },
  {
    id: 'icon-eco',
    label: 'Eco & Tree Specialist',
    category: 'vector_icon',
    url: createSvgDataUri(
      `<circle cx="36" cy="36" r="30" fill="#2E7D32"/>
       <path d="M36 14c-12 0-22 10-22 22 0 18 22 32 22 32s22-14 22-32c0-12-10-22-22-22z" fill="#A5D6A7"/>
       <path d="M36 24v34M24 38c6-6 12-4 12-4M48 38c-6-6-12-4-12-4" stroke="#1B5E20" stroke-width="3" stroke-linecap="round"/>`,
      '#1B4B43'
    ),
  },
  {
    id: 'icon-star',
    label: 'Cadet Merit Star',
    category: 'vector_icon',
    url: createSvgDataUri(
      `<polygon points="36,6 45,25 66,28 50,42 54,63 36,52 18,63 22,42 6,28 27,25" fill="#E5A93C" stroke="#FFFDF8" stroke-width="2"/>
       <circle cx="36" cy="36" r="10" fill="#B9801A"/>
       <circle cx="36" cy="36" r="5" fill="#FFFDF8"/>`,
      '#8C4A00'
    ),
  },
  {
    id: 'icon-clean',
    label: 'Sanitation Warrior',
    category: 'vector_icon',
    url: createSvgDataUri(
      `<path d="M16 56l20-20 8 8-20 20z" fill="#38665E"/>
       <path d="M36 36l18-18c2-2 6-2 8 0l4 4c2 2 2 6 0 8L48 48z" fill="#B8EADE"/>
       <path d="M12 60l6-6 10 10-6 6c-3 3-7 1-10-2s-5-7 0-8z" fill="#C59B27"/>
       <path d="M52 14l2-6 2 6 6 2-6 2-2 6-2-6-6-2z" fill="#FFDDAE"/>`,
      '#21433E'
    ),
  },
  {
    id: 'icon-rescue',
    label: 'First Responder',
    category: 'vector_icon',
    url: createSvgDataUri(
      `<circle cx="36" cy="36" r="32" fill="#C53030"/>
       <rect x="28" y="14" width="16" height="44" rx="4" fill="#FFFDF8"/>
       <rect x="14" y="28" width="44" height="16" rx="4" fill="#FFFDF8"/>
       <polygon points="36,24 40,34 33,34 36,48 30,38 37,38" fill="#C53030"/>`,
      '#741B1B'
    ),
  },
  {
    id: 'icon-community',
    label: 'Community Voice',
    category: 'vector_icon',
    url: createSvgDataUri(
      `<circle cx="24" cy="28" r="12" fill="#FFDDAE"/>
       <circle cx="48" cy="28" r="12" fill="#B8EADE"/>
       <path d="M10 60c0-10 7-18 16-18h2c2 0 4 1 6 2 2-1 4-2 6-2h2c9 0 16 8 16 18v4H10v-4z" fill="#FFFDF8"/>`,
      '#2B4C45'
    ),
  },
  {
    id: 'icon-fixer',
    label: 'Civic Repair Fixer',
    category: 'vector_icon',
    url: createSvgDataUri(
      `<circle cx="36" cy="36" r="30" fill="#3D5A80"/>
       <path d="M20 52l22-22 8 8-22 22-8-2z" fill="#E0FBFC"/>
       <path d="M42 22l8-8c4-4 10-4 14 0s4 10 0 14l-8 8-14-14z" fill="#FFB703"/>`,
      '#1E3A5F'
    ),
  },
  {
    id: 'icon-dove',
    label: 'Peace & Service',
    category: 'vector_icon',
    url: createSvgDataUri(
      `<path d="M56 12c-4 0-8 3-10 6-6-4-14-4-20 1-6 6-6 16-1 22L12 54l16-2 4 14 6-10c8 2 16-2 20-8 6-8 4-18-2-24l6-6-6-6z" fill="#FFFDF8"/>
       <circle cx="50" cy="18" r="2" fill="#1B4B43"/>`,
      '#2C5D54'
    ),
  },

  // Illustrated Cadet Portraits
  {
    id: 'portrait-priya',
    label: 'Cadet Lead Portrait (Priya)',
    category: 'cadet_portrait',
    url: PRIYA_AVATAR_URL,
  },
  {
    id: 'portrait-rohan',
    label: 'Cadet Lead (Rohan)',
    category: 'cadet_portrait',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'portrait-ananya',
    label: 'Green Specialist (Ananya)',
    category: 'cadet_portrait',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'portrait-arjun',
    label: 'Safety Cadet (Arjun)',
    category: 'cadet_portrait',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'portrait-meera',
    label: 'Community Outreach (Meera)',
    category: 'cadet_portrait',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'portrait-dev',
    label: 'Logistics Cadet (Dev)',
    category: 'cadet_portrait',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
  },
];

export const NO_PICTURE_VALUE = 'none';

export const getInitials = (name?: string): string => {
  if (!name || !name.trim()) return 'NV';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const isNoPicture = (avatar?: string): boolean => {
  return !avatar || avatar === 'none' || avatar.trim() === '' || avatar === 'initials';
};
