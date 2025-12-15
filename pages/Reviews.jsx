import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, User, Calendar, Briefcase, TrendingUp } from 'lucide-react';

export default function Reviews() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['myReviews', user?.email],
    queryFn: () => base44.entities.Review.filter({ reviewee_id: user.email }, '-created_date'),
    enabled: !!user?.email
  });

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const ratingBreakdown = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">My Reviews</h1>
        <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">See what clients and colleagues say about you</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
          <CardContent className="p-3 sm:p-5 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 mb-1">{averageRating}</div>
            <div className="flex justify-center mb-1 sm:mb-2 scale-75 sm:scale-100">{renderStars(Math.round(averageRating))}</div>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">Average</p>
          </CardContent>
        </Card>

        <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
          <CardContent className="p-3 sm:p-5 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 mb-1">{reviews.length}</div>
            <div className="flex items-center justify-center gap-1 mb-1 sm:mb-2">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
              <span className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 hidden sm:inline">Total Reviews</span>
              <span className="text-xs text-stone-600 dark:text-stone-400 sm:hidden">Total</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">All Time</p>
          </CardContent>
        </Card>

        <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
          <CardContent className="p-3 sm:p-5 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 mb-1">{ratingBreakdown[5]}</div>
            <div className="flex items-center justify-center gap-1 mb-1 sm:mb-2">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
              <span className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 hidden sm:inline">5-Star Reviews</span>
              <span className="text-xs text-stone-600 dark:text-stone-400 sm:hidden">5-Star</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              {reviews.length > 0 ? Math.round((ratingBreakdown[5] / reviews.length) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rating Breakdown */}
      <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
        <CardHeader>
          <CardTitle className="text-lg dark:text-stone-100">Rating Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingBreakdown[rating];
            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-20">
                  <span className="text-sm font-medium text-stone-900 dark:text-stone-100">{rating}</span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </div>
                <div className="flex-1 h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-stone-600 dark:text-stone-400 w-12 text-right">{count}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800 mx-auto"></div>
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <Card key={review.id} className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
              <CardContent className="p-3 sm:p-5">
                <div className="flex items-start gap-2 sm:gap-4">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                    <AvatarFallback className="bg-stone-100 text-stone-600">
                      {review.reviewer_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-stone-900 dark:text-stone-100 break-words">{review.reviewer_name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <div className="scale-90 sm:scale-100">{renderStars(review.rating)}</div>
                          <Badge variant="outline" className="text-xs capitalize">
                            {review.review_type?.replace('_', ' to ')}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3" />
                        <span className="whitespace-nowrap">{format(new Date(review.created_date), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    {review.review_text && (
                      <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap mt-2 sm:mt-3 break-words">
                        {review.review_text}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
            <CardContent className="p-12 text-center">
              <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-stone-400 dark:text-stone-500" />
              </div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">No reviews yet</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">
                Complete jobs to start receiving reviews from clients
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}