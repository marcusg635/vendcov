import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ServiceBadge from '@/components/ui/ServiceBadge';
import HelpTypeBadge from '@/components/ui/HelpTypeBadge';
import { MapPin, Calendar, Clock, Building2, ArrowRight, Users, CheckCircle2 } from 'lucide-react';

export default function JobCard({ job, showApplyButton = false, onApply }) {
  const urgency = () => {
    const daysUntil = Math.ceil((parseISO(job.event_date) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 3) return { label: 'URGENT', color: 'bg-red-500 text-white' };
    if (daysUntil <= 7) return { label: 'Soon', color: 'bg-amber-500 text-white' };
    return null;
  };

  const urgencyInfo = urgency();
  
  // Calculate positions correctly
  const allPositions = job.positions || [];
  const totalPositions = allPositions.length;
  const filledCount = allPositions.reduce((sum, p) => sum + (p.count_filled || 0), 0);
  const neededCount = allPositions.reduce((sum, p) => sum + (p.count_needed || 1), 0);
  const openPositions = neededCount - filledCount;

  return (
    <Link to={createPageUrl(`JobDetails?id=${job.id}`)} className="block w-full">
      <Card className="border-stone-200 hover:shadow-lg hover:border-stone-300 transition-all cursor-pointer group w-full">
        <CardContent className="p-3 sm:p-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 mb-3 w-full">
            <div className="flex-1 min-w-0 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                {urgencyInfo && (
                  <Badge className={`${urgencyInfo.color} text-xs font-bold self-start`}>
                    {urgencyInfo.label}
                  </Badge>
                )}
                <h3 className="font-bold text-base sm:text-lg text-stone-900 group-hover:text-blue-600 transition-colors line-clamp-2 break-words">
                  {job.title}
                </h3>
              </div>
              <Link 
                to={createPageUrl(`PublicProfile?userId=${job.requester_id}`)}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 text-xs sm:text-sm text-stone-600 hover:text-stone-900 transition-colors"
              >
                <Avatar className="h-5 w-5 sm:h-6 sm:w-6 shrink-0">
                  <AvatarFallback className="bg-stone-100 text-stone-600 text-xs">
                    {job.requester_business?.charAt(0) || job.requester_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="line-clamp-1 hover:underline break-all">{job.requester_business || job.requester_name}</span>
              </Link>
            </div>
            <div className="text-left sm:text-right shrink-0 mt-2 sm:mt-0">
              <div className="text-xl sm:text-2xl font-bold text-emerald-600">${job.pay_amount}</div>
              <div className="text-xs text-stone-500">
                {job.payment_type === 'hourly' ? '/hr' : 
                 job.payment_type === 'per_set' ? '/set' : 
                 job.payment_type === 'per_song' ? '/song' : 'flat'}
              </div>
            </div>
          </div>

          {/* Service Type & Positions */}
          <div className="mb-3 flex flex-wrap gap-2">
            <ServiceBadge type={job.service_type} />
            {allPositions.length > 0 && (
              <div className="flex gap-1">
                {allPositions.slice(0, 2).map((pos, idx) => (
                  <HelpTypeBadge key={idx} type={pos.help_type} size="sm" />
                ))}
                {allPositions.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{allPositions.length - 2} more
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm mb-3">
            <div className="flex items-center gap-1.5 text-stone-600">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-400 shrink-0" />
              <span className="truncate">{format(parseISO(job.event_date), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-600">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-400 shrink-0" />
              <span className="truncate text-xs sm:text-sm">
                {job.event_start_time && job.event_end_time 
                  ? `${job.event_start_time} - ${job.event_end_time}`
                  : job.event_start_time || job.event_end_time || 'TBD'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-600 sm:col-span-2">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-400 shrink-0" />
              <span className="truncate">{job.city}, {job.state}</span>
            </div>
          </div>

          {/* Description Preview */}
          {job.description && (
            <p className="text-xs sm:text-sm text-stone-600 line-clamp-2 mb-3 border-t border-stone-100 pt-3 break-words">
              {job.description}
            </p>
          )}

          {/* Footer Details */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 pt-3 border-t border-stone-100">
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-stone-500 flex-wrap">
              {job.equipment_provided && (
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Equipment</span>
                </div>
              )}
              {neededCount > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{neededCount} position{neededCount > 1 ? 's' : ''} • {openPositions} open</span>
                </div>
              )}
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 group-hover:bg-blue-100 text-xs w-full sm:w-auto text-center">
              View Details →
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}