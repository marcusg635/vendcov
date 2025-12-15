import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { format } from '@/components/shared/dateUtils';
import { toast } from 'sonner';

export default function Invitations() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: invitations = [] } = useQuery({
    queryKey: ['invitations'],
    queryFn: () => base44.entities.Invitation.list('-created_date'),
    enabled: !!user && user.role === 'admin'
  });

  const deleteMutation = useMutation({
    mutationFn: async (invitationId) => {
      await base44.entities.Invitation.delete(invitationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['invitations']);
      toast.success('Invitation deleted');
    },
    onError: () => {
      toast.error('Failed to delete invitation');
    }
  });

  const sentInvites = invitations.filter(i => i.status === 'sent');
  const registeredInvites = invitations.filter(i => i.status === 'registered');

  // Group by admin
  const invitesByAdmin = invitations.reduce((acc, inv) => {
    const admin = inv.invited_by_name || inv.invited_by;
    if (!acc[admin]) acc[admin] = [];
    acc[admin].push(inv);
    return acc;
  }, {});

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-stone-900">Access Denied</h2>
        <p className="text-stone-600 mt-2">Only admins can access this page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Invitations</h1>
        <p className="text-stone-600 mt-1">Track all user invitations sent by admins</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Total Sent</p>
                <p className="text-2xl font-bold text-stone-900 mt-1">{invitations.length}</p>
              </div>
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Pending</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{sentInvites.length}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Registered</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{registeredInvites.length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By Admin */}
      <Card>
        <CardHeader>
          <CardTitle>Invitations by Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(invitesByAdmin).map(([admin, invites]) => (
              <div key={admin} className="p-4 bg-stone-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-stone-900">{admin}</h3>
                  <Badge variant="outline">{invites.length} invites</Badge>
                </div>
                <div className="space-y-2">
                  {invites.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between text-sm">
                      <span className="text-stone-600">{inv.email}</span>
                      <div className="flex items-center gap-2">
                        <Badge className={inv.status === 'registered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
                          {inv.status}
                        </Badge>
                        <span className="text-xs text-stone-400">
                          {format(new Date(inv.created_date), 'MMM d, yyyy')}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Delete invitation for ${inv.email}?`)) {
                              deleteMutation.mutate(inv.id);
                            }
                          }}
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Invitations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invitations.slice(0, 20).map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-stone-900">{inv.email}</p>
                  <p className="text-xs text-stone-500">Invited by {inv.invited_by_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={inv.status === 'registered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
                    {inv.status}
                  </Badge>
                  <span className="text-xs text-stone-400">
                    {format(new Date(inv.created_date), 'MMM d, h:mm a')}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm(`Delete invitation for ${inv.email}?`)) {
                        deleteMutation.mutate(inv.id);
                      }
                    }}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}