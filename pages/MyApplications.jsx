import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import ServiceBadge from '@/components/ui/ServiceBadge';
import { toast } from 'sonner';
import {
  Calendar, MapPin, DollarSign, TrendingUp,
  CheckCircle2, XCircle, AlertCircle, ArrowRight, Send
} from 'lucide-react';

export default function MyApplications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [respondDialog, setRespondDialog] = useState({ open: false, application: null });

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['myApplications', user?.email],
    queryFn: () => base44.entities.JobApplication.filter({ applicant_id: user.email }, '-created_date'),
    enabled: !!user?.email
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['appliedJobs', applications.map(a => a.help_request_id)],
    queryFn: async () => {
      if (applications.length === 0) return [];
      const allJobs = await base44.entities.HelpRequest.list();
      return allJobs.filter(job => applications.some(app => app.help_request_id === job.id));
    },
    enabled: applications.length > 0
  });

  const acceptCounterOfferMutation = useMutation({
    mutationFn: async (applicationId) => {
      const app = applications.find(a => a.id === applicationId);
      
      await base44.entities.JobApplication.update(applicationId, {
        status: 'counter_offer_accepted',
        applicant_counter_response: {
          accepted: true,
          message: 'Counter offer accepted',
          responded_at: new Date().toISOString()
        },
        final_agreed_amount: app.counter_offer.pay_amount,
        final_payment_terms: app.counter_offer.payment_terms,
        final_payment_schedule: app.counter_offer.payment_schedule
      });

      const job = jobs.find(j => j.id === app.help_request_id);
      
      await base44.entities.Notification.create({
        user_id: job.requester_id,
        type: 'new_message',
        title: 'Counter Offer Accepted',
        message: `${user.full_name} accepted your counter offer for "${job.title}"`,
        reference_id: job.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setRespondDialog({ open: false, application: null });
      toast.success('Counter offer accepted! Waiting for final agreement.');
    }
  });

  const declineCounterOfferMutation = useMutation({
    mutationFn: async (applicationId) => {
      const app = applications.find(a => a.id === applicationId);
      
      await base44.entities.JobApplication.update(applicationId, {
        status: 'counter_offer_declined',
        applicant_counter_response: {
          accepted: false,
          message: 'Counter offer declined',
          responded_at: new Date().toISOString()
        }
      });

      const job = jobs.find(j => j.id === app.help_request_id);
      
      await base44.entities.Notification.create({
        user_id: job.requester_id,
        type: 'new_message',
        title: 'Counter Offer Declined',
        message: `${user.full_name} declined your counter offer for "${job.title}"`,
        reference_id: job.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setRespondDialog({ open: false, application: null });
      toast.success('Counter offer declined');
    }
  });

  const getPaymentTermsLabel = (terms) => {
    switch (terms) {
      case '50_50': return '50% Now / 50% Later';
      case '30_70': return '30% Now / 70% Later';
      case 'full_upfront': return 'Full Payment Upfront';
      case 'upon_completion': return 'Payment Upon Completion';
      default: return terms;
    }
  };

  const pendingCounterOffers = applications.filter(app => app.status === 'counter_offer_sent');

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900">My Applications</h1>
        <p className="text-sm text-stone-600 mt-1">Track your job applications and respond to offers</p>
      </div>

      {/* Pending Counter Offers */}
      {pendingCounterOffers.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-base sm:text-lg text-blue-900">
                Counter Offers Pending ({pendingCounterOffers.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
            {pendingCounterOffers.map(app => {
              const job = jobs.find(j => j.id === app.help_request_id);
              if (!job) return null;
              
              return (
                <Card key={app.id} className="border-blue-300 bg-white">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-stone-900 break-words mb-1">{job.title}</h3>
                        <p className="text-xs sm:text-sm text-stone-600 mb-2">
                          Counter: ${app.counter_offer.pay_amount} • {getPaymentTermsLabel(app.counter_offer.payment_terms)}
                        </p>
                        {app.counter_offer.notes && (
                          <p className="text-xs text-stone-500 italic break-words mb-2">"{app.counter_offer.notes}"</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <ServiceBadge type={job.service_type} size="sm" />
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {format(new Date(job.event_date), 'MMM d')}
                          </Badge>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => setRespondDialog({ open: true, application: app })}
                        className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                      >
                        Respond
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* All Applications */}
      <div className="space-y-3 sm:space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
          </div>
        ) : applications.length > 0 ? (
          applications.map(app => {
            const job = jobs.find(j => j.id === app.help_request_id);
            if (!job) return null;

            return (
              <Card key={app.id} className="border-stone-200 hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-sm sm:text-base text-stone-900 break-words">{job.title}</h3>
                        <Badge variant="outline" className={`text-xs shrink-0 ${
                          app.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          app.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          app.status === 'counter_offer_sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          app.status === 'counter_offer_accepted' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-stone-100 text-stone-700'
                        }`}>
                          {app.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <ServiceBadge type={job.service_type} size="sm" />
                        <Badge variant="outline" className="text-xs">
                          ${app.counter_offer ? app.counter_offer.pay_amount : job.pay_amount}
                        </Badge>
                      </div>
                      <div className="grid gap-1.5 text-xs sm:text-sm text-stone-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-400 shrink-0" />
                          <span className="break-words">{format(new Date(job.event_date), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-400 shrink-0" />
                          <span className="break-words">{job.city}, {job.state}</span>
                        </div>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="w-full sm:w-auto shrink-0">
                      <Link to={createPageUrl(`JobDetails?id=${job.id}`)}>
                        View Details
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="border-stone-200">
            <CardContent className="p-8 sm:p-12 text-center">
              <Send className="w-10 h-10 sm:w-12 sm:h-12 text-stone-300 mx-auto mb-4" />
              <h3 className="font-semibold text-stone-900 mb-1">No Applications Yet</h3>
              <p className="text-sm text-stone-500 mb-4">Browse available jobs and start applying</p>
              <Button asChild className="bg-stone-900 hover:bg-stone-800">
                <Link to={createPageUrl('AvailableJobs')}>Browse Jobs</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Counter Offer Response Dialog */}
      <Dialog open={respondDialog.open} onOpenChange={(open) => setRespondDialog({ open, application: null })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Respond to Counter Offer</DialogTitle>
            <DialogDescription>
              Review the revised terms for this job
            </DialogDescription>
          </DialogHeader>

          {respondDialog.application && (
            <div className="space-y-4 py-4">
              <div className="p-3 sm:p-4 bg-stone-50 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-stone-600">Your Original Application</span>
                  <span className="font-medium text-stone-500 line-through">
                    ${jobs.find(j => j.id === respondDialog.application.help_request_id)?.pay_amount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-stone-900">Counter Offer Amount</span>
                  <span className="text-xl sm:text-2xl font-bold text-blue-600">
                    ${respondDialog.application.counter_offer?.pay_amount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-stone-600">Payment Terms</span>
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    {getPaymentTermsLabel(respondDialog.application.counter_offer?.payment_terms)}
                  </Badge>
                </div>

                {respondDialog.application.counter_offer?.payment_schedule && (
                  <div className="border-t border-stone-200 pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-600">Upfront Payment:</span>
                      <span className="font-medium text-stone-900">
                        ${respondDialog.application.counter_offer.payment_schedule.upfront_amount}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-600">Upon Completion:</span>
                      <span className="font-medium text-stone-900">
                        ${respondDialog.application.counter_offer.payment_schedule.completion_amount}
                      </span>
                    </div>
                  </div>
                )}

                {respondDialog.application.counter_offer?.notes && (
                  <div className="border-t border-stone-200 pt-3">
                    <p className="text-xs text-stone-500 mb-1">Notes from requester:</p>
                    <p className="text-sm text-stone-700 break-words">{respondDialog.application.counter_offer.notes}</p>
                  </div>
                )}
              </div>

              <div className="text-xs sm:text-sm text-stone-600">
                <p className="font-medium text-stone-700 mb-2">By accepting:</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>You agree to the revised payment amount and terms</li>
                  <li>The requester will create a final agreement</li>
                  <li>You'll need to review and sign the agreement</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setRespondDialog({ open: false, application: null })}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 w-full sm:w-auto"
              onClick={() => declineCounterOfferMutation.mutate(respondDialog.application.id)}
              disabled={declineCounterOfferMutation.isLoading}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Decline Offer
            </Button>
            <Button
              onClick={() => acceptCounterOfferMutation.mutate(respondDialog.application.id)}
              disabled={acceptCounterOfferMutation.isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Accept Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}