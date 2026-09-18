import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  Shield,
  Layers,
  UserCheck,
  Headphones,
  User,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  Zap,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { UserRole } from '../../types';

interface LoginPageProps {
  onNavigateToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister }) => {
  const { login, switchDemoRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await login(trimmedEmail, password);
      if (rememberMe) {
        localStorage.setItem('supportpro_remember_email', trimmedEmail);
      } else {
        localStorage.removeItem('supportpro_remember_email');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoRoles: { role: UserRole; title: string; desc: string; icon: any; color: string; badge: string }[] = [
    {
      role: 'ADMIN',
      title: 'Administrator',
      desc: 'System settings, SLA rules, full ticket overview & reports',
      icon: Shield,
      color: 'bg-rose-50/70 border-rose-200 text-rose-700 hover:border-rose-400',
      badge: 'Full Access',
    },
    {
      role: 'MANAGER',
      title: 'Team Leader / Manager',
      desc: 'SLA monitoring, escalation queue & workload balance',
      icon: Layers,
      color: 'bg-purple-50/70 border-purple-200 text-purple-700 hover:border-purple-400',
      badge: 'Team Queue',
    },
    {
      role: 'AGENT',
      title: 'Support Specialist',
      desc: 'Assigned tickets, resolution workflows & internal collaboration',
      icon: UserCheck,
      color: 'bg-blue-50/70 border-blue-200 text-blue-700 hover:border-blue-400',
      badge: 'Tickets',
    },
    {
      role: 'TELECALLER',
      title: 'Inbound Telecaller',
      desc: 'Instant caller phone lookup, call logging & rapid ticket creation',
      icon: Headphones,
      color: 'bg-amber-50/70 border-amber-200 text-amber-700 hover:border-amber-400',
      badge: 'Rapid Desk',
    },
    {
      role: 'CUSTOMER',
      title: 'Customer Portal',
      desc: 'Raise tickets, conversation thread, reopen & rating',
      icon: User,
      color: 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:border-emerald-400',
      badge: 'Self-Service',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#2563eb] text-white flex items-center justify-center shadow-md shadow-blue-500/20 mx-auto">
          <Zap className="w-6 h-6 fill-white text-white" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">SUPPORTPRO</h2>
        <p className="mt-1 text-xs text-slate-500 font-medium">Customer & Telecaller Ticket Management Platform</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl px-4 sm:px-0 space-y-6">
        {/* Main Login Box */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>Remember me</span>
              </label>
              <span className="text-slate-400 hover:text-slate-600 cursor-pointer">
                Forgot password?
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-60 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
            <span>Customer without an account?</span>
            <button
              onClick={onNavigateToRegister}
              className="text-blue-600 hover:text-blue-700 font-bold"
            >
              Create Account →
            </button>
          </div>
        </div>

        {/* 1-Click Fast Persona Switcher for Instant Testing */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              🚀 1-Click Instant Persona Testing
            </span>
            <span className="text-[11px] text-slate-400 font-medium">No typing required</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {demoRoles.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.role}
                  onClick={() => switchDemoRole(item.role)}
                  className={`p-3 rounded-2xl ${item.color} border text-left hover:scale-[1.01] transition-all shadow-sm group flex items-start justify-between`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white shadow-sm shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{item.desc}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white border border-black/5 shrink-0 mt-0.5">
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
