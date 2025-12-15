import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RefundPolicy() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card className="border-stone-200">
        <CardContent className="p-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Refund Policy</h1>
          <p className="text-stone-500 mb-8">Last Updated: January 2025</p>

          <div className="space-y-6 text-stone-600">
            <div>
              <h3 className="text-lg font-semibold text-stone-900 mb-3">Subscription Refunds</h3>
              <p className="mb-4">
                VendorCover operates on a monthly subscription model at $9.99 per month. Our refund policy is designed to be fair and transparent:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>No Partial Month Refunds:</strong> Subscription fees are charged monthly and are non-refundable once the billing cycle begins</li>
                <li><strong>Cancellation:</strong> You may cancel your subscription at any time, and you will retain access until the end of your current billing period</li>
                <li><strong>No Automatic Refunds:</strong> Canceling your subscription does not entitle you to a refund for the current billing period</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-stone-900 mb-3">Exceptional Circumstances</h3>
              <p className="mb-4">
                We may consider refund requests on a case-by-case basis for:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Technical issues that prevented you from using the service for an extended period</li>
                <li>Duplicate charges or billing errors</li>
                <li>Charges made after you canceled your subscription (with proof of cancellation)</li>
              </ul>
              <p>
                To request a refund under exceptional circumstances, please contact our support team at team@twofoldvisuals.com within 7 days of the charge with a detailed explanation.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-stone-900 mb-3">Billing Disputes</h3>
              <p className="mb-4">
                If you believe you have been charged in error:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Contact us immediately at team@twofoldvisuals.com</li>
                <li>Provide your account email and transaction details</li>
                <li>We will investigate and respond within 5 business days</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-stone-900 mb-3">Payment Processing</h3>
              <p className="mb-4">
                All payments are processed through Stripe, our secure payment processor. For questions about payment processing or to dispute a charge, you may also contact Stripe directly through their customer support channels.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-stone-900 mb-3">How to Cancel Your Subscription</h3>
              <p className="mb-4">
                You can cancel your subscription at any time by:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Logging into your account</li>
                <li>Navigating to the Subscription page</li>
                <li>Clicking "Manage Subscription"</li>
                <li>Following the cancellation prompts in the Stripe portal</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-stone-900 mb-3">Service Disruptions</h3>
              <p className="mb-4">
                If VendorCover experiences a service disruption lasting more than 48 consecutive hours due to our own technical issues (not including scheduled maintenance), we may offer subscription credits or prorated refunds at our discretion.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-stone-900 mb-3">Contact Us</h3>
              <p>
                For refund requests or billing questions, please email us at{' '}
                <a href="mailto:team@twofoldvisuals.com" className="text-blue-600 hover:underline">
                  team@twofoldvisuals.com
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}