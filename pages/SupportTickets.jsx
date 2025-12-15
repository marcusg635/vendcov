import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { MessageSquare, CheckCircle2, Clock, XCircle, Loader2, AlertCircle } from 'lucide-react';

export default function SupportTickets() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [responseDialog, setResponseDialog] = useState({ open: false, ticket: null });
  const [adminResponse, setAdminResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [createDialog, setCreateDialog] = useState(false);
  const [newTicket, setNewTicket] = useState({
    type: 'other',
    title: '',
    description: '',
    priority: 'medium',
    user_email: '',
    user_name: ''
  });

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
      if (u?.role !== 'admin') {
        navigate(createPageUrl('Dashboard'));
      }
    };
    loadUser();
  }, [navigate]);

  const { data: allTickets = [] } = useQuery({
    queryKey: ['allTickets'],
    queryFn: () => base44.entities.SupportTicket.list('-created_date'),
    enabled: !!user?.email && user?.role === 'admin'
  });

  const updateMutation = useMutation({
    mutationFn: async ({ ticketId, updates }) => {
      return base44.entities.SupportTicket.update(ticketId, {
        ...updates,
        admin_id: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allTickets']);
      toast.success('Ticket updated');
      setResponseDialog({ open: false, ticket: null });
      setAdminResponse('');
      setNewStatus('');
    }
  });

  const createMutation = useMutation({
    mutationFn: async (ticketData) => {
      return base44.entities.SupportTicket.create({
        ...ticketData,
        user_id: ticketData.user_email,
        status: 'open',
        admin_id: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allTickets']);
      toast.success('Ticket created');
      setCreateDialog(false);
      setNewTicket({
        type: 'other',
        title: '',
        description: '',
        priority: 'medium',
        user_email: '',
        user_name: ''
      });
    }
  });

  const handleRespond = (ticket) => {
    setResponseDialog({ open: true, ticket });
    setAdminResponse(ticket.admin_response || '');
    setNewStatus(ticket.status);
  };

  const submitResponse = () => {
    if (responseDialog.ticket) {
      updateMutation.mutate({
        ticketId: responseDialog.ticket.id,
        updates: {
          admin_response: adminResponse,
          status: newStatus
        }
      });
    }
  };

  const statusConfig = {
    open: { icon: Clock, color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Open' },
    in_progress: { icon: Loader2, color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'In Progress' },
    resolved: { icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Resolved' },
    closed: { icon: CheckCircle2, color: 'bg-stone-100 text-stone-700', label: 'Closed' },
    denied: { icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200', label: 'Denied' }
  };

  const typeLabels = {
    bug: 'Bug Report',
    suggestion: 'Suggestion',
    feature_request: 'Feature Request',
    other: 'Other'
  };

  const priorityColors = {
    low: 'bg-stone-100 text-stone-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-amber-100 text-amber-700',
    urgent: 'bg-red-100 text-red-700'
  };

  const openTickets = allTickets.filter(t => t.status === 'open');
  const inProgressTickets = allTickets.filter(t => t.status === 'in_progress');
  const resolvedTickets = allTickets.filter(t => ['resolved', 'closed', 'denied'].includes(t.status));

  const TicketCard = ({ ticket }) => {
    const StatusIcon = statusConfig[ticket.status]?.icon || Clock;
    return (
      <Card className="border-stone-200 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {typeLabels[ticket.type]}
                </Badge>
                <Badge variant="outline" className={`text-xs ${priorityColors[ticket.priority]}`}>
                  {ticket.priority}
                </Badge>
              </div>
              <h3 className="font-semibold text-stone-900 mb-1">{ticket.title}</h3>
              <p className="text-sm text-stone-600 mb-2">{ticket.description}</p>
              <p className="text-xs text-stone-500">
                By {ticket.user_name} ({ticket.user_email})
              </p>
              <p className="text-xs text-stone-400 mt-1">
                {new Date(ticket.created_date).toLocaleDateString()}
              </p>
            </div>
            <Badge variant="outline" className={statusConfig[ticket.status]?.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig[ticket.status]?.label}
            </Badge>
          </div>
          {ticket.admin_response && (
            <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs font-medium text-blue-900 mb-1">Your Response:</p>
              <p className="text-sm text-blue-800">{ticket.admin_response}</p>
            </div>
          )}
          <Button
            onClick={() => handleRespond(ticket)}
            size="sm"
            variant="outline"
            className="w-full"
          >
            {ticket.admin_response ? 'Update Response' : 'Respond'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (user?.role !== 'admin') return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Support Tickets</h1>
          <p className="text-stone-600 mt-1">Manage user-reported issues and requests</p>
        </div>
        <Button onClick={() => setCreateDialog(true)} className="bg-stone-900 hover:bg-stone-800">
          <MessageSquare className="w-4 h-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Open</p>
                <p className="text-2xl font-bold text-stone-900">{openTickets.length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">In Progress</p>
                <p className="text-2xl font-bold text-stone-900">{inProgressTickets.length}</p>
              </div>
              <Loader2 className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Resolved</p>
                <p className="text-2xl font-bold text-stone-900">{resolvedTickets.length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets */}
      <Tabs defaultValue="open" className="w-full">
        <TabsList>
          <TabsTrigger value="open">Open ({openTickets.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({inProgressTickets.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolvedTickets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4 mt-6">
          {openTickets.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {openTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)}
            </div>
          ) : (
            <Card className="border-stone-200">
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <h3 className="font-semibold text-stone-900 mb-1">All caught up!</h3>
                <p className="text-stone-500 text-sm">No open tickets</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4 mt-6">
          {inProgressTickets.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {inProgressTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)}
            </div>
          ) : (
            <Card className="border-stone-200">
              <CardContent className="p-12 text-center">
                <Loader2 className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500 text-sm">No tickets in progress</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4 mt-6">
          {resolvedTickets.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {resolvedTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)}
            </div>
          ) : (
            <Card className="border-stone-200">
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500 text-sm">No resolved tickets</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Response Dialog */}
      <Dialog open={responseDialog.open} onOpenChange={(open) => setResponseDialog({ open, ticket: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Ticket</DialogTitle>
          </DialogHeader>
          {responseDialog.ticket && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-semibold text-stone-900 mb-1">{responseDialog.ticket.title}</h3>
                <p className="text-sm text-stone-600">{responseDialog.ticket.description}</p>
                <p className="text-xs text-stone-500 mt-2">
                  Submitted by {responseDialog.ticket.user_name} on{' '}
                  {new Date(responseDialog.ticket.created_date).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="denied">Denied</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Response</Label>
                <Textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Provide feedback or updates..."
                  rows={5}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseDialog({ open: false, ticket: null })}>
              Cancel
            </Button>
            <Button
              onClick={submitResponse}
              disabled={updateMutation.isLoading}
              className="bg-stone-900 hover:bg-stone-800"
            >
              {updateMutation.isLoading ? 'Saving...' : 'Save Response'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Ticket Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>User Email</Label>
                <Input
                  value={newTicket.user_email}
                  onChange={(e) => setNewTicket({...newTicket, user_email: e.target.value})}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>User Name</Label>
                <Input
                  value={newTicket.user_name}
                  onChange={(e) => setNewTicket({...newTicket, user_name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newTicket.type} onValueChange={(val) => setNewTicket({...newTicket, type: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Bug Report</SelectItem>
                    <SelectItem value="suggestion">Suggestion</SelectItem>
                    <SelectItem value="feature_request">Feature Request</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newTicket.priority} onValueChange={(val) => setNewTicket({...newTicket, priority: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newTicket.title}
                onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                placeholder="Brief description of the issue"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                placeholder="Detailed description..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(newTicket)}
              disabled={!newTicket.user_email || !newTicket.title || createMutation.isLoading}
              className="bg-stone-900 hover:bg-stone-800"
            >
              {createMutation.isLoading ? 'Creating...' : 'Create Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}