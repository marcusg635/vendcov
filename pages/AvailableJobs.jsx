import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Search, Filter, MapPin, AlertCircle, Briefcase, X, AlertTriangle, ToggleLeft, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Switch } from '@/components/ui/switch';
import JobCard from '@/components/jobs/JobCard';
import SubscriptionGate from '@/components/subscription/SubscriptionGate';
import { serviceConfig } from '@/components/ui/ServiceBadge';
import { helpTypeConfig } from '@/components/ui/HelpTypeBadge';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

export default function AvailableJobs() {
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    service_type: '',
    help_type: '',
    state: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showAllJobs, setShowAllJobs] = useState(false);
  const [applyDialog, setApplyDialog] = useState({ open: false, job: null });
  const [applicationMessage, setApplicationMessage] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['vendorProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.VendorProfile.filter({ user_id: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email
  });

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['availableJobs'],
    queryFn: () => base44.entities.HelpRequest.filter({ status: 'open' }, '-created_date'),
    enabled: !!user?.email,
    staleTime: 60000
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ['allVendorProfiles'],
    queryFn: () => base44.entities.VendorProfile.list(),
    enabled: !!user?.email
  });

  const { data: myApplications = [] } = useQuery({
    queryKey: ['myApplications', user?.email],
    queryFn: () => base44.entities.JobApplication.filter({ applicant_id: user.email }),
    enabled: !!user?.email,
    staleTime: 30000
  });

  const applyMutation = useMutation({
    mutationFn: async ({ job, message }) => {
      const application = await base44.entities.JobApplication.create({
        help_request_id: job.id,
        applicant_id: user.email,
        applicant_name: profile?.full_name || user?.full_name,
        applicant_business: profile?.business_name || '',
        applicant_profile_id: profile?.id,
        message: message,
        status: 'pending'
      });

      await base44.entities.Notification.create({
        user_id: job.requester_id,
        type: 'new_application',
        title: 'New Application',
        message: `${profile?.full_name || user?.full_name} applied for "${job.title}"`,
        reference_id: job.id
      });

      return application;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myApplications']);
      toast.success('Application submitted!');
      setApplyDialog({ open: false, job: null });
      setApplicationMessage('');
    },
    onError: () => {
      toast.error('Failed to submit application');
    }
  });

  const isUrgent = (job) => {
    const eventDate = new Date(job.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= today && eventDate < dayAfterTomorrow;
  };

  const filteredJobs = (jobs || []).filter(job => {
    if (job.requester_id === user?.email) return false;
    
    if (job.paused) {
      const hasAppliedToThis = (myApplications || []).some(app => app.help_request_id === job.id);
      if (!hasAppliedToThis) return false;
    }
    
    const requesterProfile = (allProfiles || []).find(p => p.user_id === job.requester_id);
    if (requesterProfile?.suspended) {
      const hasAppliedToThis = (myApplications || []).some(app => app.help_request_id === job.id);
      if (!hasAppliedToThis) return false;
    }
    
    if (!showAllJobs && profile?.service_types?.length > 0) {
      if (!profile.service_types.includes(job.service_type)) return false;
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        job.title?.toLowerCase().includes(searchLower) ||
        job.city?.toLowerCase().includes(searchLower) ||
        job.venue_name?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    
    if (filters.service_type && job.service_type !== filters.service_type) return false;
    if (filters.help_type && job.help_type !== filters.help_type) return false;
    if (filters.state && job.state !== filters.state) return false;
    
    return true;
  }).sort((a, b) => {
    const aUrgent = isUrgent(a);
    const bUrgent = isUrgent(b);
    if (aUrgent && !bUrgent) return -1;
    if (!aUrgent && bUrgent) return 1;
    return new Date(a.event_date) - new Date(b.event_date);
  });

  const hasApplied = (jobId) => {
    return (myApplications || []).some(app => app.help_request_id === jobId);
  };

  const hasActiveSubscription = user?.subscription_status === 'active' || user?.subscription_status === 'trialing' || user?.stripe_subscription_id;

  const handleApply = (job) => {
    if (!hasActiveSubscription) {
      toast.error('Subscribe to apply for jobs');
      return;
    }
    if (!profile) {
      toast.error('Please complete your profile first');
      return;
    }
    if (profile.approval_status !== 'approved') {
      toast.error('Your profile is pending approval. You can apply once it\'s approved.');
      return;
    }
    if (hasApplied(job.id)) {
      toast.info('You have already applied to this job');
      return;
    }
    setApplyDialog({ open: true, job });
  };

  const submitApplication = () => {
    if (applyDialog.job) {
      applyMutation.mutate({ job: applyDialog.job, message: applicationMessage });
    }
  };

  const clearFilters = () => {
    setFilters({ search: '', service_type: '', help_type: '', state: '' });
  };

  const activeFiltersCount = [filters.service_type, filters.help_type, filters.state].filter(Boolean).length;

  return (
    <div className="w-full max-w-full px-2 sm:px-4 lg:max-w-6xl lg:mx-auto space-y-4 sm:space-y-6 pb-20 overflow-x-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">Available Jobs</h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">Find last-minute coverage and helper opportunities</p>
        </div>
        <Button asChild className="bg-stone-900 hover:bg-stone-800 shrink-0">
          <Link to={createPageUrl('PostRequest')}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Post Job
          </Link>
        </Button>
      </div>

      {!hasActiveSubscription && (
        <SubscriptionGate user={user} feature="applying to jobs" />
      )}

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Search by title, city, or venue..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="shrink-0"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-2 w-5 h-5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2">
            <ToggleLeft className="w-4 h-4 text-stone-600 dark:text-stone-400" />
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
              Show jobs outside my services
            </span>
          </div>
          <Switch
            checked={showAllJobs}
            onCheckedChange={setShowAllJobs}
          />
        </div>

        {showFilters && (
          <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Filter Jobs</span>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Select 
                  value={filters.service_type} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, service_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Service Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Services</SelectItem>
                    {Object.entries(serviceConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={filters.help_type} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, help_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Help Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Types</SelectItem>
                    {Object.entries(helpTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={filters.state} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, state: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All States</SelectItem>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="border-stone-200 animate-pulse">
              <CardContent className="p-5 space-y-4">
                <div className="h-6 bg-stone-200 rounded w-3/4" />
                <div className="h-4 bg-stone-100 rounded w-1/2" />
                <div className="flex gap-2">
                  <div className="h-6 bg-stone-100 rounded w-20" />
                  <div className="h-6 bg-stone-100 rounded w-24" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-stone-100 rounded" />
                  <div className="h-4 bg-stone-100 rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="space-y-6">
          {filteredJobs.some(job => isUrgent(job)) && (
            <div>
              <div className="flex items-center gap-2 mb-4 px-1">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-700 uppercase tracking-wide">
                    Urgent - Next 24 Hours
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredJobs.filter(job => isUrgent(job)).map(job => (
                  <div key={job.id} className="relative">
                    <div className="absolute -top-2 -right-2 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                      URGENT!
                    </div>
                    <div className="ring-2 ring-red-200 rounded-lg">
                      <JobCard 
                        job={job} 
                        showApplyButton={!hasApplied(job.id)} 
                        onApply={handleApply}
                      />
                    </div>
                    {hasApplied(job.id) && (
                      <div className="absolute top-3 left-3 bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1 rounded z-10">
                        Applied
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredJobs.some(job => !isUrgent(job)) && (
            <div>
              {filteredJobs.some(job => isUrgent(job)) && (
                <div className="flex items-center gap-2 mb-4 px-1">
                  <span className="text-sm font-medium text-stone-500 uppercase tracking-wide">
                    Other Available Jobs
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredJobs.filter(job => !isUrgent(job)).map(job => (
                  <div key={job.id} className="relative">
                    <JobCard 
                      job={job} 
                      showApplyButton={!hasApplied(job.id)} 
                      onApply={handleApply}
                    />
                    {hasApplied(job.id) && (
                      <div className="absolute top-3 right-3 bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1 rounded">
                        Applied
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card className="border-stone-200">
          <CardContent className="p-12 text-center">
            <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-6 h-6 text-stone-400 dark:text-stone-500" />
            </div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">No jobs found</h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm">
              {activeFiltersCount > 0 
                ? 'Try adjusting your filters to see more results'
                : 'Check back later for new opportunities'}
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={applyDialog.open} onOpenChange={(open) => setApplyDialog({ open, job: applyDialog.job })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to Job</DialogTitle>
            <DialogDescription>
              Submit your application for "{applyDialog.job?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Message (optional)</label>
              <Textarea
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                placeholder="Introduce yourself and explain why you're a great fit..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyDialog({ open: false, job: null })}>
              Cancel
            </Button>
            <Button 
              onClick={submitApplication}
              disabled={applyMutation.isLoading}
              className="bg-stone-900 hover:bg-stone-800"
            >
              {applyMutation.isLoading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}