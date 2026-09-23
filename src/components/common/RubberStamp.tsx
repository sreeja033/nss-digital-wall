import React from 'react';
import { ProblemStatus } from '../../types';

interface RubberStampProps {
  status: ProblemStatus;
  size?: 'sm' | 'md' | 'lg';
  rotation?: number; // degrees
  className?: string;
}

export const RubberStamp: React.FC<RubberStampProps> = ({
  status,
  size = 'md',
  rotation,
  className = '',
}) => {
  // Distinct visual configurations matching the design screens
  const configMap: Record<ProblemStatus, {
    text: string;
    defaultRot: number;
    border: string;
    textColor: string;
    bgColor: string;
    boxShadow: string;
    icon: string;
  }> = {
    PENDING_REVIEW: {
      text: 'UNDER REVIEW',
      defaultRot: -1,
      border: 'border-2 border-[#1D4ED8] border-dashed',
      textColor: 'text-[#1D4ED8]',
      bgColor: 'bg-[#EFF6FF]/90',
      boxShadow: 'shadow-[inset_0_0_0_1px_rgba(29,78,216,0.3)]',
      icon: '⏳',
    },
    REPORTED: {
      text: 'REPORTED',
      defaultRot: -3,
      border: 'border-2 border-[#A03818]',
      textColor: 'text-[#A03818]',
      bgColor: 'bg-[#FFDBD1]/75',
      boxShadow: 'shadow-[inset_0_0_0_1px_rgba(160,56,24,0.4)]',
      icon: '!',
    },
    IN_PROGRESS: {
      text: 'IN PROGRESS',
      defaultRot: 2,
      border: 'border-2 border-[#7B5300] border-dashed',
      textColor: 'text-[#7B5300]',
      bgColor: 'bg-[#FFDDAE]/75',
      boxShadow: 'shadow-[inset_0_0_0_1px_rgba(123,83,0,0.3)]',
      icon: '⟳',
    },
    SOLVED: {
      text: 'SOLVED ✓',
      defaultRot: -2,
      border: 'border-2 border-[#1B4B43] border-double',
      textColor: 'text-[#1B4B43]',
      bgColor: 'bg-[#B8EADE]/85',
      boxShadow: 'shadow-[inset_0_0_0_1px_rgba(27,75,67,0.4)]',
      icon: '✓',
    },
  };

  const config = configMap[status] || configMap.REPORTED;

  const sizeClasses = {
    sm: 'text-[10px] py-0.5 px-2 tracking-widest font-extrabold',
    md: 'text-xs py-1 px-2.5 tracking-wider font-extrabold',
    lg: 'text-sm py-1.5 px-3.5 tracking-widest font-black',
  }[size];

  const rot = rotation !== undefined ? rotation : config.defaultRot;

  return (
    <div
      style={{ transform: `rotate(${rot}deg)` }}
      className={`inline-flex items-center gap-1.5 rounded-[3px] font-['Epilogue'] uppercase select-none transition-transform duration-200 ${config.border} ${config.textColor} ${config.bgColor} ${config.boxShadow} ${sizeClasses} ${className}`}
    >
      <span className="font-mono text-[11px] opacity-70 leading-none">{config.icon}</span>
      <span>{config.text}</span>
    </div>
  );
};
