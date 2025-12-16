import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Clock,
  DollarSign,
  MapPin,
  Star,
  Repeat2,
  CheckCircle2,
  Wallet,
  UserRound,
  FileText,
  Paperclip
} from 'lucide-react';
import { ArrowLeft, Clock, DollarSign, MapPin, Star, Repeat2, CheckCircle2, Wallet, UserRound } from 'lucide-react';
import { format } from 'date-fns';
import JobStatusIndicator from '@/components/jobs/JobStatusIndicator';
import JobStatusCard from '@/components/job/JobStatusCard';
import TimeClockCard from '@/components/job/TimeClockCard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('id');

  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const u = await base44.auth.me();
        if (!mounted) return;
        setUser(u || null);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setUser(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const {
    data: job,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['job'],
    queryFn: async () => {
      if (!jobId) throw new Error('No job id provided');
      return base44.entities.HelpRequest.get(jobId);
    },
    enabled: !!jobId
  });

  const { data: acceptedProfile } = useQuery({
    queryKey: ['acceptedProfile', job?.accepted_vendor_id],
    queryFn: async () => {
      const profiles = await base44.entities.VendorProfile.filter({ user_id: job.accepted_vendor_id });
      return profiles?.[0] || null;
    },
    enabled: !!job?.accepted_vendor_id
  });

  const { data: acceptedReviews = [] } = useQuery({
    queryKey: ['acceptedReviews', job?.accepted_vendor_id],
    queryFn: async () => base44.entities.Review.filter({ reviewee_id: job.accepted_vendor_id }),
    enabled: !!job?.accepted_vendor_id
  });

  const acceptedRating = useMemo(() => {
    if (!acceptedReviews.length) return null;
    const sum = acceptedReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return (sum / acceptedReviews.length).toFixed(1);
  }, [acceptedReviews]);

  const { data: myApplication } = useQuery({
    queryKey: ['myApplicationStatus', jobId, user?.email],
    queryFn: async () => {
      const apps = await base44.entities.JobApplication.filter({
        help_request_id: jobId,
        applicant_id: user.email
      });
      return apps?.[0] || null;
    },
    enabled: !!jobId && !!user?.email
  });

  const isPrivileged = user?.role === 'admin' || user?.role === 'owner';
  const hasActiveSubscription = useMemo(() => {
    if (isPrivileged) return true;
    if (user?.subscription_granted_by_admin) {
      if (!user?.subscription_end_date) return true;
      return new Date(user.subscription_end_date) > new Date();
    }
    return (
      user?.subscription_status === 'active' ||
      user?.subscription_status === 'trialing' ||
      !!user?.stripe_subscription_id
    );
  }, [isPrivileged, user?.subscription_end_date, user?.subscription_granted_by_admin, user?.subscription_status, user?.stripe_subscription_id]);

  const isRequester = job?.requester_id === user?.email;
  const isAcceptedVendor = job?.accepted_vendor_id === user?.email;
  const canSeePrivateDetails = isRequester || isAcceptedVendor;

  const { data: requesterProfile } = useQuery({
    queryKey: ['requesterProfile', job?.requester_id],
    queryFn: async () => {
      const profiles = await base44.entities.VendorProfile.filter({ user_id: job.requester_id });
      return profiles?.[0] || null;
    },
    enabled: !!job?.requester_id
  });

  const markComplete = useMutation({
    mutationFn: async () => {
      if (!job?.id) return;
      await base44.entities.HelpRequest.update(job.id, {
        status: 'completed',
        job_status: 'done'
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['job'] });
      refetch();
      toast.success('Marked as complete');
    },
    onError: (err) => toast.error(err?.message || 'Unable to mark complete')
  });

  const markPaid = useMutation({
    mutationFn: async () => {
      if (!job?.id) return;
      await base44.entities.HelpRequest.update(job.id, { payment_status: 'paid' });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['job'] });
      refetch();
      toast.success('Payment recorded');
    },
    onError: (err) => toast.error(err?.message || 'Unable to update payment')
  });

  const cancelHire = useMutation({
    mutationFn: async () => {
      if (!job?.id) return;
      await base44.entities.HelpRequest.update(job.id, {
        accepted_vendor_id: null,
        accepted_vendor_name: null,
        status: 'open',
        job_status: 'pending'
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['job'] });
      refetch();
      toast.success('Applicant removed and job reopened');
    },
    onError: (err) => toast.error(err?.message || 'Unable to cancel and repost')
  });

  const uploadDocument = useMutation({
    mutationFn: async (file) => {
      const upload = await base44.integrations.Core.UploadFile({ file });
      const docs = Array.isArray(job?.shared_documents) ? job.shared_documents : [];

      const newDoc = {
        url: upload.file_url,
        name: file.name,
        uploaded_by: user?.email,
        uploaded_at: new Date().toISOString()
      };

      await base44.entities.HelpRequest.update(job.id, {
        shared_documents: [...docs, newDoc]
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['job'] });
      toast.success('Document uploaded');
    },
    onError: (err) => toast.error(err?.message || 'Failed to upload document')
  });

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorBox title="Unable to load job" error={error} onBack={() => navigate(-1)} />;
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
          <DetailRow
            label="Venue"
            value={
              canSeePrivateDetails
                ? job.venue_name || job.full_address
                : job.venue_name || [job.city, job.state].filter(Boolean).join(', ') || 'Exact location shared after hire'
            }
          />
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

      {myApplication?.status === 'declined' && (
        <Card className="border-red-200 bg-red-50 mb-4">
          <CardContent className="p-4 text-sm text-red-800">
            Your application for this job was not selected.
          </CardContent>
        </Card>
      )}

      {job.accepted_vendor_id && !canSeePrivateDetails && (
        <Card className="border-stone-200 bg-stone-50 mb-6">
          <CardContent className="p-4 text-sm text-stone-700">
            This job has been filled. Details like status, time clock, and applicant info are available only to the requester and the accepted applicant.
          </CardContent>
        </Card>
      )}

      {job.accepted_vendor_id && canSeePrivateDetails ? (
      {job.accepted_vendor_id ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card className="lg:col-span-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <UserRound className="w-5 h-5" />
                Hired Talent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {acceptedProfile?.selfie_url ? (
                    <img src={acceptedProfile.selfie_url} alt={acceptedProfile.full_name || 'Applicant'} className="w-full h-full object-cover" />
                  ) : (
                    <AvatarFallback className="bg-stone-100 text-stone-600 text-lg">
                      {acceptedProfile?.full_name?.[0] || 'A'}
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline">{job.accepted_vendor_name || job.accepted_vendor_id}</Badge>
                    {acceptedRating && (
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                        <Star className="w-4 h-4" /> {acceptedRating} ({acceptedReviews.length} reviews)
                      </Badge>
                    )}
                    {acceptedProfile?.business_name && <Badge variant="secondary">{acceptedProfile.business_name}</Badge>}
                  </div>
                  {acceptedProfile?.bio && (
                    <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line mt-2">{acceptedProfile.bio}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link to={createPageUrl(`PublicProfile?userId=${acceptedProfile?.user_id || job.accepted_vendor_id}`)}>
                    View Profile
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-blue-200">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline">{job.accepted_vendor_name || job.accepted_vendor_id}</Badge>
                {acceptedRating && (
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                    <Star className="w-4 h-4" /> {acceptedRating} ({acceptedReviews.length} reviews)
                  </Badge>
                )}
                {acceptedProfile?.business_name && <Badge variant="secondary">{acceptedProfile.business_name}</Badge>}
              </div>

              {acceptedProfile?.bio && (
                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{acceptedProfile.bio}</p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link to={createPageUrl(`PublicProfile?id=${acceptedProfile?.id || job.accepted_vendor_id}`)}>
                    View Profile
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link to={createPageUrl(`Chat?jobId=${job.id}&user=${job.accepted_vendor_id}`)}>
                    Message {job.accepted_vendor_name || 'applicant'}
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to={createPageUrl(`ReportProblem?userId=${job.accepted_vendor_id}&type=user_report`)}>
                  <Link to={createPageUrl(`ReportProblem?userId=${job.accepted_vendor_id}`)}>
                    Report Applicant
                  </Link>
                </Button>
              </div>

              <Separator />

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-stone-700">
                  <Clock className="w-4 h-4 text-stone-500" />
                  Status: {job.job_status ? job.job_status.replace(/_/g, ' ') : 'pending'}
                </div>
                <div className="flex items-center gap-2 text-sm text-stone-700">
                  <DollarSign className="w-4 h-4 text-stone-500" />
                  Pay: {job.pay_amount || '—'} {job.payment_type === 'hourly' ? '/hr' : ''}
                </div>
                {job.total_hours && (
                  <div className="flex items-center gap-2 text-sm text-stone-700">
                    <Clock className="w-4 h-4 text-stone-500" />
                    Hours: {job.total_hours}h
                  </div>
                )}
                {job.payment_status && (
                  <div className="flex items-center gap-2 text-sm text-stone-700">
                    <Wallet className="w-4 h-4 text-stone-500" />
                    Payment Status: {(job.payment_status || '').replace(/_/g, ' ')}
                  </div>
                )}
              </div>

              {(job.requester_id === user?.email || job.accepted_vendor_id === user?.email) && (
              {job.requester_id === user?.email && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="border-amber-200 text-amber-700"
                    onClick={() => cancelHire.mutate()}
                    disabled={cancelHire.isLoading || job.requester_id !== user?.email}
                    disabled={cancelHire.isLoading}
                  >
                    <Repeat2 className="w-4 h-4 mr-2" />
                    Cancel applicant & reopen
                  </Button>
                  <Button
                    variant="outline"
                    className="border-purple-200 text-purple-700"
                    onClick={() => markComplete.mutate()}
                    disabled={markComplete.isLoading}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark job complete
                  </Button>
                  <Button
                    variant="outline"
                    className="border-emerald-200 text-emerald-700"
                    onClick={() => markPaid.mutate()}
                    disabled={markPaid.isLoading || job.requester_id !== user?.email}
                    disabled={markPaid.isLoading}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Mark paid
                  </Button>
                </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <JobStatusCard job={job} user={user} />
              <TimeClockCard job={job} user={user} />

            <Card className="border-stone-200">
              <CardHeader>
                <CardTitle className="text-lg">Hiring Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {requesterProfile?.selfie_url ? (
                      <img src={requesterProfile.selfie_url} alt={job.requester_name || 'Requester'} className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-stone-100 text-stone-600">
                        {(requesterProfile?.full_name || job.requester_name || 'R')?.[0]}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-semibold text-stone-900">{job.requester_name || job.requester_id}</p>
                    {requesterProfile?.business_name && (
                      <p className="text-sm text-stone-600">{requesterProfile.business_name}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" asChild>
                    <Link to={createPageUrl(`PublicProfile?userId=${job.requester_id}`)}>
                      View Profile
                    </Link>
                  </Button>
                  <Button variant="outline" className="border-blue-200" asChild>
                    <Link to={createPageUrl(`Chat?jobId=${job.id}&user=${job.requester_id}`)}>
                      Message Poster
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to={createPageUrl(`ReportProblem?userId=${job.requester_id}&type=user_report`)}>
                      Report Poster
                    </Link>
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" asChild>
                    <Link to={createPageUrl(`Agreement?jobId=${job.id}`)}>
                      View signed agreement
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-purple-200 text-purple-700"
                    onClick={() => markComplete.mutate()}
                    disabled={markComplete.isLoading}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark complete
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-stone-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Shared Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-stone-600">Upload files for both parties to access.</p>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadDocument.mutate(file);
                  }}
                  disabled={uploadDocument.isLoading}
                />

                {Array.isArray(job?.shared_documents) && job.shared_documents.length > 0 ? (
                  <div className="space-y-2">
                    {job.shared_documents.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-700 hover:underline"
                      >
                        <FileText className="w-4 h-4" /> {doc.name || `Document ${idx + 1}`} (uploaded by {doc.uploaded_by || '—'})
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-stone-500">No documents uploaded yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {isRequester && !job.accepted_vendor_id && (
        <div className="mb-6 space-y-4">
          <JobStatusCard job={job} user={user} />
        </div>
      )}
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <JobStatusCard job={job} user={user} />
            <TimeClockCard job={job} user={user} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
