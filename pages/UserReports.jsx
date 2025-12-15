import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { AlertTriangle, ExternalLink, User, CheckCircle2, XCircle, Clock } from 'lucide-react';

const REPORT_TYPE_LABELS = {
  fake_profile: 'Fake Profile / Fraud',
  non_payment: 'Non-Payment',
  no_show: 'No Show / Unreliable',
  poor_experience: 'Poor Experience',
  other: 'Other Issue'
};

const STATUS_CONFIG = {
  open: { icon: AlertTriangle, color: 'bg-red-50 text-red-700 border-red-200', label: 'Open' },
  investigating: { icon: Clock, color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Investigating' },
  resolved: { icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Resolved' },
  dismissed: { icon: XCircle, color: 'bg-stone-100 text-stone-600 border-stone-200', label: 'Dismissed' }
};

export default function UserReports() {
  const [user, setUser] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: reports = [] } = useQuery({
    queryKey: ['userReports'],
    queryFn: () => base44.entities.UserReport.list('-created_date'),
    enabled: !!user?.email && user?.role === 'admin'
  });

  const updateMutation = useMutation({
    mutationFn: async ({ reportId, data }) => {
      return base44.entities.UserReport.update(reportId, {
        ...data,
        admin_id: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userReports']);
      toast.success('Report updated');
      setDialogOpen(false);
      setSelectedReport(null);
      setAdminNotes('');
      setActionTaken('');
      setNewStatus('');
    }
  });

  const handleOpenDialog = (report) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || '');
    setActionTaken(report.action_taken || '');
    setNewStatus(report.status);
    setDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }

    updateMutation.mutate({
      reportId: selectedReport.id,
      data: {
        status: newStatus,
        admin_notes: adminNotes,
        action_taken: actionTaken
      }
    });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-stone-900">Access Denied</h2>
        <p className="text-stone-600 mt-2">You must be an admin to view this page</p>
      </div>
    );
  }

  const openReports = reports.filter(r => r.status === 'open');
  const investigatingReports = reports.filter(r => r.status === 'investigating');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">User Reports</h1>
        <p className="text-stone-600 mt-1">Manage user-submitted reports and violations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-stone-900">{openReports.length}</div>
            <div className="text-sm text-stone-600">Open Reports</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-stone-900">{investigatingReports.length}</div>
            <div className="text-sm text-stone-600">Investigating</div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-stone-900">
              {reports.filter(r => r.status === 'resolved').length}
            </div>
            <div className="text-sm text-stone-600">Resolved</div>
          </CardContent>
        </Card>
        <Card className="border-stone-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-stone-900">{reports.length}</div>
            <div className="text-sm text-stone-600">Total Reports</div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <Card className="border-stone-200">
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <h3 className="font-semibold text-stone-900 mb-1">No Reports</h3>
              <p className="text-stone-500 text-sm">No user reports have been submitted</p>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => {
            const StatusIcon = STATUS_CONFIG[report.status].icon;
            return (
              <Card key={report.id} className="border-stone-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={STATUS_CONFIG[report.status].color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {STATUS_CONFIG[report.status].label}
                        </Badge>
                        <Badge variant="outline">
                          {REPORT_TYPE_LABELS[report.report_type]}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-stone-500 mb-1">Reporter</p>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {report.reporter_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{report.reporter_name}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-stone-500 mb-1">Reported User</p>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-red-100 text-red-700">
                                {report.reported_user_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-red-700">
                              {report.reported_user_name}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-stone-700 mb-2 line-clamp-2">
                        {report.description}
                      </p>

                      {report.action_taken && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded p-2 mb-2">
                          <p className="text-xs font-medium text-emerald-900 mb-1">Action Taken:</p>
                          <p className="text-xs text-emerald-800">{report.action_taken}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-stone-500">
                        <span>Submitted {format(new Date(report.created_date), 'MMM d, yyyy')}</span>
                        {report.help_request_id && (
                          <Link
                            to={createPageUrl(`JobDetails?id=${report.help_request_id}`)}
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            View Job <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(report)}
                      >
                        Manage
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                      >
                        <Link to={createPageUrl(`UserEdit?id=${report.reported_user_id}`)}>
                          <User className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Manage Report Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Report</DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 py-4">
              <div className="bg-stone-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-stone-500 mb-1">Reporter</p>
                    <p className="font-medium">{selectedReport.reporter_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 mb-1">Reported User</p>
                    <p className="font-medium text-red-700">{selectedReport.reported_user_name}</p>
                  </div>
                </div>
                <div className="mb-3">
                  <p className="text-xs text-stone-500 mb-1">Report Type</p>
                  <p className="font-medium">{REPORT_TYPE_LABELS[selectedReport.report_type]}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 mb-1">Description</p>
                  <p className="text-sm text-stone-700">{selectedReport.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status *</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Action Taken</Label>
                <Textarea
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="Describe what action was taken (visible to reporter)..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Internal Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal admin notes (not visible to users)..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isLoading}
              className="bg-stone-900 hover:bg-stone-800"
            >
              {updateMutation.isLoading ? 'Updating...' : 'Update Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}