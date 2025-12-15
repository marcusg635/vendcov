import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Calendar, MapPin, DollarSign, Clock, Edit, Send } from 'lucide-react';
import { format } from 'date-fns';
import ServiceBadge from '@/components/ui/ServiceBadge';

function safeFormatDate(date) {
  try {
    if (!date) return 'Not specified';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return 'Invalid date';
    return format(d, 'MMMM d, yyyy');
  } catch {
    return 'Invalid date';
  }
}

function formatMoney(value) {
  if (value === undefined || value === null || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function JobPreviewStep({ jobData = {}, onEdit, onPost }) {
  const [isPosting, setIsPosting] = useState(false);

  const missingRequired = useMemo(() => {
    // Adjust this list to match what your backend truly requires.
    const missing =
      !jobData.title ||
      !jobData.event_date ||
      !jobData.city ||
      !jobData.state ||
      !jobData.payment_method ||
      jobData.pay_amount === undefined ||
      jobData.pay_amount === null ||
      jobData.pay_amount === '';

    return Boolean(missing);
  }, [jobData]);

  const showTime = useMemo(() => {
    const hasTime = jobData.event_start_time || jobData.event_end_time;
    if (!hasTime) return 'Not specified';
    return `${jobData.event_start_time || 'TBD'} – ${jobData.event_end_time || 'TBD'}`;
  }, [jobData]);

  const locationLine = useMemo(() => {
    const cityState =
      `${jobData.city || ''}${jobData.city && jobData.state ? ', ' : ''}${jobData.state || ''}`.trim();

    if (jobData.venue_name && cityState) return `${jobData.venue_name} • ${cityState}`;
    if (jobData.venue_name) return jobData.venue_name;
    return cityState || 'Not specified';
  }, [jobData]);

  const paymentTypeLabel = useMemo(() => {
    if (!jobData.payment_type) return '';
    return String(jobData.payment_type).replace(/_/g, ' ');
  }, [jobData]);

  const handlePost = async () => {
    if (missingRequired || isPosting) return;

    try {
      setIsPosting(true);
      // If onPost throws, we catch it so the UI doesn’t die.
      await Promise.resolve(onPost?.());
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900">Preview Your Job Posting</h3>
        <p className="text-sm text-blue-700">This is exactly how vendors will see it.</p>
      </div>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-stone-900">
            {jobData.title || 'Untitled Job'}
          </h2>

          <div className="flex flex-wrap gap-2 mt-2">
            {jobData.service_type && <ServiceBadge type={jobData.service_type} />}

            {Array.isArray(jobData.positions) && jobData.positions.length > 0 && (
              <Badge variant="outline">
                {jobData.positions.length} Position{jobData.positions.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            <Detail icon={Calendar} label="Event Date">
              {safeFormatDate(jobData.event_date)}
            </Detail>

            <Detail icon={Clock} label="Event Time">
              {showTime}
            </Detail>

            <Detail icon={MapPin} label="Location">
              <div>
                <div>{locationLine}</div>

                {jobData.ceremony_address && (
                  <div className="text-xs text-stone-500 mt-1">{jobData.ceremony_address}</div>
                )}

                {jobData.reception_address && !jobData.same_location && (
                  <div className="text-xs text-stone-500">
                    Reception: {jobData.reception_address}
                  </div>
                )}
              </div>
            </Detail>

            <Detail icon={DollarSign} label="Payment">
              <div className="capitalize">
                ${formatMoney(jobData.pay_amount)} {paymentTypeLabel}
                <div className="text-xs text-stone-500">
                  via {jobData.payment_method || 'unspecified'}
                </div>
              </div>
            </Detail>
          </div>

          {/* Positions */}
          {Array.isArray(jobData.positions) && jobData.positions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Positions</h3>
              <div className="space-y-2">
                {jobData.positions.map((p, i) => (
                  <div key={i} className="flex justify-between bg-stone-50 p-3 rounded">
                    <div className="capitalize">
                      {String(p?.help_type || '').replace(/_/g, ' ') || 'Unspecified role'}
                      <div className="text-xs text-stone-500">
                        {p?.count_needed ?? '—'} needed
                      </div>
                    </div>
                    <div className="font-medium text-emerald-700">
                      ${formatMoney(p?.pay_amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {jobData.description && (
            <div>
              <h3 className="text-lg font-semibold mb-1">Description</h3>
              <p className="text-stone-700 whitespace-pre-wrap">{jobData.description}</p>
            </div>
          )}

          {/* Extras */}
          {(jobData.attire ||
            jobData.parking_info ||
            jobData.load_in_time ||
            jobData.equipment_provided) && (
            <div>
              <h3 className="text-lg font-semibold mb-1">Additional Details</h3>
              <ul className="text-sm text-stone-700 space-y-1">
                {jobData.attire && <li>Attire: {jobData.attire}</li>}
                {jobData.parking_info && <li>Parking: {jobData.parking_info}</li>}
                {jobData.load_in_time && <li>Arrival: {jobData.load_in_time}</li>}
                {jobData.equipment_provided && <li>Equipment provided</li>}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onEdit} className="flex-1" disabled={isPosting}>
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>

        <Button
          onClick={handlePost}
          disabled={missingRequired || isPosting}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
        >
          <Send className="w-4 h-4 mr-2" />
          {isPosting ? 'Posting...' : 'Post Job'}
        </Button>
      </div>

      {missingRequired && (
        <p className="text-xs text-amber-600 text-center">
          Please fill all required fields before posting.
        </p>
      )}
    </div>
  );
}

/* ---------- Helper ---------- */
function Detail({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 text-stone-500 mt-0.5" />
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-sm text-stone-600">{children}</div>
      </div>
    </div>
  );
}
