import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatMessageTime } from '@/components/shared/dateUtils';
import { getAdminDisplayName } from '@/components/utils/adminUtils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Clock, CheckCircle2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SupportChatView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const chatId = urlParams.get('id');

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: chat } = useQuery({
    queryKey: ['supportChat', chatId],
    queryFn: async () => {
      const chats = await base44.entities.SupportChat.filter({ id: chatId });
      return chats[0] || null;
    },
    enabled: !!chatId
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['supportMessages', chatId],
    queryFn: () => base44.entities.SupportMessage.filter({ chat_id: chatId }, 'created_date'),
    enabled: !!chatId,
    refetchInterval: 3000
  });

  const isAdmin = user?.role === 'admin';

  // Mark as read
  useEffect(() => {
    const markRead = async () => {
      if (!chat || !user) return;
      if (isAdmin && chat.unread_admin) {
        await base44.entities.SupportChat.update(chat.id, { unread_admin: false });
      } else if (!isAdmin && chat.unread_user) {
        await base44.entities.SupportChat.update(chat.id, { unread_user: false });
      }
    };
    markRead();
  }, [chat, user, isAdmin]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (content) => {
      const message = await base44.entities.SupportMessage.create({
        chat_id: chatId,
        sender_id: user.email,
        sender_name: user.full_name,
        content: content,
        is_admin: isAdmin
      });

      await base44.entities.SupportChat.update(chatId, {
        last_message: content,
        last_message_at: new Date().toISOString(),
        unread_admin: !isAdmin,
        unread_user: isAdmin
      });

      // Notify recipient
      if (isAdmin) {
        // Admin replying to user
        await base44.entities.Notification.create({
          user_id: chat.user_id,
          type: 'new_message',
          title: 'Support Reply',
          message: `${getAdminDisplayName(user)} replied to your support request`,
          reference_id: chatId
        });
      } else if (chat.assigned_admin_id) {
        // User replying to assigned admin
        await base44.entities.Notification.create({
          user_id: chat.assigned_admin_id,
          type: 'new_message',
          title: 'Support Message',
          message: `${getAdminDisplayName(user)} sent you a message`,
          reference_id: chatId
        });
      }

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['supportMessages']);
      queryClient.invalidateQueries(['supportChat']);
      setNewMessage('');
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMutation.mutate(newMessage);
  };

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus) => {
      await base44.entities.SupportChat.update(chatId, { status: newStatus });
      
      // Check if user has denied appeal and is suspended - mark as permanently disabled
      if (newStatus === 'closed') {
        const profiles = await base44.entities.VendorProfile.filter({ user_id: chat.user_id });
        const profile = profiles[0];
        if (profile?.appeal_status === 'denied' && profile?.suspended) {
          await base44.entities.VendorProfile.update(profile.id, {
            permanently_disabled: true
          });
        }
      }
      
      // Log admin action
      await base44.entities.AdminAction.create({
        admin_id: user.email,
        admin_name: getAdminDisplayName(user),
        action_type: newStatus === 'closed' ? 'support_chat_closed' : 'support_chat_assigned',
        target_id: chatId,
        target_name: chat.user_name,
        details: { status: newStatus }
      });

      // If closing chat, add system message
      if (newStatus === 'closed') {
        await base44.entities.SupportMessage.create({
          chat_id: chatId,
          sender_id: 'system',
          sender_name: 'VendorCover Support',
          content: '✅ This support chat has been marked as complete. Thank you for reaching out! If you need further assistance, please start a new support chat from your profile menu.',
          is_admin: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['supportChat']);
      queryClient.invalidateQueries(['supportChats']);
      queryClient.invalidateQueries(['supportMessages']);
    }
  });

  if (!chat) {
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
            {(isAdmin ? chat.user_name : 'Support')?.charAt(0) || 'S'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="font-semibold text-stone-900">
            {isAdmin ? chat.user_name : 'VendorCover Support'}
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {chat.status}
            </Badge>
            {chat.assigned_admin_name && (
              <Badge variant="outline" className="text-xs">
                Assigned to: {chat.assigned_admin_name}
              </Badge>
            )}
          </div>
        </div>
        {isAdmin && chat.status !== 'closed' && (
          <Select value={chat.status} onValueChange={(value) => updateStatusMutation.mutate(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Open
                </div>
              </SelectItem>
              <SelectItem value="assigned">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  In Progress
                </div>
              </SelectItem>
              <SelectItem value="closed">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Complete
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
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
                      <AvatarFallback className={isMe ? 'bg-stone-900 text-white' : 'bg-blue-100 text-blue-700'}>
                        {message.sender_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div
                        className={`rounded-2xl px-4 py-2.5 ${
                          isMe ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-900'
                        }`}
                      >
                        {message.is_admin && !isMe && (
                          <p className="text-xs font-medium mb-1 opacity-70">{message.sender_name}</p>
                        )}
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
      {chat?.status === 'closed' ? (
        <div className="p-4 border-t border-stone-200 bg-white text-center">
          <p className="text-stone-500 text-sm">This chat has been closed</p>
        </div>
      ) : (
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
      )}
    </div>
  );
}