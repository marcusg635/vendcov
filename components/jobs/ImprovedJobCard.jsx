import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ServiceBadge from '@/components/ui/ServiceBadge';
import HelpTypeBadge from '@/components/ui/HelpTypeBadge';
import {
  Calendar, Clock, MapPin, DollarSign, Briefcase,
  Star, CheckCircle2, TrendingUp, Users
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function ImprovedJobCard({ job }) {
  const urgency = () => {
    const daysUntil = Math.ceil((parseISO(job.event_date) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 3) return { label: 'URGENT', color: 'bg-red-500 text-white' };
    if (daysUntil <= 7) return { label: 'Soon', color: 'bg-amber-500 text-white' };
    return null;
  };

  const urgencyInfo = urgency();

  return (
    <Link to={createPageUrl(`JobDetails?id=${job.id}`)}>
      <Card className="border-stone-200 hover:shadow-lg hover:border-stone-300 transition-all cursor-pointer group">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {urgencyInfo && (
                  <Badge className={`${urgencyInfo.color} text-xs font-bold`}>
                    {urgencyInfo.label}
                  </Badge>
                )}
                <h3 className="font-bold text-lg text-stone-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {job.title}
                </h3>
              </div>
              <Link 
                to={createPageUrl(`PublicProfile?userId=${job.requester_id}`)}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-stone-100 text-stone-600 text-xs">
                    {job.requester_business?.charAt(0) || job.requester_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="line-clamp-1 hover:underline">{job.requester_business || job.requester_name}</span>
              </Link>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-emerald-600">${job.pay_amount}</div>
              <div className="text-xs text-stone-500">{job.payment_type === 'hourly' ? '/hr' : job.payment_type === 'per_set' ? '/set' : 'flat'}</div>
            </div>
          </div>

          {/* Service + Help Type */}
          <div className="mb-3">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-medium capitalize">
              {job.service_type.replace(/_/g, ' ')} ({job.help_type.replace(/_/g, ' ')})
            </Badge>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div className="flex items-center gap-1.5 text-stone-600">
              <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
              <span className="truncate">{format(parseISO(job.event_date), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-600">
              <Clock className="w-4 h-4 text-stone-400 shrink-0" />
              <span className="truncate">
                {job.event_start_time && job.event_end_time 
                  ? `${job.event_start_time} - ${job.event_end_time}`
                  : job.event_start_time || job.event_end_time || 'TBD'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-600 col-span-2">
              <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
              <span className="truncate">{job.city}, {job.state}</span>
            </div>
          </div>

          {/* Additional Info */}
          {job.description && (
            <p className="text-sm text-stone-600 line-clamp-2 mb-3 border-t border-stone-100 pt-3">
              {job.description}
            </p>
          )}

          {/* Footer Details */}
          <div className="flex items-center justify-between pt-3 border-t border-stone-100">
            <div className="flex items-center gap-3 text-xs text-stone-500">
              {job.equipment_provided && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Equipment Provided
                </Badge>
              )}
              {job.positions && job.positions.length > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{job.positions.reduce((sum, p) => sum + (p.count_needed || 0), 0) + 1} positions</span>
                </div>
              )}
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 group-hover:bg-blue-100">
              View Details →
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}