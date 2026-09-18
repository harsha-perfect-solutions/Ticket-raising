import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  backLabel?: string;
  fallbackBackUrl?: string;
  onBack?: () => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  backLabel = 'Back',
  fallbackBackUrl,
  onBack,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const rolePrefix = user?.role ? user.role.toLowerCase() : 'customer';
  const defaultFallback = `/${rolePrefix}/dashboard`;

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    // Check if there is history to go back to; if not, go to fallback URL
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallbackBackUrl || defaultFallback);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-2 border-b border-slate-200/80">
      {/* Left: Visible Back Button & Breadcrumbs Trail */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 shadow-sm transition-all text-xs"
          title="Go back to previous page"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-blue-600" />
          <span>{backLabel}</span>
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-slate-500">
          <Link
            to={`/${rolePrefix}/dashboard`}
            className="hover:text-blue-600 flex items-center gap-1 font-semibold transition-colors"
          >
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span className="capitalize">{rolePrefix} Dashboard</span>
          </Link>

          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <React.Fragment key={`${item.label}-${idx}`}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {item.to && !isLast ? (
                  <Link
                    to={item.to}
                    className="hover:text-blue-600 font-semibold text-slate-600 transition-colors truncate max-w-[150px] sm:max-w-none"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={`truncate max-w-[200px] sm:max-w-none ${isLast ? 'font-bold text-slate-900' : 'text-slate-600 font-medium'}`}>
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Breadcrumbs;
