import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Clock, DollarSign, MapPin, User, CheckCircle2, Flag, Undo2, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import JobStatusIndicator from '@/components/jobs/JobStatusIndicator';
import TimeClockCard from '@/components/job/TimeClockCard';
import { toast } from 'sonner';

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800" />
    </div>
  );
}

function ErrorBox({ title, error, onBack }) {
  return (
    <div className="max-w-xl mx-auto p-6">
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 space-y-3">
          <h2 className="text-lg font-bold text-red-900">{title}</h2>
          <pre className="text-xs bg-white/70 p-3 rounded border border-red-200">
            {String(error?.message || error || 'Unknown error')}
          </pre>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack}>Back</Button>
            <Button onClick={() => window.location.reload()}>Reload</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1 py-2">
      <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <p className="text-sm text-stone-900 whitespace-pre-line">{value}</p>
    </div>
  );
}

export default function JobDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('id');

  const [user, setUser] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const u = await base44.auth.me();
        if (!mounted) return;
        setUser(u || null);

        if (!jobId) {
          setLoadError('No job id provided');
          return;
        }

        const record = await base44.entities.HelpRequest.get(jobId);
        if (!mounted) return;
        setJob(record || null);

        if (record?.accepted_vendor_id) {
          const vendorProfiles = await base44.entities.VendorProfile.filter({ user_id: record.accepted_vendor_id });
          if (!mounted) return;
          setVendorProfile(vendorProfiles?.[0] || null);
        }
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setLoadError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [jobId]);

  const isPrivileged = user?.role === 'admin' || user?.role === 'owner';
  const hasActiveSubscription = useMemo(() => {
    if (isPrivileged) return true;
    return (
      user?.subscription_status === 'active' ||
      user?.subscription_status === 'trialing' ||
      user?.subscription_granted_by_admin ||
      !!user?.stripe_subscription_id
    );
  }, [isPrivileged, user?.subscription_status, user?.subscription_granted_by_admin, user?.stripe_subscription_id]);

  const isRequester = job?.requester_id === user?.email;
  const isVendor = job?.accepted_vendor_id === user?.email;

  const refreshJob = async () => {
    const record = await base44.entities.HelpRequest.get(jobId);
    setJob(record || null);
  };

  const updateJob = async (updates, successMessage) => {
    if (!job?.id) return;
    setActionLoading(true);
    try {
      await base44.entities.HelpRequest.update(job.id, updates);
      await refreshJob();
      if (successMessage) toast.success(successMessage);
    } catch (err) {
      toast.error(err?.message || 'Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkComplete = () =>
    updateJob({ status: 'completed', job_status: 'done' }, 'Marked as complete');

  const handleMarkPaid = () =>
    updateJob({ payment_status: 'paid' }, 'Marked as paid');

  const handleReopen = () =>
    updateJob({ status: 'open', accepted_vendor_id: null, accepted_vendor_name: null, job_status: 'open' }, 'Job reopened and vendor cleared');

  const handleReport = async () => {
    if (!job?.accepted_vendor_id) return;
    try {
      await base44.entities.UserReport.create({
        reporter_id: user.email,
        reported_user_id: job.accepted_vendor_id,
        reason: 'Issue with hired vendor',
        help_request_id: job.id,
        status: 'open'
      });
      toast.success('Report submitted to admins');
    } catch (err) {
      toast.error(err?.message || 'Failed to submit report');
    }
  };

  if (loading) return <LoadingScreen />;
  if (loadError) return <ErrorBox title="Unable to load job" error={loadError} onBack={() => navigate(-1)} />;
  if (!job) return <ErrorBox title="Job not found" error="This listing may have been removed." onBack={() => navigate(-1)} />;

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Job Details</h1>
          <p className="text-sm text-stone-600">Review the full request and related info.</p>
        </div>
      </div>

      {!hasActiveSubscription && (
        <Card className="border-amber-200 bg-amber-50 mb-4">
          <CardContent className="p-4 text-sm text-amber-800">
            Viewing is limited without an active subscription. Upgrade to unlock actions like applying or messaging.
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl">{job.title || 'Untitled listing'}</CardTitle>
            <div className="flex flex-wrap gap-2 items-center text-sm text-stone-600">
              {job.city || job.state ? (
                <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.city}{job.state ? `, ${job.state}` : ''}</span>
              ) : null}
              {job.event_date ? (
                <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" /> {format(new Date(job.event_date), 'MMM d, yyyy')}</span>
              ) : null}
              {job.pay_amount ? (
                <span className="inline-flex items-center gap-1"><DollarSign className="w-4 h-4" /> {job.pay_amount}</span>
              ) : null}
            </div>
          </div>
          <JobStatusIndicator status={job.status} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {job.service_type && <Badge variant="secondary">{job.service_type}</Badge>}
            {job.event_type && <Badge variant="outline">{job.event_type}</Badge>}
            {job.help_type && <Badge variant="outline">{job.help_type}</Badge>}
          </div>

          <Separator />

          <DetailRow label="Description" value={job.description} />
          <DetailRow label="Venue" value={job.venue_name || job.full_address} />
          <DetailRow label="Schedule" value={[job.event_start_time, job.event_end_time].filter(Boolean).join(' - ')} />
          <DetailRow label="Requirements" value={job.requirements} />
          <DetailRow label="Attire" value={job.attire} />
          <DetailRow label="Parking" value={job.parking_info} />
          <DetailRow label="Notes" value={job.additional_notes} />

          {job.positions?.length ? (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-stone-500">Positions</p>
              <div className="flex flex-wrap gap-2">
                {job.positions.map((pos) => (
                  <Badge key={pos} variant="outline">{pos}</Badge>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-2">
            {hasActiveSubscription && (
              <Button asChild>
                <Link to={createPageUrl(`Chat?jobId=${job.id}`)}>Message requester</Link>
              </Button>
            )}
            {isPrivileged && (
              <Button variant="outline" asChild>
                <Link to={createPageUrl(`EditRequest?id=${job.id}`)}>Edit job</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {job.accepted_vendor_id && (
        <Card className="mb-6">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-stone-500" />
              <div>
                <p className="text-sm text-stone-500">Hired Vendor</p>
                <p className="text-lg font-semibold text-stone-900">{job.accepted_vendor_name || job.accepted_vendor_id}</p>
                {vendorProfile?.service_types && (
                  <p className="text-xs text-stone-500">{vendorProfile.service_types.join(', ')}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to={createPageUrl(`Chat?jobId=${job.id}`)}>Message {isRequester ? 'vendor' : 'client'}</Link>
              </Button>
              {isRequester && (
                <Button variant="outline" onClick={handleReport} disabled={actionLoading}>
                  <Flag className="w-4 h-4 mr-2" />
                  Report
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-stone-50">
                <p className="text-xs text-stone-500">Status</p>
                <p className="font-semibold text-stone-900 capitalize">{job.job_status || job.status}</p>
              </div>
              <div className="p-3 rounded-lg bg-stone-50">
                <p className="text-xs text-stone-500">Payment</p>
                <p className="font-semibold text-stone-900">{job.payment_status === 'paid' ? 'Paid' : 'Pending'}</p>
              </div>
              <div className="p-3 rounded-lg bg-stone-50">
                <p className="text-xs text-stone-500">Clocked Hours</p>
                <p className="font-semibold text-stone-900">{job.total_hours ? `${job.total_hours.toFixed(2)} hrs` : 'Not started'}</p>
              </div>
            </div>

            {(isRequester || isPrivileged) && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleMarkComplete} disabled={actionLoading || job.status === 'completed'} className="bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark Complete
                </Button>
                <Button onClick={handleMarkPaid} variant="outline" disabled={actionLoading || job.payment_status === 'paid'}>
                  <Wallet className="w-4 h-4 mr-2" />
                  Mark Paid
                </Button>
                <Button onClick={handleReopen} variant="ghost" disabled={actionLoading}>
                  <Undo2 className="w-4 h-4 mr-2" />
                  Cancel & Reopen
                </Button>
              </div>
            )}

            {(isVendor || isRequester || isPrivileged) && (
              <TimeClockCard job={job} user={user} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
