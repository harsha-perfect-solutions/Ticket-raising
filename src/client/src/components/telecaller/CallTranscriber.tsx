import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, FileText, CheckCircle2, RotateCcw } from 'lucide-react';

interface CallTranscriberProps {
  onSummaryGenerated?: (summaryText: string) => void;
}

export const CallTranscriber: React.FC<CallTranscriberProps> = ({ onSummaryGenerated }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [hasSpeechSupport, setHasSpeechSupport] = useState<boolean>(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript + ' ';
        }
        setTranscript(currentText.trim());
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setHasSpeechSupport(false);
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      // Fallback simulation if Web Speech API isn't enabled in browser
      if (!isListening) {
        setIsListening(true);
        setTranscript(
          'Customer reported VPN connection failure after changing corporate password. Attempted network diagnostic, IP address 192.168.1.45, requested ticket escalation to L2 network team.'
        );
      } else {
        setIsListening(false);
      }
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const generateSummary = () => {
    if (!transcript.trim()) return;

    const formattedSummary = `• Caller Query: Connection / Technical support request\n• Key Notes: ${transcript.trim()}\n• Action Required: Follow up with customer within SLA window.`;

    setSummary(formattedSummary);
    if (onSummaryGenerated) {
      onSummaryGenerated(formattedSummary);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Mic className="h-4 w-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-900 dark:text-white">Call Speech Transcriber</h5>
            <p className="text-[10px] text-slate-500">Real-time voice-to-text & auto-summary</p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleListening}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="h-3.5 w-3.5" /> Stop Listening
            </>
          ) : (
            <>
              <Mic className="h-3.5 w-3.5" /> Start Recording Call
            </>
          )}
        </button>
      </div>

      {/* Live Transcript Box */}
      <div className="relative rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
          Live Speech Transcript
        </label>
        <p className="text-xs text-slate-700 dark:text-slate-300 min-h-[48px] max-h-[100px] overflow-y-auto leading-relaxed">
          {transcript || (
            <span className="text-slate-400 italic">
              {isListening ? 'Listening for speech...' : 'Click "Start Recording Call" to transcribe conversation.'}
            </span>
          )}
        </p>
      </div>

      {/* Action Button: Auto-Summarize */}
      {transcript.trim().length > 0 && (
        <div className="flex justify-between items-center pt-1">
          <button
            type="button"
            onClick={generateSummary}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:from-indigo-700 hover:to-violet-700"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Auto-Generate Call Summary
          </button>
          {summary && (
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Summary Applied to Ticket
            </span>
          )}
        </div>
      )}
    </div>
  );
};
