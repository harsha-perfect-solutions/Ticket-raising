import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
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
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { UserRole } from '../../types';

interface LoginPageProps {
  onNavigateToRegister: () => void;
}

type AuthMode = 'LOGIN' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD' | 'MFA_CHALLENGE';

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister }) => {
  const { login, verifyMfaLogin, switchDemoRole } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');

  // Login form states with Remember Me prefill
  const [email, setEmail] = useState(() => localStorage.getItem('supportpro_remember_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('supportpro_remember_email'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SEC-02: MFA Challenge states
  const [mfaTempToken, setMfaTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCodeInput, setBackupCodeInput] = useState('');

  // Forgot / Reset Password flow states
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

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
      const result = await login(trimmedEmail, password, rememberMe);
      if (result && result.mfaRequired) {
        setMfaTempToken(result.tempToken || '');
        setAuthMode('MFA_CHALLENGE');
        setIsLoading(false);
        return;
      }
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

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!useBackupCode && totpCode.length !== 6) {
      setError('Please enter a 6-digit verification code.');
      return;
    }
    if (useBackupCode && !backupCodeInput.trim()) {
      setError('Please enter your emergency backup code.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await verifyMfaLogin(
        mfaTempToken,
        useBackupCode ? undefined : totpCode,
        useBackupCode ? backupCodeInput.trim() : undefined,
        rememberMe
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = resetEmail.trim();
    if (!trimmedEmail) {
      setResetError('Please enter your registered email address.');
      return;
    }

    setIsSubmittingReset(true);
    setResetError(null);
    setResetSuccessMessage(null);

    try {
      const res = await authApi.forgotPassword(trimmedEmail);
      if (res.data.success) {
        setResetSuccessMessage(res.data.message);
        if (res.data.resetToken) {
          // In development/demo environment, automatically populate resetToken and transition to Reset Password
          setResetToken(res.data.resetToken);
          setAuthMode('RESET_PASSWORD');
        }
      }
    } catch (err: any) {
      setResetError(err.response?.data?.message || 'Failed to process request. Please try again.');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setResetError('Please enter a new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match. Please re-type them.');
      return;
    }
    if (newPassword.length < 8) {
      setResetError('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setResetError('Password must include at least one uppercase letter.');
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setResetError('Password must include at least one lowercase letter.');
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setResetError('Password must include at least one number.');
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      setResetError('Password must include at least one special character.');
      return;
    }

    setIsSubmittingReset(true);
    setResetError(null);

    try {
      const res = await authApi.resetPassword({ token: resetToken, newPassword });
      if (res.data.success) {
        setEmail(resetEmail);
        setPassword('');
        setResetSuccessMessage(res.data.message || 'Password successfully reset! You can now log in.');
        setResetError(null);
        setAuthMode('LOGIN');
      }
    } catch (err: any) {
      setResetError(err.response?.data?.message || 'Failed to reset password. Please request a new link.');
    } finally {
      setIsSubmittingReset(false);
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
      {/* Ambient background glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mx-auto ring-4 ring-blue-500/10 mb-3">
          <Zap className="w-7 h-7 fill-white text-white" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-1">
          <span>Resolve</span>
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">Hub</span>
        </h2>
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500">powered by</span>
          <span className="text-[11px] font-extrabold text-slate-800 tracking-tight">HPS(OPC) Pvt. Ltd.</span>
        </div>
        <p className="mt-2 text-xs text-slate-500 font-medium">Enterprise Service Desk & Operations Platform</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl px-4 sm:px-0 space-y-6">
        {/* Main Login / Forgot Password Box */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
          {resetSuccessMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Password Reset Instructions</p>
                <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">{resetSuccessMessage}</p>
              </div>
            </div>
          )}

          {/* MODE 1: LOGIN */}
          {authMode === 'LOGIN' && (
            <>
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
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('FORGOT_PASSWORD');
                      setResetEmail(email);
                      setResetError(null);
                      setResetSuccessMessage(null);
                    }}
                    className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer transition-colors"
                  >
                    Forgot password?
                  </button>
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
            </>
          )}

          {/* MODE: MFA 2-STEP AUTHENTICATOR CHALLENGE */}
          {authMode === 'MFA_CHALLENGE' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Two-Factor Authentication</h3>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      RFC 6238
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Signing in as <span className="font-semibold text-slate-700">{email}</span>
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleMfaSubmit} className="space-y-4">
                {!useBackupCode ? (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Enter 6-Digit Code from Authenticator App
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        autoFocus
                        placeholder="••••••"
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full pl-10 pr-3.5 py-3 bg-[#f8fafc] border border-slate-200 rounded-xl text-center font-mono text-xl tracking-[0.3em] font-bold text-slate-900 placeholder-slate-300 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-colors"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Enter Emergency Recovery Backup Code
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="e.g. 8F9A-2C4B"
                        value={backupCodeInput}
                        onChange={(e) => setBackupCodeInput(e.target.value.toUpperCase())}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Demo test code banner */}
                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-700 flex items-center justify-between">
                  <span>💡 Test code: <strong className="font-mono">123456</strong> or authenticator app</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTotpCode('123456');
                      setUseBackupCode(false);
                    }}
                    className="font-bold underline hover:text-indigo-900 cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setUseBackupCode(!useBackupCode)}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                  >
                    {useBackupCode ? 'Use 6-Digit Authenticator Code' : 'Use Emergency Backup Code'}
                  </button>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('LOGIN');
                      setError(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MODE 2: FORGOT PASSWORD */}
          {authMode === 'FORGOT_PASSWORD' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('LOGIN');
                    setResetError(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Back to Login"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Forgot Password</h3>
                  <p className="text-[11px] text-slate-500">
                    Enter your registered email to reset your account password.
                  </p>
                </div>
              </div>

              {resetError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reset-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      id="reset-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="e.g. customer@acme.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('LOGIN');
                      setResetError(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReset}
                    className="flex-1 py-2.5 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-60 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmittingReset ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MODE 3: RESET PASSWORD */}
          {authMode === 'RESET_PASSWORD' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('LOGIN');
                    setResetError(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Back to Login"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Set New Password</h3>
                  <p className="text-[11px] text-slate-500">
                    Choose a strong password for <span className="font-semibold text-slate-700">{resetEmail}</span>
                  </p>
                </div>
              </div>

              {resetError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reset-new-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      id="reset-new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="At least 8 chars, uppercase, digit & special"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="reset-confirm-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      id="reset-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Criteria Badges */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <span className={newPassword.length >= 8 ? 'text-emerald-600 font-bold' : ''}>
                    • 8+ characters
                  </span>
                  <span className={/[A-Z]/.test(newPassword) ? 'text-emerald-600 font-bold' : ''}>
                    • Uppercase letter
                  </span>
                  <span className={/[a-z]/.test(newPassword) ? 'text-emerald-600 font-bold' : ''}>
                    • Lowercase letter
                  </span>
                  <span className={/[0-9]/.test(newPassword) ? 'text-emerald-600 font-bold' : ''}>
                    • Number & Symbol
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('LOGIN');
                      setResetError(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReset}
                    className="flex-1 py-2.5 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-60 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmittingReset ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
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

        {/* Footer Attribution */}
        <div className="text-center text-xs text-slate-400 font-medium pt-2 pb-4 select-none">
          ResolveHub &copy; {new Date().getFullYear()} &bull; Powered by <span className="font-semibold text-slate-600">HPS(OPC) Pvt. Ltd.</span> All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
