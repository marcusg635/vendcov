import React from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, MapPin, PlayCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const defaultStatusConfig = {
  pending: { label: 'Accepted', icon: MapPin, color: 'bg-stone-100 text-stone-700' },
  in_route: { label: 'In Route', icon: Navigation, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  arrived: { label: 'Arrived', icon: MapPin, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  in_progress: { label: 'In Progress', icon: PlayCircle, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  done: { label: 'Done', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
};

const vendorStatusConfig = {
  florist: {
    pending: { label: 'Accepted', icon: MapPin, color: 'bg-stone-100 text-stone-700' },
    preparing: { label: 'Preparing', icon: PlayCircle, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    in_route: { label: 'In Route', icon: Navigation, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    delivered: { label: 'Delivered', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    complete: { label: 'Complete', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  },
  caterer: {
    pending: { label: 'Accepted', icon: MapPin, color: 'bg-stone-100 text-stone-700' },
    preparing: { label: 'Preparing', icon: PlayCircle, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    in_route: { label: 'In Route', icon: Navigation, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    setup: { label: 'Setting Up', icon: PlayCircle, color: 'bg-purple-50 text-purple-700 border-purple-200' },
    serving: { label: 'Serving', icon: PlayCircle, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    complete: { label: 'Complete', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  },
  bartender: {
    pending: { label: 'Accepted', icon: MapPin, color: 'bg-stone-100 text-stone-700' },
    preparing: { label: 'Preparing', icon: PlayCircle, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    in_route: { label: 'In Route', icon: Navigation, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    setup: { label: 'Setting Up', icon: PlayCircle, color: 'bg-purple-50 text-purple-700 border-purple-200' },
    serving: { label: 'Serving', icon: PlayCircle, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    complete: { label: 'Complete', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  }
};

export default function JobStatusCard({ job, user }) {
  const queryClient = useQueryClient();
  const currentStatus = job.job_status || 'pending';
  
  // Get the right status config based on service type
  const statusConfig = vendorStatusConfig[job.service_type] || defaultStatusConfig;
  const StatusIcon = statusConfig[currentStatus]?.icon || MapPin;

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus) => {
      await base44.entities.HelpRequest.update(job.id, {
        job_status: newStatus
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['job']);
      toast.success('Status updated!');
    }
  });

  const canUpdateStatus = job.accepted_vendor_id === user?.email && job.status === 'filled';

  return (
    <Card className="border-stone-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <StatusIcon className="w-5 h-5" />
          Job Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center py-4">
          <Badge className={statusConfig[currentStatus]?.color}>
            {statusConfig[currentStatus]?.label}
          </Badge>
        </div>

        {canUpdateStatus && (
          <div className="space-y-2">
            <p className="text-sm text-stone-600 mb-3">Update your current status:</p>
            {Object.entries(statusConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <Button
                  key={key}
                  variant={currentStatus === key ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => updateStatusMutation.mutate(key)}
                  disabled={updateStatusMutation.isLoading || currentStatus === key}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {config.label}
                </Button>
              );
            })}
          </div>
        )}

        {!canUpdateStatus && (
          <p className="text-sm text-stone-500 text-center">
            {job.requester_id === user?.email 
              ? 'Vendor will update status during the job'
              : 'You can update status once the job is active'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}