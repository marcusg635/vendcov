import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Sparkles, Undo2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAIModal({ open, onClose, currentPage, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionHistory, setActionHistory] = useState([]);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role, content, action = null) => {
    setMessages(prev => [...prev, { role, content, action, timestamp: new Date() }]);
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);
    setIsProcessing(true);

    try {
      // Check for undo command
      if (userMessage.toLowerCase().includes('undo')) {
        if (actionHistory.length === 0) {
          addMessage('assistant', "There's nothing to undo. I haven't performed any actions yet.");
          setIsProcessing(false);
          return;
        }

        const lastAction = actionHistory[actionHistory.length - 1];
        await performUndo(lastAction);
        setActionHistory(prev => prev.slice(0, -1));
        setIsProcessing(false);
        return;
      }

      // Build conversation history
      const conversationHistory = messages
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      // Fetch ALL data for admin
      const [users, profiles, jobs, applications, chats, tickets, reports, reviews, agreements] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.VendorProfile.list(),
        base44.entities.HelpRequest.list(),
        base44.entities.JobApplication.list(),
        base44.entities.SupportChat.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.UserReport.list(),
        base44.entities.Review.list(),
        base44.entities.SubcontractAgreement.list()
      ]);

      const contextData = {
        current_page: currentPage,
        total_users: users.length,
        total_profiles: profiles.length,
        pending_profiles: profiles.filter(p => p.approval_status === 'pending').length,
        approved_profiles: profiles.filter(p => p.approval_status === 'approved').length,
        rejected_profiles: profiles.filter(p => p.approval_status === 'rejected').length,
        suspended_users: profiles.filter(p => p.suspended).length,
        total_jobs: jobs.length,
        open_jobs: jobs.filter(j => j.status === 'open').length,
        filled_jobs: jobs.filter(j => j.status === 'filled').length,
        completed_jobs: jobs.filter(j => j.status === 'completed').length,
        total_applications: applications.length,
        pending_applications: applications.filter(a => a.status === 'pending').length,
        open_chats: chats.filter(c => c.status === 'open').length,
        open_tickets: tickets.filter(t => t.status === 'open').length,
        open_reports: reports.filter(r => r.status === 'open').length,
        total_reviews: reviews.length,
        users: users,
        profiles: profiles,
        jobs: jobs,
        applications: applications
      };

      // Check for research requests
      if (userMessage.toLowerCase().includes('research') || userMessage.toLowerCase().includes('look up')) {
        const researchMatch = userMessage.match(/research|look up\s+(.+)/i);
        if (researchMatch) {
          addMessage('assistant', `Researching ${researchMatch[1]} online...`);
          
          const researchResult = await base44.integrations.Core.InvokeLLM({
            prompt: `Research "${researchMatch[1]}" online and provide insights about their legitimacy as a vendor/service provider. Look for their business presence, social media, reviews, and professional credibility.`,
            add_context_from_internet: true
          });

          addMessage('assistant', researchResult);
          setIsProcessing(false);
          return;
        }
      }

      // Process with AI
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the VendorCover Admin AI Assistant.

The admin is currently viewing: ${currentPage}

Conversation:
${conversationHistory}
User: ${userMessage}

Platform Data Summary:
${JSON.stringify(contextData, null, 2)}

Provide a helpful, conversational response. If they're asking about something on the current page, use that context. For actions, be clear and ask for confirmation if needed.

