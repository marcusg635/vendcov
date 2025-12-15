import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Send, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function SupportChatUser() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const isPrivileged = user?.role === 'admin' || user?.role === 'owner';
  const hasActiveSubscription =
    isPrivileged ||
    user?.subscription_status === 'active' ||
    user?.subscription_status === 'trialing' ||
    user?.subscription_granted_by_admin ||
    user?.stripe_subscription_id;

  // Get active chat
  const { data: chat } = useQuery({
    queryKey: ['mySupportChat', user?.email],
    queryFn: async () => {
      const chats = await base44.entities.SupportChat.filter({ user_id: user.email });
      const sortedChats = chats.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      const activeChat = sortedChats.find(c => c.status !== 'closed');
      return activeChat || null;
    },
    enabled: !!user?.email && hasActiveSubscription
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['mySupportMessages', chat?.id],
    queryFn: () => base44.entities.SupportMessage.filter({ chat_id: chat.id }, 'created_date'),
    enabled: !!chat?.id && hasActiveSubscription,
    refetchInterval: 3000
  });

  useEffect(() => {
    const markRead = async () => {
      if (!chat || !user || !chat.unread_user) return;
      await base44.entities.SupportChat.update(chat.id, { unread_user: false });
    };
    markRead();
  }, [chat, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (content) => {
      let chatId = chat?.id;
      
      if (!chatId) {
        const newChat = await base44.entities.SupportChat.create({
          user_id: user.email,
          user_name: user.full_name,
          status: 'open',
          last_message: content,
          last_message_at: new Date().toISOString(),
          unread_admin: true
        });
        chatId = newChat.id;

        const admins = await base44.entities.User.list();
        const adminUsers = admins.filter(u => u.role === 'admin');
        for (const admin of adminUsers) {
          await base44.entities.Notification.create({
            user_id: admin.email,
            type: 'new_message',
            title: 'New Support Request',
            message: `${user.full_name} started a support chat`,
            reference_id: newChat.id
          });
        }
      }

      const message = await base44.entities.SupportMessage.create({
        chat_id: chatId,
        sender_id: user.email,
        sender_name: user.full_name,
        content: content,
        is_admin: false
      });

      await base44.entities.SupportChat.update(chatId, {
        last_message: content,
        last_message_at: new Date().toISOString(),
        unread_admin: true,
        unread_user: false
      });

      if (chat?.assigned_admin_id) {
        await base44.entities.Notification.create({
          user_id: chat.assigned_admin_id,
          type: 'new_message',
          title: 'Support Message',
          message: `${user.full_name} sent you a message`,
          reference_id: chatId
        });
      }

      return message;
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries(['mySupportMessages']);
      queryClient.invalidateQueries(['mySupportChat']);
    },
    onError: () => {
      toast.error('Failed to send message');
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || !user?.email) return;

    setNewMessage('');
    sendMutation.mutate(content);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">
              Upgrade to Pro for Live Chat
            </h2>
            <p className="text-stone-600 mb-6">
              Live chat support with our admin team is available exclusively to Pro subscribers. Get instant help and priority support!
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 justify-center text-sm text-stone-700">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Real-time chat with admin team
              </div>
              <div className="flex items-center gap-2 justify-center text-sm text-stone-700">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Priority customer support
              </div>
              <div className="flex items-center gap-2 justify-center text-sm text-stone-700">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Faster response times
              </div>
            </div>
            <Button asChild size="lg" className="bg-stone-900 hover:bg-stone-800 mb-4">
              <Link to={createPageUrl('Pricing')}>
                Upgrade to Pro - $9.99/month
              </Link>
            </Button>
            <div className="pt-4 border-t border-amber-200">
              <p className="text-sm text-stone-600 mb-2">
                Need help but not ready to upgrade?
              </p>
              <Button asChild variant="outline">
                <Link to={createPageUrl('ReportProblem')}>
                  Submit a Support Ticket (Free)
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
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
          <AvatarFallback className="bg-blue-100 text-blue-700">
            VC
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="font-semibold text-stone-900">VendorCover Support</h1>
          <p className="text-xs text-stone-500">
            {chat?.assigned_admin_name 
              ? `Chat with ${chat.assigned_admin_name}` 
              : 'An admin will respond soon'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              <p className="mb-2">👋 Welcome to VendorCover Support!</p>
              <p className="text-sm">An admin will respond to your message shortly.</p>
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
                          <p className="text-xs font-medium mb-1 text-blue-700">{message.sender_name} (Admin)</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <p className={`text-xs text-stone-400 mt-1 ${isMe ? 'text-right' : ''}`}>
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
        {chat?.status === 'closed' ? (
          <div className="text-center py-2">
            <p className="text-sm text-stone-500">This chat has been closed. Refresh to start a new support request.</p>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message to support..."
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
        )}
      </form>
    </div>
  );
}