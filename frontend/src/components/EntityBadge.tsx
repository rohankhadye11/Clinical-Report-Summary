import React from 'react';

interface EntityBadgeProps {
  text: string;
  type: 'Diagnosis' | 'Medication';
}

export default function EntityBadge({ text, type }: EntityBadgeProps) {
  const colorClasses = 
    type === 'Diagnosis' 
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
      : 'bg-amber-100 text-amber-800 border-amber-200';      

  return (
    <span className={`px-3 py-1.5 rounded-md text-sm font-medium border ${colorClasses} shadow-sm inline-block`}>
      {text.charAt(0).toUpperCase() + text.slice(1)}
    </span>
  );
}