import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Portfolio() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('profileId');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['vendorProfile', profileId],
    queryFn: async () => {
      const profiles = await base44.entities.VendorProfile.filter({ id: profileId });
      return profiles[0] || null;
    },
    enabled: !!profileId
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-stone-900">Portfolio not found</h2>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">{profile.full_name}'s Portfolio</h1>
        {profile.business_name && (
          <p className="text-stone-600 mt-1">{profile.business_name}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profile.portfolio_items?.map((item, index) => (
          <Card key={index} className="border-stone-200 overflow-hidden">
            {item.type === 'image' && item.image_url && (
              <img 
                src={item.image_url} 
                alt={item.title || 'Portfolio item'} 
                className="w-full h-64 object-cover"
              />
            )}
            {(item.title || item.description) && (
              <CardContent className="p-4">
                {item.title && (
                  <h3 className="font-semibold text-stone-900 mb-1">{item.title}</h3>
                )}
                {item.description && (
                  <p className="text-sm text-stone-600">{item.description}</p>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {profile.portfolio_items?.length === 0 && (
        <Card className="border-stone-200">
          <CardContent className="p-12 text-center">
            <p className="text-stone-500">No portfolio items to display</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}