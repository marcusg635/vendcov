import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Shield } from 'lucide-react';

export default function AdminChat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const dedupedMessages = useMemo(() => {
    const seen = new Set();
    return messages.filter((m) => {
      const key = `${m.sender_id}-${m.content}-${m.created_date}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [messages]);

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
      if (u.role !== 'admin') {
        navigate('/');
      }
    };
    loadUser();
  }, [navigate]);

  const { data: messages = [] } = useQuery({
    queryKey: ['adminMessages'],
    queryFn: async () => {
      const allMessages = await base44.entities.DirectMessage.list('-created_date');
      // Filter for messages where both sender and recipient are admins
      const allUsers = await base44.entities.User.list();
      const adminEmails = allUsers.filter(u => u.role === 'admin').map(u => u.email);
      return allMessages
        .filter(m => adminEmails.includes(m.sender_id) && adminEmails.includes(m.recipient_id))
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    },
    enabled: !!user,
    refetchInterval: 3000
  });

  // Mark messages as read
  useEffect(() => {
    const markAsRead = async () => {
      if (!user || !messages.length) return;
      const unread = messages.filter(m => m.recipient_id === user.email && !m.read);
      for (const msg of unread) {
        await base44.entities.DirectMessage.update(msg.id, { read: true });
      }
    };
    markAsRead();
  }, [messages, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (content) => {
      // Get all admin users
      const allUsers = await base44.entities.User.list();
      const adminUsers = allUsers.filter(u => u.role === 'admin' && u.email !== user.email);
      
      // Send message to all other admins
      for (const admin of adminUsers) {
        await base44.entities.DirectMessage.create({
          sender_id: user.email,
          sender_name: user.full_name,
          recipient_id: admin.email,
          recipient_name: admin.full_name,
          content: content
        });

        await base44.entities.Notification.create({
          user_id: admin.email,
          type: 'new_message',
          title: 'Admin Chat Message',
          message: `${user.full_name} sent a message in admin chat`,
          reference_id: null
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminMessages']);
      setNewMessage('');
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.email) return;
    sendMutation.mutate(newMessage.trim());
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <Card className="border-blue-200 bg-blue-50 mb-4">
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="font-semibold text-blue-900">Admin Team Chat</h1>
            <p className="text-sm text-blue-700">Private chat for administrators</p>
          </div>
        </div>
      </Card>

      {/* Messages */}
      <Card className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {dedupedMessages.length === 0 ? (
              <div className="text-center py-12 text-stone-500">
                <Shield className="w-12 h-12 mx-auto mb-3 text-stone-300" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              dedupedMessages.map((message) => {
                const isMe = message.sender_id === user?.email;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : ''}`}>
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className={isMe ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-600'}>
                          {message.sender_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        {!isMe && (
                          <p className="text-xs text-stone-500 mb-1 px-2">{message.sender_name}</p>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2.5 ${
                            isMe
                              ? 'bg-blue-600 text-white'
                              : 'bg-stone-100 text-stone-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <p className={`text-xs text-stone-400 mt-1 px-2 ${isMe ? 'text-right' : ''}`}>
                          {format(new Date(message.created_date), 'h:mm a')}
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
              placeholder="Message all admins..."
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!newMessage.trim() || sendMutation.isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}