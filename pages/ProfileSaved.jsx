import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function ProfileSaved() {
  const urlParams = new URLSearchParams(window.location.search);
  const needsReview = urlParams.get('review') === 'true';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full border-stone-200">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          
          {needsReview ? (
            <>
              <h2 className="text-xl font-semibold text-stone-900 mb-2">
                Profile Updated - Pending Review
              </h2>
              <p className="text-stone-600 mb-6">
                Your profile changes have been saved. Since you updated your business name, 
                your profile needs to be reviewed again by an admin. You'll be notified once approved.
              </p>
              <p className="text-sm text-stone-500 mb-6">
                Your existing job posts and history remain active.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-stone-900 mb-2">
                Profile Saved Successfully
              </h2>
              <p className="text-stone-600 mb-6">
                Your profile changes have been saved and are now live.
              </p>
            </>
          )}
          
          <Button asChild className="w-full bg-stone-900 hover:bg-stone-800">
            <Link to={createPageUrl('Dashboard')}>
              Go to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}