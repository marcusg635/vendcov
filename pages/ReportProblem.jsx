import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MessageSquare, Send, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';

export default function ReportProblem() {
  const queryClient = useQueryClient();

  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const reportedUserId = searchParams.get('userId');
  const reportedUserName = searchParams.get('userName');
  const intentType = searchParams.get('type');
  const isUserReport = intentType === 'user_report' || !!reportedUserId;

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState(() => ({
    type: isUserReport ? 'user_report' : 'bug',
    title: '',
    description: '',
    reported_user_id: reportedUserId || ''
  }));

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingUser(true);
      try {
        const u = await base44.auth.me();
        if (mounted) setUser(u || null);
      } catch (e) {
        console.error('Error loading user:', e);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoadingUser(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const statusConfig = useMemo(
    () => ({
      open: { icon: Clock, color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Open' },
      in_progress: { icon: Loader2, color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'In Progress' },
      resolved: { icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Resolved' },
      closed: { icon: CheckCircle2, color: 'bg-stone-100 text-stone-700', label: 'Closed' },
      denied: { icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200', label: 'Denied' }
    }),
    []
  );

  const typeLabels = useMemo(
    () => ({
      bug: 'Bug Report',
      suggestion: 'Suggestion',
      feature_request: 'Feature Request',
      other: 'Other',
      user_report: 'Report User'
    }),
    []
  );

  const { data: myTickets = [], isLoading: myTicketsLoading } = useQuery({
    queryKey: ['myTickets', user?.email],
    queryFn: async () => {
      const tickets = await base44.entities.SupportTicket.filter({ user_id: user.email });
      return (tickets || []).slice().sort((a, b) => {
        const ad = new Date(a.created_date || 0).getTime();
        const bd = new Date(b.created_date || 0).getTime();
        return bd - ad;
      });
    },
    enabled: !!user?.email
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      if (!user?.email) throw new Error('You must be signed in to submit a ticket.');

      // IMPORTANT: make sure these field names match your SupportTicket schema in Base44.
      const ticket = await base44.entities.SupportTicket.create({
        type: data.type,
        title: data.title,
        description: data.description,
        user_id: user.email,
        user_name: user.full_name,
        user_email: user.email,
        reported_user_id: data.reported_user_id || null,
        reported_user_name: reportedUserName || null,
        status: 'open',
        admin_id: null

      });

      // Optional: notify admins
      try {
        const admins = await base44.entities.User.filter({ role: 'admin' });
        for (const admin of admins || []) {
          await base44.entities.Notification.create({
            user_id: admin.email,
            type: 'new_message',
            title: 'New Support Ticket',
            message: `${user.full_name} submitted a ${data.type}: ${data.title}`,
            reference_id: ticket.id
          });
        }
      } catch (e) {
        console.warn('Admin notify failed (ticket still created):', e);
      }

      return ticket;
    },
    onSuccess: () => {
      toast.success('Ticket submitted successfully!');
      setFormData({ type: 'bug', title: '', description: '' });

      queryClient.invalidateQueries({ queryKey: ['myTickets', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['allTickets'] });
      queryClient.invalidateQueries({ queryKey: ['unassignedTasks'] });
    },
    onError: (e) => {
      console.error('Ticket submit failed:', e);
      toast.error(e?.message || 'Failed to submit ticket');
    },
    onSettled: () => {
      setSubmitting(false);
    }
  });

  const forceSubmit = async () => {
    // This toast should appear instantly if the click is actually firing.
    toast.message('Submitting ticket…');

    if (submitting) return;

    if (!user?.email) {
      toast.error('You are not signed in.');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill out Title and Description.');
      return;
    }

    setSubmitting(true);

    // Fire mutation
    submitMutation.mutate(formData);
  };

  if (loadingUser) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <Card className="border-stone-200">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-stone-500" />
            <p className="text-stone-600">Loading your account…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user?.email) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <Card className="border-stone-200">
          <CardContent className="p-8 text-center">
            <p className="text-stone-900 font-semibold">You’re not signed in.</p>
            <p className="text-stone-600 mt-1">Refresh the page or log in again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">{isUserReport ? 'Report a User' : 'Report a Problem'}</h1>
        <p className="text-stone-600 mt-1">
          {isUserReport
            ? 'Flag behavior or safety concerns about this user.'
            : 'Submit bugs, suggestions, or feature requests'}
        </p>
      </div>

      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            New Ticket
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* No form submit reliance anymore — button click directly submits */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                disabled={isUserReport}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="suggestion">Suggestion</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="user_report">Report User</SelectItem>
                </SelectContent>
              </Select>
              {isUserReport && (
                <p className="text-xs text-stone-500">You’re reporting {reportedUserName || reportedUserId || 'this user'}.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Brief summary of the issue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Provide detailed information about the issue..."
                rows={5}
              />
            </div>

            <Button
              type="button"
              onClick={forceSubmit}
              disabled={submitting}
              className="bg-stone-900 hover:bg-stone-800"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Ticket
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-stone-900 mb-4">My Tickets</h2>
        <div className="space-y-3">
          {myTicketsLoading ? (
            <Card className="border-stone-200">
              <CardContent className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-stone-400" />
                <p className="text-stone-500 text-sm">Loading your tickets…</p>
              </CardContent>
            </Card>
          ) : myTickets.length > 0 ? (
            myTickets.map((ticket) => {
              const StatusIcon = statusConfig[ticket.status]?.icon || Clock;
              return (
                <Card key={ticket.id} className="border-stone-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-stone-900">{ticket.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {typeLabels[ticket.type] || ticket.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-stone-600 whitespace-pre-wrap">{ticket.description}</p>
                      </div>
                      <Badge variant="outline" className={statusConfig[ticket.status]?.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig[ticket.status]?.label || ticket.status}
                      </Badge>
                    </div>

                    {ticket.admin_response && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs font-medium text-blue-900 mb-1">Admin Response:</p>
                        <p className="text-sm text-blue-800 whitespace-pre-wrap">{ticket.admin_response}</p>
                      </div>
                    )}

                    <p className="text-xs text-stone-400 mt-2">
                      Submitted {new Date(ticket.created_date || Date.now()).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="border-stone-200">
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-8 h-8 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-500">No tickets submitted yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
