import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, ArrowRight, X } from 'lucide-react';

export function calculateProfileCompleteness(profile) {
  if (!profile) return { percentage: 0, missingFields: [] };

  const requiredFields = [
    { key: 'first_name', label: 'First Name', value: profile.first_name },
    { key: 'last_name', label: 'Last Name', value: profile.last_name },
    { key: 'business_name', label: 'Business Name', value: profile.business_name },
    { key: 'selfie_url', label: 'Profile Photo', value: profile.selfie_url },
    { key: 'phone', label: 'Phone Number', value: profile.phone },
    { key: 'email', label: 'Email', value: profile.email },
    { key: 'bio', label: 'Bio', value: profile.bio },
    { key: 'city', label: 'City', value: profile.city },
    { key: 'state', label: 'State', value: profile.state },
    { key: 'zip_code', label: 'Zip Code', value: profile.zip_code },
    { key: 'street_address', label: 'Street Address', value: profile.street_address },
    { key: 'service_types', label: 'Service Types', value: profile.service_types?.length > 0 },
    { key: 'services_offered', label: 'Services Offered', value: profile.services_offered?.length > 0 },
    { key: 'experience_years', label: 'Years of Experience', value: profile.experience_years },
    { key: 'portfolio_links', label: 'Portfolio Links', value: profile.portfolio_links?.some(link => link?.trim()) },
  ];

  const optionalFields = [
    { key: 'business_logo_url', label: 'Business Logo', value: profile.business_logo_url },
    { key: 'portfolio_items', label: 'Portfolio Examples', value: profile.portfolio_items?.length > 0 },
    { key: 'insurance_url', label: 'Insurance Certificate', value: profile.insurance_url },
    { key: 'credentials_url', label: 'Credentials', value: profile.credentials_url },
    { key: 'service_states', label: 'Service States', value: profile.service_states?.length > 0 },
  ];

  const completedRequired = requiredFields.filter(field => field.value).length;
  const completedOptional = optionalFields.filter(field => field.value).length;
  
  const totalFields = requiredFields.length + optionalFields.length;
  const completedFields = completedRequired + completedOptional;
  const percentage = Math.round((completedFields / totalFields) * 100);

  const missingRequired = requiredFields.filter(field => !field.value);
  const missingOptional = optionalFields.filter(field => !field.value);

  return {
    percentage,
    missingRequired,
    missingOptional,
    isComplete: missingRequired.length === 0
  };
}

export default function ProfileCompleteness({ profile }) {
  const [dismissed, setDismissed] = React.useState(() => {
    return localStorage.getItem(`profile_completeness_dismissed_${profile?.user_id}`) === 'true';
  });

  if (!profile || dismissed) return null;

  const { percentage, missingRequired, missingOptional, isComplete } = calculateProfileCompleteness(profile);

  // Don't show if profile is 100% complete
  if (percentage === 100) return null;

  const handleDismiss = () => {
    localStorage.setItem(`profile_completeness_dismissed_${profile.user_id}`, 'true');
    setDismissed(true);
  };

  return (
    <Card className="border-blue-200 bg-blue-50 relative">
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
      >
        <X className="h-4 w-4 text-blue-900" />
      </button>
      <CardHeader>
        <div className="flex items-center justify-between pr-6">
          <CardTitle className="text-lg text-blue-900">Complete Your Profile</CardTitle>
          <span className="text-2xl font-bold text-blue-900">{percentage}%</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={percentage} className="h-2" />
        
        <p className="text-sm text-blue-800">
          {isComplete 
            ? "Your required information is complete! Add optional details to make your profile stand out."
            : "Complete your profile to unlock all features and get more job opportunities."}
        </p>

        {missingRequired.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-blue-900 uppercase">Required Information</p>
            {missingRequired.slice(0, 3).map((field) => (
              <div key={field.key} className="flex items-center gap-2 text-sm text-blue-800">
                <Circle className="w-4 h-4 text-blue-400" />
                <span>{field.label}</span>
              </div>
            ))}
            {missingRequired.length > 3 && (
              <p className="text-xs text-blue-700 ml-6">+ {missingRequired.length - 3} more</p>
            )}
          </div>
        )}

        {isComplete && missingOptional.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-blue-900 uppercase">Optional (Recommended)</p>
            {missingOptional.slice(0, 3).map((field) => (
              <div key={field.key} className="flex items-center gap-2 text-sm text-blue-800">
                <Circle className="w-4 h-4 text-blue-400" />
                <span>{field.label}</span>
              </div>
            ))}
          </div>
        )}

        <Button asChild className="w-full bg-blue-900 hover:bg-blue-800">
          <Link to={createPageUrl('Profile')}>
            Complete Profile
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}