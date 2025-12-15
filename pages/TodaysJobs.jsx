import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, isToday } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ServiceBadge from '@/components/ui/ServiceBadge';
import HelpTypeBadge from '@/components/ui/HelpTypeBadge';
import { Calendar, Clock, MapPin, DollarSign, User, Briefcase, ArrowRight, AlertCircle } from 'lucide-react';

export default function TodaysJobs() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  // Get all filled jobs
  const { data: allJobs = [], isLoading } = useQuery({
    queryKey: ['todaysJobs'],
    queryFn: () => base44.entities.HelpRequest.filter({ status: 'filled' }),
    enabled: !!user?.email
  });

  // Filter jobs for today
  const todaysJobs = allJobs.filter(job => {
    try {
      return isToday(new Date(job.event_date));
    } catch {
      return false;
    }
  });

  // Jobs where I'm the vendor
  const myVendorJobs = todaysJobs.filter(job => job.accepted_vendor_id === user?.email);

  // Jobs where I'm the requester
  const myRequesterJobs = todaysJobs.filter(job => job.requester_id === user?.email);

  const JobCard = ({ job, role }) => {
    const showVendorInfo = role === 'requester';
    const isClockedIn = job.clock_in_time && !job.clock_out_time;

    return (
      <Link to={createPageUrl(`JobDetails?id=${job.id}`)}>
        <Card className="border-stone-200 hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-stone-900 line-clamp-1 mb-1">{job.title}</h3>
                <p className="text-sm text-stone-500">
                  {showVendorInfo ? `Vendor: ${job.accepted_vendor_name}` : `Client: ${job.requester_business || job.requester_name}`}
                </p>
              </div>
              <div className="flex flex-col gap-2 items-end shrink-0">
                <Badge 
                  variant="outline" 
                  className={
                    job.job_status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    job.job_status === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    job.job_status === 'in_route' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-stone-100 text-stone-700'
                  }
                >
                  {job.job_status?.replace('_', ' ')}
                </Badge>
                {isClockedIn && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse">
                    Clocked In
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <ServiceBadge type={job.service_type} size="sm" />
              <HelpTypeBadge type={job.help_type} size="sm" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm text-stone-600">
              {(job.event_start_time || job.event_end_time) && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  {job.event_start_time} - {job.event_end_time}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                {job.city}, {job.state}
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-stone-400" />
                ${job.pay_amount} ({job.payment_type})
              </div>
              {job.venue_name && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  {job.venue_name}
                </div>
              )}
            </div>

            {job.total_hours > 0 && (
              <div className="mt-3 pt-3 border-t border-stone-100 flex justify-between text-sm">
                <span className="text-stone-600">Hours Logged:</span>
                <span className="font-semibold text-stone-900">{job.total_hours.toFixed(2)} hrs</span>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  };

  const EmptyState = ({ icon: Icon, title, description }) => (
    <Card className="border-stone-200">
      <CardContent className="p-12 text-center">
        <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="w-6 h-6 text-stone-400" />
        </div>
        <h3 className="font-semibold text-stone-900 mb-1">{title}</h3>
        <p className="text-stone-500 text-sm">{description}</p>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Today's Jobs</h1>
        <p className="text-stone-600 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Jobs I'm Working (Vendor) */}
      {myVendorJobs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-stone-600" />
            <h2 className="text-lg font-semibold text-stone-900">Jobs I'm Working ({myVendorJobs.length})</h2>
          </div>
          <div className="grid gap-4">
            {myVendorJobs.map(job => (
              <JobCard key={job.id} job={job} role="vendor" />
            ))}
          </div>
        </div>
      )}

      {/* My Jobs Being Worked (Requester) */}
      {myRequesterJobs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-stone-600" />
            <h2 className="text-lg font-semibold text-stone-900">My Jobs Being Worked ({myRequesterJobs.length})</h2>
          </div>
          <div className="grid gap-4">
            {myRequesterJobs.map(job => (
              <JobCard key={job.id} job={job} role="requester" />
            ))}
          </div>
        </div>
      )}

      {/* No Jobs Today */}
      {myVendorJobs.length === 0 && myRequesterJobs.length === 0 && (
        <EmptyState
          icon={Calendar}
          title="No jobs scheduled for today"
          description="Check back when you have jobs scheduled for today"
        />
      )}
    </div>
  );
}