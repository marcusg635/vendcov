import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Calendar, DollarSign, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function SubscriptionHistory() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const hasActiveSubscription = user?.subscription_status === 'active' || user?.subscription_status === 'trialing' || user?.stripe_subscription_id;
  const isStripeSubscription = user?.stripe_customer_id && !user?.subscription_granted_by_admin;
  const isFreeAccess = user?.subscription_granted_by_admin;

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('createCustomerPortal');
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error('Failed to open subscription portal');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Subscription & Billing</h1>
        <p className="text-stone-600">Manage your subscription and view billing history</p>
      </div>

      {/* Current Subscription Status */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
            <div>
              <p className="text-sm text-stone-600">Status</p>
              <div className="flex items-center gap-2 mt-1">
                {hasActiveSubscription ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-900">
                      {isFreeAccess ? 'Free Access (Admin Granted)' : 'Active'}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-stone-400" />
                    <span className="font-semibold text-stone-600">Free Plan</span>
                  </>
                )}
              </div>
            </div>
            {hasActiveSubscription && (
              <Badge className="bg-emerald-100 text-emerald-700">
                ✓ Pro
              </Badge>
            )}
          </div>

          {hasActiveSubscription && (
            <div className="space-y-3">
              {isStripeSubscription && (
                <>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Payment Method</span>
                    </div>
                    <span className="text-sm text-blue-700">Card on file</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-stone-50 rounded">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-stone-600" />
                      <span className="text-sm font-medium text-stone-700">Amount</span>
                    </div>
                    <span className="text-sm font-semibold text-stone-900">$9.99/month</span>
                  </div>
                </>
              )}

              {user?.subscription_end_date && (
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-stone-600" />
                    <span className="text-sm font-medium text-stone-700">
                      {user.subscription_status === 'canceled' ? 'Access Until' : 'Renews On'}
                    </span>
                  </div>
                  <span className="text-sm text-stone-900">
                    {format(new Date(user.subscription_end_date), 'MMMM d, yyyy')}
                  </span>
                </div>
              )}

              {user?.subscription_status === 'canceled' && user?.subscription_end_date && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900">Subscription Cancelled</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Your access will continue until {format(new Date(user.subscription_end_date), 'MMMM d, yyyy')}. After this date, your account will revert to the Free plan.
                    </p>
                  </div>
                </div>
              )}

              {isFreeAccess && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-purple-900">Free Access Granted</p>
                    <p className="text-xs text-purple-700 mt-1">
                      An admin has granted you free access to all Pro features
                      {user?.subscription_end_date && ` until ${format(new Date(user.subscription_end_date), 'MMMM d, yyyy')}`}.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {isStripeSubscription && (
            <Button
              onClick={handleManageSubscription}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {loading ? 'Loading...' : 'Manage Subscription & Billing'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>
            {hasActiveSubscription ? 'Your Pro Features' : 'Upgrade to Pro'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${hasActiveSubscription ? 'text-emerald-600' : 'text-stone-300'}`} />
              <span className={hasActiveSubscription ? 'text-stone-900' : 'text-stone-500'}>
                Post unlimited jobs
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${hasActiveSubscription ? 'text-emerald-600' : 'text-stone-300'}`} />
              <span className={hasActiveSubscription ? 'text-stone-900' : 'text-stone-500'}>
                Apply to unlimited jobs
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${hasActiveSubscription ? 'text-emerald-600' : 'text-stone-300'}`} />
              <span className={hasActiveSubscription ? 'text-stone-900' : 'text-stone-500'}>
                Direct messaging with vendors
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${hasActiveSubscription ? 'text-emerald-600' : 'text-stone-300'}`} />
              <span className={hasActiveSubscription ? 'text-stone-900' : 'text-stone-500'}>
                Live chat support with admins
              </span>
            </div>
          </div>

          {!hasActiveSubscription && (
            <Button asChild className="w-full mt-6 bg-stone-900 hover:bg-stone-800">
              <a href={createPageUrl('Pricing')}>
                Upgrade to Pro - $9.99/month
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}