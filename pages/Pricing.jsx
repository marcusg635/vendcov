import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Sparkles, Zap, ArrowLeft, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function Pricing() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null); // 'checkout' | 'portal' | null
  const [loadingUser, setLoadingUser] = useState(true);

  // --- Helpers ---
  const unwrap = (res) => res?.data ?? res ?? {};
  const safeErr = (err) => err?.message || err?.error || 'Something went wrong';

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        if (mounted) setUser(u);
      } catch (e) {
        toast.error('Failed to load user session');
      } finally {
        if (mounted) setLoadingUser(false);
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  // Subscription logic
  const hasActiveSubscription = useMemo(() => {
    return (
      user?.subscription_status === 'active' ||
      user?.subscription_status === 'trialing' ||
      !!user?.stripe_subscription_id
    );
  }, [user]);

  const isFreeAccess = useMemo(() => !!user?.subscription_granted_by_admin, [user]);

  // Stripe-backed subscription ONLY if customer exists and it’s not admin-granted
  const isStripeSubscription = useMemo(() => {
    return !!user?.stripe_customer_id && !isFreeAccess;
  }, [user, isFreeAccess]);

  const PRICE_ID = 'price_1SeJycR9qCsoD6tQ2zqF7oMo';

  const handleSubscribe = async () => {
    if (loadingAction) return;
    setLoadingAction('checkout');

    try {
      const res = await base44.functions.invoke('createCheckout', { priceId: PRICE_ID });
      const data = unwrap(res);

      if (!data?.url) {
        throw new Error(data?.error || 'Checkout URL not returned');
      }

      window.location.href = data.url;
    } catch (error) {
      toast.error(safeErr(error) || 'Failed to start checkout');
      setLoadingAction(null);
    }
  };

  const handleManageSubscription = async () => {
    if (loadingAction) return;
    setLoadingAction('portal');

    try {
      const res = await base44.functions.invoke('createCustomerPortal');
      const data = unwrap(res);

      if (!data?.url) {
        throw new Error(data?.error || 'Portal URL not returned');
      }

      window.location.href = data.url;
    } catch (error) {
      toast.error(safeErr(error) || 'Failed to open subscription portal');
      setLoadingAction(null);
    }
  };

  const checkoutLoading = loadingAction === 'checkout';
  const portalLoading = loadingAction === 'portal';

  return (
    <div className="max-w-4xl mx-auto">
      <Button
        type="button"
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-100 mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg text-stone-600 dark:text-stone-400">
          Get full access to post jobs and apply for opportunities
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Free Plan */}
        <Card className="border-stone-200 dark:border-stone-700">
          <CardHeader>
            <CardTitle className="text-2xl">Free</CardTitle>
            <div className="text-4xl font-bold text-stone-900 dark:text-stone-100 mt-4">
              $0
              <span className="text-lg font-normal text-stone-500">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-stone-700 dark:text-stone-300">Browse available jobs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-stone-700 dark:text-stone-300">View vendor profiles</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-stone-700 dark:text-stone-300">Create your profile</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-stone-700 dark:text-stone-300">Submit support tickets</span>
              </div>
            </div>

            <Button type="button" variant="outline" className="w-full" disabled>
              Current Plan
            </Button>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="border-stone-900 dark:border-stone-100 shadow-xl relative">
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-stone-900 text-white">
            <Sparkles className="w-3 h-3 mr-1" />
            Most Popular
          </Badge>

          <CardHeader>
            <CardTitle className="text-2xl">Pro</CardTitle>
            <div className="text-4xl font-bold text-stone-900 dark:text-stone-100 mt-4">
              $9.99
              <span className="text-lg font-normal text-stone-500">/month</span>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-stone-700 dark:text-stone-300 font-medium">
                  Everything in Free, plus:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                <span className="text-stone-700 dark:text-stone-300">Post unlimited jobs</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                <span className="text-stone-700 dark:text-stone-300">Apply to unlimited jobs</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                <span className="text-stone-700 dark:text-stone-300">Direct messaging with vendors</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                <span className="text-stone-700 dark:text-stone-300">Live chat support with admins</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                <span className="text-stone-700 dark:text-stone-300">Priority customer service</span>
              </div>
            </div>

            {loadingUser ? (
              <Button type="button" className="w-full bg-stone-900 hover:bg-stone-800" disabled>
                Loading...
              </Button>
            ) : hasActiveSubscription ? (
              <div className="space-y-2">
                <Button
                  type="button"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {isFreeAccess ? 'Free Access (Admin Granted)' : 'Active Subscription'}
                </Button>

                {/* Only show Stripe portal button if this subscription is actually Stripe-backed */}
                {isStripeSubscription ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleManageSubscription}
                    disabled={!!loadingAction}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {portalLoading ? 'Loading...' : 'View Subscription & Billing'}
                  </Button>
                ) : (
                  <Button type="button" variant="outline" className="w-full" disabled>
                    Billing Portal Unavailable (Admin Granted)
                  </Button>
                )}
              </div>
            ) : (
              <Button
                type="button"
                className="w-full bg-stone-900 hover:bg-stone-800"
                onClick={handleSubscribe}
                disabled={!!loadingAction}
              >
                {checkoutLoading ? 'Loading...' : 'Subscribe Now'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <Card className="border-stone-200 dark:border-stone-700">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">Can I cancel anytime?</h3>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Yes! You can cancel your subscription at any time from the Manage Subscription portal.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">What happens when I cancel?</h3>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              You'll retain access until the end of your billing period, then your account will revert to the free plan.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">Is payment secure?</h3>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Yes! All payments are processed securely through Stripe. We never store your credit card information.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">What forms of payment do you accept?</h3>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              We accept all major credit and debit cards through our secure payment processor.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
