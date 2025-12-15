import React from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

export default function AppealSubmitted() {
  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-blue-200 bg-blue-50">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-blue-900 mb-2">Appeal Submitted</h2>
          <p className="text-blue-700 mb-6">
            Your appeal has been submitted and will be reviewed within 24 hours. You'll receive a notification with the decision.
          </p>
          <Button onClick={handleLogout} className="w-full bg-stone-900 hover:bg-stone-800">
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}