import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ArrowRight } from 'lucide-react';

export default function Messages() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  // Get all jobs where user is involved
  const { data: myJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['myInvolvedJobs', user?.email],
    queryFn: async () => {
      const [posted, applications] = await Promise.all([
        base44.entities.HelpRequest.filter({ requester_id: user.email, status: 'filled' }),
        base44.entities.JobApplication.filter({ applicant_id: user.email, status: 'accepted' })
      ]);
      
      // Get jobs for accepted applications
      const allJobs = await base44.entities.HelpRequest.list();
      const acceptedJobs = allJobs.filter(job => 
        applications.some(app => app.help_request_id === job.id)
      );
      
      return [...posted, ...acceptedJobs];
    },
    enabled: !!user?.email
  });

  // Get messages for these jobs
  const { data: allMessages = [] } = useQuery({
    queryKey: ['allMessages', user?.email],
    queryFn: async () => {
      if (myJobs.length === 0) return [];
      const messages = await base44.entities.ChatMessage.list('-created_date');
      return messages.filter(m => 
        myJobs.some(job => job.id === m.help_request_id)
      );
    },
    enabled: myJobs.length > 0
  });

  // Group messages by job and get latest
  const conversations = myJobs.map(job => {
    const jobMessages = allMessages.filter(m => m.help_request_id === job.id);
    const latestMessage = jobMessages[0];
    const unreadCount = jobMessages.filter(m => m.recipient_id === user?.email && !m.read).length;
    
    const otherPartyName = user?.email === job.requester_id 
      ? job.accepted_vendor_name 
      : (job.requester_business || job.requester_name);
    
    return {
      job,
      latestMessage,
      unreadCount,
      otherPartyName
    };
  }).filter(c => c.latestMessage || c.job.status === 'filled').sort((a, b) => {
    if (!a.latestMessage) return 1;
    if (!b.latestMessage) return -1;
    return new Date(b.latestMessage.created_date) - new Date(a.latestMessage.created_date);
  });

  if (jobsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">Messages</h1>
        <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">Chat with your job contacts</p>
      </div>

      {conversations.length > 0 ? (
        <div className="space-y-3">
          {conversations.map(({ job, latestMessage, unreadCount, otherPartyName }) => (
            <Link 
              key={job.id} 
              to={createPageUrl(`Chat?jobId=${job.id}`)}
              className="block"
            >
              <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900 hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                      <AvatarFallback className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                        {otherPartyName?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium text-sm sm:text-base text-stone-900 dark:text-stone-100 truncate">{otherPartyName}</h3>
                        {latestMessage && (
                          <span className="text-xs text-stone-400 shrink-0">
                            {format(new Date(latestMessage.created_date), 'MMM d')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 truncate">{job.title}</p>
                      {latestMessage && (
                        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 truncate mt-1">
                          {latestMessage.sender_id === user?.email ? 'You: ' : ''}
                          {latestMessage.content}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {unreadCount > 0 && (
                        <Badge className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                      <ArrowRight className="w-4 h-4 text-stone-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
          <CardContent className="p-12 text-center">
            <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6 text-stone-400 dark:text-stone-500" />
            </div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">No conversations yet</h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm">
              When you get accepted for a job or accept a vendor, you can chat here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}