import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Calendar, Clock, MapPin, DollarSign, Building2, 
  Info, Send, Briefcase, ArrowLeft
} from 'lucide-react';
import { serviceConfig } from '@/components/ui/ServiceBadge';
import { helpTypeConfig } from '@/components/ui/HelpTypeBadge';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

const EVENT_TYPES = [
  { id: 'wedding', label: 'Wedding' },
  { id: 'corporate', label: 'Corporate Event' },
  { id: 'birthday', label: 'Birthday Party' },
  { id: 'anniversary', label: 'Anniversary' },
  { id: 'engagement', label: 'Engagement Party' },
  { id: 'rehearsal_dinner', label: 'Rehearsal Dinner' },
  { id: 'shower', label: 'Shower (Bridal/Baby)' },
  { id: 'other', label: 'Other' }
];

const PAYMENT_METHODS = [
  { id: 'venmo', label: 'Venmo' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'zelle', label: 'Zelle' },
  { id: 'cash', label: 'Cash' },
  { id: 'check', label: 'Check' },
  { id: 'other', label: 'Other' }
];

export default function EditRequest() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('id');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_start_time: '',
    event_end_time: '',
    event_type: '',
    venue_name: '',
    city: '',
    state: '',
    full_address: '',
    service_type: '',
    help_type: '',
    payment_type: 'flat_rate',
    pay_amount: '',
    payment_method: '',
    requirements: '',
    equipment_provided: false,
    positions: []
  });
  const [needMultiplePeople, setNeedMultiplePeople] = useState(false);
  const [positionCounts, setPositionCounts] = useState({});
  const [positionPayments, setPositionPayments] = useState({});

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const jobs = await base44.entities.HelpRequest.filter({ id: jobId });
      return jobs[0] || null;
    },
    enabled: !!jobId
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['jobApplications', jobId],
    queryFn: () => base44.entities.JobApplication.filter({ help_request_id: jobId }),
    enabled: !!jobId
  });

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || '',
        description: job.description || '',
        event_date: job.event_date || '',
        event_start_time: job.event_start_time || '',
        event_end_time: job.event_end_time || '',
        event_type: job.event_type || '',
        venue_name: job.venue_name || '',
        city: job.city || '',
        state: job.state || '',
        full_address: job.full_address || '',
        service_type: job.service_type || '',
        help_type: job.help_type || '',
        payment_type: job.payment_type || 'flat_rate',
        pay_amount: job.pay_amount || '',
        payment_method: job.payment_method || '',
        requirements: job.requirements || '',
        equipment_provided: job.equipment_provided || false,
        positions: job.positions || []
      });

      if (job.positions && job.positions.length > 0) {
        setNeedMultiplePeople(true);
        const counts = {};
        const payments = {};
        job.positions.forEach(pos => {
          counts[pos.help_type] = pos.count_needed;
          payments[pos.help_type] = {
            type: pos.payment_type,
            amount: pos.pay_amount
          };
        });
        setPositionCounts(counts);
        setPositionPayments(payments);
      }
    }
  }, [job]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.HelpRequest.update(jobId, data);

      // Notify applicants and viewers
      const viewedBy = job.viewed_by || [];
      const applicantIds = applications.map(a => a.applicant_id);
      const uniqueUsers = [...new Set([...applicantIds, ...viewedBy])].filter(id => id !== user.email);

      for (const userId of uniqueUsers) {
        await base44.entities.Notification.create({
          user_id: userId,
          type: 'new_message',
          title: 'Job Updated',
          message: `"${job.title}" has been updated by the requester`,
          reference_id: jobId
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['job']);
      queryClient.invalidateQueries(['helpRequests']);
      toast.success('Job updated and notifications sent!');
      navigate(createPageUrl(`JobDetails?id=${jobId}`));
    },
    onError: () => {
      toast.error('Failed to update job');
    }
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updatePositionCount = (helpType, count) => {
    setPositionCounts(prev => {
      const updated = { ...prev };
      if (count > 0) {
        updated[helpType] = count;
      } else {
        delete updated[helpType];
      }
      return updated;
    });
  };

  useEffect(() => {
    if (!job) return;
    
    setFormData(prev => {
      const positions = Object.entries(positionCounts).map(([help_type, count]) => {
        const posPayment = positionPayments[help_type] || {};
        const existingPosition = job.positions?.find(p => p.help_type === help_type);
        
        return {
          help_type,
          count_needed: count,
          count_filled: existingPosition?.count_filled || 0,
          pay_amount: parseFloat(posPayment.amount) || parseFloat(prev.pay_amount) || 0,
          payment_type: posPayment.type || prev.payment_type,
          accepted_vendors: existingPosition?.accepted_vendors || []
        };
      });
      return { ...prev, positions };
    });
  }, [positionCounts, positionPayments, job]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (jobLoading || !job) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  if (job.requester_id !== user?.email) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-red-900 mb-2">Access Denied</h2>
            <p className="text-red-700 mb-6">You can only edit your own job postings.</p>
            <Button asChild>
              <Link to={createPageUrl('Dashboard')}>Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Edit Job Request</h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">Update your job posting details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 dark:text-stone-100">
              <Info className="w-5 h-5" />
              Request Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Request Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Second Shooter Needed for Saturday Wedding"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the event and what you need help with..."
                rows={3}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service Type *</Label>
                <Select 
                  value={formData.service_type} 
                  onValueChange={(value) => handleInputChange('service_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(serviceConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type of Help *</Label>
                <Select 
                  value={formData.help_type} 
                  onValueChange={(value) => handleInputChange('help_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(helpTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Details */}
        <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 dark:text-stone-100">
              <Calendar className="w-5 h-5" />
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_date">Event Date *</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => handleInputChange('event_date', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event_start_time">Start Time</Label>
                <Input
                  id="event_start_time"
                  type="time"
                  value={formData.event_start_time}
                  onChange={(e) => handleInputChange('event_start_time', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event_end_time">End Time</Label>
                <Input
                  id="event_end_time"
                  type="time"
                  value={formData.event_end_time}
                  onChange={(e) => handleInputChange('event_end_time', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select 
                value={formData.event_type} 
                onValueChange={(value) => handleInputChange('event_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label>Do you need more than one person for this job?</Label>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  For example: Lead {formData.service_type ? serviceConfig[formData.service_type]?.label.toLowerCase() : 'photographer'} + second shooter or assistant
                </p>
              </div>
              <Switch
                checked={needMultiplePeople}
                onCheckedChange={(checked) => {
                  setNeedMultiplePeople(checked);
                  if (!checked) {
                    setPositionCounts({});
                    setFormData(prev => ({ ...prev, positions: [] }));
                  }
                }}
              />
            </div>

            {needMultiplePeople && (
              <div className="mt-4 p-4 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 space-y-4">
                <div>
                  <h4 className="font-medium text-stone-900 dark:text-stone-100 mb-2">Additional Positions Needed</h4>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
                    Select which types of help you need and how many people for each. All positions are for {formData.service_type ? serviceConfig[formData.service_type]?.label : 'this service'}.
                  </p>
                </div>

                <div className="space-y-3">
                  {Object.entries(helpTypeConfig).map(([key, config]) => {
                    if (key === formData.help_type) return null;
                    
                    const hasCount = positionCounts[key] > 0;
                    const posPayment = positionPayments[key] || {};
                    
                    return (
                      <div key={key} className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            <config.icon className="w-5 h-5 text-stone-500 dark:text-stone-400" />
                            <div>
                              <p className="font-medium text-stone-900 dark:text-stone-100 text-sm">{config.label}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-stone-500 dark:text-stone-400">How many?</Label>
                            <Input
                              type="number"
                              min="0"
                              max="5"
                              value={positionCounts[key] || ''}
                              onChange={(e) => updatePositionCount(key, parseInt(e.target.value) || 0)}
                              className="w-20 h-9"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        
                        {hasCount && (
                          <div className="px-3 pb-3 grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Payment Type</Label>
                              <Select 
                                value={posPayment.type || formData.payment_type} 
                                onValueChange={(value) => setPositionPayments(prev => ({
                                  ...prev,
                                  [key]: { ...prev[key], type: value }
                                }))}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="flat_rate">Flat Rate</SelectItem>
                                  <SelectItem value="hourly">Hourly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Amount ($)</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={posPayment.amount || ''}
                                onChange={(e) => setPositionPayments(prev => ({
                                  ...prev,
                                  [key]: { ...prev[key], amount: e.target.value }
                                }))}
                                className="h-9"
                                placeholder={formData.pay_amount || '0.00'}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {Object.keys(positionCounts).length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Total positions:</strong> 1 main ({formData.help_type ? helpTypeConfig[formData.help_type]?.label : 'position'}) + {Object.values(positionCounts).reduce((a, b) => a + b, 0)} additional = {1 + Object.values(positionCounts).reduce((a, b) => a + b, 0)} people total
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 dark:text-stone-100">
              <MapPin className="w-5 h-5" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="venue_name">Venue Name</Label>
              <Input
                id="venue_name"
                value={formData.venue_name}
                onChange={(e) => handleInputChange('venue_name', e.target.value)}
                placeholder="e.g., The Grand Ballroom"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>State *</Label>
                <Select 
                  value={formData.state} 
                  onValueChange={(value) => handleInputChange('state', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_address">Full Address</Label>
              <Input
                id="full_address"
                value={formData.full_address}
                onChange={(e) => handleInputChange('full_address', e.target.value)}
                placeholder="Street address (shared only with accepted vendor)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment */}
        <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 dark:text-stone-100">
              <DollarSign className="w-5 h-5" />
              Payment Details
            </CardTitle>
            <CardDescription>
              Payment applies to all positions unless specified differently
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Payment Type *</Label>
                <Select 
                  value={formData.payment_type} 
                  onValueChange={(value) => handleInputChange('payment_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat_rate">Flat Rate</SelectItem>
                    <SelectItem value="hourly">Hourly Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay_amount">
                  {formData.payment_type === 'hourly' ? 'Hourly Rate ($) *' : 'Total Pay ($) *'}
                </Label>
                <Input
                  id="pay_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pay_amount}
                  onChange={(e) => handleInputChange('pay_amount', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select 
                  value={formData.payment_method} 
                  onValueChange={(value) => handleInputChange('payment_method', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.id} value={method.id}>{method.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 dark:text-stone-100">
              <Briefcase className="w-5 h-5" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="requirements">Special Requirements</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
                placeholder="Any specific skills, equipment, dress code, or other requirements..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Equipment Provided</Label>
                <p className="text-sm text-stone-500 dark:text-stone-400">Will you provide equipment for this job?</p>
              </div>
              <Switch
                checked={formData.equipment_provided}
                onCheckedChange={(checked) => handleInputChange('equipment_provided', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateMutation.isLoading}
            className="bg-stone-900 hover:bg-stone-800"
          >
            {updateMutation.isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Updating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Update Job
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}