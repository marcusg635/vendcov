import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, Briefcase, CheckCircle2, XCircle, MessageSquare, 
  ArrowRight, Check, Trash2 
} from 'lucide-react';

const notificationIcons = {
  new_job: Briefcase,
  new_application: Bell,
  application_accepted: CheckCircle2,
  application_declined: XCircle,
  job_completed: CheckCircle2,
  new_message: MessageSquare
};

const notificationColors = {
  new_job: 'bg-blue-50 text-blue-600',
  new_application: 'bg-amber-50 text-amber-600',
  application_accepted: 'bg-emerald-50 text-emerald-600',
  application_declined: 'bg-red-50 text-red-600',
  job_completed: 'bg-violet-50 text-violet-600',
  new_message: 'bg-stone-100 text-stone-600'
};

export default function Notifications() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_id: user.email }, '-created_date'),
    enabled: !!user?.email
  });

  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      return base44.entities.Notification.update(id, { read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.read);
      for (const n of unread) {
        await base44.entities.Notification.update(n.id, { read: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return base44.entities.Notification.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const getNotificationLink = (notification) => {
    if (notification.type === 'new_message') {
      return createPageUrl(`Chat?jobId=${notification.reference_id}`);
    }
    return createPageUrl(`JobDetails?id=${notification.reference_id}`);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Notifications</h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isLoading}
          >
            <Check className="w-4 h-4 mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = notificationIcons[notification.type] || Bell;
            const colorClass = notificationColors[notification.type] || 'bg-stone-100 text-stone-600';
            
            return (
              <Card 
                key={notification.id} 
                className={`border-stone-200 dark:border-stone-700 dark:bg-stone-900 ${!notification.read ? 'bg-stone-50 dark:bg-stone-800' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-stone-900 dark:text-stone-100">{notification.title}</h3>
                          <p className="text-sm text-stone-600 dark:text-stone-400 mt-0.5">{notification.message}</p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-stone-400 dark:text-stone-500">
                          {format(new Date(notification.created_date), 'MMM d, h:mm a')}
                        </span>
                        <div className="flex items-center gap-2">
                          {notification.reference_id && (
                            <Link 
                              to={getNotificationLink(notification)}
                              className="text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1"
                              onClick={() => !notification.read && markReadMutation.mutate(notification.id)}
                            >
                              View
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-stone-400 hover:text-red-500"
                            onClick={() => deleteMutation.mutate(notification.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
          <CardContent className="p-12 text-center">
            <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-6 h-6 text-stone-400 dark:text-stone-500" />
            </div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">No notifications</h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm">
              You're all caught up! We'll notify you when something happens.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}