import React, { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Sparkles, Trash2 } from 'lucide-react';

function safeISO(d) {
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toISOString();
  } catch {
    return null;
  }
}

function summarizeJob(job) {
  if (!job) return null;
  return {
    id: job.id,
    title: job.title,
    service_type: job.service_type,
    event_type: job.event_type,
    status: job.status,
    city: job.city,
    state: job.state,
    event_date: safeISO(job.event_date),
    pay_amount: job.pay_amount,
    created_date: safeISO(job.created_date),
  };
}

function summarizeApplication(app) {
  if (!app) return null;
  return {
    id: app.id,
    help_request_id: app.help_request_id,
    status: app.status,
    created_date: safeISO(app.created_date),
    message_preview: app.message ? String(app.message).slice(0, 250) : null,
  };
}

export default function UserAIModal({ open, onClose, currentPage, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing, open]);

  const addMessage = (role, content, meta = {}) => {
    setMessages(prev => [...prev, { role, content, timestamp: new Date(), ...meta }]);
  };

  const clearHistory = () => {
    setMessages([]);
    setInput('');
  };

  const conversationHistory = useMemo(() => {
    // Keep last 10 messages for context, not the entire chat
    return messages
      .slice(-10)
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');
  }, [messages]);

  const fetchUserContext = async () => {
    if (!user?.email) return null;

    const [profileArr, myJobs, myApps] = await Promise.all([
      base44.entities.VendorProfile.filter({ user_id: user.email }),
      base44.entities.HelpRequest.filter({ requester_id: user.email }, '-created_date'),
      base44.entities.JobApplication.filter({ applicant_id: user.email }, '-created_date'),
    ]);

    const profile = profileArr?.[0] || null;

    return {
      current_page: currentPage || 'Unknown',
      profile: profile
        ? {
            approval_status: profile.approval_status,
            full_name: profile.full_name,
            business_name: profile.business_name,
            service_types: profile.service_types || [],
            city: profile.city,
            state: profile.state,
            suspended: !!profile.suspended,
          }
        : { approval_status: 'not_created' },
      counts: {
        jobs_posted: myJobs?.length || 0,
        applications_submitted: myApps?.length || 0,
        pending_applications: (myApps || []).filter(a => a.status === 'pending').length,
      },
      recent: {
        jobs: (myJobs || []).slice(0, 5).map(summarizeJob).filter(Boolean),
        applications: (myApps || []).slice(0, 5).map(summarizeApplication).filter(Boolean),
      },
    };
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing || !user?.email) return;

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);
    setIsProcessing(true);

    try {
      const ctx = await fetchUserContext();

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `
You are the VendorCover User Assistant.

Primary goals:
- Help the user use the app (posting jobs, applying, profile approval, subscriptions, chats, payments).
- Be practical and direct. If you must ask a question, ask only ONE short question.

Strict privacy rules:
- Use ONLY the provided context data.
- Never mention other users, admin notes, internal moderation, or platform-wide stats.
- If asked for info you don't have, explain what the user should check in the app.

The user is currently viewing: ${currentPage || 'Unknown'}

Conversation (latest):
${conversationHistory}

User message:
${userMessage}

User context JSON (ONLY their own data):
${JSON.stringify(ctx, null, 2)}

Return JSON:
{
  "response": "string",
  "suggested_actions": ["string", ...] // optional short UI steps
}
        `,
        response_json_schema: {
          type: "object",
          properties: {
            response: { type: "string" },
            suggested_actions: { type: "array", items: { type: "string" } }
          },
          required: ["response"]
        }
      });

      const assistantText =
        typeof result === 'string'
          ? result
          : (result?.response || 'I didn’t get a usable response. Try asking again.');

      addMessage('assistant', assistantText, {
        suggested_actions: Array.isArray(result?.suggested_actions) ? result.suggested_actions : []
      });
    } catch (error) {
      console.error('AI Error:', error);
      addMessage('assistant', `Sorry — something failed. Try rephrasing your question, or use “Report a Problem” if it keeps happening.`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                VendorCover Assistant
                <Badge variant="outline" className="ml-2 text-xs">
                  {currentPage || 'Unknown'}
                </Badge>
              </DialogTitle>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Ask me how to use the app, why something isn’t working, or what to do next.
              </p>
            </div>

            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-stone-500 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Messages */}
        <div className="h-[400px] overflow-y-auto space-y-3 p-4 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">
                What are you trying to do on this page?
              </p>
              <div className="space-y-1.5 text-xs text-stone-400">
                <p>• “Why can’t I post a job?”</p>
                <p>• “What does pending approval mean for me?”</p>
                <p>• “Help me write a better job description”</p>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                    : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {msg.role === 'assistant' &&
                  Array.isArray(msg.suggested_actions) &&
                  msg.suggested_actions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.suggested_actions.slice(0, 5).map((a, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex gap-2 justify-start">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2">
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
            placeholder="Ask me anything about using VendorCover..."
            disabled={isProcessing}
            className="flex-1 bg-white dark:bg-stone-800"
          />
          <Button
            onClick={handleSend}
            disabled={isProcessing || !input.trim()}
            size="icon"
            className="bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
