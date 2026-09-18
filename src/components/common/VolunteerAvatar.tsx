import React, { useState } from 'react';
import { getInitials, isNoPicture } from '../../data/avatarIcons';
import { Shield } from 'lucide-react';

interface VolunteerAvatarProps {
  avatar?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  badge?: React.ReactNode;
}

const SIZE_MAP = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-20 h-20 text-xl',
};

export const VolunteerAvatar: React.FC<VolunteerAvatarProps> = ({
  avatar,
  name = 'Volunteer',
  size = 'md',
  className = '',
  badge,
}) => {
  const [imageError, setImageError] = useState(false);
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const showInitials = isNoPicture(avatar) || imageError;

  return (
    <div className={`relative inline-block shrink-0 ${sizeClass}`}>
      {showInitials ? (
        <div
          title={name}
          className={`w-full h-full rounded-xl bg-[#1B4B43] text-[#FFFDF8] font-['Epilogue'] font-black flex items-center justify-center border-2 border-[#38665E] shadow-2xs select-none ${className}`}
        >
          {name ? (
            <span>{getInitials(name)}</span>
          ) : (
            <Shield className="w-1/2 h-1/2 text-[#B8EADE]" />
          )}
        </div>
      ) : (
        <img
          src={avatar}
          alt={name}
          onError={() => setImageError(true)}
          className={`w-full h-full rounded-xl object-cover border-2 border-[#38665E] shadow-2xs ${className}`}
        />
      )}
      {badge && <div className="absolute -bottom-1 -right-1 z-10">{badge}</div>}
    </div>
  );
};
