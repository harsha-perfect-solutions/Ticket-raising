import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const NotFoundPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const rolePrefix = user?.role ? user.role.toLowerCase() : 'customer';
  const dashboardUrl = user ? `/${rolePrefix}/dashboard` : '/login';

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-lg animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center mb-4">
          <FileQuestion className="w-9 h-9" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Error 404
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
          Page Not Found
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mb-4 leading-relaxed">
          The requested URL <code className="px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-800 text-xs">{location.pathname}</code> does not exist or you do not have permission to view it.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>

          <Link
            to={dashboardUrl}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
