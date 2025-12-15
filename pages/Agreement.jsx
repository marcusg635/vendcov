import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, FileText, Calendar, MapPin, DollarSign, User, Building2, Clock, AlertCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function Agreement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('jobId');

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: agreement, isLoading } = useQuery({
    queryKey: ['agreement', jobId],
    queryFn: async () => {
      const agreements = await base44.entities.SubcontractAgreement.filter({ help_request_id: jobId });
      return agreements[0] || null;
    },
    enabled: !!jobId
  });

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const jobs = await base44.entities.HelpRequest.filter({ id: jobId });
      return jobs[0] || null;
    },
    enabled: !!jobId
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const isRequester = user.email === agreement.requester_id;
      const updateData = isRequester 
        ? { requester_confirmed: true }
        : { vendor_confirmed: true };
      
      return base44.entities.SubcontractAgreement.update(agreement.id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['agreement', jobId]);
      setShowSuccessDialog(true);
    }
  });

  const isRequester = user?.email === agreement?.requester_id;
  const myConfirmed = isRequester ? agreement?.requester_confirmed : agreement?.vendor_confirmed;
  const bothConfirmed = agreement?.requester_confirmed && agreement?.vendor_confirmed;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-xl font-semibold text-stone-900">Agreement not found</h2>
        <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card className="border-stone-200">
        <CardHeader className="text-center border-b border-stone-100">
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-stone-600" />
          </div>
          <CardTitle className="text-xl">Subcontract Agreement</CardTitle>
          <p className="text-sm text-stone-500">Event Services Agreement</p>
          
          {bothConfirmed ? (
            <Badge className="mt-3 bg-emerald-50 text-emerald-700 border-emerald-200 mx-auto">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Both Parties Confirmed
            </Badge>
          ) : (
            <Badge variant="outline" className="mt-3 mx-auto">
              Pending Confirmation
            </Badge>
          )}
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Parties */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Hiring Party</h3>
              <div className="p-4 bg-stone-50 rounded-lg">
                <p className="font-semibold text-stone-900">{agreement.requester_name}</p>
                {agreement.requester_business && (
                  <p className="text-sm text-stone-600">{agreement.requester_business}</p>
                )}
                {agreement.requester_confirmed && (
                  <Badge className="mt-2 bg-emerald-50 text-emerald-700 text-xs">Confirmed</Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Service Provider</h3>
              <div className="p-4 bg-stone-50 rounded-lg">
                <p className="font-semibold text-stone-900">{agreement.vendor_name}</p>
                {agreement.vendor_business && (
                  <p className="text-sm text-stone-600">{agreement.vendor_business}</p>
                )}
                {agreement.vendor_confirmed && (
                  <Badge className="mt-2 bg-emerald-50 text-emerald-700 text-xs">Confirmed</Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Event Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Event Details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                <Calendar className="w-5 h-5 text-stone-400" />
                <div>
                  <p className="text-xs text-stone-500">Date</p>
                  <p className="font-medium text-stone-900">
                    {format(new Date(agreement.event_date), 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                <MapPin className="w-5 h-5 text-stone-400" />
                <div>
                  <p className="text-xs text-stone-500">Location</p>
                  <p className="font-medium text-stone-900">{agreement.event_location}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Service & Payment */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Service & Payment</h3>
            <div className="p-4 bg-stone-50 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-stone-600">Service</span>
                <span className="font-medium text-stone-900 capitalize">
                  {agreement.service_description?.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-600">Payment Amount</span>
                <span className="font-bold text-xl text-stone-900">
                  ${agreement.pay_amount}
                  {agreement.payment_type === 'hourly' && <span className="text-sm font-normal">/hr</span>}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-600">Payment Method</span>
                <span className="font-medium text-stone-900 capitalize">{agreement.payment_method}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Terms */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Agreement Terms</h3>
            <div className="text-sm text-stone-600 space-y-2">
              <p>By confirming this agreement, both parties agree to the following:</p>
              <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>The Service Provider will perform the services described above at the specified event.</li>
                <li>The Hiring Party will compensate the Service Provider according to the payment terms stated.</li>
                <li>Both parties will communicate professionally and promptly regarding any changes.</li>
                <li>Cancellation by either party should be communicated as soon as possible.</li>
                <li>The Service Provider maintains their own liability insurance if applicable.</li>
              </ol>
            </div>
          </div>

          {/* Confirm Button */}
          {!myConfirmed && (
            <div className="pt-4">
              <Button
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isLoading}
                className="w-full bg-stone-900 hover:bg-stone-800"
              >
                {confirmMutation.isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Confirming...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Agreement
                  </span>
                )}
              </Button>
              <p className="text-xs text-stone-500 text-center mt-2">
                By confirming, you agree to the terms above
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <DialogTitle className="text-center">Agreement Signed Successfully!</DialogTitle>
            <DialogDescription className="text-center">
              {bothConfirmed || (isRequester && agreement?.vendor_confirmed) || (!isRequester && agreement?.requester_confirmed) ? (
                <span>Both parties have now signed the agreement.</span>
              ) : (
                <span>Your signature has been recorded.</span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {bothConfirmed || (isRequester && agreement?.vendor_confirmed) || (!isRequester && agreement?.requester_confirmed) ? (
              <>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-emerald-900 mb-2">✓ Agreement Fully Executed</p>
                  <p className="text-xs text-emerald-700">
                    Both parties have signed. You can now proceed with the job.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-stone-900 text-sm">Next Steps:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-stone-600">
                    {isRequester ? (
                      <>
                        <li>Coordinate with the vendor via chat if needed</li>
                        <li>Upload any schedules or documents for the job</li>
                        <li>The vendor will clock in when they arrive</li>
                        <li>Confirm payment after job completion</li>
                      </>
                    ) : (
                      <>
                        <li>Review job details and uploaded documents</li>
                        <li>Communicate with the poster via chat if needed</li>
                        <li>Clock in when you arrive at the event</li>
                        <li>Update job status as you work</li>
                      </>
                    )}
                  </ol>
                </div>
              </>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">Waiting for {isRequester ? 'Vendor' : 'Poster'} Signature</p>
                      <p className="text-xs text-blue-700">
                        {isRequester 
                          ? 'The vendor needs to sign the agreement before you can proceed. They will be notified.'
                          : 'The job poster needs to sign the agreement before you can proceed. You\'ll be notified when they sign.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-stone-900 text-sm">What Happens Next:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-stone-600">
                    <li>You'll receive a notification when the other party signs</li>
                    <li>Once both signatures are complete, you can proceed with the job</li>
                    <li>You can view this agreement anytime from the job details page</li>
                  </ol>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button 
              onClick={() => {
                setShowSuccessDialog(false);
                navigate(createPageUrl(`JobDetails?id=${jobId}`));
              }}
              className="w-full bg-stone-900 hover:bg-stone-800"
            >
              Go to Job Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}