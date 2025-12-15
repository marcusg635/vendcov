import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';

export default function ManualJobForm({ jobData, initialData = {}, updateJobData, onNext, onBack }) {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    event_date: initialData.event_date || '',
    event_start_time: initialData.event_start_time || '',
    event_end_time: initialData.event_end_time || '',
    venue_name: initialData.venue_name || '',
    ceremony_address: initialData.ceremony_address || '',
    reception_address: initialData.reception_address || '',
    same_location: initialData.same_location !== false,
    city: initialData.city || '',
    state: initialData.state || '',
    payment_type: initialData.payment_type || 'flat_rate',
    payment_method: 'venmo',
    requirements: initialData.requirements || '',
    equipment_provided: initialData.equipment_provided || false,
    attire: initialData.attire || '',
    parking_info: initialData.parking_info || '',
    load_in_time: initialData.load_in_time || '',
    positions: (initialData.positions && initialData.positions.length > 0) ? 
      initialData.positions : 
      [{ help_type: '', count_needed: 1, pay_amount: '' }]
  });

const serviceType = jobData?.service_type || 'service';
const eventType = jobData?.event_type || 'event';

  // Get service-specific fields and help text
  const getServiceFields = () => {
    const serviceLabel =String(serviceType).replace(/_/g, ' ');
    
    const commonFields = {
      photographer: {
        helpTypes: [
          { value: 'full_replacement', label: 'Full Replacement - Complete wedding day coverage' },
          { value: 'second_shooter', label: 'Second Shooter - Support primary photographer' },
          { value: 'assistant', label: 'Assistant - Equipment and lighting help' },
          { value: 'extra_help', label: 'Extra Help - Specific portions only' }
        ],
        requirementsPlaceholder: 'Example:\n- 3+ years wedding photography experience\n- Professional camera equipment with backups\n- Ability to shoot in manual mode\n- Portfolio of wedding work\n- Professional editing software',
        titlePlaceholder: 'Example: Experienced Wedding Photographer Needed - Backup Coverage',
        descriptionPlaceholder: 'Describe your event, venue, what makes it special, what you need the photographer to do, timeline expectations, and any special requirements...',
        additionalFields: [
          { name: 'equipment_provided', label: 'Equipment Provided?', type: 'checkbox' },
          { name: 'shooting_hours', label: 'Hours of Coverage Needed', type: 'text', placeholder: '8 hours' }
        ]
      },
      videographer: {
        helpTypes: [
          { value: 'full_replacement', label: 'Full Replacement - Complete video coverage' },
          { value: 'second_shooter', label: 'Second Shooter - Multi-camera B-roll' },
          { value: 'assistant', label: 'Assistant - Camera and audio support' },
          { value: 'extra_help', label: 'Extra Help - Specific coverage needs' }
        ],
        requirementsPlaceholder: 'Example:\n- Professional videography experience\n- High-quality video equipment\n- Audio recording capabilities\n- Experience with wedding timeline\n- Portfolio of event videos',
        titlePlaceholder: 'Example: Wedding Videographer Needed for Elegant Ceremony',
        descriptionPlaceholder: 'Describe your event, venue atmosphere, desired video style, what coverage you need, and any special moments to capture...',
        additionalFields: [
          { name: 'equipment_provided', label: 'Equipment Provided?', type: 'checkbox' },
          { name: 'editing_needed', label: 'Editing Included?', type: 'checkbox' }
        ]
      },
      dj: {
        helpTypes: [
          { value: 'full_replacement', label: 'Full Replacement - Primary DJ for entire event' },
          { value: 'backup', label: 'Backup DJ - Emergency same-day coverage' },
          { value: 'assistant', label: 'Assistant - Equipment and MC support' },
          { value: 'extra_help', label: 'Extra Help - Specific portions (cocktail hour, ceremony)' }
        ],
        requirementsPlaceholder: 'Example:\n- 5+ years professional DJ experience\n- Quality sound system and equipment\n- MC experience for wedding announcements\n- Diverse music library\n- Professional appearance',
        titlePlaceholder: 'Example: Professional Wedding DJ Needed for Reception',
        descriptionPlaceholder: 'Describe your event, music style preferences, any special dances or moments, MC duties needed, and timeline...',
        additionalFields: [
          { name: 'equipment_provided', label: 'Equipment Provided?', type: 'checkbox' },
          { name: 'music_style', label: 'Preferred Music Style', type: 'text', placeholder: 'Top 40, Classic Rock, etc.' }
        ]
      },
      musician: {
        helpTypes: [
          { value: 'full_replacement', label: 'Full Replacement - Replace scheduled performer' },
          { value: 'additional_musician', label: 'Additional Musician - Join ensemble' },
          { value: 'assistant', label: 'Assistant - Equipment and music support' },
          { value: 'extra_help', label: 'Extra Help - Specific performance portions' }
        ],
        requirementsPlaceholder: 'Example:\n- Professional musician with 5+ years experience\n- Specific instrument expertise\n- Ability to read sheet music\n- Professional equipment\n- Appropriate repertoire',
        titlePlaceholder: 'Example: Classical Violinist Needed for Wedding Ceremony',
        descriptionPlaceholder: 'Describe your event, musical style needed, specific pieces or genre, performance duration, and any special requirements...',
        additionalFields: [
          { name: 'instrument_needed', label: 'Instrument(s) Needed', type: 'text', placeholder: 'Violin, Guitar, etc.' },
          { name: 'amplification_needed', label: 'Amplification Needed?', type: 'checkbox' }
        ]
      },
      band: {
        helpTypes: [
          { value: 'full_replacement', label: 'Full Replacement - Replace entire band' },
          { value: 'additional_members', label: 'Additional Members - Fill in missing musicians' },
          { value: 'crew_assistant', label: 'Crew/Assistant - Equipment and setup help' },
          { value: 'extra_performance', label: 'Extra Performance - Additional set or coverage' }
        ],
        requirementsPlaceholder: 'Example:\n- Professional band/ensemble experience\n- Full backline and equipment\n- 3-4 hour performance capability\n- Diverse repertoire\n- Professional stage presence',
        titlePlaceholder: 'Example: Live Wedding Band Needed for Reception',
        descriptionPlaceholder: 'Describe your event, music genre preferences, set length needed, stage/space available, and special song requests...',
        additionalFields: [
          { name: 'band_size', label: 'Band Size Needed', type: 'text', placeholder: '4-piece band' },
          { name: 'equipment_provided', label: 'Equipment/PA Provided?', type: 'checkbox' }
        ]
      },
      bartender: {
        helpTypes: [
          { value: 'full_replacement', label: 'Full Replacement - Primary bartender' },
          { value: 'additional_staff', label: 'Additional Staff - Supplement existing team' },
          { value: 'bar_back', label: 'Bar Back - Restock and support' },
          { value: 'extra_help', label: 'Extra Help - Additional bar station' }
        ],
        requirementsPlaceholder: 'Example:\n- Professional bartending certification\n- 3+ years event bartending experience\n- Knowledge of cocktails and wine\n- Responsible alcohol service\n- Professional appearance',
        titlePlaceholder: 'Example: Professional Bartender Needed for Wedding Reception',
        descriptionPlaceholder: 'Describe your event size, bar type (full bar, beer/wine), guest count, service duration, and any specialty drinks...',
        additionalFields: [
          { name: 'guest_count', label: 'Guest Count', type: 'number', placeholder: '150' },
          { name: 'bar_type', label: 'Bar Type', type: 'text', placeholder: 'Full bar, beer/wine only, etc.' }
        ]
      },
      server: {
        helpTypes: [
          { value: 'full_replacement', label: 'Full Replacement - Replace scheduled server' },
          { value: 'additional_server', label: 'Additional Server - Supplement staff' },
          { value: 'food_runner', label: 'Food Runner/Busser - Support service' },
          { value: 'extra_help', label: 'Extra Help - Specific service periods' }
        ],
        requirementsPlaceholder: 'Example:\n- Professional serving experience\n- Plated service expertise\n- Professional appearance\n- Team player\n- Knowledge of proper service technique',
        titlePlaceholder: 'Example: Professional Server Needed for Wedding Reception',
        descriptionPlaceholder: 'Describe your event, guest count, service style (plated, buffet, family-style), uniform requirements, and timeline...',
        additionalFields: [
          { name: 'guest_count', label: 'Guest Count', type: 'number', placeholder: '150' },
          { name: 'service_style', label: 'Service Style', type: 'text', placeholder: 'Plated, buffet, etc.' }
        ]
      },
      planner: {
        helpTypes: [
          { value: 'full_replacement', label: 'Full Replacement - Complete planning takeover' },
          { value: 'day_of_coordinator', label: 'Day-of Coordinator - Execute existing plans' },
          { value: 'planning_assistant', label: 'Planning Assistant - Support lead planner' },
          { value: 'extra_help', label: 'Extra Help - Specific planning tasks' }
        ],
        requirementsPlaceholder: 'Example:\n- 5+ years event planning experience\n- Vendor relationship management\n- Timeline creation expertise\n- Problem-solving under pressure\n- Strong organizational skills',
        titlePlaceholder: 'Example: Day-of Wedding Coordinator Needed',
        descriptionPlaceholder: 'Describe your event, planning stage, what coordination is needed, vendor list, timeline complexity, and your vision...',
        additionalFields: [
          { name: 'planning_scope', label: 'Scope of Work', type: 'text', placeholder: 'Full planning, day-of only, etc.' }
        ]
      },
      coordinator: {
        helpTypes: [
          { value: 'full_replacement', label: 'Full Replacement - Complete coordination' },
          { value: 'assistant_coordinator', label: 'Assistant Coordinator - Support lead' },
          { value: 'setup_crew', label: 'Setup Crew - Physical setup and vendor direction' },
          { value: 'extra_help', label: 'Extra Help - Specific coordination needs' }
        ],
        requirementsPlaceholder: 'Example:\n- Day-of coordination experience\n- Timeline management skills\n- Vendor coordination\n- Problem-solving ability\n- Calm under pressure',
        titlePlaceholder: 'Example: Wedding Day Coordinator Needed',
        descriptionPlaceholder: 'Describe your event, coordination needs, vendor list, timeline, and what support you need...',
        additionalFields: []
      },
      muah: {
        helpTypes: [
          { value: 'full_replacement', label: 'Full Replacement - All MUAH services' },
          { value: 'additional_artist', label: 'Additional Artist - Help with large bridal party' },
          { value: 'assistant', label: 'Assistant - Support lead artist' },
          { value: 'extra_help', label: 'Extra Help - Specific services or touch-ups' }
        ],
        requirementsPlaceholder: 'Example:\n- Professional makeup and hair certification\n- 3+ years bridal experience\n- Professional kit and products\n- Portfolio of bridal work\n- Airbrush capability',
        titlePlaceholder: 'Example: Bridal Hair and Makeup Artist Needed',
        descriptionPlaceholder: 'Describe how many people need services, style preferences, timeline, location, and any specific looks desired...',
        additionalFields: [
          { name: 'people_count', label: 'Number of People', type: 'number', placeholder: '6' },
          { name: 'services_needed', label: 'Services Needed', type: 'text', placeholder: 'Hair and makeup, hair only, etc.' }
        ]
      },
      caterer: {
        helpTypes: [
          { value: 'full_replacement', label: 'Full Replacement - Complete catering' },
          { value: 'additional_staff', label: 'Additional Staff - Supplement team' },
          { value: 'prep_assistant', label: 'Prep/Kitchen Assistant - Food prep and support' },
          { value: 'extra_help', label: 'Extra Help - Specific stations or service' }
        ],
        requirementsPlaceholder: 'Example:\n- Professional catering experience\n- Food handler certification\n- Event catering expertise\n- Quality standards\n- Team coordination',
        titlePlaceholder: 'Example: Professional Catering Staff Needed for Wedding',
        descriptionPlaceholder: 'Describe your event, guest count, menu style, service type, kitchen facilities, and any dietary considerations...',
        additionalFields: [
          { name: 'guest_count', label: 'Guest Count', type: 'number', placeholder: '150' },
          { name: 'service_type', label: 'Service Type', type: 'text', placeholder: 'Plated, buffet, etc.' }
        ]
      },
      florist: {
        helpTypes: [
          { value: 'full_replacement', label: 'Full Replacement - Complete floral service' },
          { value: 'additional_florist', label: 'Additional Florist - Large installation help' },
          { value: 'floral_assistant', label: 'Floral Assistant - Assembly and setup' },
          { value: 'extra_help', label: 'Extra Help - Specific floral elements' }
        ],
        requirementsPlaceholder: 'Example:\n- Professional floral design experience\n- Event floral expertise\n- Setup and delivery capability\n- Design aesthetic\n- Timely delivery',
        titlePlaceholder: 'Example: Wedding Florist Needed for Ceremony and Reception',
        descriptionPlaceholder: 'Describe your floral vision, arrangements needed (bouquets, centerpieces, ceremony), color palette, and setup requirements...',
        additionalFields: [
          { name: 'floral_scope', label: 'Floral Scope', type: 'text', placeholder: 'Bridal bouquet, 10 centerpieces, etc.' }
        ]
      },
      baker: {
        helpTypes: [
          { value: 'full_replacement', label: 'Full Replacement - Complete cake service' },
          { value: 'additional_baker', label: 'Additional Baker - Large dessert order' },
          { value: 'assistant', label: 'Assistant - Baking and decorating support' },
          { value: 'extra_help', label: 'Extra Help - Specific desserts' }
        ],
        requirementsPlaceholder: 'Example:\n- Professional baking certification\n- Wedding cake experience\n- Design and decorating skills\n- Food safety standards\n- Delivery and setup',
        titlePlaceholder: 'Example: Wedding Cake Baker Needed',
        descriptionPlaceholder: 'Describe your cake vision, size/servings needed, flavor preferences, design style, dietary restrictions, and delivery requirements...',
        additionalFields: [
          { name: 'servings_needed', label: 'Number of Servings', type: 'number', placeholder: '150' }
        ]
      },
      officiant: {
        helpTypes: [
          { value: 'full_replacement', label: 'Full Replacement - Complete ceremony service' },
          { value: 'backup_officiant', label: 'Backup Officiant - Emergency coverage' },
          { value: 'assistant', label: 'Assistant - Ceremony coordination' },
          { value: 'extra_help', label: 'Extra Help - Additional ceremony' }
        ],
        requirementsPlaceholder: 'Example:\n- Licensed/ordained officiant\n- 10+ ceremonies performed\n- Public speaking skills\n- Script customization\n- Professional demeanor',
        titlePlaceholder: 'Example: Wedding Officiant Needed for Outdoor Ceremony',
        descriptionPlaceholder: 'Describe your ceremony vision, type (religious/secular), any special traditions, personalization needs, and rehearsal requirements...',
        additionalFields: [
          { name: 'ceremony_type', label: 'Ceremony Type', type: 'text', placeholder: 'Religious, secular, interfaith, etc.' }
        ]
      },
      av_tech: {
        helpTypes: [
          { value: 'full_replacement', label: 'Full Replacement - Complete AV service' },
          { value: 'additional_tech', label: 'Additional Tech - Complex setup support' },
          { value: 'assistant', label: 'Assistant - Equipment and monitoring' },
          { value: 'extra_help', label: 'Extra Help - Specific AV needs' }
        ],
        requirementsPlaceholder: 'Example:\n- Professional AV experience\n- Sound and video equipment expertise\n- Troubleshooting skills\n- Professional equipment\n- Setup and monitoring',
        titlePlaceholder: 'Example: AV Technician Needed for Wedding Reception',
        descriptionPlaceholder: 'Describe venue size, AV needs (microphones, speakers, projector), equipment provided, and any special requirements...',
        additionalFields: [
          { name: 'equipment_provided', label: 'Equipment Provided?', type: 'checkbox' }
        ]
      },
      lighting_tech: {
        helpTypes: [
          { value: 'full_replacement', label: 'Full Replacement - Complete lighting' },
          { value: 'additional_tech', label: 'Additional Tech - Complex lighting setup' },
          { value: 'assistant', label: 'Assistant - Setup and programming support' },
          { value: 'extra_help', label: 'Extra Help - Specific lighting effects' }
        ],
        requirementsPlaceholder: 'Example:\n- Professional lighting experience\n- DMX programming knowledge\n- Intelligent lighting expertise\n- Equipment knowledge\n- Setup capability',
        titlePlaceholder: 'Example: Lighting Technician Needed for Wedding Reception',
        descriptionPlaceholder: 'Describe venue, lighting needs (uplighting, dance floor, gobos), equipment provided, and desired atmosphere...',
        additionalFields: [
          { name: 'lighting_type', label: 'Lighting Needs', type: 'text', placeholder: 'Uplighting, dance floor, etc.' }
        ]
      },
      sound_tech: {
        helpTypes: [
          { value: 'full_replacement', label: 'Full Replacement - Complete sound' },
          { value: 'additional_tech', label: 'Additional Tech - Complex sound needs' },
          { value: 'assistant', label: 'Assistant - Monitoring and support' },
          { value: 'extra_help', label: 'Extra Help - Specific sound coverage' }
        ],
        requirementsPlaceholder: 'Example:\n- Professional sound technician experience\n- Mixing board expertise\n- Microphone setup\n- Monitor systems\n- Quality audio standards',
        titlePlaceholder: 'Example: Sound Technician Needed for Wedding Ceremony',
        descriptionPlaceholder: 'Describe venue size, sound requirements (ceremony, speeches, band/DJ), equipment provided, and special needs...',
        additionalFields: [
          { name: 'equipment_provided', label: 'Equipment Provided?', type: 'checkbox' }
        ]
      },
      stage_crew: {
        helpTypes: [
          { value: 'full_replacement', label: 'Full Replacement - Complete crew' },
          { value: 'additional_crew', label: 'Additional Crew - Large setup support' },
          { value: 'assistant', label: 'Assistant - Physical labor and support' },
          { value: 'extra_help', label: 'Extra Help - Load in/out only' }
        ],
        requirementsPlaceholder: 'Example:\n- Stage setup experience\n- Physical capability\n- Equipment knowledge\n- Safety awareness\n- Team coordination',
        titlePlaceholder: 'Example: Stage Crew Needed for Event Load In/Out',
        descriptionPlaceholder: 'Describe setup complexity, load in/out times, physical requirements, and equipment to be moved...',
        additionalFields: [
          { name: 'setup_complexity', label: 'Setup Complexity', type: 'text', placeholder: 'Simple, moderate, complex' }
        ]
      },
      security: {
        helpTypes: [
          { value: 'full_replacement', label: 'Full Replacement - Complete security' },
          { value: 'additional_security', label: 'Additional Security - Large event support' },
          { value: 'assistant', label: 'Assistant - Support lead security' },
          { value: 'extra_help', label: 'Extra Help - Specific coverage areas' }
        ],
        requirementsPlaceholder: 'Example:\n- Professional security training\n- Event security experience\n- Crowd management\n- Emergency response capability\n- Professional appearance',
        titlePlaceholder: 'Example: Security Personnel Needed for Wedding Reception',
        descriptionPlaceholder: 'Describe event size, venue layout, specific security concerns, guest count, and coverage hours needed...',
        additionalFields: [
          { name: 'guest_count', label: 'Guest Count', type: 'number', placeholder: '200' }
        ]
      },
      valet: {
        helpTypes: [
          { value: 'full_replacement', label: 'Full Replacement - Complete valet service' },
          { value: 'additional_valet', label: 'Additional Valet - High volume support' },
          { value: 'assistant', label: 'Assistant - Key and parking management' },
          { value: 'extra_help', label: 'Extra Help - Peak times only' }
        ],
        requirementsPlaceholder: 'Example:\n- Valid driver\'s license\n- Professional driving record\n- Event valet experience\n- Professional appearance\n- Customer service skills',
        titlePlaceholder: 'Example: Valet Attendants Needed for Wedding Reception',
        descriptionPlaceholder: 'Describe guest count, parking layout, service hours, and any special parking considerations...',
        additionalFields: [
          { name: 'guest_count', label: 'Expected Cars', type: 'number', placeholder: '100' }
        ]
      }
    };

    return commonFields[serviceType] || {
      helpTypes: [
        { value: 'full_replacement', label: 'Full Replacement' },
        { value: 'additional_staff', label: 'Additional Staff' },
        { value: 'assistant', label: 'Assistant' },
        { value: 'extra_help', label: 'Extra Help' }
      ],
      requirementsPlaceholder: 'List the requirements for this position...',
titlePlaceholder: `${String(serviceLabel).charAt(0).toUpperCase() + String(serviceLabel).slice(1)} Needed`,
      descriptionPlaceholder: 'Describe what you need...',
      additionalFields: []
    };
  };

  const serviceFields = getServiceFields();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Parse city/state from addresses if not separately provided
    let city = formData.city;
    let state = formData.state;
    
    const addressToUse = formData.ceremony_address || formData.reception_address;
    if ((!city || !state) && addressToUse) {
  const parts = addressToUse.split(',').map(s => s.trim());
  if (!city && parts.length >= 2) city = parts[parts.length - 2];
  if (!state && parts.length >= 1) state = parts[parts.length - 1];
}


    // Set full_address and help_type for backward compatibility
    const full_address = formData.same_location ? 
      formData.ceremony_address : 
      formData.ceremony_address || formData.reception_address;

    // Get first position's help_type and pay_amount for backward compatibility
    const firstPosition = formData.positions[0] || {};

    updateJobData({
      ...formData,
      city: city || 'Unknown',
      state: state || 'Unknown',
      full_address: full_address,
      help_type: firstPosition.help_type || 'full_replacement',
      pay_amount: parseFloat(firstPosition.pay_amount) || 0,
      service_type: serviceType,
      event_type: eventType
    });
    
    onNext();
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to AI Assistant
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-1">
          Manual Job Posting Form
        </h3>
        <p className="text-sm text-blue-700">
