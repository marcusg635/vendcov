import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/components/shared/useCurrentUser';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parseISO } from 'date-fns';
import { format, isToday, isFuture } from '@/components/shared/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ServiceBadge from '@/components/ui/ServiceBadge';
import HelpTypeBadge from '@/components/ui/HelpTypeBadge';
import JobStatusIndicator from '@/components/jobs/JobStatusIndicator';
import {
  Calendar, Clock, MapPin, DollarSign, MessageSquare,
  FileText, ArrowRight, Briefcase, Send, AlertCircle, User, Star, XCircle, CheckCircle2, AlertTriangle, PlusCircle, ChevronDown, Search
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import ReviewDialog from '@/components/reviews/ReviewDialog';
import { toast } from 'sonner';

export default function MyJobs() {
  const { user, loading: userLoading } = useCurrentUser();
  const [reviewDialog, setReviewDialog] = useState({ open: false, job: null, revieweeId: null, revieweeName: null, reviewType: null });
  const queryClient = useQueryClient();
  
  // All state hooks must be at top level - before any conditional returns
  const [openJobsExpanded, setOpenJobsExpanded] = useState(true);
  const [activeJobsExpanded, setActiveJobsExpanded] = useState(false);
  const [completedJobsExpanded, setCompletedJobsExpanded] = useState(false);
  const [cancelledJobsExpanded, setCancelledJobsExpanded] = useState(false);
  
  const [openJobsSearch, setOpenJobsSearch] = useState('');
  const [activeJobsSearch, setActiveJobsSearch] = useState('');
  const [completedJobsSearch, setCompletedJobsSearch] = useState('');
  const [cancelledJobsSearch, setCancelledJobsSearch] = useState('');
  
  const [tasksExpanded, setTasksExpanded] = useState(true);
  const [todaysJobsExpanded, setTodaysJobsExpanded] = useState(false);
  const [upcomingJobsExpanded, setUpcomingJobsExpanded] = useState(false);
  const [myJobsExpanded, setMyJobsExpanded] = useState(false);
  const [postedJobsExpanded, setPostedJobsExpanded] = useState(false);
  const [postedOpenExpanded, setPostedOpenExpanded] = useState(false);
  const [postedHiredExpanded, setPostedHiredExpanded] = useState(false);
  const [postedInProgressExpanded, setPostedInProgressExpanded] = useState(false);
  const [postedCancelledExpanded, setPostedCancelledExpanded] = useState(false);
  const [postedCompleteExpanded, setPostedCompleteExpanded] = useState(false);
  const [appliedJobsExpanded, setAppliedJobsExpanded] = useState(false);

  const isAdmin = user?.role === 'admin' && !user?._isSimulated;

  // For admins: fetch all jobs
  const { data: allJobs = [], isLoading: allJobsLoading } = useQuery({
    queryKey: ['allJobs'],
    queryFn: () => base44.entities.HelpRequest.list('-created_date'),
    enabled: !!user?.email && isAdmin
  });

  // Jobs I posted (as requester)
  const { data: myRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['myRequests', user?.email],
    queryFn: () => base44.entities.HelpRequest.filter({ requester_id: user.email }, '-created_date'),
    enabled: !!user?.email && !isAdmin,
    staleTime: 30000
  });

  // Get all applications for my posted jobs
  const { data: allApplications = [] } = useQuery({
    queryKey: ['allApplicationsForMyJobs', myRequests.map(r => r.id)],
    queryFn: async () => {
      if (myRequests.length === 0) return [];
      const apps = await base44.entities.JobApplication.list();
      return apps.filter(app => myRequests.some(req => req.id === app.help_request_id));
    },
    enabled: myRequests.length > 0
  });

  // Jobs I applied to (not for admins)
  const { data: myApplications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['myApplications', user?.email],
    queryFn: () => base44.entities.JobApplication.filter({ applicant_id: user.email }, '-created_date'),
    enabled: !!user?.email && !isAdmin,
    staleTime: 30000
  });

  // Get the jobs for my applications
  const { data: appliedJobs = [] } = useQuery({
    queryKey: ['appliedJobs', myApplications.map(a => a.help_request_id)],
    queryFn: async () => {
      if (myApplications.length === 0) return [];
      const jobs = await base44.entities.HelpRequest.list();
      return jobs.filter(job => myApplications.some(app => app.help_request_id === job.id));
    },
    enabled: myApplications.length > 0
  });

  // Fetch profiles for job requesters to check suspension status
  const { data: requesterProfiles = [] } = useQuery({
    queryKey: ['requesterProfiles', appliedJobs.map(j => j.requester_id)],
    queryFn: async () => {
      if (appliedJobs.length === 0) return [];
      const profiles = await base44.entities.VendorProfile.list();
      return profiles.filter(p => appliedJobs.some(job => job.requester_id === p.user_id));
    },
    enabled: appliedJobs.length > 0
  });

  // Get available jobs (jobs not posted by me and not applied to)
  const { data: availableJobs = [] } = useQuery({
    queryKey: ['availableJobs'],
    queryFn: () => base44.entities.HelpRequest.filter({ status: 'open' }, '-created_date'),
    enabled: !!user?.email
  });

  const filteredAvailableJobs = (availableJobs || []).filter(job => 
    job.requester_id !== user?.email && 
    !(myApplications || []).some(app => app.help_request_id === job.id)
  );

  // Get agreements for task tracking
  const { data: agreements = [] } = useQuery({
    queryKey: ['agreements', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allAgreements = await base44.entities.SubcontractAgreement.list();
      return allAgreements.filter(a => 
        a.requester_id === user.email || a.vendor_id === user.email
      );
    },
    enabled: !!user?.email,
    staleTime: 30000
  });

  // Get all my jobs (accepted applications)
  const myAcceptedJobs = (appliedJobs || []).filter(job => 
    job.accepted_vendor_id === user?.email && job.status === 'filled'
  );

  const myFilledRequests = (myRequests || []).filter(job => job.status === 'filled');

  // Today's jobs (only jobs I'm working as vendor)
  const todaysJobs = (myAcceptedJobs || []).filter(job => 
    isToday(parseISO(job.event_date))
  );

  // Upcoming jobs (next 7 days, only jobs I'm working as vendor)
  const upcomingJobs = (myAcceptedJobs || []).filter(job => {
    const eventDate = parseISO(job.event_date);
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    return eventDate > today && eventDate <= sevenDaysFromNow && !isToday(eventDate);
  }).sort((a, b) => parseISO(a.event_date) - parseISO(b.event_date));

  // Calculate tasks
  const tasks = [];

  // Tasks for new applications on my posted jobs
  (myRequests || []).forEach(jobItem => {
    const newApps = (allApplications || []).filter(app => 
      app.help_request_id === jobItem.id && 
      app.status === 'pending'
    );
    newApps.forEach(app => {
      tasks.push({
        id: `new-app-${app.id}`,
        type: 'new_application',
        title: 'New Application',
        description: `${app.applicant_name} applied to "${jobItem.title}"`,
        jobId: jobItem.id,
        jobTitle: jobItem.title,
        applicationId: app.id,
        priority: 'high'
      });
    });
  });

  // Tasks for unsigned agreements (as vendor)
  (myAcceptedJobs || []).forEach(jobItem => {
    const agreement = (agreements || []).find(a => a.help_request_id === jobItem.id);
    if (agreement && !agreement.vendor_confirmed) {
      tasks.push({
        id: `sign-${jobItem.id}`,
        type: 'sign_agreement',
        title: 'Sign Agreement',
        description: `Sign the agreement for "${jobItem.title}"`,
        jobId: jobItem.id,
        jobTitle: jobItem.title,
        priority: 'high'
      });
    }
  });

  // Tasks for unsigned agreements (as requester)
  (myFilledRequests || []).forEach(jobItem => {
    const agreement = (agreements || []).find(a => a.help_request_id === jobItem.id);
    if (agreement && !agreement.requester_confirmed) {
      tasks.push({
        id: `sign-requester-${jobItem.id}`,
        type: 'sign_agreement',
        title: 'Sign Agreement',
        description: `Sign the agreement for "${jobItem.title}"`,
        jobId: jobItem.id,
        jobTitle: jobItem.title,
        priority: 'high'
      });
    }
  });

  // Tasks for completed jobs waiting for payment (as vendor)
  (myAcceptedJobs || []).forEach(jobItem => {
    if (jobItem.status === 'completed' && jobItem.payment_status === 'pending') {
      tasks.push({
        id: `waiting-payment-${jobItem.id}`,
        type: 'awaiting_payment',
        title: 'Awaiting Payment',
        description: `Waiting for payment from "${jobItem.title}"`,
        jobId: jobItem.id,
        jobTitle: jobItem.title,
        priority: 'medium'
      });
    }
  });

  // Tasks for leaving reviews
  (myAcceptedJobs || []).forEach(jobItem => {
    if (jobItem.status === 'completed') {
      const hasReviewed = false;
      if (!hasReviewed) {
        tasks.push({
          id: `review-client-${jobItem.id}`,
          type: 'review_client',
          title: 'Review Client',
          description: `Leave a review for "${jobItem.title}"`,
          jobId: jobItem.id,
          jobTitle: jobItem.title,
          revieweeId: jobItem.requester_id,
          revieweeName: jobItem.requester_name,
          priority: 'low'
        });
      }
    }
  });



  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'filled': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed': return 'bg-stone-100 text-stone-700 border-stone-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  const getApplicationStatus = (jobId) => {
    const app = (myApplications || []).find(a => a.help_request_id === jobId);
    return app?.status || 'pending';
  };

  const getApplicationId = (jobId) => {
    const app = (myApplications || []).find(a => a.help_request_id === jobId);
    return app?.id;
  };

  const getApplicantCount = (jobId) => {
    return (allApplications || []).filter(app => app.help_request_id === jobId).length;
  };

  const withdrawMutation = useMutation({
    mutationFn: async (applicationId) => {
      await base44.entities.JobApplication.delete(applicationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myApplications']);
      toast.success('Application withdrawn');
    }
  });

  const cancelJobMutation = useMutation({
    mutationFn: async (jobId) => {
      const job = (myRequests || []).find(r => r.id === jobId);
      
      // Get all applications for this job
      const applications = await base44.entities.JobApplication.filter({ help_request_id: jobId });
      
      // Notify all applicants
      for (const app of applications) {
        await base44.entities.Notification.create({
          user_id: app.applicant_id,
          type: 'new_message',
          title: 'Job Cancelled',
          message: `The job "${job.title}" has been cancelled by the requester`,
          reference_id: null
        });
      }
      
      // Update job status
      await base44.entities.HelpRequest.update(jobId, { status: 'cancelled' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myRequests']);
      toast.success('Job cancelled and applicants notified');
    }
  });

  const JobListItem = ({ job, showApplicationStatus = false }) => {
    const canReviewRequester = showApplicationStatus && job.status === 'completed' && job.accepted_vendor_id === user?.email;
    const canReviewVendor = !showApplicationStatus && job.status === 'completed' && job.requester_id === user?.email;
    
    // Check if requester is suspended
    const requesterProfile = (requesterProfiles || []).find(p => p.user_id === job.requester_id);
    const requesterSuspended = requesterProfile?.suspended;
    const requesterAppealStatus = requesterProfile?.appeal_status;

    return (
      <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900 hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          {/* Suspended User Warning */}
          {showApplicationStatus && requesterSuspended && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-800">
                  <p className="font-medium mb-1">
                    {requesterAppealStatus === 'pending' 
                      ? 'Job Under Review'
                      : requesterAppealStatus === 'denied'
                      ? 'Job Suspended'
                      : 'Job On Hold'}
                  </p>
                  <p>
                    {requesterAppealStatus === 'pending'
                      ? 'This job is under review. Update coming by end of day.'
                      : requesterAppealStatus === 'denied'
                      ? 'This job will be removed. You will be notified.'
                      : 'This job is on hold pending review. Update within 24 hours.'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base text-stone-900 dark:text-stone-100 break-words">{job.title}</h3>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 break-words mt-0.5">
                  {showApplicationStatus ? (job.requester_business || job.requester_name) : 'You posted this'}
                </p>
              </div>
              <Badge variant="outline" className={`${getStatusColor(job.status)} text-xs shrink-0`}>
                {job.status}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-medium capitalize">
                {job.service_type.replace(/_/g, ' ')} ({job.help_type.replace(/_/g, ' ')})
              </Badge>
              <JobStatusIndicator 
                job={job} 
                user={user} 
                agreement={(agreements || []).find(a => a.help_request_id === job.id)}
                applications={(allApplications || []).filter(a => a.help_request_id === job.id)}
                size="sm"
              />
            </div>

            <div className="grid gap-2 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-400 shrink-0" />
                <span className="break-words">{format(new Date(job.event_date), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-400 shrink-0" />
                <span className="break-words">{job.city}, {job.state}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-400 shrink-0" />
                <span>${job.pay_amount} ({job.payment_type})</span>
              </div>
              {job.accepted_vendor_name && !showApplicationStatus && (
               <div className="flex items-center gap-1.5">
                 <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-400 shrink-0" />
                 <span className="break-words">{job.accepted_vendor_name}</span>
               </div>
              )}
              {!showApplicationStatus && (
               <div className="flex items-center gap-1.5">
                 <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-400 shrink-0" />
                 <span>{getApplicantCount(job.id)} applicant{getApplicantCount(job.id) !== 1 ? 's' : ''}</span>
               </div>
              )}
            </div>

            {showApplicationStatus && (
              <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-700 flex items-center justify-between">
                <Badge className={
                  getApplicationStatus(job.id) === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  getApplicationStatus(job.id) === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  'bg-stone-100 text-stone-600 border-stone-200'
                }>
                  {getApplicationStatus(job.id) === 'pending' ? 'Application Pending' :
                   getApplicationStatus(job.id) === 'accepted' ? 'Accepted' : 'Not Selected'}
                </Badge>
                {getApplicationStatus(job.id) === 'pending' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => withdrawMutation.mutate(getApplicationId(job.id))}
                    disabled={withdrawMutation.isLoading}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Withdraw
                  </Button>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                <Link to={createPageUrl(`JobDetails?id=${job.id}`)}>
                  <span className="truncate">View Details</span>
                  <ArrowRight className="w-4 h-4 ml-1 shrink-0" />
                </Link>
              </Button>
              {!showApplicationStatus && job.status === 'open' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-red-600 hover:text-red-700 w-full sm:w-auto"
                  onClick={() => {
                    if (window.confirm('Cancel this job? All applicants will be notified.')) {
                      cancelJobMutation.mutate(job.id);
                    }
                  }}
                >
                  <span className="truncate">Cancel Job</span>
                </Button>
              )}
              {(job.status === 'filled' && (job.accepted_vendor_id === user?.email || job.requester_id === user?.email)) && (
                <>
                  <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                    <Link to={createPageUrl(`Chat?jobId=${job.id}`)}>
                      <MessageSquare className="w-4 h-4 mr-1" />
                      <span className="truncate">Chat</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                    <Link to={createPageUrl(`Agreement?jobId=${job.id}`)}>
                      <FileText className="w-4 h-4 mr-1" />
                      <span className="truncate">Agreement</span>
                    </Link>
                  </Button>
                </>
              )}
              {canReviewRequester && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setReviewDialog({ 
                    open: true, 
                    job, 
                    revieweeId: job.requester_id, 
                    revieweeName: job.requester_name,
                    reviewType: 'vendor_to_requester'
                  })}
                >
                  <Star className="w-4 h-4 mr-1" />
                  <span className="truncate">Review Client</span>
                </Button>
              )}
              {canReviewVendor && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setReviewDialog({ 
                    open: true, 
                    job, 
                    revieweeId: job.accepted_vendor_id, 
                    revieweeName: job.accepted_vendor_name,
                    reviewType: 'requester_to_vendor'
                  })}
                >
                  <Star className="w-4 h-4 mr-1" />
                  <span className="truncate">Review Vendor</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ icon: Icon, title, description, action }) => (
    <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
      <CardContent className="p-12 text-center">
        <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="w-6 h-6 text-stone-400 dark:text-stone-500" />
        </div>
        <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">{title}</h3>
        <p className="text-stone-500 dark:text-stone-400 text-sm mb-4">{description}</p>
        {action}
      </CardContent>
    </Card>
  );

  const isLoading = isAdmin ? allJobsLoading : (requestsLoading || appsLoading);

  // Admin view: categorize all jobs
  const openJobs = isAdmin ? (allJobs || []).filter(j => j.status === 'open') : [];
  const filledJobs = isAdmin ? (allJobs || []).filter(j => j.status === 'filled') : [];
  const completedJobs = isAdmin ? (allJobs || []).filter(j => j.status === 'completed') : [];
  const cancelledJobs = isAdmin ? (allJobs || []).filter(j => j.status === 'cancelled') : [];

  const TaskCard = ({ task }) => {
    const priorityColors = {
      high: 'bg-red-50 border-red-200 text-red-700',
      medium: 'bg-amber-50 border-amber-200 text-amber-700',
      low: 'bg-blue-50 border-blue-200 text-blue-700'
    };

    return (
      <Card className={`border ${priorityColors[task.priority]}`}>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {task.type === 'new_application' && <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
                {task.type === 'sign_agreement' && <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
                {task.type === 'mark_paid' && <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
                {task.type === 'awaiting_payment' && <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
                {(task.type === 'review_client' || task.type === 'review_vendor') && <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
                <h3 className="font-semibold text-sm sm:text-base break-words">{task.title}</h3>
              </div>
              <p className="text-xs sm:text-sm opacity-80 break-words">{task.description}</p>
            </div>
            <Button asChild size="sm" className="w-full sm:w-auto shrink-0">
              <Link to={createPageUrl(`JobDetails?id=${task.jobId}`)}>
                View
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Get the next upcoming job (only jobs I'm working as vendor)
  const nextJob = (myAcceptedJobs || [])
    .filter(jobItem => isFuture(parseISO(jobItem.event_date)) && jobItem.status !== 'completed' && jobItem.status !== 'cancelled')
    .sort((a, b) => parseISO(a.event_date) - parseISO(b.event_date))[0];

  // Admin view
  if (isAdmin) {
    const filterJobs = (jobs, searchTerm) => {
      if (!searchTerm) return jobs;
      const search = searchTerm.toLowerCase();
      return jobs.filter(job => 
        job.title?.toLowerCase().includes(search) ||
        job.city?.toLowerCase().includes(search) ||
        job.state?.toLowerCase().includes(search) ||
        job.requester_name?.toLowerCase().includes(search) ||
        job.requester_business?.toLowerCase().includes(search) ||
        job.accepted_vendor_name?.toLowerCase().includes(search)
      );
    };

    const filteredOpenJobs = filterJobs(openJobs, openJobsSearch);
    const filteredActiveJobs = filterJobs(filledJobs, activeJobsSearch);
    const filteredCompletedJobs = filterJobs(completedJobs, completedJobsSearch);
    const filteredCancelledJobs = filterJobs(cancelledJobs, cancelledJobsSearch);

    return (
      <div className="w-full max-w-full px-2 sm:px-4 space-y-4 pb-20 overflow-x-hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">All Jobs (Admin View)</h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">View and manage all jobs on the platform</p>
        </div>

        {/* Open Jobs */}
        <Collapsible open={openJobsExpanded} onOpenChange={setOpenJobsExpanded}>
          <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors rounded-t-lg">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">Open Jobs ({openJobs.length})</h2>
                </div>
                <ChevronDown className={`w-5 h-5 text-emerald-600 transition-transform ${openJobsExpanded ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    placeholder="Search by title, location, requester, or vendor..."
                    value={openJobsSearch}
                    onChange={(e) => setOpenJobsSearch(e.target.value)}
                    className="pl-10 bg-white"
                  />
                </div>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map(i => (
                      <Card key={i} className="border-stone-200 animate-pulse">
                        <CardContent className="p-5">
                          <div className="h-6 bg-stone-200 rounded w-1/3 mb-3" />
                          <div className="h-4 bg-stone-100 rounded w-1/4 mb-3" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredOpenJobs.length > 0 ? (
                  <div className="space-y-4">
                    {filteredOpenJobs.map(job => (
                      <JobListItem key={job.id} job={job} />
                    ))}
                  </div>
                ) : openJobsSearch ? (
                  <p className="text-center text-stone-500 py-8">No jobs match your search</p>
                ) : (
                  <EmptyState
                    icon={Briefcase}
                    title="No open jobs"
                    description="No jobs are currently accepting applications"
                    action={null}
                  />
                )}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Filled/Active Jobs */}
        <Collapsible open={activeJobsExpanded} onOpenChange={setActiveJobsExpanded}>
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors rounded-t-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Active Jobs ({filledJobs.length})</h2>
                </div>
                <ChevronDown className={`w-5 h-5 text-blue-600 transition-transform ${activeJobsExpanded ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    placeholder="Search by title, location, requester, or vendor..."
                    value={activeJobsSearch}
                    onChange={(e) => setActiveJobsSearch(e.target.value)}
                    className="pl-10 bg-white"
                  />
                </div>
                {filteredActiveJobs.length > 0 ? (
                  <div className="space-y-4">
                    {filteredActiveJobs.map(job => (
                      <JobListItem key={job.id} job={job} />
                    ))}
                  </div>
                ) : activeJobsSearch ? (
                  <p className="text-center text-stone-500 py-8">No jobs match your search</p>
                ) : (
                  <EmptyState
                    icon={CheckCircle2}
                    title="No active jobs"
                    description="No jobs are currently in progress"
                    action={null}
                  />
                )}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Completed Jobs */}
        <Collapsible open={completedJobsExpanded} onOpenChange={setCompletedJobsExpanded}>
          <Card className="border-stone-200 bg-stone-50 dark:bg-stone-900">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors rounded-t-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-stone-600" />
                  <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Completed Jobs ({completedJobs.length})</h2>
                </div>
                <ChevronDown className={`w-5 h-5 text-stone-600 transition-transform ${completedJobsExpanded ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    placeholder="Search by title, location, requester, or vendor..."
                    value={completedJobsSearch}
                    onChange={(e) => setCompletedJobsSearch(e.target.value)}
                    className="pl-10 bg-white"
                  />
                </div>
                {filteredCompletedJobs.length > 0 ? (
                  <div className="space-y-4">
                    {filteredCompletedJobs.map(job => (
                      <JobListItem key={job.id} job={job} />
                    ))}
                  </div>
                ) : completedJobsSearch ? (
                  <p className="text-center text-stone-500 py-8">No jobs match your search</p>
                ) : (
                  <EmptyState
                    icon={CheckCircle2}
                    title="No completed jobs"
                    description="Completed jobs will appear here"
                    action={null}
                  />
                )}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Cancelled Jobs */}
        <Collapsible open={cancelledJobsExpanded} onOpenChange={setCancelledJobsExpanded}>
          <Card className="border-red-200 bg-red-50 dark:bg-red-950">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 hover:bg-red-100 dark:hover:bg-red-900 transition-colors rounded-t-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">Cancelled Jobs ({cancelledJobs.length})</h2>
                </div>
                <ChevronDown className={`w-5 h-5 text-red-600 transition-transform ${cancelledJobsExpanded ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    placeholder="Search by title, location, requester, or vendor..."
                    value={cancelledJobsSearch}
                    onChange={(e) => setCancelledJobsSearch(e.target.value)}
                    className="pl-10 bg-white"
                  />
                </div>
                {filteredCancelledJobs.length > 0 ? (
                  <div className="space-y-4">
                    {filteredCancelledJobs.map(job => (
                      <JobListItem key={job.id} job={job} />
                    ))}
                  </div>
                ) : cancelledJobsSearch ? (
                  <p className="text-center text-stone-500 py-8">No jobs match your search</p>
                ) : (
                  <EmptyState
                    icon={XCircle}
                    title="No cancelled jobs"
                    description="Cancelled jobs will appear here"
                    action={null}
                  />
                )}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    );
  }

  // Regular user view
  return (
    <div className="w-full max-w-full px-2 sm:px-4 space-y-4 pb-20 overflow-x-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">My Jobs</h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">Manage your jobs, applications, and tasks</p>
        </div>
        <Button asChild className="bg-stone-900 hover:bg-stone-800 shrink-0">
          <Link to={createPageUrl('PostRequest')}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Post Job
          </Link>
        </Button>
      </div>

      {/* Next Job */}
      {nextJob && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="p-3 sm:pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />
              <CardTitle className="text-sm sm:text-base text-blue-900">Your Next Job</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="bg-white rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-stone-900 text-base sm:text-lg mb-1 break-words">{nextJob.title}</h3>
                  <p className="text-xs sm:text-sm text-stone-600 break-words">
                    Client: {nextJob.requester_business || nextJob.requester_name}
                  </p>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs self-start">
                  {nextJob.status}
                </Badge>
              </div>

              <div className="mb-4">
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-medium capitalize">
                  {nextJob.service_type.replace(/_/g, ' ')} ({nextJob.help_type.replace(/_/g, ' ')})
                </Badge>
              </div>

              <div className="grid gap-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-400 shrink-0" />
                  <span className="font-medium break-words">{format(parseISO(nextJob.event_date), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                {(nextJob.event_start_time || nextJob.event_end_time) && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-400 shrink-0" />
                    <span className="break-words">
                      {nextJob.event_start_time && nextJob.event_start_time}
                      {nextJob.event_start_time && nextJob.event_end_time && ' - '}
                      {nextJob.event_end_time && nextJob.event_end_time}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-400 shrink-0" />
                  <span className="break-words">{nextJob.city}, {nextJob.state}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-400 shrink-0" />
                  <span className="font-medium">${nextJob.pay_amount} ({nextJob.payment_type})</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-stone-100">
                <Button asChild size="sm" className="flex-1">
                  <Link to={createPageUrl(`JobDetails?id=${nextJob.id}`)}>
                    <span className="truncate">View Details</span>
                    <ArrowRight className="w-4 h-4 ml-1 shrink-0" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="sm:w-auto">
                  <Link to={createPageUrl(`Chat?jobId=${nextJob.id}`)}>
                    <MessageSquare className="w-4 h-4 mr-1" />
                    <span className="truncate">Chat</span>
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks Section */}
      {tasks.length > 0 && (
        <Collapsible open={tasksExpanded} onOpenChange={setTasksExpanded}>
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-3 sm:p-4 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors rounded-t-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                  <h2 className="text-sm sm:text-lg font-semibold text-amber-900 dark:text-amber-100">Tasks ({tasks.length})</h2>
                </div>
                <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-amber-600 transition-transform ${tasksExpanded ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-3 sm:p-4 pt-0 space-y-3">
                {tasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Today's Jobs */}
      {todaysJobs.length > 0 && (
        <Collapsible open={todaysJobsExpanded} onOpenChange={setTodaysJobsExpanded}>
          <Card className="border-red-200 bg-red-50 dark:bg-red-950">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-3 sm:p-4 hover:bg-red-100 dark:hover:bg-red-900 transition-colors rounded-t-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  <h2 className="text-sm sm:text-lg font-semibold text-red-900 dark:text-red-100">Today's Jobs ({todaysJobs.length})</h2>
                </div>
                <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-red-600 transition-transform ${todaysJobsExpanded ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-3 sm:p-4 pt-0 space-y-4">
                {todaysJobs.map(job => (
                  <JobListItem key={job.id} job={job} showApplicationStatus />
                ))}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Upcoming Jobs */}
      {upcomingJobs.length > 0 && (
        <Collapsible open={upcomingJobsExpanded} onOpenChange={setUpcomingJobsExpanded}>
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-3 sm:p-4 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors rounded-t-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <h2 className="text-sm sm:text-lg font-semibold text-blue-900 dark:text-blue-100">Upcoming (7 Days) ({upcomingJobs.length})</h2>
                </div>
                <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-blue-600 transition-transform ${upcomingJobsExpanded ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-3 sm:p-4 pt-0 space-y-4">
                {upcomingJobs.map(job => (
                  <JobListItem key={job.id} job={job} showApplicationStatus />
                ))}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* My Jobs (Jobs I'm working on as vendor) */}
      <Collapsible open={myJobsExpanded} onOpenChange={setMyJobsExpanded}>
        <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-3 sm:p-4 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors rounded-t-lg">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                <h2 className="text-sm sm:text-lg font-semibold text-emerald-900 dark:text-emerald-100">My Jobs ({myAcceptedJobs.length})</h2>
              </div>
              <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 transition-transform ${myJobsExpanded ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-3 sm:p-4 pt-0 space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <Card key={i} className="border-stone-200 animate-pulse">
                      <CardContent className="p-4 sm:p-5">
                        <div className="h-6 bg-stone-200 rounded w-1/3 mb-3" />
                        <div className="h-4 bg-stone-100 rounded w-1/4 mb-3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : myAcceptedJobs.filter(job => !todaysJobs.includes(job) && !upcomingJobs.includes(job)).length > 0 ? (
                myAcceptedJobs.filter(job => !todaysJobs.includes(job) && !upcomingJobs.includes(job)).map(job => (
                  <JobListItem key={job.id} job={job} showApplicationStatus />
                ))
              ) : (
                <EmptyState
                  icon={Briefcase}
                  title="No active jobs"
                  description="Jobs you've been hired for will appear here"
                  action={null}
                />
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Jobs Posted */}
      <Collapsible open={postedJobsExpanded} onOpenChange={setPostedJobsExpanded}>
        <Card className="border-violet-200 bg-violet-50 dark:bg-violet-950">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-3 sm:p-4 hover:bg-violet-100 dark:hover:bg-violet-900 transition-colors rounded-t-lg">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
                <h2 className="text-sm sm:text-lg font-semibold text-violet-900 dark:text-violet-100">Jobs Posted ({myRequests.length})</h2>
              </div>
              <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-violet-600 transition-transform ${postedJobsExpanded ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-3 sm:p-4 pt-0 space-y-3">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <Card key={i} className="border-stone-200 animate-pulse">
                      <CardContent className="p-4 sm:p-5">
                        <div className="h-6 bg-stone-200 rounded w-1/3 mb-3" />
                        <div className="h-4 bg-stone-100 rounded w-1/4 mb-3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : myRequests.length > 0 ? (
                <>
                  {/* Open Jobs */}
                  {(myRequests || []).filter(j => j.status === 'open').length > 0 && (
                    <Collapsible open={postedOpenExpanded} onOpenChange={setPostedOpenExpanded}>
                      <Card className="border-emerald-200 bg-white">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-3 hover:bg-emerald-50 transition-colors rounded-t-lg">
                            <h3 className="text-sm font-semibold text-emerald-900">Open ({myRequests.filter(j => j.status === 'open').length})</h3>
                            <ChevronDown className={`w-4 h-4 text-emerald-600 transition-transform ${postedOpenExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-3 pt-0 space-y-3">
                            {myRequests.filter(j => j.status === 'open').map(job => (
                              <JobListItem key={job.id} job={job} />
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  )}

                  {/* Hired/Filled Jobs */}
                  {(myRequests || []).filter(j => j.status === 'filled').length > 0 && (
                    <Collapsible open={postedHiredExpanded} onOpenChange={setPostedHiredExpanded}>
                      <Card className="border-blue-200 bg-white">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-3 hover:bg-blue-50 transition-colors rounded-t-lg">
                            <h3 className="text-sm font-semibold text-blue-900">Hired ({myRequests.filter(j => j.status === 'filled').length})</h3>
                            <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform ${postedHiredExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-3 pt-0 space-y-3">
                            {myRequests.filter(j => j.status === 'filled').map(job => (
                              <JobListItem key={job.id} job={job} />
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  )}

                  {/* Completed Jobs */}
                  {(myRequests || []).filter(j => j.status === 'completed').length > 0 && (
                    <Collapsible open={postedCompleteExpanded} onOpenChange={setPostedCompleteExpanded}>
                      <Card className="border-stone-200 bg-white">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-3 hover:bg-stone-50 transition-colors rounded-t-lg">
                            <h3 className="text-sm font-semibold text-stone-900">Complete ({myRequests.filter(j => j.status === 'completed').length})</h3>
                            <ChevronDown className={`w-4 h-4 text-stone-600 transition-transform ${postedCompleteExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-3 pt-0 space-y-3">
                            {myRequests.filter(j => j.status === 'completed').map(job => (
                              <JobListItem key={job.id} job={job} />
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  )}

                  {/* Cancelled Jobs */}
                  {(myRequests || []).filter(j => j.status === 'cancelled').length > 0 && (
                    <Collapsible open={postedCancelledExpanded} onOpenChange={setPostedCancelledExpanded}>
                      <Card className="border-red-200 bg-white">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-3 hover:bg-red-50 transition-colors rounded-t-lg">
                            <h3 className="text-sm font-semibold text-red-900">Cancelled ({myRequests.filter(j => j.status === 'cancelled').length})</h3>
                            <ChevronDown className={`w-4 h-4 text-red-600 transition-transform ${postedCancelledExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-3 pt-0 space-y-3">
                            {myRequests.filter(j => j.status === 'cancelled').map(job => (
                              <JobListItem key={job.id} job={job} />
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  )}
                </>
              ) : (
                <EmptyState
                  icon={Briefcase}
                  title="No jobs posted yet"
                  description="Post a job to find coverage or extra help"
                  action={
                    <Button asChild className="bg-stone-900 hover:bg-stone-800 text-sm">
                      <Link to={createPageUrl('PostRequest')}>Post a Job</Link>
                    </Button>
                  }
                />
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Jobs Applied */}
      <Collapsible open={appliedJobsExpanded} onOpenChange={setAppliedJobsExpanded}>
        <Card className="border-indigo-200 bg-indigo-50 dark:bg-indigo-950">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-3 sm:p-4 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors rounded-t-lg">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                <h2 className="text-sm sm:text-lg font-semibold text-indigo-900 dark:text-indigo-100">Jobs Applied ({myApplications.length})</h2>
              </div>
              <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 transition-transform ${appliedJobsExpanded ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-3 sm:p-4 pt-0 space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <Card key={i} className="border-stone-200 animate-pulse">
                      <CardContent className="p-4 sm:p-5">
                        <div className="h-6 bg-stone-200 rounded w-1/3 mb-3" />
                        <div className="h-4 bg-stone-100 rounded w-1/4 mb-3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : appliedJobs.length > 0 ? (
                appliedJobs.map(job => (
                  <JobListItem key={job.id} job={job} showApplicationStatus />
                ))
              ) : (
                <EmptyState
                  icon={Send}
                  title="No applications yet"
                  description="Browse jobs above and apply to opportunities"
                  action={null}
                />
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <ReviewDialog
        open={reviewDialog.open}
        onClose={() => setReviewDialog({ open: false, job: null, revieweeId: null, revieweeName: null, reviewType: null })}
        job={reviewDialog.job}
        revieweeId={reviewDialog.revieweeId}
        revieweeName={reviewDialog.revieweeName}
        reviewType={reviewDialog.reviewType}
        currentUser={user}
      />
    </div>
  );
}