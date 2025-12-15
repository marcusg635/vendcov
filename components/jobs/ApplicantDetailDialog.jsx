import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

import { toast } from 'sonner';
import ReportUserDialog from '@/components/reports/ReportUserDialog';

import { Star, CheckCircle2, XCircle, AlertTriangle, DollarSign, Send, User } from 'lucide-react';

export default function ApplicantDetailDialog({
  open,
  onClose,
  application,
  job,
  onAccept,
  onDecline
}) {
  const queryClient = useQueryClient();

  const [counterOfferAmount, setCounterOfferAmount] = useState('');
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [reportDialog, setReportDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // ✅ Always run hooks. No early returns before hooks.
  const applicantId = application?.applicant_id || null;
  const applicationId = application?.id || null;
  const jobId = job?.id || null;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await base44.auth.me();
        if (mounted) setCurrentUser(u);
      } catch (e) {
        console.error('Error loading current user:', e);
        if (mounted) setCurrentUser(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const { data: applicantProfile } = useQuery({
    queryKey: ['applicantProfile', applicantId],
    queryFn: async () => {
      const profiles = await base44.entities.VendorProfile.filter({ user_id: applicantId });
      return profiles?.[0] || null;
    },
    enabled: !!applicantId && !!open
  });

  const { data: applicantReviews = [] } = useQuery({
    queryKey: ['applicantReviews', applicantId],
    queryFn: async () => {
      return base44.entities.Review.filter({ reviewee_id: applicantId });
    },
    enabled: !!applicantId && !!open
  });

  const { data: applicantJobs = [] } = useQuery({
    queryKey: ['applicantJobHistory', applicantId],
    queryFn: async () => {
      return base44.entities.HelpRequest.filter({ accepted_vendor_id: applicantId });
    },
    enabled: !!applicantId && !!open
  });

  const jobsWorked = applicantJobs.length;
  const jobsCompleted = applicantJobs.filter(j => j.status === 'completed' && j.payment_status === 'paid').length;

  const avgRating = useMemo(() => {
    if (!applicantReviews.length) return null;
    const sum = applicantReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return (sum / applicantReviews.length).toFixed(1);
  }, [applicantReviews]);

  // If dialog opens for a new applicant, reset form state (optional but helps UX)
  useEffect(() => {
    if (open) {
      setShowCounterForm(false);
      setCounterOfferAmount('');
    }
  }, [open, applicantId]);

  const sendCounterOfferMutation = useMutation({
    mutationFn: async () => {
      if (!applicationId || !jobId || !applicantId) throw new Error('Missing required data');

      const amount = parseFloat(counterOfferAmount);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error('Invalid counter offer amount');

      await base44.entities.JobApplication.update(applicationId, {
        status: 'counter_offer_sent',
        counter_offer: {
          ...(application?.counter_offer || {}),
          pay_amount: amount,
          sent_at: new Date().toISOString(),
          from_poster: true
        }
      });

      await base44.entities.Notification.create({
        user_id: applicantId,
        type: 'new_message',
        title: 'Counter Offer Received',
        message: `The job poster sent a counter offer of $${amount} for "${job?.title || 'this job'}"`,
        reference_id: jobId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplications', jobId] });
      toast.success('Counter offer sent');
      setShowCounterForm(false);
      setCounterOfferAmount('');
      onClose?.();
    },
    onError: (e) => {
      console.error(e);
      toast.error('Failed to send counter offer');
    }
  });

  const acceptCounterMutation = useMutation({
    mutationFn: async () => {
      if (!applicationId || !jobId || !applicantId) throw new Error('Missing required data');
      const counterAmount = application?.counter_offer?.pay_amount;

      if (!Number.isFinite(counterAmount)) throw new Error('No valid counter offer to accept');

      await base44.entities.JobApplication.update(applicationId, {
        status: 'counter_offer_accepted',
        final_agreed_amount: counterAmount
      });

      await base44.entities.HelpRequest.update(jobId, {
        pay_amount: counterAmount
      });

      await base44.entities.Notification.create({
        user_id: applicantId,
        type: 'new_message',
        title: 'Counter Offer Accepted',
        message: `Your counter offer of $${counterAmount} was accepted for "${job?.title || 'this job'}"`,
        reference_id: jobId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplications', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      toast.success('Counter offer accepted');
      onClose?.();
    },
    onError: (e) => {
      console.error(e);
      toast.error('Failed to accept counter offer');
    }
  });

  // ✅ Render guard AFTER hooks
  if (!application || !job) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Application Details</span>
              <Badge
                className={
                  application.status === 'pending' || application.status === 'counter_offer_sent'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : application.status === 'accepted' || application.status === 'counter_offer_accepted'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-stone-100 text-stone-600'
                }
              >
                {(application.status || '').replace(/_/g, ' ') || '—'}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Job Info */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-medium text-blue-700 mb-1">Job</p>
              <p className="font-semibold text-blue-900">{job.title}</p>
              <p className="text-sm text-blue-700 mt-1">
                {job.city}, {job.state} • {job.event_date}
              </p>
            </div>

            {/* Applicant Profile */}
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                {applicantProfile?.selfie_url ? (
                  <img
                    src={applicantProfile.selfie_url}
                    alt={application.applicant_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-stone-100 text-stone-600 text-xl">
                    {application.applicant_name?.charAt(0) || 'V'}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="flex-1">
                <h3 className="font-bold text-xl text-stone-900">{application.applicant_name}</h3>
                {application.applicant_business && <p className="text-stone-600">{application.applicant_business}</p>}

                {applicantProfile?.city && applicantProfile?.state && (
                  <p className="text-sm text-stone-500 mt-1">📍 {applicantProfile.city}, {applicantProfile.state}</p>
                )}

                {applicantProfile?.experience_years && (
                  <p className="text-sm text-stone-500">{applicantProfile.experience_years} years experience</p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-stone-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-stone-900">{jobsWorked}</p>
                <p className="text-xs text-stone-600">Jobs Worked</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-emerald-900">{jobsCompleted}</p>
                <p className="text-xs text-emerald-700">Completed</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-center">
                {avgRating ? (
                  <>
                    <p className="text-2xl font-bold text-amber-900">{avgRating} ⭐</p>
                    <p className="text-xs text-amber-700">{applicantReviews.length} reviews</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-stone-400">—</p>
                    <p className="text-xs text-stone-500">No reviews</p>
                  </>
                )}
              </div>
            </div>

            {/* Bio */}
            {applicantProfile?.bio && (
              <div>
                <h4 className="font-semibold text-stone-900 mb-2">About</h4>
                <p className="text-sm text-stone-600 whitespace-pre-wrap">{applicantProfile.bio}</p>
              </div>
            )}

            {/* Recent Reviews */}
            {applicantReviews.length > 0 && (
              <div>
                <h4 className="font-semibold text-stone-900 mb-3">Recent Reviews</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {applicantReviews.slice(0, 3).map((review) => (
                    <div key={review.id || `${review.reviewer_name}-${review.created_date}`} className="bg-stone-50 p-3 rounded border border-stone-200">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= (Number(review.rating) || 0)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-stone-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-stone-500">by {review.reviewer_name}</span>
                      </div>
                      {review.review_text && <p className="text-sm text-stone-600 mt-1">{review.review_text}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Preview */}
            {applicantProfile?.portfolio_items?.length > 0 && (
              <div>
                <h4 className="font-semibold text-stone-900 mb-2">Portfolio Preview</h4>
                <div className="grid grid-cols-3 gap-2">
                  {applicantProfile.portfolio_items
                    .filter(item => item?.type === 'image' && item?.image_url)
                    .slice(0, 6)
                    .map((item, idx) => (
                      <a key={`${item.image_url}-${idx}`} href={item.image_url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={item.image_url}
                          alt={item.title || 'Portfolio'}
                          className="w-full h-24 object-cover rounded border border-stone-200 hover:opacity-75 transition-opacity"
                        />
                      </a>
                    ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Application Message */}
            {application.message && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Application Message</h4>
                <p className="text-sm text-blue-800 whitespace-pre-wrap">{application.message}</p>
              </div>
            )}

            {/* Counter Offer Section */}
            {application.counter_offer && (
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Counter Offer from Applicant
                </h4>

                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold text-purple-900">
                    ${application.counter_offer.pay_amount}
                  </span>
                  <span className="text-sm text-purple-700">(Original: ${job.pay_amount})</span>
                </div>

                {(application.status === 'pending' || application.status === 'counter_offer_sent') && !showCounterForm && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => acceptCounterMutation.mutate()}
                      disabled={acceptCounterMutation.isLoading}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Accept ${application.counter_offer.pay_amount}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCounterForm(true)}
                      className="text-purple-700"
                    >
                      <DollarSign className="w-3 h-3 mr-1" />
                      Counter Back
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Poster Counter Form */}
            {showCounterForm && (
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <h4 className="font-semibold text-amber-900 mb-3">Your Counter Offer</h4>
                <div className="space-y-3">
                  <div>
                    <Label>Your Offer Amount ($)</Label>
                    <Input
                      type="number"
                      value={counterOfferAmount}
                      onChange={(e) => setCounterOfferAmount(e.target.value)}
                      placeholder="Enter amount"
                      min="0"
                    />
                    <p className="text-xs text-amber-700 mt-1">
                      Applicant asked for ${application.counter_offer?.pay_amount ?? 'N/A'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => sendCounterOfferMutation.mutate()}
                      disabled={!counterOfferAmount || sendCounterOfferMutation.isLoading}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Send Counter
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowCounterForm(false);
                        setCounterOfferAmount('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              {(application.status === 'pending' || application.status === 'counter_offer_accepted') && job.status === 'open' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      onAccept?.(application);
                      onClose?.();
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Accept & Hire
                  </Button>

                  <Button
                    onClick={() => {
                      onDecline?.(application);
                      onClose?.();
                    }}
                    variant="outline"
                    className="flex-1 text-red-600 hover:text-red-700"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                </div>
              )}

              <Button asChild variant="outline" className="w-full">
                <Link to={createPageUrl('PublicProfile') + `?userId=${applicantId}`}>
                  <User className="w-4 h-4 mr-2" />
                  View Full Profile
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 border-red-200"
                onClick={() => setReportDialog(true)}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Report User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ReportUserDialog
        open={reportDialog}
        onClose={() => setReportDialog(false)}
        reportedUser={{
          id: applicantId,
          name: application.applicant_name
        }}
        jobId={jobId}
        reporterName={currentUser?.full_name}
      />
    </>
  );
}
