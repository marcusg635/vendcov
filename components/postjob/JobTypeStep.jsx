import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ServiceBadge from '@/components/ui/ServiceBadge';
import {
  Camera, Video, Music, Users, Sparkles, Wine, Flower2, 
  UtensilsCrossed, Heart, Radio, Mic, Cake, Lightbulb, Shield, Car
} from 'lucide-react';

const SERVICE_TYPES = [
  { value: 'photographer', label: 'Photographer', icon: Camera, color: 'blue' },
  { value: 'videographer', label: 'Videographer', icon: Video, color: 'purple' },
  { value: 'dj', label: 'DJ', icon: Radio, color: 'pink' },
  { value: 'musician', label: 'Musician', icon: Music, color: 'indigo' },
  { value: 'band', label: 'Band/Group', icon: Mic, color: 'violet' },
  { value: 'planner', label: 'Event Planner', icon: Users, color: 'emerald' },
  { value: 'coordinator', label: 'Day-of Coordinator', icon: Users, color: 'teal' },
  { value: 'muah', label: 'Makeup & Hair', icon: Sparkles, color: 'rose' },
  { value: 'bartender', label: 'Bartender', icon: Wine, color: 'amber' },
  { value: 'server', label: 'Server/Waitstaff', icon: UtensilsCrossed, color: 'orange' },
  { value: 'florist', label: 'Florist', icon: Flower2, color: 'green' },
  { value: 'caterer', label: 'Caterer', icon: UtensilsCrossed, color: 'orange' },
  { value: 'baker', label: 'Baker/Cake Designer', icon: Cake, color: 'pink' },
  { value: 'officiant', label: 'Officiant', icon: Heart, color: 'red' },
  { value: 'av_tech', label: 'AV Technician', icon: Radio, color: 'slate' },
  { value: 'lighting_tech', label: 'Lighting Tech', icon: Lightbulb, color: 'yellow' },
  { value: 'sound_tech', label: 'Sound Tech', icon: Radio, color: 'blue' },
  { value: 'stage_crew', label: 'Stage Crew', icon: Users, color: 'stone' },
  { value: 'security', label: 'Security', icon: Shield, color: 'red' },
  { value: 'valet', label: 'Valet', icon: Car, color: 'gray' }
];

const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding', emoji: '💒' },
  { value: 'corporate', label: 'Corporate Event', emoji: '💼' },
  { value: 'birthday', label: 'Birthday Party', emoji: '🎂' },
  { value: 'anniversary', label: 'Anniversary', emoji: '💕' },
  { value: 'engagement', label: 'Engagement Party', emoji: '💍' },
  { value: 'rehearsal_dinner', label: 'Rehearsal Dinner', emoji: '🍽️' },
  { value: 'shower', label: 'Shower (Baby/Bridal)', emoji: '🎁' },
  { value: 'concert', label: 'Concert', emoji: '🎸' },
  { value: 'festival', label: 'Festival', emoji: '🎪' },
  { value: 'conference', label: 'Conference', emoji: '🎤' },
  { value: 'gala', label: 'Gala', emoji: '✨' },
  { value: 'other', label: 'Other', emoji: '📅' }
];

export default function JobTypeStep({ jobData, updateJobData }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-stone-900 mb-2">What type of help do you need?</h2>
        <p className="text-sm text-stone-600">Select the service you're looking for</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SERVICE_TYPES.map((service) => {
          const Icon = service.icon;
          const isSelected = jobData.service_type === service.value;
          
          return (
            <button
              key={service.value}
              onClick={() => updateJobData({ service_type: service.value })}
              className={`p-4 rounded-lg border-2 transition-all text-left hover:shadow-md ${
                isSelected 
                  ? 'border-stone-900 bg-stone-50 shadow-md' 
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-stone-900' : 'text-stone-400'}`} />
              <div className="font-medium text-sm text-stone-900">{service.label}</div>
            </button>
          );
        })}
      </div>

      {jobData.service_type && (
        <>
          <div className="pt-4">
            <h2 className="text-xl font-semibold text-stone-900 mb-2">What type of event?</h2>
            <p className="text-sm text-stone-600">This helps us ask the right questions</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {EVENT_TYPES.map((event) => {
              const isSelected = jobData.event_type === event.value;
              
              return (
                <button
                  key={event.value}
                  onClick={() => updateJobData({ event_type: event.value })}
                  className={`p-4 rounded-lg border-2 transition-all text-left hover:shadow-md ${
                    isSelected 
                      ? 'border-stone-900 bg-stone-50 shadow-md' 
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{event.emoji}</div>
                  <div className="font-medium text-sm text-stone-900">{event.label}</div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}