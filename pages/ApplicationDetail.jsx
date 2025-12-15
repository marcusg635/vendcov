import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import ServiceBadge from '@/components/ui/ServiceBadge';

import {
  ArrowLeft, MapPin, Briefcase, Mail, Phone, ExternalLink,
  CheckCircle2, XCircle, Star, TrendingUp
} from 'lucide-react';

function safeNumber(n, fallback = 0) {
  const v = typeof n === 'number' ? n : parseFloat(n);
  return Number.isFinite(v) ? v : fallback;
}

function getPaymentTermsLabel(terms) {
  switch (terms) {
    case '50_50': return '50% Now / 50% Later';
    case '30_70': return '30% Now / 70% Later';
    case 'full_upfront': return 'Full Payment Upfront';
    case 'upon_completion': return 'Payment Upon Completion';
    default: return terms || '—';
  }
}

function calculatePaymentSchedule(amount, terms) {
  const a = safeNumber(amount, 0);
  switch (terms) {
    case '50_50':
      return { upfront_amount: a * 0.5, completion_amount: a * 0.5 };
    case '30_70':
      return { upfront_amount: a * 0.3, completion_amount: a * 0.7 };
    case 'full_upfront':
      return { upfront_amount: a, completion_amount: 0 };
    case 'upon_completion':
      return { upfront_amount: 0, completion_amount: a };
    default:
      return { upfront_amount: a * 0.5, completion_amount: a * 0.5 };
  }
}

