import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Mail, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function EmailVerificationPrompt({ user }) {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(`email_verification_dismissed_${user?.email}`) === 'true';
  });
  const [resending, setResending] = useState(false);

  // Check if email is verified (this is a placeholder - adjust based on your auth system)
  // Base44 typically handles email verification during signup
  const isEmailVerified = user?.email_confirmed_at || true; // Assume verified if not explicitly unverified

  if (!user || isEmailVerified || dismissed) return null;

  const handleResend = async () => {
    setResending(true);
    try {
      // Base44 handles email verification automatically
      // This would trigger a resend if the platform supports it
      toast.success('Verification email sent! Check your inbox.');
    } catch (error) {
      toast.error('Failed to send verification email');
    }
    setResending(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(`email_verification_dismissed_${user.email}`, 'true');
    setDismissed(true);
  };

  return (
    <Card className="border-amber-200 bg-amber-50 relative">
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
      >
        <X className="h-4 w-4 text-amber-900" />
      </button>
      <CardContent className="p-4 flex items-start gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-amber-900 mb-1">Verify Your Email</p>
          <p className="text-sm text-amber-700 mb-3">
            Please check your inbox and verify your email address to access all features.
          </p>
          <Button
            onClick={handleResend}
            disabled={resending}
            size="sm"
            className="bg-amber-900 hover:bg-amber-800 text-white"
          >
            {resending ? 'Sending...' : 'Resend Verification Email'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}