import React from 'react';

type SeverityLevel = 'XANH' | 'VANG' | 'DO';

interface LevelBadgeProps {
  level: SeverityLevel;
  className?: string;
}

export default function LevelBadge({ level, className = '' }: LevelBadgeProps) {
  const config = {
    XANH: {
      label: 'Bình thường',
      classes: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    },
    VANG: {
      label: 'Giám sát',
      classes: 'bg-amber-100 text-amber-700 border-amber-200'
    },
    DO: {
      label: 'Khẩn cấp',
      classes: 'bg-red-100 text-red-700 border-red-200'
    }
  };

  const { label, classes } = config[level] || config.XANH;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        level === 'XANH' ? 'bg-emerald-500' : 
        level === 'VANG' ? 'bg-amber-500' : 'bg-red-500'
      }`}></span>
      {label}
    </span>
  );
}
