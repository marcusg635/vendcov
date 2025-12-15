import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatMessageTime } from '@/components/shared/dateUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send } from 'lucide-react';

export default function DirectMessageChat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('userId');

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: recipient } = useQuery({
    queryKey: ['recipientProfile', userId],
    queryFn: async () => {
      const profiles = await base44.entities.VendorProfile.filter({ user_id: userId });
      return profiles[0] || null;
    },
    enabled: !!userId
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['directMessages', user?.email, userId],
    queryFn: async () => {
      const sent = await base44.entities.DirectMessage.filter({ sender_id: user.email, recipient_id: userId });
      const received = await base44.entities.DirectMessage.filter({ sender_id: userId, recipient_id: user.email });
      return [...sent, ...received].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    },
    enabled: !!user?.email && !!userId,
    refetchInterval: 5000
  });

  // Mark as read
  useEffect(() => {
    const markRead = async () => {
      if (!user || !messages.length) return;
      const unread = messages.filter(m => m.recipient_id === user.email && !m.read);
      for (const msg of unread) {
        await base44.entities.DirectMessage.update(msg.id, { read: true });
      }
    };
    markRead();
  }, [messages, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (content) => {
      const message = await base44.entities.DirectMessage.create({
        sender_id: user.email,
        sender_name: user.full_name,
        recipient_id: userId,
        recipient_name: recipient?.full_name || userId,
        content: content
      });

      await base44.entities.Notification.create({
        user_id: userId,
        type: 'new_message',
        title: 'New Message',
        message: `${user.full_name} sent you a message`,
        reference_id: null
      });

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['directMessages']);
      setNewMessage('');
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMutation.mutate(newMessage);
  };

  if (!recipient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-stone-200">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-stone-100 text-stone-600">
            {recipient.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="font-semibold text-stone-900">{recipient.full_name}</h1>
          {recipient.business_name && (
            <p className="text-xs text-stone-500">{recipient.business_name}</p>
          )}
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
                <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : ''}`}>
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className={isMe ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}>
                        {message.sender_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div
                        className={`rounded-2xl px-4 py-2.5 ${
                          isMe ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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