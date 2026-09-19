import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';

interface PhoneLinkProps {
  phone?: string | null;
  className?: string;
  iconClassName?: string;
  showIcon?: boolean;
  showText?: boolean;
  label?: string;
}

export const PhoneLink: React.FC<PhoneLinkProps> = ({
  phone,
  className = '',
  iconClassName = 'w-3.5 h-3.5',
  showIcon = true,
  showText = true,
  label,
}) => {
  if (!phone) return <span className="text-slate-400">N/A</span>;
  const cleanPhone = phone.replace(/[^\d+]/g, '');

  return (
    <a
      href={`tel:${cleanPhone}`}
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer group ${className}`}
      aria-label={label || `Call ${phone}`}
      title={`Call ${phone}`}
    >
      {showIcon && <Phone className={`${iconClassName} transition-transform group-hover:scale-110 shrink-0`} />}
      {showText && <span>{phone}</span>}
    </a>
  );
};

interface EmailLinkProps {
  email?: string | null;
  className?: string;
  iconClassName?: string;
  showIcon?: boolean;
  showText?: boolean;
  label?: string;
}

export const EmailLink: React.FC<EmailLinkProps> = ({
  email,
  className = '',
  iconClassName = 'w-3.5 h-3.5',
  showIcon = true,
  showText = true,
  label,
}) => {
  if (!email) return <span className="text-slate-400">N/A</span>;

  return (
    <a
      href={`mailto:${email}`}
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer group truncate ${className}`}
      aria-label={label || `Email ${email}`}
      title={`Email ${email}`}
    >
      {showIcon && <Mail className={`${iconClassName} transition-transform group-hover:scale-110 shrink-0`} />}
      {showText && <span className="truncate">{email}</span>}
    </a>
  );
};

interface LocationLinkProps {
  location?: string | null;
  className?: string;
  iconClassName?: string;
  showIcon?: boolean;
  showText?: boolean;
  label?: string;
}

export const LocationLink: React.FC<LocationLinkProps> = ({
  location,
  className = '',
  iconClassName = 'w-3.5 h-3.5',
  showIcon = true,
  showText = true,
  label,
}) => {
  if (!location) return <span className="text-slate-400">N/A</span>;

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

  return (
    <a
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1.5 text-slate-700 hover:text-blue-600 hover:underline transition-colors cursor-pointer group ${className}`}
      aria-label={label || `Open ${location} in map`}
      title={`Open ${location} in Google Maps`}
    >
      {showIcon && <MapPin className={`${iconClassName} transition-transform group-hover:scale-110 shrink-0 text-slate-400 group-hover:text-blue-600`} />}
      {showText && <span className="truncate">{location}</span>}
    </a>
  );
};
