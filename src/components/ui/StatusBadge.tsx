import React from 'react';

export type StatusKey = 'active' | 'in_progress' | 'review' | 'done' | 'overdue';

interface StatusBadgeProps {
  status?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

const normalizeStatus = (s?: string | null): StatusKey => {
  const v = (s || '').toLowerCase();
  if (['completed', 'done', 'closed'].includes(v)) return 'done';
  if (v.includes('review')) return 'review';
  if (v.includes('progress') || v.includes('started') || v.includes('working')) return 'in_progress';
  if (v.includes('overdue')) return 'overdue';
  return 'active';
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', className = '' }) => {
  const key = normalizeStatus(status);
  const base = 'inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap';
  const sizeCls = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';
  const colorMap: Record<StatusKey, string> = {
    done: 'bg-green-700 text-white',
    review: 'bg-violet-700 text-white',
    in_progress: 'bg-blue-700 text-white',
    overdue: 'bg-red-700 text-white',
    active: 'bg-amber-700 text-white',
  };
  return <span className={`${base} ${sizeCls} ${colorMap[key]} ${className}`}>{
    key === 'in_progress' ? 'In Progress' : key.charAt(0).toUpperCase() + key.slice(1).replace('_',' ')
  }</span>;
};
