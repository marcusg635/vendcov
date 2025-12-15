import React, { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Sparkles, Undo2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

function normalize(s) {
  return String(s || '').toLowerCase().trim();
}

function isYes(text) {
  const t = normalize(text);
  return t === 'yes' || t === 'y' || t === 'confirm' || t === 'confirmed' || t === 'do it' || t === 'proceed';
}

function isNo(text) {
  const t = normalize(text);
  return t === 'no' || t === 'n' || t === 'cancel' || t === 'stop' || t === 'nevermind' || t === 'never mind';
}

function looksLikeEmail(text) {
  return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(String(text || ''));
}

function pickMostRecent(list, n = 15) {
  return (Array.isArray(list) ? list : [])
    .slice()
    .sort((a, b) => {
      const da = new Date(a?.created_date || a?.created_at || 0).getTime();
      const db = new Date(b?.created_date || b?.created_at || 0).getTime();
      return db - da;
    })
    .slice(0, n);
}

function safeJson(obj, maxChars = 12000) {
  try {
    const s = JSON.stringify(obj, null, 2);
    if (s.length <= maxChars) return s;
    return s.slice(0, maxChars) + '\n...<trimmed>';
  } catch {
    return '{}';
  }
}

export default function AdminAIChat() {
  const [user, setUser] = useState(null);

  // chat + ui
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // undo + confirm
  const [actionHistory, setActionHistory] = useState([]);
  const [pendingAction, setPendingAction] = useState(null); // stores proposed action until confirmed

  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
      if (u?.role !== 'admin') window.location.href = '/';
    };
    loadUser();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const addMessage = (role, content, meta = {}) => {
    setMessages(prev => [...prev, { role, content, timestamp: new Date(), ...meta }]);
  };

  // ---------- Data helpers ----------
  const fetchAdminSnapshot = async (queryText) => {
    // Pull only what we need: summary counts + recent items.
    // This makes the model faster + far less dumb.
    const [
      users,
      profiles,
      jobs,
      applications,
      chats,
      tickets,
      reports
    ] = await Promise.all([
      base44.entities.User.list(),
      base44.entities.VendorProfile.list('-created_date'),
      base44.entities.HelpRequest.list('-created_date'),
      base44.entities.JobApplication.list('-created_date'),
      base44.entities.SupportChat.list('-created_date'),
      base44.entities.SupportTicket.list('-created_date'),
      base44.entities.UserReport.list('-created_date')
    ]);

    const q = normalize(queryText);

    // Basic matchers for “find user/profile by …”
    const matchedUsers = users.filter(u =>
      normalize(u.email).includes(q) ||
      normalize(u.full_name).includes(q)
    ).slice(0, 10);

    const matchedProfiles = profiles.filter(p =>
      normalize(p.user_id).includes(q) ||
      normalize(p.email).includes(q) ||
      normalize(p.full_name).includes(q) ||
      normalize(p.business_name).includes(q)
    ).slice(0, 10);

    const matchedTickets = tickets.filter(t =>
      normalize(t.id).includes(q) ||
      normalize(t.user_email).includes(q) ||
      normalize(t.user_name).includes(q) ||
      normalize(t.title).includes(q)
    ).slice(0, 10);

    const matchedChats = chats.filter(c =>
      normalize(c.id).includes(q) ||
      normalize(c.user_id).includes(q) ||
      normalize(c.user_email).includes(q) ||
      normalize(c.user_name).includes(q)
    ).slice(0, 10);

    const stats = {
      total_users: users.length,
      total_profiles: profiles.length,
      pending_profiles: profiles.filter(p => p.approval_status === 'pending').length,
      approved_profiles: profiles.filter(p => p.approval_status === 'approved').length,
      rejected_profiles: profiles.filter(p => p.approval_status === 'rejected').length,
      suspended_profiles: profiles.filter(p => !!p.suspended).length,

      total_jobs: jobs.length,
      open_jobs: jobs.filter(j => j.status === 'open').length,
      filled_jobs: jobs.filter(j => j.status === 'filled').length,
      completed_jobs: jobs.filter(j => j.status === 'completed').length,

      total_applications: applications.length,
      pending_applications: applications.filter(a => a.status === 'pending').length,

      open_support_chats: chats.filter(c => c.status === 'open' || c.status === 'assigned').length,
      unassigned_support_chats: chats.filter(c => !c.assigned_admin_id && c.status !== 'closed').length,

      open_support_tickets: tickets.filter(t => t.status === 'open').length,
      open_reports: reports.filter(r => r.status === 'open').length
    };

    const recent = {
      recent_pending_profiles: pickMostRecent(profiles.filter(p => p.approval_status === 'pending'), 8),
      recent_unassigned_support_chats: pickMostRecent(chats.filter(c => !c.assigned_admin_id && c.status !== 'closed'), 8),
      recent_open_tickets: pickMostRecent(tickets.filter(t => t.status === 'open'), 8),
      recent_open_reports: pickMostRecent(reports.filter(r => r.status === 'open'), 8),
      recent_open_jobs: pickMostRecent(jobs.filter(j => j.status === 'open'), 8)
    };

    const matches = {
      matched_users: matchedUsers,
      matched_profiles: matchedProfiles,
      matched_support_tickets: matchedTickets,
      matched_support_chats: matchedChats
    };

    return { stats, recent, matches };
  };

  // ---------- Actions ----------
  const performAction = async (action) => {
    // action: { action_type, target_kind, target_id, reason, duration_days }
    const actionType = action?.action_type;

    if (!actionType) throw new Error('Missing action_type');

    // ---- Suspend / Approve / Deny are profile-based actions in your schema ----
    if (actionType === 'suspend' || actionType === 'approve' || actionType === 'deny') {
      const targetEmail = action.target_id; // expected: user email
      if (!looksLikeEmail(targetEmail)) throw new Error('Target must be a user email');

      const profile = (await base44.entities.VendorProfile.filter({ user_id: targetEmail }))[0];
      if (!profile) throw new Error(`No VendorProfile found for ${targetEmail}`);

      if (actionType === 'suspend') {
        await base44.entities.VendorProfile.update(profile.id, {
          suspended: true,
          suspension_type: 'temporary',
          suspension_duration_days: action.duration_days || 7,
          suspension_start_date: new Date().toISOString(),
          suspension_reason: action.reason || 'Admin action'
        });
        toast.success(`Suspended ${profile.full_name || targetEmail}`);
      }

      if (actionType === 'approve') {
        await base44.entities.VendorProfile.update(profile.id, {
          approval_status: 'approved',
          rejection_reason: null,
          action_required_notes: null,
          approved_by_id: user.email,
          approved_by_name: user.full_name,
          approved_at: new Date().toISOString()
        });
        toast.success(`Approved ${profile.full_name || targetEmail}`);
      }

      if (actionType === 'deny') {
        await base44.entities.VendorProfile.update(profile.id, {
          approval_status: 'rejected',
          rejection_reason: action.reason || 'Does not meet requirements',
          rejected_by_id: user.email,
          rejected_by_name: user.full_name,
          rejected_at: new Date().toISOString()
        });
        toast.success(`Denied ${profile.full_name || targetEmail}`);
      }

      // Invalidate broad admin lists (your dashboard uses these)
      queryClient.invalidateQueries(['allVendorProfiles']);
      queryClient.invalidateQueries(['vendorProfile']);
      return;
    }

    throw new Error(`Unsupported action_type: ${actionType}`);
  };

  const performUndo = async (lastAction) => {
    addMessage('assistant', `Undoing last action: ${lastAction.action_type} for ${lastAction.target_id}...`);

    if (!looksLikeEmail(lastAction.target_id)) throw new Error('Undo target must be an email');

    const profile = (await base44.entities.VendorProfile.filter({ user_id: lastAction.target_id }))[0];
    if (!profile) throw new Error(`No VendorProfile found for ${lastAction.target_id}`);

    if (lastAction.action_type === 'suspend') {
      await base44.entities.VendorProfile.update(profile.id, {
        suspended: false,
        suspension_type: null,
        suspension_reason: null,
        suspension_duration_days: null,
        suspension_start_date: null
      });
    }

    if (lastAction.action_type === 'approve') {
      await base44.entities.VendorProfile.update(profile.id, {
        approval_status: 'pending',
        approved_by_id: null,
        approved_by_name: null,
        approved_at: null
      });
    }

    if (lastAction.action_type === 'deny') {
      await base44.entities.VendorProfile.update(profile.id, {
        approval_status: 'pending',
        rejection_reason: null,
        rejected_by_id: null,
        rejected_by_name: null,
        rejected_at: null
      });
    }

    queryClient.invalidateQueries(['allVendorProfiles']);
    queryClient.invalidateQueries(['vendorProfile']);
    toast.success('Action undone');
    addMessage('assistant', `✅ Undid ${lastAction.action_type} for ${profile.full_name || lastAction.target_id}.`);
  };

  // ---------- AI call ----------
  const callAdminLLM = async ({ userMessage, conversationHistory, snapshot }) => {
    // IMPORTANT: keep prompt small + structured
    const prompt = `
You are VendorCover Admin Assistant. You must be accurate and never invent IDs or facts.
You will be given:
- Conversation history
- Admin snapshot data (stats + recent + matches)
Your job:
1) Determine intent: "question", "action", or "research".
2) If action: extract a single concrete action with a specific target email.
   - If target is ambiguous (multiple matches or none), ask a clarifying question and set needs_confirmation=false.
   - Otherwise, set needs_confirmation=true and propose the action clearly.
3) If question: answer using the snapshot; if insufficient, say what data is missing.
4) If research: propose what you will research and what you need (name/business/site), do NOT run actions.

Strict rules:
- Never perform an action in the response. Only propose it.
- For actions: require confirmation with yes/confirm, unless it's not safe/ambiguous.
- NEVER assume "john" means a specific person if multiple matches exist.
- Keep responses short and direct.

Conversation:
${conversationHistory}

User message:
${userMessage}

Admin snapshot JSON:
${safeJson(snapshot, 12000)}
`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          response: { type: "string" },
          intent: { type: "string", enum: ["question", "action", "research"] },

          // action proposal
          is_action: { type: "boolean" },
          needs_confirmation: { type: "boolean" },
          action_type: { type: "string", enum: ["suspend", "approve", "deny", "none"] },
          target_id: { type: "string" }, // email for profile actions
          reason: { type: "string" },
          duration_days: { type: "number" }
        },
        required: ["response", "intent", "is_action", "needs_confirmation", "action_type", "target_id"]
      }
    });

    return result;
  };

  const conversationHistory = useMemo(() => {
    // keep last 12 messages in context (more = worse)
    const last = messages.slice(-12);
    return last.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
  }, [messages]);

  // ---------- Send handler ----------
  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);
    setIsProcessing(true);

    try {
      // 1) Confirm flow
      if (pendingAction) {
        if (isNo(userMessage)) {
          addMessage('assistant', 'Cancelled. No action taken.');
          setPendingAction(null);
          return;
        }

        if (isYes(userMessage)) {
          // Execute pending action
          await performAction(pendingAction);
          addMessage('assistant', `✅ Done. (${pendingAction.action_type} ${pendingAction.target_id})`, { action: pendingAction.action_type });
          setActionHistory(prev => [...prev, pendingAction]);
          setPendingAction(null);
          return;
        }

        addMessage('assistant', 'I’m waiting on confirmation. Reply **yes** to proceed or **no** to cancel.');
        return;
      }

      // 2) Undo command
      if (normalize(userMessage) === 'undo') {
        if (actionHistory.length === 0) {
          addMessage('assistant', "There's nothing to undo yet.");
          return;
        }
        const last = actionHistory[actionHistory.length - 1];
        await performUndo(last);
        setActionHistory(prev => prev.slice(0, -1));
        return;
      }

      // 3) Snapshot (small, relevant)
      const snapshot = await fetchAdminSnapshot(userMessage);

      // 4) AI routing + proposal
      const ai = await callAdminLLM({
        userMessage,
        conversationHistory,
        snapshot
      });

      // If action proposed, validate + confirm
      if (ai?.is_action && ai?.action_type && ai.action_type !== 'none') {
        const targetEmail = ai.target_id;

        // If AI didn’t provide a real email, force clarification
        if (!looksLikeEmail(targetEmail)) {
          addMessage('assistant', `${ai.response}\n\nI need the user’s email to do that. Paste the email address.`);
          return;
        }

        if (ai.needs_confirmation) {
          const proposed = {
            action_type: ai.action_type,
            target_id: targetEmail,
            reason: ai.reason || '',
            duration_days: ai.duration_days || undefined
          };
          setPendingAction(proposed);
          addMessage('assistant', `${ai.response}\n\nReply **yes** to confirm, or **no** to cancel.`);
          return;
        }

        // Not safe / ambiguous -> just respond
        addMessage('assistant', ai.response);
        return;
      }

      // Non-action response
      addMessage('assistant', ai?.response || 'No response returned.');
    } catch (error) {
      console.error('Admin AI Error:', error);
      addMessage('assistant', `Error: ${error.message || 'Something went wrong.'}`);
      toast.error('Admin AI failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-stone-200 dark:border-stone-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Admin AI Assistant
            <Badge className="bg-red-50 text-red-600 border-red-200">Admin Only</Badge>
          </CardTitle>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Ask questions, propose admin actions (with confirmation), or request research.
          </p>

          {pendingAction && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50">
              <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5" />
              <div className="text-sm text-amber-900">
                <div className="font-medium">Pending confirmation</div>
                <div className="text-amber-800">
                  {pendingAction.action_type} → {pendingAction.target_id}
                  {pendingAction.duration_days ? ` (${pendingAction.duration_days} days)` : ''}
                </div>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Messages */}
          <div className="h-[500px] overflow-y-auto mb-4 space-y-4 p-4 bg-stone-50 dark:bg-stone-900 rounded-lg">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-600 dark:text-stone-400 mb-2">Try:</p>
                <p className="text-sm text-stone-500 dark:text-stone-500">
                  “How many pending profiles?”<br/>
                  “Suspend user john@example.com for 7 days for chargeback”<br/>
                  “Show recent open support tickets”
                </p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-blue-100 dark:bg-blue-900">
                      <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                      : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                  {msg.action && (
                    <Badge className="mt-2 bg-emerald-50 text-emerald-700 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Action: {msg.action}
                    </Badge>
                  )}
                </div>

                {msg.role === 'user' && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                      {user?.full_name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) handleSend();
              }}
              placeholder={pendingAction ? 'Type yes to confirm, or no to cancel…' : 'Ask me anything or give a command…'}
              disabled={isProcessing}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={isProcessing || !input.trim()} size="icon">
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>

          {actionHistory.length > 0 && (
            <div className="mt-4 flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
              <Undo2 className="w-4 h-4" />
              <span>Type <b>undo</b> to reverse the last action</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
