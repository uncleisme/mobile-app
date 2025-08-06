import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

interface NotificationBannerProps {
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  type,
  title,
  message,
}) => {
  const config = {
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      icon: Info,
      iconColor: 'text-blue-600',
    },
    warning: {
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800',
      icon: AlertTriangle,
      iconColor: 'text-orange-600',
    },
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-600',
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      icon: XCircle,
      iconColor: 'text-red-600',
    },
  };

  const { bgColor, borderColor, textColor, icon: Icon, iconColor } = config[type];

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`${iconColor} flex-shrink-0 mt-0.5`} size={20} />
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium ${textColor}`}>{title}</h4>
          <p className={`text-sm ${textColor} mt-1`}>{message}</p>
        </div>
      </div>
    </div>
  );
};