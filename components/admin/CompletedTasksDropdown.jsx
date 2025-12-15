import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  ChevronDown, ChevronUp, CheckCircle2, XCircle, 
  AlertCircle, Shield, Calendar, Filter, ExternalLink 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CompletedTasksDropdown({ adminActions }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [detailDialog, setDetailDialog] = useState({ open: false, action: null });

  const actionTypeLabels = {
    profile_approved: { label: 'Profile Approved', icon: CheckCircle2, color: 'text-emerald-600' },
    profile_rejected: { label: 'Profile Rejected', icon: XCircle, color: 'text-red-600' },
    action_required: { label: 'Action Required', icon: AlertCircle, color: 'text-amber-600' },
    appeal_approved: { label: 'Appeal Approved', icon: CheckCircle2, color: 'text-emerald-600' },
    appeal_denied: { label: 'Appeal Denied', icon: XCircle, color: 'text-red-600' },
    user_suspended: { label: 'User Suspended', icon: Shield, color: 'text-orange-600' },
    user_unsuspended: { label: 'User Unsuspended', icon: CheckCircle2, color: 'text-blue-600' },
    support_chat_assigned: { label: 'Support Chat Assigned', icon: CheckCircle2, color: 'text-blue-600' },
    support_chat_closed: { label: 'Support Chat Closed', icon: CheckCircle2, color: 'text-stone-600' },
    job_deleted: { label: 'Job Deleted', icon: XCircle, color: 'text-red-600' },
    user_deleted: { label: 'User Deleted', icon: XCircle, color: 'text-red-600' },
    profile_reviewed: { label: 'Profile Reviewed', icon: CheckCircle2, color: 'text-blue-600' }
  };

  const filteredActions = adminActions.filter(action => {
    const categoryMatch = selectedCategory === 'all' || action.action_type === selectedCategory;
    const dateMatch = !selectedDate || 
      format(new Date(action.created_date), 'yyyy-MM-dd') === selectedDate;
    return categoryMatch && dateMatch;
  });

  return (
    <Card className="border-stone-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-stone-900">Completed Tasks</h3>
            <p className="text-sm text-stone-500">{adminActions.length} total completed actions</p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-stone-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-stone-400" />
        )}
      </button>

      {isOpen && (
        <CardContent className="pt-0 pb-6 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-stone-200">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-stone-500">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(actionTypeLabels).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-stone-500">Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedDate('');
                }}
                className="h-9"
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Action List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredActions.length > 0 ? (
              filteredActions.map((action) => {
                const config = actionTypeLabels[action.action_type] || { 
                  label: action.action_type, 
                  icon: CheckCircle2, 
                  color: 'text-stone-600' 
                };
                const Icon = config.icon;

                return (
                  <div 
                    key={action.id} 
                    className="p-3 bg-stone-50 rounded-lg hover:bg-stone-100 cursor-pointer transition-colors"
                    onClick={() => setDetailDialog({ open: true, action })}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", config.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                          <span className="text-xs text-stone-500">
                            {format(new Date(action.created_date), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-stone-900">
                          {action.admin_name} → {action.target_name}
                        </p>
                        {action.notes && (
                          <p className="text-xs text-stone-600 mt-1 line-clamp-2">{action.notes}</p>
                        )}
                      </div>
                      <ExternalLink className="w-4 h-4 text-stone-400 shrink-0" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Filter className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-sm text-stone-500">No tasks found for the selected filters</p>
              </div>
            )}
          </div>

          {filteredActions.length > 0 && (
            <div className="pt-2 border-t border-stone-200 text-center">
              <p className="text-xs text-stone-500">
                Showing {filteredActions.length} of {adminActions.length} completed tasks
              </p>
            </div>
          )}
        </CardContent>
      )}

      {/* Task Detail Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog({ open, action: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>
              View complete information about this admin action
            </DialogDescription>
          </DialogHeader>
          
          {detailDialog.action && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-stone-500">Action Type</Label>
                  <Badge variant="outline" className="mt-1">
                    {actionTypeLabels[detailDialog.action.action_type]?.label || detailDialog.action.action_type}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-stone-500">Timestamp</Label>
                  <p className="text-sm font-medium text-stone-900 mt-1">
                    {format(new Date(detailDialog.action.created_date), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-stone-500">Admin</Label>
                  <p className="text-sm font-medium text-stone-900 mt-1">{detailDialog.action.admin_name}</p>
                  <p className="text-xs text-stone-500">{detailDialog.action.admin_id}</p>
                </div>
                <div>
                  <Label className="text-xs text-stone-500">Target User</Label>
                  <p className="text-sm font-medium text-stone-900 mt-1">{detailDialog.action.target_name}</p>
                  <p className="text-xs text-stone-500">{detailDialog.action.target_id}</p>
                </div>
              </div>

              {detailDialog.action.notes && (
                <div>
                  <Label className="text-xs text-stone-500">Notes</Label>
                  <div className="bg-stone-50 rounded-lg p-3 mt-1 border border-stone-200">
                    <p className="text-sm text-stone-900 whitespace-pre-wrap">{detailDialog.action.notes}</p>
                  </div>
                </div>
              )}

              {detailDialog.action.details && Object.keys(detailDialog.action.details).length > 0 && (
                <div>
                  <Label className="text-xs text-stone-500">Additional Details</Label>
                  <pre className="bg-stone-50 rounded-lg p-3 mt-1 border border-stone-200 text-xs text-stone-700 overflow-auto">
                    {JSON.stringify(detailDialog.action.details, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-stone-200">
                <Button asChild variant="outline" className="flex-1">
                  <Link to={createPageUrl(`UserEdit?id=${detailDialog.action.target_id}`)}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View User Profile
                  </Link>
                </Button>
                <Button onClick={() => setDetailDialog({ open: false, action: null })} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}