If this is an action request, identify:
- action_type: "suspend", "approve", "deny", etc.
- target_id: user email or entity ID
- target_name: user name
- Other relevant details`,
        response_json_schema: {
          type: "object",
          properties: {
            response: { type: "string" },
            is_action: { type: "boolean" },
            action_type: { type: "string" },
            target_id: { type: "string" },
            target_name: { type: "string" },
            duration_days: { type: "number" },
            reason: { type: "string" },
            needs_confirmation: { type: "boolean" }
          }
        }
      });

      // Handle action requests
      if (result.is_action && result.action_type && result.target_id) {
        if (result.needs_confirmation) {
          addMessage('assistant', `${result.response}\n\nReply "yes" or "confirm" to proceed.`);
          setIsProcessing(false);
          return;
        }

        await performAction(result);
        addMessage('assistant', result.response, result.action_type);
        setActionHistory(prev => [...prev, result]);
        setIsProcessing(false);
        return;
      }

      addMessage('assistant', result.response);
    } catch (error) {
      console.error('AI Error:', error);
      addMessage('assistant', `Sorry, I encountered an error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const performAction = async (action) => {
    try {
      switch (action.action_type) {
        case 'suspend':
          const profile = (await base44.entities.VendorProfile.filter({ user_id: action.target_id }))[0];
          if (profile) {
            await base44.entities.VendorProfile.update(profile.id, {
              suspended: true,
              suspension_type: 'temporary',
              suspension_duration_days: action.duration_days || 7,
              suspension_start_date: new Date().toISOString(),
              suspension_reason: action.reason || 'Admin AI action'
            });
            queryClient.invalidateQueries(['vendorProfile']);
            toast.success(`Suspended ${action.target_name}`);
          }
          break;

        case 'approve':
          const profileToApprove = (await base44.entities.VendorProfile.filter({ user_id: action.target_id }))[0];
          if (profileToApprove) {
            await base44.entities.VendorProfile.update(profileToApprove.id, {
              approval_status: 'approved',
              approved_by_id: user.email,
              approved_by_name: user.full_name,
              approved_at: new Date().toISOString()
            });
            queryClient.invalidateQueries(['vendorProfile']);
            toast.success(`Approved ${action.target_name}`);
          }
          break;

        case 'deny':
          const profileToDeny = (await base44.entities.VendorProfile.filter({ user_id: action.target_id }))[0];
          if (profileToDeny) {
            await base44.entities.VendorProfile.update(profileToDeny.id, {
              approval_status: 'rejected',
              rejection_reason: action.reason || 'Does not meet requirements',
              rejected_by_id: user.email,
              rejected_by_name: user.full_name,
              rejected_at: new Date().toISOString()
            });
            queryClient.invalidateQueries(['vendorProfile']);
            toast.success(`Denied ${action.target_name}`);
          }
          break;
      }
    } catch (error) {
      console.error('Action error:', error);
      toast.error('Failed to perform action');
    }
  };

  const performUndo = async (lastAction) => {
    try {
      addMessage('assistant', `Undoing: ${lastAction.action_type} for ${lastAction.target_name}...`);

      switch (lastAction.action_type) {
        case 'suspend':
          const profile = (await base44.entities.VendorProfile.filter({ user_id: lastAction.target_id }))[0];
          if (profile) {
            await base44.entities.VendorProfile.update(profile.id, {
              suspended: false,
              suspension_type: null,
              suspension_reason: null
            });
            queryClient.invalidateQueries(['vendorProfile']);
          }
          break;

        case 'approve':
          const profileToUnapprove = (await base44.entities.VendorProfile.filter({ user_id: lastAction.target_id }))[0];
          if (profileToUnapprove) {
            await base44.entities.VendorProfile.update(profileToUnapprove.id, {
              approval_status: 'pending',
              approved_by_id: null,
              approved_by_name: null,
              approved_at: null
            });
            queryClient.invalidateQueries(['vendorProfile']);
          }
          break;

        case 'deny':
          const profileToUndeny = (await base44.entities.VendorProfile.filter({ user_id: lastAction.target_id }))[0];
          if (profileToUndeny) {
            await base44.entities.VendorProfile.update(profileToUndeny.id, {
              approval_status: 'pending',
              rejection_reason: null,
              rejected_by_id: null,
              rejected_by_name: null,
              rejected_at: null
            });
            queryClient.invalidateQueries(['vendorProfile']);
          }
          break;
      }

      addMessage('assistant', `Successfully undid ${lastAction.action_type}.`);
      toast.success('Action undone');
    } catch (error) {
      console.error('Undo error:', error);
      addMessage('assistant', `Failed to undo: ${error.message}`);
      toast.error('Failed to undo action');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Admin AI Assistant
            <Badge className="bg-red-50 text-red-600 border-red-200 text-xs">Admin</Badge>
          </DialogTitle>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Viewing: {currentPage} • Ask questions, perform actions, or research users
          </p>
        </DialogHeader>

        {/* Messages */}
        <div className="h-[400px] overflow-y-auto space-y-3 p-4 bg-stone-50 dark:bg-stone-900 rounded-lg">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p className="text-sm text-stone-500 dark:text-stone-400">
                How can I help you today?
              </p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user' 
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900' 
                  : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.action && (
                  <Badge className="mt-1.5 bg-emerald-50 text-emerald-700 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {msg.action}
                  </Badge>
                )}
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex gap-2 justify-start">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
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
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            disabled={isProcessing}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isProcessing || !input.trim()} size="icon">
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {actionHistory.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            <Undo2 className="w-3.5 h-3.5" />
            Type "undo" to reverse the last action
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}