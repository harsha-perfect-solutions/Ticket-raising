import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  Volume2,
  VolumeX,
  User,
  Clock,
  Sparkles,
  PhoneIncoming,
  PhoneOutgoing,
  X,
  ChevronUp,
  ChevronDown,
  FileText,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface WebRTCSoftphoneProps {
  onCallStarted?: (phoneNumber: string) => void;
  onCallEnded?: (durationSeconds: number, phoneNumber: string) => void;
  onCustomerSelected?: (phone: string) => void;
  onLogTicketFromCall?: (customer: { name: string; phone: string }) => void;
}

export const WebRTCSoftphone: React.FC<WebRTCSoftphoneProps> = ({
  onCallStarted,
  onCallEnded,
  onCustomerSelected,
  onLogTicketFromCall,
}) => {
  const { user } = useAuth();
  const isTelecallerOrStaff = ['TELECALLER', 'ADMIN', 'MANAGER', 'AGENT'].includes(user?.role || '');

  const [isMinimized, setIsMinimized] = useState(false);
  const [callState, setCallState] = useState<'IDLE' | 'RINGING' | 'CONNECTED' | 'ENDED'>('IDLE');
  const [callType, setCallType] = useState<'INBOUND' | 'OUTBOUND'>('OUTBOUND');
  const [phoneNumber, setPhoneNumber] = useState('9876543210');
  const [callerName, setCallerName] = useState('John Doe (Customer)');
  const [callerTier, setCallerTier] = useState('Enterprise Tier');
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Call controls
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Web Audio synth ringtone ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to start ringtone synthesis using Web Audio API
  const startRingtone = () => {
    if (isAudioMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const playBurst = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.value = 440; // US Ringer Tone 1
        osc2.frequency.value = 480; // US Ringer Tone 2

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 1.8);
        osc2.stop(ctx.currentTime + 1.8);
      };

      playBurst();
      ringIntervalRef.current = setInterval(playBurst, 3000);
    } catch (e) {
      console.warn('AudioContext ringtone unavailable:', e);
    }
  };

  const stopRingtone = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
    }
    audioCtxRef.current = null;
  };

  // Ringtone trigger on INBOUND RINGING
  useEffect(() => {
    if (callState === 'RINGING' && callType === 'INBOUND') {
      startRingtone();
    } else {
      stopRingtone();
    }
    return () => stopRingtone();
  }, [callState, callType, isAudioMuted]);

  // Timer effect for connected call
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState === 'CONNECTED') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [callState]);

  if (!isTelecallerOrStaff) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartOutboundCall = (phoneToCall?: string) => {
    const targetPhone = phoneToCall || phoneNumber;
    if (!targetPhone || targetPhone.length < 10) return;
    setPhoneNumber(targetPhone);
    setCallType('OUTBOUND');
    setCallState('RINGING');

    setTimeout(() => {
      setCallState('CONNECTED');
      if (onCallStarted) onCallStarted(targetPhone);
      if (onCustomerSelected) onCustomerSelected(targetPhone);
    }, 1500);
  };

  const handleSimulateInboundCall = () => {
    const customers = [
      { phone: '9876543210', name: 'Rahul Sharma', tier: 'Enterprise Tier (VIP)' },
      { phone: '9123456789', name: 'Priya Patel', tier: 'Gold Tier' },
      { phone: '9988776655', name: 'Amit Kumar', tier: 'Standard Tier' },
      { phone: '9811223344', name: 'Sneha Gupta', tier: 'Platinum Tier' },
    ];
    const item = customers[Math.floor(Math.random() * customers.length)];
    
    setPhoneNumber(item.phone);
    setCallerName(item.name);
    setCallerTier(item.tier);
    setCallType('INBOUND');
    setCallState('RINGING');
    setIsMinimized(false);
  };

  const handleAnswerCall = () => {
    stopRingtone();
    setCallState('CONNECTED');
    if (onCallStarted) onCallStarted(phoneNumber);
    if (onCustomerSelected) onCustomerSelected(phoneNumber);
  };

  const handleEndCall = () => {
    stopRingtone();
    const duration = callDuration;
    setCallState('ENDED');
    setIsMuted(false);
    setIsOnHold(false);
    if (onCallEnded) onCallEnded(duration, phoneNumber);

    setTimeout(() => {
      setCallState('IDLE');
    }, 2000);
  };

  return (
    <>
      {/* PROMINENT TOP INBOUND CALL BANNER ALERT */}
      {callState === 'RINGING' && callType === 'INBOUND' && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-lg rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 shadow-2xl border border-indigo-500/40 animate-bounce">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 animate-pulse">
                  <PhoneIncoming className="h-6 w-6" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    INCOMING CALL VIA APP
                  </span>
                  <button
                    onClick={() => setIsAudioMuted(!isAudioMuted)}
                    className="text-slate-400 hover:text-white"
                    title={isAudioMuted ? "Unmute Ringtone" : "Mute Ringtone"}
                  >
                    {isAudioMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <h4 className="text-sm font-bold text-white mt-1">{callerName}</h4>
                <p className="text-xs text-indigo-300 font-mono">{phoneNumber} • <span className="text-amber-400 font-sans">{callerTier}</span></p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAnswerCall}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow-lg transition-transform active:scale-95"
              >
                <PhoneCall className="h-4 w-4" /> ACCEPT
              </button>
              <button
                onClick={handleEndCall}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-3 py-2 text-xs font-bold text-white shadow-lg transition-transform active:scale-95"
              >
                <PhoneOff className="h-4 w-4" /> DECLINE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING SOFTPHONE WIDGET */}
      <div className="fixed bottom-6 left-6 z-40 animate-slideUp">
        {isMinimized ? (
          <div className="flex items-center gap-3 rounded-full bg-slate-900 px-4 py-2.5 text-white shadow-2xl border border-slate-800 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${callState === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'}`} />
              <span className="text-xs font-bold font-mono">
                {callState === 'CONNECTED' ? formatTimer(callDuration) : 'Softphone CTI'}
              </span>
            </div>
            <button
              onClick={() => setIsMinimized(false)}
              className="rounded-full p-1 hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="w-84 rounded-2xl bg-slate-900 p-4 text-white shadow-2xl border border-slate-800 backdrop-blur-md space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
                  <PhoneCall className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold flex items-center gap-1.5">
                    WebRTC Softphone <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  </h4>
                  <p className="text-[10px] text-slate-400">In-App Voice Engine Active</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* RINGING STATE */}
            {callState === 'RINGING' && (
              <div className="space-y-3 py-2 text-center animate-pulse">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {callType === 'INBOUND' ? <PhoneIncoming className="h-6 w-6 animate-bounce" /> : <PhoneOutgoing className="h-6 w-6" />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    {callType === 'INBOUND' ? 'Incoming Call...' : 'Ringing Customer...'}
                  </p>
                  <p className="text-sm font-bold text-white font-mono mt-0.5">{phoneNumber}</p>
                  <p className="text-[11px] text-slate-400">{callerName}</p>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  {callType === 'INBOUND' && (
                    <button
                      onClick={handleAnswerCall}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-lg hover:bg-emerald-500"
                    >
                      <PhoneCall className="h-4 w-4" /> Answer
                    </button>
                  )}
                  <button
                    onClick={handleEndCall}
                    className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-rose-500"
                  >
                    <PhoneOff className="h-4 w-4" /> Decline
                  </button>
                </div>
              </div>
            )}

            {/* CONNECTED STATE */}
            {callState === 'CONNECTED' && (
              <div className="space-y-3 py-1">
                <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{callerName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{phoneNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 px-2 py-0.5 text-xs font-mono font-bold text-emerald-400 border border-emerald-800/60">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                        {formatTimer(callDuration)}
                      </span>
                    </div>
                  </div>

                  {/* Audio Frequency Waveform Visualizer */}
                  <div className="flex items-center justify-center gap-1 py-1.5 bg-slate-950/60 rounded-lg">
                    {[16, 28, 12, 36, 24, 40, 18, 30, 14, 26].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 bg-emerald-400 rounded-full animate-pulse"
                        style={{
                          height: `${isOnHold ? 4 : (i % 2 === 0 ? h : h * 0.7)}px`,
                          animationDelay: `${i * 120}ms`,
                        }}
                      />
                    ))}
                    <span className="text-[10px] text-slate-400 ml-2 font-mono">
                      {isOnHold ? 'CALL ON HOLD' : isMuted ? 'MIC MUTED' : 'LIVE VOICE HD'}
                    </span>
                  </div>
                </div>

                {/* Call Controls Bar */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-[11px] font-semibold transition-colors ${
                      isMuted ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isMuted ? <MicOff className="h-4 w-4 mb-1" /> : <Mic className="h-4 w-4 mb-1" />}
                    {isMuted ? 'Muted' : 'Mute'}
                  </button>
                  <button
                    onClick={() => setIsOnHold(!isOnHold)}
                    className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-[11px] font-semibold transition-colors ${
                      isOnHold ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isOnHold ? <Play className="h-4 w-4 mb-1" /> : <Pause className="h-4 w-4 mb-1" />}
                    {isOnHold ? 'On Hold' : 'Hold'}
                  </button>
                  <button
                    onClick={handleEndCall}
                    className="flex flex-col items-center justify-center rounded-xl bg-rose-600 p-2.5 text-[11px] font-bold text-white hover:bg-rose-500 shadow-md"
                  >
                    <PhoneOff className="h-4 w-4 mb-1" />
                    End Call
                  </button>
                </div>

                {/* Quick Log Ticket Action */}
                {onLogTicketFromCall && (
                  <button
                    onClick={() => onLogTicketFromCall({ name: callerName, phone: phoneNumber })}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" /> Log Ticket from Active Call
                  </button>
                )}
              </div>
            )}

            {/* ENDED STATE */}
            {callState === 'ENDED' && (
              <div className="py-4 text-center space-y-1">
                <p className="text-xs font-bold text-rose-400">Call Ended</p>
                <p className="text-xs text-slate-400">Duration: {formatTimer(callDuration)}</p>
              </div>
            )}

            {/* IDLE DIALPAD STATE */}
            {callState === 'IDLE' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">Enter Mobile Number</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                      placeholder="10-digit number..."
                      className="flex-1 rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      onClick={() => handleStartOutboundCall()}
                      disabled={phoneNumber.length < 10}
                      className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-40"
                    >
                      Dial
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  <button
                    onClick={handleSimulateInboundCall}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60"
                  >
                    <PhoneIncoming className="h-3.5 w-3.5 animate-pulse text-emerald-400" /> Receive Inbound Call
                  </button>
                  <span className="text-[10px] text-slate-500">CTI Ready</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
