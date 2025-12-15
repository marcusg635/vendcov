import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft } from 'lucide-react';
import JobTypeStep from '@/components/postjob/JobTypeStep';
import ManualJobForm from '@/components/postjob/ManualJobForm';
import JobPreviewStep from '@/components/postjob/JobPreviewStep';
import SubscriptionGate from '@/components/subscription/SubscriptionGate';
import { toast } from 'sonner';

/* -------------------- helpers -------------------- */

function stripEmpty(obj) {
  const out = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === 'string' && !v.trim()) return;
    if (Array.isArray(v) && v.length === 0) return;
    out[k] = v;
  });
  return out;
}

function toNumberOrUndefined(value) {
  if (value === undefined || value === null) return undefined;
  if (value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen">
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

/* ==================== MAIN PAGE ==================== */

const STEPS = [
  { id: 'type', label: 'Select Type' },
  { id: 'form', label: 'Details' },
  { id: 'preview', label: 'Review & Post' }
];

export default function PostRequest() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [step, setStep] = useState('type');
  const [isPosting, setIsPosting] = useState(false);

  const [jobData, setJobData] = useState({
    service_type: '',
    event_type: '',

    // core listing fields
    title: '',
    description: '',
    event_date: '',
    event_start_time: '',
    event_end_time: '',
    city: '',
    state: '',
    venue_name: '',
    full_address: '',
    ceremony_address: '',
    reception_address: '',
    same_location: true,

    // payment + legacy compatibility
    pay_amount: '',
    payment_type: 'flat_rate',
    payment_method: '',
    help_type: '',

    // richer/modern fields
    positions: [],
    requirements: '',
    equipment_provided: false,
    attire: '',
    parking_info: '',
    load_in_time: '',

    ai_generated_questions: []
  });

  /* ---------- load user + profile ---------- */

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const u = await base44.auth.me();
        if (!mounted) return;

        if (!u?.email) {
          toast.error('Session expired. Please sign in again.');
          navigate(createPageUrl('Login'));
          return;
        }

        setUser(u);

        const profiles = await base44.entities.VendorProfile.filter({ user_id: u.email });
        if (!mounted) return;

        setProfile(profiles?.[0] || null);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setLoadError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [navigate]);

  /* ---------- updates ---------- */

  const updateJobData = useCallback((updates) => {
    setJobData((prev) => ({ ...prev, ...updates }));
  }, []);

  const hasChosenTypes = !!jobData.service_type && !!jobData.event_type;

  const goNext = () => {
    setStep((s) => (s === 'type' ? 'form' : s === 'form' ? 'preview' : 'preview'));
  };

  const goBack = () => {
    setStep((s) => (s === 'preview' ? 'form' : s === 'form' ? 'type' : 'type'));
  };

  const isPrivileged = user?.role === 'admin' || user?.role === 'owner';

  /* ---------- submit ---------- */

  const handlePost = useCallback(async () => {
    if (!user?.email || !profile || isPosting) return;

    setIsPosting(true);

    try {
      // keep schema stable for the rest of your app
      const cleaned = stripEmpty({
        ...jobData,
        pay_amount: toNumberOrUndefined(jobData.pay_amount),
        requester_id: user.email,
        requester_name: profile?.full_name || user.full_name || user.email,
        requester_business: profile?.business_name || '',
        status: 'open'
      });

      await base44.entities.HelpRequest.create(cleaned);

      toast.success('Job posted');
      navigate(createPageUrl('MyJobs'));
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to post job');
    } finally {
      setIsPosting(false);
    }
  }, [user, profile, jobData, isPosting, navigate]);

  /* ---------- render ---------- */

  const stepIndex = STEPS.findIndex((x) => x.id === step);
  const progress = useMemo(() => ((stepIndex + 1) / STEPS.length) * 100, [stepIndex]);

  /* ---------- guards ---------- */

  if (loading) return <LoadingScreen />;

  if (loadError) {
    return <ErrorBox title="Failed to load page" error={loadError} onBack={() => navigate(-1)} />;
  }

  if (!user) {
    return <ErrorBox title="Not signed in" error="Please log in" onBack={() => navigate(-1)} />;
  }

  if (!profile && !isPrivileged) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Profile required</h2>
            <Button onClick={() => navigate(createPageUrl('CreateProfile'))}>
              Create Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasActiveSubscription =
    isPrivileged ||
    user?.subscription_status === 'active' ||
    user?.subscription_status === 'trialing' ||
    !!user?.stripe_subscription_id;

  if (!hasActiveSubscription) {
    return <SubscriptionGate user={user} feature="job posting" />;
  }

  if (profile.approval_status !== 'approved') {
    return <ErrorBox title="Profile under review" error="Pending approval" onBack={() => navigate(-1)} />;
  }

  return (
    <div className="max-w-3xl mx-auto pb-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Post a Job</h1>
          <p className="text-sm text-stone-600">
            Step {stepIndex + 1} of {STEPS.length}: {STEPS[stepIndex]?.label}
          </p>
        </div>
      </div>

      <Progress value={progress} className="mb-6" />

      <Card>
        <CardContent className="p-6">
          {step === 'type' && (
            <JobTypeStep
              jobData={jobData}
              updateJobData={updateJobData}
              onNext={goNext}
            />
          )}

          {step === 'form' && (
            <ManualJobForm
              jobData={jobData}
              initialData={jobData}
              updateJobData={updateJobData}
              onNext={goNext}
              onBack={goBack}
            />
          )}

          {step === 'preview' && (
            <JobPreviewStep
              jobData={jobData}
              onEdit={goBack}
              onPost={handlePost}
              isPosting={isPosting}
            />
          )}
        </CardContent>
      </Card>

      {/* bottom nav */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={goBack} disabled={step === 'type'}>
          Back
        </Button>

        {step !== 'preview' && (
          <Button onClick={goNext} disabled={step === 'type' && !hasChosenTypes}>
            Next
          </Button>
        )}
      </div>

      {step === 'type' && !hasChosenTypes && (
        <p className="text-xs text-amber-600 text-center mt-3">
          Select an event type and a service type to continue.
        </p>
      )}
    </div>
  );
}
