import React, { useState, useEffect } from 'react';
import { AlertTriangle, Users, Eye, Edit3, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ActiveAgentPresence {
  id: string;
  fullName: string;
  role: string;
  isTyping?: boolean;
}

interface AgentCollisionBannerProps {
  ticketId: string;
  ticketNumber: string;
}

export const AgentCollisionBanner: React.FC<AgentCollisionBannerProps> = ({
  ticketId,
  ticketNumber,
}) => {
  const { user } = useAuth();
  const isStaff = ['ADMIN', 'MANAGER', 'AGENT', 'TELECALLER'].includes(user?.role || '');

  const [activeViewers, setActiveViewers] = useState<ActiveAgentPresence[]>([]);
  const [typingAgent, setTypingAgent] = useState<ActiveAgentPresence | null>(null);

  useEffect(() => {
    if (!isStaff) return;

    // Simulate multi-agent collision detection logic
    // In production, listens to Socket.IO events `ticket:viewers_update` & `ticket:agent_typing`
    const demoAgents: ActiveAgentPresence[] = [
      { id: 'usr-agent-2', fullName: 'Sarah Jenkins', role: 'Support Specialist', isTyping: false },
      { id: 'usr-agent-3', fullName: 'Alex Rivera', role: 'L2 Network Engineer', isTyping: true },
    ];

    // Filter out current logged in user to avoid self-collision warning
    const otherAgents = demoAgents.filter((a) => a.id !== user?.id);

    if (otherAgents.length > 0) {
      setActiveViewers(otherAgents);
      const typing = otherAgents.find((a) => a.isTyping);
      if (typing) {
        setTypingAgent(typing);
      }
    }
  }, [ticketId, user, isStaff]);

  if (!isStaff || activeViewers.length === 0) return null;

  return (
    <div className="mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 backdrop-blur-md animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0 shadow-sm">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                Agent Collision Warning
              </span>
              <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                Live Activity
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
              {typingAgent ? (
                <>
                  <span className="font-bold text-amber-900 dark:text-amber-200">✍️ {typingAgent.fullName}</span> is currently typing a response to ticket #{ticketNumber}...
                </>
              ) : (
                <>
                  <span className="font-bold text-amber-900 dark:text-amber-200">👁️ {activeViewers.map((a) => a.fullName).join(', ')}</span> is currently viewing this ticket.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 px-3 py-1.5 rounded-xl border border-amber-300/60">
          <Users className="h-3.5 w-3.5" />
          <span>{activeViewers.length} staff viewing</span>
        </div>
      </div>
    </div>
  );
};
