import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
  AlertTriangle,
  Download,
  X,
  KeyRound,
  Lock,
} from 'lucide-react';
import { api } from '../../services/api';

interface MfaSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const MfaSetupModal: React.FC<MfaSetupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'SETUP' | 'BACKUP_CODES'>('SETUP');
  const [secret, setSecret] = useState('');
  const [otpAuthUrl, setOtpAuthUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [totpCode, setTotpCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSetupData();
    }
  }, [isOpen]);

  const loadSetupData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/mfa/setup');
      if (res.data.success) {
        setSecret(res.data.secret);
        setOtpAuthUrl(res.data.otpAuthUrl);
        setBackupCodes(res.data.backupCodes || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initialize MFA setup.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length !== 6) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/mfa/enable', { totpCode });
      if (res.data.success) {
        setStep('BACKUP_CODES');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Two-Factor Authentication</h3>
              <p className="text-xs text-slate-500">RFC 6238 TOTP Authenticator Security</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'SETUP' ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Smartphone className="h-4 w-4 text-indigo-600" />
                <span>1. Scan or Enter Key in Authenticator App</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Compatible with Google Authenticator, Microsoft Authenticator, and Authy.
              </p>

              {/* Secret Key Box */}
              <div className="flex items-center justify-between bg-white rounded-xl p-2.5 border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">MANUAL SETUP SECRET</span>
                  <span className="font-mono text-xs font-bold text-indigo-600 tracking-wider">
                    {secret || 'GENERATING-SECRET-KEY...'}
                  </span>
                </div>
                <button
                  onClick={handleCopySecret}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                  title="Copy secret"
                >
                  {copiedSecret ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleVerifyCode} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  2. Enter 6-Digit Code from App
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 123456"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-center font-mono text-base font-bold tracking-widest text-slate-800 focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={totpCode.length !== 6 || isLoading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify & Enable 2FA'}
              </button>
            </form>
          </div>
        ) : (
          /* Step 2: Emergency Recovery Codes */
          <div className="space-y-4">
            <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Lock className="h-4 w-4 text-amber-700" />
                <span>Save Emergency Backup Codes</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                If you lose access to your authenticator app, these single-use codes can be used to sign into your account.
              </p>
            </div>

            {/* Codes Grid */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              {backupCodes.map((code, i) => (
                <div key={i} className="bg-white rounded-lg p-2 border border-slate-200 text-center font-mono text-xs font-bold text-slate-800">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyBackupCodes}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700"
              >
                {copiedCodes ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedCodes ? 'Copied to Clipboard' : 'Copy All Codes'}
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
              >
                I Have Saved Them
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
