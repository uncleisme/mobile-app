import React from 'react';

export type PriorityKey = 'critical' | 'high' | 'medium' | 'low';

interface PriorityBadgeProps {
  priority?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

const normalizePriority = (p?: string | null): PriorityKey => {
  const v = (p || '').toLowerCase();
  if (v === 'critical' || v === 'urgent' || v === 'p1') return 'critical';
  if (v === 'high' || v === 'p2') return 'high';
  if (v === 'medium' || v === 'p3') return 'medium';
  return 'low';
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm', className = '' }) => {
  const key = normalizePriority(priority);
  const base = 'inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap';
  const sizeCls = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';
  const colorMap: Record<PriorityKey, string> = {
    critical: 'bg-red-700 text-white',
    high: 'bg-orange-700 text-white',
    medium: 'bg-yellow-700 text-white',
    low: 'bg-gray-700 text-white',
  };
  return <span className={`${base} ${sizeCls} ${colorMap[key]} ${className}`}>{
    key.charAt(0).toUpperCase() + key.slice(1)
  }</span>;
};
