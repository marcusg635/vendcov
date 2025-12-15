import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatMessageTime } from '@/components/shared/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Calendar, MapPin } from 'lucide-react';
import { format } from '@/components/shared/dateUtils';

export default function Chat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('jobId');

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const jobs = await base44.entities.HelpRequest.filter({ id: jobId });
      return jobs[0] || null;
    },
    enabled: !!jobId
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chatMessages', jobId],
    queryFn: () => base44.entities.ChatMessage.filter({ help_request_id: jobId }, 'created_date'),
    enabled: !!jobId,
    refetchInterval: 5000
  });

  // Mark messages as read
  useEffect(() => {
    const markAsRead = async () => {
      if (!user || !messages.length) return;
      const unread = messages.filter(m => m.recipient_id === user.email && !m.read);
      for (const msg of unread) {
        await base44.entities.ChatMessage.update(msg.id, { read: true });
      }
    };
    markAsRead();
  }, [messages, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const otherPartyId = user?.email === job?.requester_id 
    ? job?.accepted_vendor_id 
    : job?.requester_id;

  const otherPartyName = user?.email === job?.requester_id 
    ? job?.accepted_vendor_name 
    : (job?.requester_business || job?.requester_name);

  const sendMutation = useMutation({
    mutationFn: async (content) => {
      const message = await base44.entities.ChatMessage.create({
        help_request_id: jobId,
        sender_id: user.email,
        sender_name: user.full_name,
        recipient_id: otherPartyId,
        content: content
      });

      // Create notification
      await base44.entities.Notification.create({
        user_id: otherPartyId,
        type: 'new_message',
        title: 'New Message',
        message: `${user.full_name} sent you a message`,
        reference_id: jobId
      });

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chatMessages', jobId]);
      setNewMessage('');
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMutation.mutate(newMessage);
    setNewMessage('');
  };

  if (!job) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-4 pb-3 sm:pb-4 border-b border-stone-200">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm sm:text-base text-stone-900 truncate">{otherPartyName}</h1>
          <p className="text-xs sm:text-sm text-stone-500 truncate">{job.title}</p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link to={createPageUrl(`JobDetails?id=${jobId}`)}>
            <span className="hidden sm:inline">View Job</span>
            <span className="sm:hidden">View</span>
          </Link>
        </Button>
      </div>

      {/* Job Info Banner */}
      <div className="py-2 sm:py-3 px-3 sm:px-4 bg-stone-50 border-b border-stone-200 flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-stone-600">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-400 shrink-0" />
          <span className="break-words">{format(new Date(job.event_date), 'MMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-400 shrink-0" />
          <span className="break-words">{job.city}, {job.state}</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isMe = message.sender_id === user?.email;
              return (
                <div
                  key={message.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[80%] ${isMe ? 'flex-row-reverse' : ''}`}>
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                      <AvatarFallback className={isMe ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}>
                        {message.sender_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div
                        className={`rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 ${
                          isMe
                            ? 'bg-stone-900 text-white'
                            : 'bg-stone-100 text-stone-900'
                        }`}
                      >
                        <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                      <p className={`text-xs text-stone-400 mt-1 ${isMe ? 'text-right' : ''}`}>
                        {formatMessageTime(message.created_date)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-stone-200 bg-white">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || sendMutation.isLoading}
            className="bg-stone-900 hover:bg-stone-800"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}