export default function ApplicationDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [user, setUser] = useState(null);

  const [showCounterOfferDialog, setShowCounterOfferDialog] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);

  const [counterOffer, setCounterOffer] = useState({
    pay_amount: 0,
    payment_terms: '50_50',
    notes: ''
  });

  // ✅ Router-safe query param reading
  const applicationId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('id');
  }, [location.search]);

  // -----------------------
  // Load user (no hooks inside conditionals)
  // -----------------------
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (mounted) setUser(me);
      } catch (e) {
        console.error('Error loading user:', e);
        if (mounted) setUser(null);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // -----------------------
  // Queries (ALL unconditional)
  // -----------------------
  const {
    data: application,
    isLoading: applicationLoading,
    error: applicationError
  } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: async () => {
      if (!applicationId) return null;
      const apps = await base44.entities.JobApplication.filter({ id: applicationId });
      return apps?.[0] || null;
    },
    enabled: !!applicationId && !!user?.email,
    staleTime: 30000,
    retry: 1
  });

  const {
    data: job,
    isLoading: jobLoading,
    error: jobError
  } = useQuery({
    queryKey: ['job', application?.help_request_id],
    queryFn: async () => {
      if (!application?.help_request_id) return null;
      const jobs = await base44.entities.HelpRequest.filter({ id: application.help_request_id });
      return jobs?.[0] || null;
    },
    enabled: !!application?.help_request_id && !!user?.email,
    staleTime: 30000,
    retry: 1
  });

  const {
    data: applicantProfile,
    isLoading: profileLoading,
    error: profileError
  } = useQuery({
    queryKey: ['applicantProfile', application?.applicant_id],
    queryFn: async () => {
      if (!application?.applicant_id) return null;
      const profiles = await base44.entities.VendorProfile.filter({ user_id: application.applicant_id });
      return profiles?.[0] || null;
    },
    enabled: !!application?.applicant_id && !!user?.email,
    staleTime: 30000,
    retry: 1
  });

  const {
    data: reviews = [],
    isLoading: reviewsLoading
  } = useQuery({
    queryKey: ['applicantReviews', application?.applicant_id],
    queryFn: async () => {
      if (!application?.applicant_id) return [];
      return base44.entities.Review.filter({ reviewee_id: application.applicant_id });
    },
    enabled: !!application?.applicant_id,
    staleTime: 30000
  });

  const { data: allJobs = [] } = useQuery({
    queryKey: ['allJobsForApplicant', application?.applicant_id],
    queryFn: async () => {
      // Base44 list() might be heavy but you had it. Keeping it.
      return base44.entities.HelpRequest.list();
    },
    enabled: !!application?.applicant_id,
    staleTime: 30000
  });

  // -----------------------
  // Derived values
  // -----------------------
  const avgRating = useMemo(() => {
    if (!reviews?.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + safeNumber(r.rating, 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const ratingBreakdown = useMemo(() => {
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of reviews || []) {
      const rating = safeNumber(r.rating, 0);
      if (breakdown[rating] !== undefined) breakdown[rating] += 1;
    }
    return breakdown;
  }, [reviews]);

  const completedJobs = useMemo(() => {
    if (!allJobs?.length || !application?.applicant_id) return 0;
    return allJobs.filter(j => j.status === 'completed' && j.accepted_vendor_id === application.applicant_id).length;
  }, [allJobs, application?.applicant_id]);

  const isTopVendor = useMemo(() => {
    const highRatings = (reviews || []).filter(r => safeNumber(r.rating, 0) >= 4).length;
    return highRatings >= 3;
  }, [reviews]);

  const isRequester = useMemo(() => job?.requester_id && user?.email && job.requester_id === user.email, [job?.requester_id, user?.email]);
  const isApplicant = useMemo(() => application?.applicant_id && user?.email && application.applicant_id === user.email, [application?.applicant_id, user?.email]);

  const hasCounterOffer = useMemo(() => {
    return !!application?.counter_offer && application?.status === 'counter_offer_sent';
  }, [application?.counter_offer, application?.status]);

  const counterAccepted = useMemo(() => application?.status === 'counter_offer_accepted', [application?.status]);

  // Keep counter offer amount in sync with job pay_amount once job loads
  useEffect(() => {
    if (job?.pay_amount) {
      setCounterOffer(prev => ({ ...prev, pay_amount: safeNumber(job.pay_amount, 0) }));
    }
  }, [job?.pay_amount]);

  // -----------------------
  // Mutations
  // -----------------------
  const sendCounterOfferMutation = useMutation({
    mutationFn: async () => {
      if (!application?.id || !job?.id) throw new Error('Missing application or job');
      const schedule = calculatePaymentSchedule(counterOffer.pay_amount, counterOffer.payment_terms);

      await base44.entities.JobApplication.update(application.id, {
        status: 'counter_offer_sent',
        counter_offer: {
          pay_amount: safeNumber(counterOffer.pay_amount, 0),
          payment_terms: counterOffer.payment_terms,
          payment_schedule: schedule,
          notes: counterOffer.notes || '',
          sent_at: new Date().toISOString()
        }
      });

      await base44.entities.Notification.create({
        user_id: application.applicant_id,
        type: 'new_message',
        title: 'Counter Offer Received',
        message: `You have a counter offer for "${job.title}". Please review and respond.`,
        reference_id: job.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setShowCounterOfferDialog(false);
      toast.success('Counter offer sent');
    },
    onError: (e) => {
      console.error(e);
      toast.error('Failed to send counter offer');
    }
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!application?.id || !job?.id) throw new Error('Missing application or job');

      const finalAmount = safeNumber(job.pay_amount, 0);
      const finalTerms = 'full_upfront';
      const finalSchedule = calculatePaymentSchedule(finalAmount, finalTerms);

      await base44.entities.JobApplication.update(application.id, {
        status: 'accepted',
        final_agreed_amount: finalAmount,
        final_payment_terms: finalTerms,
        final_payment_schedule: finalSchedule
      });

      const allApps = await base44.entities.JobApplication.filter({ help_request_id: application.help_request_id });
      const otherApps = (allApps || []).filter(a => a.id !== application.id);

      for (const app of otherApps) {
        await base44.entities.JobApplication.update(app.id, { status: 'declined' });
        await base44.entities.Notification.create({
          user_id: app.applicant_id,
          type: 'application_declined',
          title: 'Application Update',
          message: `Your application for "${job.title}" was not selected`,
          reference_id: job.id
        });
      }

      await base44.entities.HelpRequest.update(job.id, {
        status: 'filled',
        accepted_vendor_id: application.applicant_id,
        accepted_vendor_name: application.applicant_name,
        pay_amount: finalAmount
      });

      await base44.entities.Notification.create({
        user_id: application.applicant_id,
        type: 'application_accepted',
        title: 'Application Accepted!',
        message: `Your application for "${job.title}" was accepted. Please review and sign the agreement.`,
        reference_id: job.id
      });

      const agreement = await base44.entities.SubcontractAgreement.create({
        help_request_id: job.id,
        requester_id: job.requester_id,
        requester_name: job.requester_name,
        requester_business: job.requester_business,
        vendor_id: application.applicant_id,
        vendor_name: application.applicant_name,
        vendor_business: application.applicant_business || '',
        event_date: job.event_date,
        event_location: `${job.venue_name || ''} ${job.city}, ${job.state}`,
        service_description: `${job.help_type} - ${job.service_type}`,
        pay_amount: finalAmount,
        payment_type: job.payment_type,
        payment_method: job.payment_method,
        requester_confirmed: true
      });

      return agreement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setShowAcceptDialog(false);
      toast.success('Applicant accepted. Agreement created.');
      navigate(createPageUrl('Agreement') + `?jobId=${job?.id}`);
    },
    onError: (e) => {
      console.error(e);
      toast.error('Failed to accept applicant');
    }
  });

  const declineMutation = useMutation({
    mutationFn: async () => {
      if (!application?.id || !job?.id) throw new Error('Missing application or job');

      await base44.entities.JobApplication.update(application.id, { status: 'declined' });
      await base44.entities.Notification.create({
        user_id: application.applicant_id,
        type: 'application_declined',
        title: 'Application Update',
        message: `Your application for "${job.title}" was not selected`,
        reference_id: job.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setShowDeclineDialog(false);
      toast.success('Application declined');
      navigate(-1);
    },
    onError: (e) => {
      console.error(e);
      toast.error('Failed to decline application');
    }
  });

  // -----------------------
  // Render guards (AFTER hooks)
  // -----------------------
  const isBooting = !user || applicationLoading || jobLoading || profileLoading || reviewsLoading;

  if (!applicationId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-stone-900">Missing application ID</h2>
        <p className="text-stone-600 mt-2">This page needs a URL like ?id=APPLICATION_ID</p>
        <Button asChild className="mt-4">
          <Link to={createPageUrl('Dashboard')}>Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  if (isBooting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (applicationError || jobError || profileError) {
    const msg =
      applicationError?.message ||
      jobError?.message ||
      profileError?.message ||
      'Something went wrong.';
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-stone-900">Error loading application</h2>
        <p className="text-stone-600 mt-2">{msg}</p>
        <Button asChild className="mt-4" onClick={() => navigate(-1)}>
          <Link to={createPageUrl('Dashboard')}>Go Back</Link>
        </Button>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-stone-900">Application not found</h2>
        <p className="text-stone-600 mt-2">This application may have been deleted.</p>
        <Button asChild className="mt-4">
          <Link to={createPageUrl('Dashboard')}>Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-stone-900">Job not found</h2>
        <p className="text-stone-600 mt-2">The job linked to this application could not be loaded.</p>
        <Button asChild className="mt-4" onClick={() => navigate(-1)}>
          <Link to={createPageUrl('Dashboard')}>Go Back</Link>
        </Button>
      </div>
    );
  }

  if (!applicantProfile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-stone-900">Vendor profile not found</h2>
        <p className="text-stone-600 mt-2">The applicant profile could not be loaded.</p>
        <Button asChild className="mt-4" onClick={() => navigate(-1)}>
          <Link to={createPageUrl('Dashboard')}>Go Back</Link>
        </Button>
      </div>
    );
  }

  // -----------------------
  // UI
  // -----------------------
  return (
    <div className="w-full max-w-4xl mx-auto pb-8 px-2 sm:px-4">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Header */}
          <Card className="border-stone-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 shrink-0">
                  <AvatarFallback className="bg-stone-100 text-stone-600 text-lg sm:text-xl">
                    {applicantProfile.full_name?.charAt(0) || 'V'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-stone-900 break-words">
                      {applicantProfile.full_name}
                    </h1>
                    {isTopVendor && (
                      <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white border-0 text-xs">
                        ⭐ Top Vendor
                      </Badge>
                    )}
                  </div>

                  {applicantProfile.business_name && (
                    <p className="text-stone-600 text-base sm:text-lg break-words">
                      {applicantProfile.business_name}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2">
                    {reviews.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-base sm:text-lg">{avgRating}</span>
                        <span className="text-xs sm:text-sm text-stone-500">({reviews.length})</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-stone-600">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                      <span className="font-medium">{completedJobs}</span>
                      <span className="text-stone-500">completed</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {applicantProfile.service_types?.map(type => (
                      <ServiceBadge key={type} type={type} size="sm" />
                    ))}
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={`${
                    application.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    application.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    application.status === 'counter_offer_sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    application.status === 'counter_offer_accepted' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    'bg-stone-100 text-stone-700'
                  } text-xs shrink-0`}
                >
                  {application.status?.replace(/_/g, ' ') || '—'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Counter offer display */}
          {hasCounterOffer && isApplicant && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-base sm:text-lg text-blue-900">Counter Offer Received</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="bg-white rounded-lg p-3 sm:p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-stone-600">Original Amount</span>
                    <span className="text-stone-500 line-through">${job?.pay_amount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-stone-900">Counter Offer Amount</span>
                    <span className="text-xl sm:text-2xl font-bold text-blue-600">
                      ${application.counter_offer?.pay_amount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-stone-600">Payment Terms</span>
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      {getPaymentTermsLabel(application.counter_offer?.payment_terms)}
                    </Badge>
                  </div>

                  {application.counter_offer?.payment_schedule && (
                    <div className="border-t border-stone-200 pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-600">Upfront Payment:</span>
                        <span className="font-medium text-stone-900">
                          ${safeNumber(application.counter_offer.payment_schedule.upfront_amount, 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-600">Upon Completion:</span>
                        <span className="font-medium text-stone-900">
                          ${safeNumber(application.counter_offer.payment_schedule.completion_amount, 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {application.counter_offer?.notes && (
                    <div className="border-t border-stone-200 pt-3">
                      <p className="text-xs text-stone-500 mb-1">Notes from requester:</p>
                      <p className="text-sm text-stone-700 break-words">{application.counter_offer.notes}</p>
                    </div>
                  )}

                  {/* NOTE: You had placeholder logic here. Leaving it as UI only, not wiring fake success. */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-3">
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => toast.message('Wire this to your "accept counter offer" mutation when ready.')}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Accept Offer
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 hover:text-red-700"
                      onClick={() => toast.message('Wire this to your "decline counter offer" mutation when ready.')}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {counterAccepted && isRequester && (
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Counter Offer Accepted</h3>
                </div>
                <p className="text-sm text-purple-800 mb-4">
                  {application.applicant_name} accepted your counter offer. Finalize the agreement to proceed.
                </p>
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => toast.message('Wire this to your "finalize agreement from counter offer" flow.')}
                >
                  Create Final Agreement
                </Button>
              </CardContent>
            </Card>
          )}

          {/* About */}
          {applicantProfile.bio && (
            <Card className="border-stone-200">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">About</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-sm sm:text-base text-stone-600 whitespace-pre-wrap break-words">
                  {applicantProfile.bio}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Application Message */}
          {application.message && (
            <Card className="border-stone-200">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Application Message</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-sm sm:text-base text-stone-600 whitespace-pre-wrap break-words">
                  {application.message}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Portfolio items */}
          {applicantProfile.portfolio_items?.length > 0 && (
            <Card className="border-stone-200">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Portfolio Examples</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <Button asChild variant="outline" className="w-full">
                  <Link to={createPageUrl('Portfolio') + `?profileId=${applicantProfile.id}`}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Portfolio ({applicantProfile.portfolio_items.length} items)
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Portfolio links */}
          {applicantProfile.portfolio_links?.length > 0 && (
            <Card className="border-stone-200">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Portfolio Links</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-2">
                  {applicantProfile.portfolio_links.map((link, index) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline break-all"
                    >
                      <ExternalLink className="w-4 h-4 shrink-0" />
                      {link}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews summary */}
          {reviews.length > 0 && (
            <Card className="border-stone-200">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Rating Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                  <div className="text-center shrink-0">
                    <div className="text-3xl sm:text-4xl font-bold text-stone-900 mb-1">{avgRating}</div>
                    <div className="flex gap-0.5 justify-center mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                            i < Math.round(parseFloat(avgRating)) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-stone-500">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                  </div>

                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = ratingBreakdown[rating];
                      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={rating} className="flex items-center gap-2">
                          <span className="text-xs text-stone-600 w-8">{rating} ★</span>
                          <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 transition-all" style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="text-xs text-stone-500 w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent reviews */}
                <div className="mt-6 space-y-4">
                  <h3 className="text-sm font-semibold text-stone-900">Recent Reviews</h3>
                  {reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="border-b border-stone-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base text-stone-900 break-words">
                            {review.reviewer_name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                                    i < safeNumber(review.rating, 0) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {review.review_type === 'requester_to_vendor' ? 'Client' : 'Vendor'}
                            </Badge>
                          </div>
                        </div>
                        <span className="text-xs text-stone-500 shrink-0">
                          {review.created_date ? format(new Date(review.created_date), 'MMM d, yyyy') : ''}
                        </span>
                      </div>

                      {review.review_text && (
                        <p className="text-xs sm:text-sm text-stone-600 mt-2 break-words">
                          {review.review_text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border-stone-200">
            <CardHeader className="p-4">
              <CardTitle className="text-sm sm:text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              {applicantProfile.email && (
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-400 shrink-0" />
                  <a href={`mailto:${applicantProfile.email}`} className="text-blue-600 hover:underline break-all">
                    {applicantProfile.email}
                  </a>
                </div>
              )}
              {applicantProfile.phone && (
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-400 shrink-0" />
                  <a href={`tel:${applicantProfile.phone}`} className="text-blue-600 hover:underline">
                    {applicantProfile.phone}
                  </a>
                </div>
              )}

              <Separator />

              <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-600">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-400 shrink-0" />
                <span className="break-words">{applicantProfile.city}, {applicantProfile.state}</span>
              </div>

              {applicantProfile.experience_years && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-600">
                  <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-400 shrink-0" />
                  <span>{applicantProfile.experience_years} years experience</span>
                </div>
              )}
            </CardContent>
          </Card>

          {applicantProfile.services_offered?.length > 0 && (
            <Card className="border-stone-200">
              <CardHeader className="p-4">
                <CardTitle className="text-sm sm:text-base">Services Offered</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-wrap gap-2">
                  {applicantProfile.services_offered.map(service => (
                    <Badge key={service} variant="outline" className="capitalize text-xs">
                      {service.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Requester actions */}
          {isRequester && application.status === 'pending' && (
            <Card className="border-stone-200">
              <CardContent className="p-3 sm:p-4 space-y-2">
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm sm:text-base"
                  onClick={() => setShowAcceptDialog(true)}
                  disabled={acceptMutation.isLoading}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Accept at Original Terms
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-blue-300 text-blue-600 hover:bg-blue-50 text-sm sm:text-base"
                  onClick={() => setShowCounterOfferDialog(true)}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Make Counter Offer
                </Button>

                <Button
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 text-sm sm:text-base"
                  onClick={() => setShowDeclineDialog(true)}
                  disabled={declineMutation.isLoading}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Decline Application
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Counter offer dialog */}
      <Dialog open={showCounterOfferDialog} onOpenChange={setShowCounterOfferDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Make Counter Offer</DialogTitle>
            <DialogDescription>
              Propose different payment terms to {application?.applicant_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-stone-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-stone-600">Original Job Posting</span>
                <Badge variant="outline">
                  ${job?.pay_amount} {job?.payment_type === 'hourly' ? '/hr' : ''}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">
                Counter Offer Amount ($)
              </label>
              <Input
                type="number"
                value={counterOffer.pay_amount}
                onChange={(e) => setCounterOffer({ ...counterOffer, pay_amount: safeNumber(e.target.value, 0) })}
                placeholder="Enter amount"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">
                Payment Terms
              </label>
              <Select
                value={counterOffer.payment_terms}
                onValueChange={(value) => setCounterOffer({ ...counterOffer, payment_terms: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_upfront">Full Payment Upfront</SelectItem>
                  <SelectItem value="50_50">50% Now / 50% Upon Completion</SelectItem>
                  <SelectItem value="30_70">30% Now / 70% Upon Completion</SelectItem>
                  <SelectItem value="upon_completion">Full Payment Upon Completion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-2">Payment Breakdown</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Upfront:</span>
                  <span className="font-medium text-blue-900">
                    ${calculatePaymentSchedule(counterOffer.pay_amount, counterOffer.payment_terms).upfront_amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Upon Completion:</span>
                  <span className="font-medium text-blue-900">
                    ${calculatePaymentSchedule(counterOffer.pay_amount, counterOffer.payment_terms).completion_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">
                Notes (Optional)
              </label>
              <Textarea
                value={counterOffer.notes}
                onChange={(e) => setCounterOffer({ ...counterOffer, notes: e.target.value })}
                placeholder="Explain why you're proposing these terms..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCounterOfferDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => sendCounterOfferMutation.mutate()}
              disabled={sendCounterOfferMutation.isLoading || !counterOffer.pay_amount}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sendCounterOfferMutation.isLoading ? 'Sending...' : 'Send Counter Offer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accept dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Accept at Original Terms</DialogTitle>
            <DialogDescription>
              Accept {application?.applicant_name} for this job at the original posted amount
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-emerald-700">Service</span>
                <span className="font-medium text-emerald-900 capitalize text-sm">
                  {job?.help_type?.replace(/_/g, ' ')} - {job?.service_type}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-emerald-700">Amount</span>
                <span className="font-bold text-xl text-emerald-900">
                  ${job?.pay_amount}{job?.payment_type === 'hourly' ? <span className="text-sm font-normal">/hr</span> : null}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-emerald-700">Payment</span>
                <span className="font-medium text-emerald-900 text-sm">Full payment upfront</span>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-stone-600 space-y-2">
              <p className="font-medium text-stone-700">By accepting, an agreement will be created and:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>All other applicants will be notified they were not selected</li>
                <li>The vendor will be notified to review and sign the agreement</li>
                <li>The job will be marked as filled</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {acceptMutation.isLoading ? 'Processing...' : 'Confirm & Accept'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline {application?.applicant_name}'s application?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-stone-600">
              The applicant will be notified that they were not selected for this job.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeclineDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => declineMutation.mutate()}
              disabled={declineMutation.isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              Decline Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
