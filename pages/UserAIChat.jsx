import React, { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Sparkles } from 'lucide-react';

function normalize(s) {
  return String(s || '').toLowerCase().trim();
}

function safeDate(d) {
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
    event_date: safeDate(job.event_date),
    pay_amount: job.pay_amount,
    created_date: safeDate(job.created_date)
  };
}

function summarizeApplication(app) {
  if (!app) return null;
  return {
    id: app.id,
    help_request_id: app.help_request_id,
    status: app.status,
    created_date: safeDate(app.created_date),
    message: app.message ? String(app.message).slice(0, 300) : null
  };
}

export default function UserAIChat() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const addMessage = (role, content, meta = {}) => {
    setMessages(prev => [...prev, { role, content, timestamp: new Date(), ...meta }]);
  };

  const conversationHistory = useMemo(() => {
    // keep last 10 messages to avoid bloating prompt
    const last = messages.slice(-10);
    return last
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');
  }, [messages]);

  const fetchUserContext = async (email) => {
    const [profile, myJobs, myApplications] = await Promise.all([
      base44.entities.VendorProfile.filter({ user_id: email }).then(p => p[0] || null),
      base44.entities.HelpRequest.filter({ requester_id: email }, '-created_date'),
      base44.entities.JobApplication.filter({ applicant_id: email }, '-created_date')
    ]);

    const profileSummary = profile
      ? {
          approval_status: profile.approval_status,
          full_name: profile.full_name,
          business_name: profile.business_name,
          service_types: profile.service_types || [],
          city: profile.city,
          state: profile.state,
          suspended: !!profile.suspended
        }
      : { approval_status: 'not_created' };

    const recentJobs = (myJobs || []).slice(0, 5).map(summarizeJob).filter(Boolean);
    const recentApps = (myApplications || []).slice(0, 5).map(summarizeApplication).filter(Boolean);

    return {
      profile: profileSummary,
      counts: {
        jobs_posted: (myJobs || []).length,
        applications_submitted: (myApplications || []).length,
        pending_applications: (myApplications || []).filter(a => a.status === 'pending').length
      },
      recent: {
        jobs: recentJobs,
        applications: recentApps
      }
    };
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing || !user?.email) return;

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);
    setIsProcessing(true);

    try {
      const ctx = await fetchUserContext(user.email);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `
You are the VendorCover User Assistant.

Goals:
- Help the user understand and use the app (posting jobs, applying, profile approval, payments, chats, subscriptions).
- Be direct and practical. Ask 1 short question only if absolutely needed.

Privacy rules (strict):
- You can ONLY use the data provided below (this user's own data).
- Never mention other users' information.
- If asked for admin-only info or anything about other people, refuse and suggest contacting support.

Conversation so far:
${conversationHistory}

User message:
${userMessage}

User context JSON (only their own):
${JSON.stringify(ctx, null, 2)}

Return JSON with:
- response: string (the message you will display)
- suggested_actions: array of strings (optional, like "Go to Profile > Edit", "Open My Jobs", etc.)
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
          : (result?.response || 'I didn’t get a usable response. Try again.');

      addMessage('assistant', assistantText, {
        suggested_actions: Array.isArray(result?.suggested_actions) ? result.suggested_actions : []
      });
    } catch (error) {
      console.error('AI Error:', error);
      addMessage(
        'assistant',
        `Sorry — something failed on my end. Try again, or use “Report a Problem” if this keeps happening.`
      );
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
            VendorCover Assistant
          </CardTitle>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Ask me how to use the app, get help posting/applying, or understand your profile status
          </p>
        </CardHeader>

        <CardContent>
          <div className="h-[500px] overflow-y-auto mb-4 space-y-4 p-4 bg-stone-50 dark:bg-stone-900 rounded-lg">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-600 dark:text-stone-400 mb-2">How can I help?</p>
                <div className="space-y-2 text-sm text-stone-500 dark:text-stone-500">
                  <p>• “Why can’t I post a job?”</p>
                  <p>• “What does pending approval mean for me?”</p>
                  <p>• “Help me write a good job post description”</p>
                  <p>• “Why is my application still pending?”</p>
                </div>
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

                  {msg.role === 'assistant' && Array.isArray(msg.suggested_actions) && msg.suggested_actions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.suggested_actions.slice(0, 4).map((a, i) => (
                        <Badge key={i} variant="outline" className="mr-2 mb-1 text-xs">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                      {user?.full_name?.charAt(0) || 'U'}
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

          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) handleSend();
              }}
              placeholder="Ask me anything about using VendorCover…"
              disabled={isProcessing}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={isProcessing || !input.trim()} size="icon">
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
