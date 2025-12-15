import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Clock, DollarSign, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import JobStatusIndicator from '@/components/jobs/JobStatusIndicator';

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
      !!user?.stripe_subscription_id
    );
  }, [isPrivileged, user?.subscription_status, user?.stripe_subscription_id]);

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
    </div>
  );
}