Fill out the details for your {String(serviceType).replace(/_/g, ' ')} job at your {String(eventType).replace(/_/g, ' ')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Job Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder={serviceFields.titlePlaceholder}
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Job Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder={serviceFields.descriptionPlaceholder}
            rows={6}
            required
          />
          <p className="text-xs text-stone-500">
            Describe your event in detail to attract quality vendors
          </p>
        </div>

        {/* Event Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="event_date">Event Date *</Label>
            <Input
              id="event_date"
              type="date"
              value={formData.event_date}
              onChange={(e) => updateField('event_date', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event_start_time">Start Time *</Label>
            <Input
              id="event_start_time"
              type="time"
              value={formData.event_start_time}
              onChange={(e) => updateField('event_start_time', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event_end_time">End Time *</Label>
            <Input
              id="event_end_time"
              type="time"
              value={formData.event_end_time}
              onChange={(e) => updateField('event_end_time', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Venue & Location */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="venue_name">Venue Name *</Label>
            <Input
              id="venue_name"
              value={formData.venue_name}
              onChange={(e) => updateField('venue_name', e.target.value)}
              placeholder="Countryside Wedding and Events Center"
              required
            />
          </div>
          
          {eventType === 'wedding' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="same_location"
                  checked={formData.same_location}
                  onChange={(e) => updateField('same_location', e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="same_location" className="cursor-pointer">
                  Ceremony and reception at the same location
                </Label>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="ceremony_address">
              {eventType === 'wedding' ? 'Ceremony Address *' : 'Event Address *'}
            </Label>
            <Input
              id="ceremony_address"
              value={formData.ceremony_address}
              onChange={(e) => updateField('ceremony_address', e.target.value)}
              placeholder="123 Main St, City, State 12345"
              required
            />
          </div>
          
          {eventType === 'wedding' && !formData.same_location && (
            <div className="space-y-2">
              <Label htmlFor="reception_address">Reception Address *</Label>
              <Input
                id="reception_address"
                value={formData.reception_address}
                onChange={(e) => updateField('reception_address', e.target.value)}
                placeholder="456 Event Ave, City, State 12345"
                required={!formData.same_location}
              />
            </div>
          )}
        </div>

        {/* Positions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Positions Needed *</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const newPositions = [...formData.positions, { help_type: '', count_needed: 1, pay_amount: '' }];
                updateField('positions', newPositions);
              }}
            >
              + Add Position
            </Button>
          </div>
          
          {formData.positions.map((position, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3 bg-stone-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Position {index + 1}</span>
                {formData.positions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newPositions = formData.positions.filter((_, i) => i !== index);
                      updateField('positions', newPositions);
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Position Type *</Label>
                  <Select 
                    value={position.help_type} 
                    onValueChange={(value) => {
                      const newPositions = [...formData.positions];
                      newPositions[index].help_type = value;
                      updateField('positions', newPositions);
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceFields.helpTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label.split(' - ')[0]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Number Needed *</Label>
                  <Input
                    type="number"
                    value={position.count_needed}
                    onChange={(e) => {
                      const newPositions = [...formData.positions];
                      newPositions[index].count_needed = parseInt(e.target.value) || 1;
                      updateField('positions', newPositions);
                    }}
                    min="1"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Pay Amount ($) *</Label>
                  <Input
                    type="number"
                    value={position.pay_amount}
                    onChange={(e) => {
                      const newPositions = [...formData.positions];
                      newPositions[index].pay_amount = parseFloat(e.target.value) || '';
                      updateField('positions', newPositions);
                    }}
                    placeholder="500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="payment_type">Payment Type *</Label>
            <Select value={formData.payment_type} onValueChange={(value) => updateField('payment_type', value)} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flat_rate">Flat Rate</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method *</Label>
            <Select value={formData.payment_method} onValueChange={(value) => updateField('payment_method', value)} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="venmo">Venmo</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="cashapp">Cash App</SelectItem>
                <SelectItem value="zelle">Zelle</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="check">Check</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Requirements */}
        <div className="space-y-2">
          <Label htmlFor="requirements">Requirements & Qualifications *</Label>
          <Textarea
            id="requirements"
            value={formData.requirements}
            onChange={(e) => updateField('requirements', e.target.value)}
            placeholder={serviceFields.requirementsPlaceholder}
            rows={5}
            required
          />
        </div>

        {/* Service-specific additional fields */}
        {serviceFields.additionalFields && serviceFields.additionalFields.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-stone-900">Additional Details</h3>
            {serviceFields.additionalFields.map(field => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                {field.type === 'checkbox' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={field.name}
                      checked={formData[field.name] || false}
                      onChange={(e) => updateField(field.name, e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-stone-600">Yes</span>
                  </div>
                ) : (
                  <Input
                    id={field.name}
                    type={field.type}
                    value={formData[field.name] || ''}
                    onChange={(e) => updateField(field.name, e.target.value)}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Logistics Details */}
        <div className="space-y-4">
          <h3 className="font-semibold text-stone-900">Event Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="attire">Attire/Dress Code *</Label>
              <Input
                id="attire"
                value={formData.attire}
                onChange={(e) => updateField('attire', e.target.value)}
                placeholder="Black formal attire"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="load_in_time">Arrival/Setup Time *</Label>
              <Input
                id="load_in_time"
                type="time"
                value={formData.load_in_time}
                onChange={(e) => updateField('load_in_time', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="parking_info">Parking Information *</Label>
            <Input
              id="parking_info"
              value={formData.parking_info}
              onChange={(e) => updateField('parking_info', e.target.value)}
              placeholder="Free parking in rear lot"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="equipment_provided"
              checked={formData.equipment_provided}
              onChange={(e) => updateField('equipment_provided', e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="equipment_provided" className="cursor-pointer">
              Equipment is provided
            </Label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button type="submit" className="bg-stone-900 hover:bg-stone-800">
            Continue to Review
          </Button>
        </div>
      </form>
    </div>
  );
}