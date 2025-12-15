import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Activity } from 'lucide-react';
import { formatTimestamp } from '@/components/shared/formatTimestamp';

export default function OnlineUsers({ onClick }) {
  const { data: sessions = [] } = useQuery({
    queryKey: ['activeSessions'],
    queryFn: async () => {
      const allSessions = await base44.entities.UserSession.list('-login_timestamp');
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      return allSessions.filter(s => s.login_timestamp > twoMinutesAgo);
    },
    refetchInterval: 10000
  });

  const uniqueUsers = Array.from(new Set(sessions.map(s => s.user_id))).length;

  return (
    <Card 
      className="border-emerald-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-stone-500">Online Now</p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{uniqueUsers}</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OnlineUsersDialog({ open, onClose }) {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['activeSessions'],
    queryFn: async () => {
      const allSessions = await base44.entities.UserSession.list('-login_timestamp');
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      return allSessions.filter(s => s.login_timestamp > twoMinutesAgo);
    },
    refetchInterval: 5000,
    enabled: open
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['allProfiles'],
    queryFn: () => base44.entities.VendorProfile.list(),
    enabled: open
  });

  // Group sessions by user
  const userSessions = sessions.reduce((acc, session) => {
    if (!acc[session.user_id]) {
      acc[session.user_id] = {
        user_id: session.user_id,
        user_name: session.user_name,
        sessions: []
      };
    }
    acc[session.user_id].sessions.push(session);
    return acc;
  }, {});

  const onlineUsers = Object.values(userSessions).map(user => ({
    ...user,
    profile: profiles.find(p => p.user_id === user.user_id),
    lastActive: user.sessions.sort((a, b) => 
      new Date(b.login_timestamp).getTime() - new Date(a.login_timestamp).getTime()
    )[0].login_timestamp
  })).sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            Users Online Now ({onlineUsers.length})
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800 mx-auto"></div>
            </div>
          ) : onlineUsers.length === 0 ? (
            <div className="text-center py-8 text-stone-500">
              No users currently active
            </div>
          ) : (
            onlineUsers.map(user => (
              <Card key={user.user_id} className="border-stone-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      {user.profile?.selfie_url ? (
                        <img src={user.profile.selfie_url} alt={user.user_name} className="w-full h-full object-cover" />
                      ) : (
                        <AvatarFallback className="bg-emerald-100 text-emerald-700">
                          {user.user_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-stone-900">{user.user_name}</h3>
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                          <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full mr-1.5" />
                          Online
                        </Badge>
                      </div>
                      {user.profile?.business_name && (
                        <p className="text-sm text-stone-600 mb-1">{user.profile.business_name}</p>
                      )}
                      <p className="text-xs text-stone-500">
                        Last active: {formatTimestamp(user.lastActive)}
                      </p>
                      {user.sessions.length > 1 && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {user.sessions.length} active sessions
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}