import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, AlertCircle, FileText, DollarSign, Calendar } from 'lucide-react';

function startOfDay(d) {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function JobStatusIndicator({ job, user, agreement, applications = [], size = 'default' }) {
  if (!job || !user) return null;

  const isRequester = job.requester_id === user.email;
  const isAcceptedVendor = job.accepted_vendor_id === user.email;
  const myApplication = applications.find(app => app.applicant_id === user.email);

  const status = useMemo(() => {
    // -------------------------
    // OPEN
    // -------------------------
    if (job.status === 'open') {
      // Paused should be loud and early for the requester
      if (isRequester && job.paused) {
        return {
          label: 'Paused - Hidden from Search',
          icon: Clock,
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          type: 'info'
        };
      }

      if (isRequester) {
        // Applicant counter offers = applicant added counter_offer while still pending
        const applicantCounterOffers = applications.filter(a =>
          a.status === 'pending' && Number.isFinite(a?.counter_offer?.pay_amount)
        ).length;

        if (applicantCounterOffers > 0) {
          return {
            label: `Review ${applicantCounterOffers} Counter Offer${applicantCounterOffers > 1 ? 's' : ''}`,
            icon: AlertCircle,
            color: 'bg-orange-50 text-orange-700 border-orange-200',
            type: 'action'
          };
        }

        // Poster counter offers = requester sent counter offer, waiting on applicant response
        const awaitingCounterResponse = applications.filter(a => a.status === 'counter_offer_sent').length;

        if (awaitingCounterResponse > 0) {
          return {
            label: `Awaiting ${awaitingCounterResponse} Counter Offer Response${awaitingCounterResponse > 1 ? 's' : ''}`,
            icon: Clock,
            color: 'bg-purple-50 text-purple-700 border-purple-200',
            type: 'waiting'
          };
        }

        const pendingApps = applications.filter(a => a.status === 'pending' && !Number.isFinite(a?.counter_offer?.pay_amount)).length;

        if (pendingApps > 0) {
          return {
            label: `Review ${pendingApps} Application${pendingApps > 1 ? 's' : ''}`,
            icon: AlertCircle,
            color: 'bg-blue-50 text-blue-700 border-blue-200',
            type: 'action'
          };
        }

        return {
          label: 'Open - Awaiting Applications',
          icon: Clock,
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          type: 'info'
        };
      }

      // Non-requester view (applicant / other)
      if (myApplication) {
        if (myApplication.status === 'counter_offer_sent') {
          return {
            label: 'Respond to Counter Offer',
            icon: AlertCircle,
            color: 'bg-purple-50 text-purple-700 border-purple-200',
            type: 'action'
          };
        }

        if (Number.isFinite(myApplication?.counter_offer?.pay_amount) && myApplication.status === 'pending') {
          return {
            label: 'Your Counter Offer - Awaiting Review',
            icon: Clock,
            color: 'bg-orange-50 text-orange-700 border-orange-200',
            type: 'waiting'
          };
        }

        if (myApplication.status === 'pending') {
          return {
            label: 'Application Under Review',
            icon: Clock,
            color: 'bg-amber-50 text-amber-700 border-amber-200',
            type: 'waiting'
          };
        }

        if (myApplication.status === 'declined') {
          return {
            label: 'Application Declined',
            icon: AlertCircle,
            color: 'bg-stone-100 text-stone-600 border-stone-200',
            type: 'info'
          };
        }
      }

      return {
        label: 'Open Job',
        icon: Clock,
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        type: 'info'
      };
    }

    // -------------------------
    // FILLED
    // -------------------------
    if (job.status === 'filled') {
      if (agreement) {
        const needsMySignature =
          (isRequester && !agreement.requester_confirmed) ||
          (isAcceptedVendor && !agreement.vendor_confirmed);

        const needsOtherSignature =
          (isRequester && !agreement.vendor_confirmed) ||
          (isAcceptedVendor && !agreement.requester_confirmed);

        if (needsMySignature) {
          return {
            label: 'Sign Agreement Required',
            icon: FileText,
            color: 'bg-amber-50 text-amber-700 border-amber-200',
            type: 'action'
          };
        }

        if (needsOtherSignature) {
          return {
            label: 'Waiting for Other Party to Sign',
            icon: Clock,
            color: 'bg-blue-50 text-blue-700 border-blue-200',
            type: 'waiting'
          };
        }
      }

      // Date-based messaging (guard invalid dates)
      const eventDay = startOfDay(job.event_date);
      const today = startOfDay(new Date());

      if (eventDay && today) {
        if (eventDay.getTime() === today.getTime()) {
          return {
            label: 'Job Today - In Progress',
            icon: AlertCircle,
            color: 'bg-orange-50 text-orange-700 border-orange-200',
            type: 'action'
          };
        }

        if (eventDay > today) {
          const daysUntil = Math.ceil((eventDay - today) / (1000 * 60 * 60 * 24));
          return {
            label: `Upcoming in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`,
            icon: Calendar,
            color: 'bg-blue-50 text-blue-700 border-blue-200',
            type: 'info'
          };
        }
      }

      // Fallback if event_date missing/invalid or in the past
      return {
        label: 'Job Filled',
        icon: CheckCircle2,
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        type: 'info'
      };
    }

    // -------------------------
    // COMPLETED
    // -------------------------
    if (job.status === 'completed') {
      if (job.payment_status === 'paid') {
        return {
          label: 'Complete & Paid',
          icon: CheckCircle2,
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          type: 'success'
        };
      }

      if (isRequester) {
        return {
          label: 'Confirm Payment Required',
          icon: DollarSign,
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          type: 'action'
        };
      }

      return {
        label: 'Awaiting Payment Confirmation',
        icon: Clock,
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        type: 'waiting'
      };
    }

    // -------------------------
    // CANCELLED
    // -------------------------
    if (job.status === 'cancelled') {
      return {
        label: 'Cancelled',
        icon: AlertCircle,
        color: 'bg-stone-100 text-stone-600 border-stone-200',
        type: 'info'
      };
    }

    return null;
  }, [applications, agreement, isAcceptedVendor, isRequester, job, myApplication]);

  if (!status) return null;

  const Icon = status.icon;
  const isMobile = size === 'sm';

  return (
    <Badge
      variant="outline"
      className={`${status.color} font-medium ${isMobile ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'} flex items-center gap-1.5`}
    >
      <Icon className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
      <span className={isMobile ? 'truncate max-w-[120px]' : ''}>{status.label}</span>
    </Badge>
  );
}
