import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Clock, CheckCircle2, User } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSupport() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: supportChats = [] } = useQuery({
    queryKey: ['supportChats'],
    queryFn: () => base44.entities.SupportChat.list('-last_message_at'),
    enabled: !!user && user.role === 'admin'
  });

  const { data: admins = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter(u => u.role === 'admin');
    },
    enabled: !!user && user.role === 'admin'
  });

  const assignMutation = useMutation({
    mutationFn: async ({ chatId, adminId }) => {
      const admin = admins.find(a => a.email === adminId);
      await base44.entities.SupportChat.update(chatId, {
        assigned_admin_id: adminId,
        assigned_admin_name: admin?.full_name || adminId,
        status: 'assigned'
      });

      // Notify admin
      await base44.entities.Notification.create({
        user_id: adminId,
        type: 'new_message',
        title: 'Support Chat Assigned',
        message: 'A support chat has been assigned to you',
        reference_id: chatId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['supportChats']);
      toast.success('Admin assigned');
    }
  });

  const closeChMutation = useMutation({
    mutationFn: async (chatId) => {
      await base44.entities.SupportChat.update(chatId, {
        status: 'closed'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['supportChats']);
      toast.success('Chat closed');
    }
  });

  const openChats = supportChats.filter(c => c.status === 'open');
  const assignedChats = supportChats.filter(c => c.status === 'assigned');
  const closedChats = supportChats.filter(c => c.status === 'closed');

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-stone-900">Access Denied</h2>
        <p className="text-stone-600 mt-2">Only admins can access this page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Support Chats</h1>
          <p className="text-stone-600 mt-1">Manage user support requests</p>
        </div>
        <Button asChild variant="outline">
          <Link to={createPageUrl('AdminMessageUser')}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Message User
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Open Requests</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{openChats.length}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Assigned</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{assignedChats.length}</p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Closed</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{closedChats.length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Open Chats */}
      {openChats.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-3">Open Requests</h2>
          <div className="space-y-3">
            {openChats.map(chat => (
              <Card key={chat.id} className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-amber-100 text-amber-700">
                        {chat.user_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-stone-900">{chat.user_name}</p>
                      {chat.last_message && (
                        <p className="text-sm text-stone-600 truncate mt-0.5">{chat.last_message}</p>
                      )}
                      <p className="text-xs text-stone-500 mt-1">
                        {chat.last_message_at && format(new Date(chat.last_message_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select onValueChange={(adminId) => assignMutation.mutate({ chatId: chat.id, adminId })}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Assign to..." />
                        </SelectTrigger>
                        <SelectContent>
                          {admins.map(admin => (
                            <SelectItem key={admin.email} value={admin.email}>
                              {admin.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button asChild variant="outline" size="sm">
                        <Link to={createPageUrl(`SupportChatView?id=${chat.id}`)}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Chats */}
      {assignedChats.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-3">Assigned Chats</h2>
          <div className="space-y-3">
            {assignedChats.map(chat => (
              <Card key={chat.id} className="border-stone-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-stone-100 text-stone-600">
                        {chat.user_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-stone-900">{chat.user_name}</p>
                        <Badge variant="outline" className="text-xs">
                          Assigned to: {chat.assigned_admin_name}
                        </Badge>
                        {chat.unread_admin && (
                          <Badge className="bg-red-500 text-white text-xs">New</Badge>
                        )}
                      </div>
                      {chat.last_message && (
                        <p className="text-sm text-stone-600 truncate mt-0.5">{chat.last_message}</p>
                      )}
                      <p className="text-xs text-stone-500 mt-1">
                        {chat.last_message_at && format(new Date(chat.last_message_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to={createPageUrl(`SupportChatView?id=${chat.id}`)}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          View
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => closeChMutation.mutate(chat.id)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Closed Chats */}
      {closedChats.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-3">Closed Chats</h2>
          <div className="space-y-3">
            {closedChats.slice(0, 5).map(chat => (
              <Card key={chat.id} className="border-stone-200 opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-stone-100 text-stone-600">
                        {chat.user_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-stone-900">{chat.user_name}</p>
                      <p className="text-xs text-stone-500">
                        Closed • {chat.last_message_at && format(new Date(chat.last_message_at), 'MMM d')}
                      </p>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link to={createPageUrl(`SupportChatView?id=${chat.id}`)}>
                        View
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}