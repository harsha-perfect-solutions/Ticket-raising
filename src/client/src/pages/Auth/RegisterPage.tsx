import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  Lock,
  User,
  AlertCircle,
  Zap,
  Check,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    company: '',
    address: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Email Validation
  const emailValidation = useMemo(() => {
    const trimmed = formData.email.trim();
    if (!trimmed) return { isValid: false, message: '' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(trimmed)) {
      return { isValid: true, message: 'Email format looks good' };
    }
    return { isValid: false, message: 'Please enter a valid email address' };
  }, [formData.email]);

  // Dynamic Password Requirements
  const passwordCriteria = useMemo(() => {
    const p = formData.password;
    const hasMinLength = p.length >= 8;
    const hasUpper = /[A-Z]/.test(p);
    const hasLower = /[a-z]/.test(p);
    const hasNumber = /[0-9]/.test(p);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p);
    const passwordsMatch =
      formData.confirmPassword.length > 0 && p === formData.confirmPassword;

    return {
      hasMinLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      passwordsMatch,
      allMet:
        hasMinLength &&
        hasUpper &&
        hasLower &&
        hasNumber &&
        hasSpecial &&
        passwordsMatch,
    };
  }, [formData.password, formData.confirmPassword]);

  // Dynamic Password Strength Meter
  const passwordStrength = useMemo(() => {
    const p = formData.password;
    if (!p) return { score: 0, label: 'Empty', color: 'bg-slate-200', textCol: 'text-slate-400', width: '0%' };

    let score = 0;
    if (p.length >= 8) score += 1;
    if (p.length >= 12) score += 1;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score += 1;
    if (/[0-9]/.test(p)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)) score += 1;

    // Penalty for repeated characters or sequences like "1234" or "aaaa"
    if (/(.)\1{2,}/.test(p) || /1234|abcd|password|qwerty/i.test(p)) {
      score = Math.max(1, score - 1);
    }

    if (score <= 1) {
      return { score: 1, label: 'Very Weak', color: 'bg-rose-500', textCol: 'text-rose-600', width: '20%' };
    } else if (score === 2) {
      return { score: 2, label: 'Weak', color: 'bg-amber-500', textCol: 'text-amber-600', width: '40%' };
    } else if (score === 3) {
      return { score: 3, label: 'Medium', color: 'bg-yellow-500', textCol: 'text-yellow-600', width: '60%' };
    } else if (score === 4) {
      return { score: 4, label: 'Strong', color: 'bg-emerald-500', textCol: 'text-emerald-600', width: '80%' };
    } else {
      return { score: 5, label: 'Very Strong', color: 'bg-blue-600', textCol: 'text-blue-600', width: '100%' };
    }
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.fullName.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phone.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone) {
      setError('Full Name, Email, and Phone number are required.');
      return;
    }

    if (!emailValidation.isValid) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!passwordCriteria.allMet) {
      setError('Please satisfy all password security requirements before proceeding.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await register({
        fullName: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        password: formData.password,
        company: formData.company.trim() || undefined,
        address: formData.address.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please verify your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#2563eb] text-white flex items-center justify-center shadow-md shadow-blue-500/20 mx-auto">
          <Zap className="w-6 h-6 fill-white text-white" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">Customer Portal Registration</h2>
        <p className="mt-1 text-xs text-slate-500 font-medium">Create an account to submit and track support tickets</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Jane Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="+1 555-0199"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  />
                </div>
              </div>
            </div>

            {/* Email Address with dynamic validation */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                {formData.email && (
                  <span
                    className={`text-[11px] font-semibold flex items-center gap-1 ${
                      emailValidation.isValid ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {emailValidation.isValid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    {emailValidation.message}
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="jane@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Password Strength Meter */}
            {formData.password && (
              <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-slate-200/80 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Password Strength</span>
                  <span className={`font-bold ${passwordStrength.textCol}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: passwordStrength.width }}
                  />
                </div>
              </div>
            )}

            {/* Dynamic Password Requirements Panel */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Password Requirements</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                <div
                  className={`flex items-center gap-1.5 ${
                    passwordCriteria.hasMinLength ? 'text-emerald-600 font-semibold' : 'text-slate-500'
                  }`}
                >
                  {passwordCriteria.hasMinLength ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0" />
                  )}
                  <span>At least 8 characters</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${
                    passwordCriteria.hasUpper ? 'text-emerald-600 font-semibold' : 'text-slate-500'
                  }`}
                >
                  {passwordCriteria.hasUpper ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0" />
                  )}
                  <span>Contains uppercase letter</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${
                    passwordCriteria.hasLower ? 'text-emerald-600 font-semibold' : 'text-slate-500'
                  }`}
                >
                  {passwordCriteria.hasLower ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0" />
                  )}
                  <span>Contains lowercase letter</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${
                    passwordCriteria.hasNumber ? 'text-emerald-600 font-semibold' : 'text-slate-500'
                  }`}
                >
                  {passwordCriteria.hasNumber ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0" />
                  )}
                  <span>Contains a number</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${
                    passwordCriteria.hasSpecial ? 'text-emerald-600 font-semibold' : 'text-slate-500'
                  }`}
                >
                  {passwordCriteria.hasSpecial ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0" />
                  )}
                  <span>Contains special character</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${
                    formData.confirmPassword.length === 0
                      ? 'text-slate-400'
                      : passwordCriteria.passwordsMatch
                      ? 'text-emerald-600 font-semibold'
                      : 'text-rose-600 font-semibold'
                  }`}
                >
                  {formData.confirmPassword.length === 0 ? (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0" />
                  ) : passwordCriteria.passwordsMatch ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  )}
                  <span>
                    {formData.confirmPassword.length === 0
                      ? 'Passwords match'
                      : passwordCriteria.passwordsMatch
                      ? 'Passwords match'
                      : 'Passwords do not match'}
                  </span>
                </div>
              </div>
            </div>

            {/* Company & Address (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Company / Org</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Acme Corp (optional)"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Address / City</label>
                <input
                  type="text"
                  placeholder="New York, USA (optional)"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !passwordCriteria.allMet || !emailValidation.isValid}
              className="w-full py-3 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Complete Registration</span>
              )}
            </button>
          </form>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
            <span>Already have an account?</span>
            <button
              onClick={onNavigateToLogin}
              className="text-blue-600 hover:text-blue-700 font-bold"
            >
              ← Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
