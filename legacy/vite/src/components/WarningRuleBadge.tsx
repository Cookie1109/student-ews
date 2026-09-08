import React from 'react';

type WarningRuleCode = 'THIEU_TIN_CHI' | 'NO_TIN_CHI_NHE' | 'GPA_THAP' | 'ROT_MON_NHIEU';

interface WarningRuleBadgeProps {
  code: WarningRuleCode;
  className?: string;
}

export default function WarningRuleBadge({ code, className = '' }: WarningRuleBadgeProps) {
  const config = {
    THIEU_TIN_CHI: {
      label: 'Thiếu tín chỉ',
      classes: 'bg-amber-50 text-amber-600 border-amber-200'
    },
    NO_TIN_CHI_NHE: {
      label: 'Nợ tín chỉ nhẹ',
      classes: 'bg-amber-50 text-amber-600 border-amber-200'
    },
    GPA_THAP: {
      label: 'GPA thấp',
      classes: 'bg-red-50 text-red-600 border-red-200'
    },
    ROT_MON_NHIEU: {
      label: 'Rớt môn nhiều',
      classes: 'bg-red-50 text-red-600 border-red-200'
    }
  };

  const { label, classes } = config[code] || { label: code, classes: 'bg-gray-100 text-gray-700 border-gray-200' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${classes} ${className}`}>
      {label}
    </span>
  );
}
