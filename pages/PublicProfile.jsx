import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/components/shared/useCurrentUser';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ServiceBadge from '@/components/ui/ServiceBadge';
import { 
  ArrowLeft, Star, Briefcase, CheckCircle2, DollarSign, 
  MapPin, Calendar, TrendingUp, Award, Shield, ExternalLink, Image
} from 'lucide-react';
import { format } from 'date-fns';

export default function PublicProfile() {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useCurrentUser();
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('userId');

  const { data: profile } = useQuery({
    queryKey: ['publicProfile', userId],
    queryFn: async () => {
      const profiles = await base44.entities.VendorProfile.filter({ user_id: userId });
      return profiles[0] || null;
    },
    enabled: !!userId
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['userJobs', userId],
    queryFn: () => base44.entities.HelpRequest.filter({ requester_id: userId }),
    enabled: !!userId
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['userReviews', userId],
    queryFn: async () => {
      const allReviews = await base44.entities.Review.list();
      return allReviews.filter(r => r.reviewee_id === userId);
    },
    enabled: !!userId
  });

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const totalJobs = jobs.length;
  const paidJobs = jobs.filter(j => j.payment_status === 'paid').length;
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* Profile Header */}
      <Card className="border-stone-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              {profile.selfie_url ? (
                <img src={profile.selfie_url} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                <AvatarFallback className="bg-stone-100 text-stone-600 text-2xl">
                  {profile.full_name?.charAt(0) || profile.business_name?.charAt(0) || 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-stone-900 mb-1">{profile.full_name}</h1>
              {profile.business_name && (
                <p className="text-lg text-stone-600 mb-2">{profile.business_name}</p>
              )}
              {profile.city && profile.state && (
                <div className="flex items-center gap-1 text-sm text-stone-500 mb-3">
                  <MapPin className="w-4 h-4" />
                  {profile.city}, {profile.state}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {profile.service_types?.map(type => (
                  <ServiceBadge key={type} type={type} size="sm" />
                ))}
              </div>
            </div>
            {averageRating && (
              <div className="text-center">
                <div className="flex items-center gap-1 text-2xl font-bold text-stone-900">
                  <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                  {averageRating}
                </div>
                <p className="text-xs text-stone-500 mt-1">{reviews.length} reviews</p>
              </div>
            )}
          </div>
          {profile.bio && (
            <p className="text-stone-600 mt-4 pt-4 border-t border-stone-100">{profile.bio}</p>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card className="border-stone-200">
          <CardContent className="p-4 text-center">
            <Briefcase className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-stone-900">{totalJobs}</div>
            <div className="text-xs text-stone-500 mt-1">Jobs Posted</div>
          </CardContent>
        </Card>
        
        <Card className="border-stone-200">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-stone-900">{completedJobs}</div>
            <div className="text-xs text-stone-500 mt-1">Completed</div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-violet-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-stone-900">{paidJobs}</div>
            <div className="text-xs text-stone-500 mt-1">Vendors Paid</div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-stone-900">
              {completedJobs > 0 ? Math.round((paidJobs / completedJobs) * 100) : 0}%
            </div>
            <div className="text-xs text-stone-500 mt-1">Payment Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Trust Indicators */}
      {(paidJobs >= 3 || averageRating >= 4.5) && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-emerald-900 mb-1">Verified Reliable Hirer</h3>
                <p className="text-sm text-emerald-800">
                  {paidJobs >= 3 && `Has successfully paid ${paidJobs} vendors. `}
                  {averageRating >= 4.5 && `Highly rated by vendors (${averageRating} stars).`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio */}
      {(profile.portfolio_links?.length > 0 || profile.portfolio_items?.length > 0) && (
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.portfolio_items?.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {profile.portfolio_items.map((item, idx) => (
                  <div key={idx} className="relative group">
                    {item.type === 'image' && item.image_url && (
                      <img 
                        src={item.image_url} 
                        alt={item.title || 'Portfolio item'} 
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                    )}
                    {item.title && (
                      <p className="text-xs text-stone-600 mt-1 line-clamp-1">{item.title}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {profile.portfolio_links?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-stone-700">Links:</p>
                {profile.portfolio_links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline break-all"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    {link}
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Reviews from Vendors ({reviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-stone-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-stone-900">{review.reviewer_name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-stone-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-stone-500">
                    {format(new Date(review.created_date), 'MMM d, yyyy')}
                  </span>
                </div>
                {review.review_text && (
                  <p className="text-sm text-stone-600">{review.review_text}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Jobs */}
      {jobs.filter(j => j.status !== 'cancelled').length > 0 && (
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Recent Jobs Posted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {jobs.filter(j => j.status !== 'cancelled').slice(0, 5).map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-stone-900 text-sm">{job.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(job.event_date), 'MMM d, yyyy')}
                    </div>
                    <ServiceBadge type={job.service_type} size="sm" />
                  </div>
                </div>
                <Badge className={
                  job.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  job.status === 'filled' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  'bg-stone-100 text-stone-600'
                }>
                  {job.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}