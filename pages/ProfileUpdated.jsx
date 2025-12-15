import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function ProfileUpdated() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-stone-200">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Profile Updated</h1>
          <p className="text-stone-600 mb-6">
            The user's profile has been successfully updated.
          </p>
          <Button 
            onClick={() => navigate(createPageUrl('Dashboard'))} 
            className="w-full bg-stone-900 hover:bg-stone-800"
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}