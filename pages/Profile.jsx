import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/components/shared/useCurrentUser';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Edit, Save, X, LogOut } from 'lucide-react';
import { serviceConfig } from '@/components/ui/ServiceBadge';
import ProfileWizard from '@/components/onboarding/ProfileWizard';

function RejectionAppealForm({ profile, user }) {
  const [appealMessage, setAppealMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const submitAppeal = async () => {
    if (!appealMessage.trim()) {
      toast.error('Please provide a reason for your appeal');
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.entities.VendorProfile.update(profile.id, {
        appeal_status: 'pending',
        appeal_message: appealMessage,
        appeal_submitted_date: new Date().toISOString()
      });

      await base44.entities.Notification.create({
        user_id: 'team@twofoldvisuals.com',
        type: 'new_message',
        title: 'New Rejection Appeal',
        message: `${profile.full_name} has appealed their profile rejection`,
        reference_id: profile.id
      });

      queryClient.invalidateQueries(['vendorProfile']);
      toast.success('Appeal submitted to admins');
    } catch (error) {
      toast.error('Failed to submit appeal');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={appealMessage}
        onChange={(e) => setAppealMessage(e.target.value)}
        placeholder="Explain why you believe your profile should be approved..."
        rows={4}
        className="bg-white"
      />
      <div className="flex gap-2">
        <Button
          onClick={submitAppeal}
          disabled={isSubmitting || !appealMessage.trim()}
          className="flex-1 bg-red-600 hover:bg-red-700"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Appeal'}
        </Button>
        <Button
          onClick={() => base44.auth.logout()}
          variant="outline"
          className="flex-1"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </div>
    </div>
  );
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useCurrentUser();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    business_name: '',
    bio: '',
    selfie_url: '',
    business_logo_url: '',
    service_types: [],
    experience_years: '',
    street_address: '',
    city: '',
    state: '',
    service_states: [],
    zip_code: '',
    travel_radius_miles: 50,
    portfolio_links: [''],
    phone: '',
    email: '',
    insurance_url: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [user]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['vendorProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.VendorProfile.filter({ user_id: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        business_name: profile.business_name || '',
        bio: profile.bio || '',
        selfie_url: profile.selfie_url || '',
        business_logo_url: profile.business_logo_url || '',
        service_types: profile.service_types || [],
        experience_years: profile.experience_years || '',
        street_address: profile.street_address || '',
        city: profile.city || '',
        state: profile.state || '',
        service_states: profile.service_states || [],
        zip_code: profile.zip_code || '',
        travel_radius_miles: profile.travel_radius_miles || 50,
        portfolio_links: profile.portfolio_links?.length > 0 ? profile.portfolio_links : [''],
        phone: profile.phone || '',
        email: profile.email || user?.email || '',
        insurance_url: profile.insurance_url || ''
      });
    }
  }, [profile, user]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const cleanedData = {
        ...data,
        user_id: user.email,
        full_name: data.first_name && data.last_name ? `${data.first_name} ${data.last_name}` : '',
        portfolio_links: data.portfolio_links?.filter(link => link.trim() !== '') || [],
        experience_years: parseInt(data.experience_years) || 0,
        travel_radius_miles: parseInt(data.travel_radius_miles) || 50
      };

      const isAdmin = user.role === 'admin';
      const isOwner = user.email === 'team@twofoldvisuals.com';
      const isNewProfile = !profile;
      
      if (!isAdmin && profile?.approval_status === 'action_required') {
        cleanedData.approval_status = 'pending';
        cleanedData.action_required_notes = null;
      }

      let profileId;
      if (profile) {
        await base44.entities.VendorProfile.update(profile.id, cleanedData);
        profileId = profile.id;
      } else {
        const newProfile = await base44.entities.VendorProfile.create({
          ...cleanedData,
          approval_status: isAdmin ? 'approved' : 'pending',
          ai_assessment_status: 'pending',
          needs_risk_review: false
        });
        profileId = newProfile.id;
      }

      // Trigger AI for new profiles AND updates to approved profiles
      if (!isAdmin && !isOwner) {
        try {
          // Don't await - let it run in background
          base44.functions.invoke('analyzeVendorProfile', { profileId, isNewProfile });
        } catch (error) {
          console.error('AI analysis failed:', error);
        }
      }
      
      return { isNewProfile };
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries(['vendorProfile']);
      setEditMode(false);
      if (data.isNewProfile) {
        toast.success('Profile submitted - AI analysis in progress');
        navigate(createPageUrl('Dashboard'));
      } else {
        toast.success('Profile updated');
      }
    },
    onError: () => {
      toast.error('Failed to save profile');
    }
  });

  const handleWizardComplete = async (wizardData) => {
    return new Promise((resolve, reject) => {
      saveMutation.mutate(wizardData, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error)
      });
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleInputChange(field, file_url);
      toast.success('File uploaded');
    } catch (error) {
      toast.error('Failed to upload file');
    }
    setIsUploading(false);
  };

  const handlePortfolioChange = (index, value) => {
    const newLinks = [...formData.portfolio_links];
    newLinks[index] = value;
    setFormData(prev => ({ ...prev, portfolio_links: newLinks }));
  };

  const addPortfolioLink = () => {
    setFormData(prev => ({
      ...prev,
      portfolio_links: [...prev.portfolio_links, '']
    }));
  };

  const removePortfolioLink = (index) => {
    setFormData(prev => ({
      ...prev,
      portfolio_links: prev.portfolio_links.filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  // Show wizard for new users
  if (!profile) {
    return <ProfileWizard user={user} onComplete={handleWizardComplete} />;
  }

  // Block access if appeal is denied
  if (profile?.approval_status === 'rejected' && profile?.appeal_status === 'denied') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <Card className="max-w-md border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-red-600 text-2xl">❌</span>
              </div>
              <div>
                <p className="font-bold text-red-900 text-lg">Appeal Denied</p>
                <p className="text-sm text-red-700">
                  {profile.appeal_denial_reason || 'Your appeal has been reviewed and denied.'}
                </p>
              </div>
            </div>
            <Button 
              onClick={() => base44.auth.logout()}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Block editing/viewing if rejected (show appeal form)
  if (profile?.approval_status === 'rejected' && profile?.appeal_status !== 'pending') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <Card className="max-w-md border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-red-600 text-2xl">❌</span>
              </div>
              <div>
                <p className="font-bold text-red-900 text-lg">Profile Rejected</p>
                <p className="text-sm text-red-700 mb-2">
                  {profile.rejection_reason || 'Your profile has been rejected.'}
                </p>
              </div>
            </div>
            <RejectionAppealForm profile={profile} user={user} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show appeal pending message
  if (profile?.approval_status === 'rejected' && profile?.appeal_status === 'pending') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <Card className="max-w-md border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-amber-600 text-2xl">⏳</span>
              </div>
              <div>
                <p className="font-bold text-amber-900 text-lg">Appeal Under Review</p>
                <p className="text-sm text-amber-700">
                  Your appeal has been submitted and is being reviewed by our admin team. You'll be notified once a decision is made.
                </p>
              </div>
            </div>
            <Button 
              onClick={() => base44.auth.logout()}
              variant="outline"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show profile details summary for existing users
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Profile Details</h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            {editMode ? 'Update your information below' : 'View and manage your profile'}
          </p>
        </div>

        {/* Approval Status Banners */}
        {profile?.approval_status === 'pending' && (
          <Card className="border-amber-200 bg-amber-50 mb-6">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-amber-600 text-xl">⏳</span>
              </div>
              <div>
                <p className="font-medium text-amber-900">Profile Under Review</p>
                <p className="text-sm text-amber-700">
                  Your profile is pending admin approval. You'll be notified once it's reviewed.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {profile?.approval_status === 'action_required' && (
          <Card className="border-amber-200 bg-amber-50 mb-6">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-amber-600 text-xl">⚠️</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-amber-900">Action Required</p>
                <p className="text-sm text-amber-700 mb-2">
                  {profile.action_required_notes || 'Additional information is needed before we can approve your profile.'}
                </p>
                <p className="text-xs text-amber-600 font-medium">
                  Please update your profile and save. Your profile will be re-submitted for admin review.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {profile?.approval_status === 'rejected' && profile?.appeal_status === 'denied' && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-red-600 text-xl">❌</span>
                </div>
                <div>
                  <p className="font-medium text-red-900">Appeal Denied</p>
                  <p className="text-sm text-red-700">
                    {profile.appeal_denial_reason || 'Your appeal has been reviewed and denied.'}
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => base44.auth.logout()}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Log Out
              </Button>
            </CardContent>
          </Card>
        )}

        {profile?.approval_status === 'rejected' && profile?.appeal_status !== 'denied' && profile?.appeal_status !== 'pending' && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-red-600 text-xl">❌</span>
                </div>
                <div>
                  <p className="font-medium text-red-900">Profile Rejected</p>
                  <p className="text-sm text-red-700 mb-2">
                    {profile.rejection_reason || 'Your profile has been rejected.'}
                  </p>
                </div>
              </div>
              <RejectionAppealForm profile={profile} user={user} />
            </CardContent>
          </Card>
        )}

        {profile?.approval_status === 'rejected' && profile?.appeal_status === 'pending' && (
          <Card className="border-amber-200 bg-amber-50 mb-6">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-amber-600 text-xl">⏳</span>
              </div>
              <div>
                <p className="font-medium text-amber-900">Appeal Under Review</p>
                <p className="text-sm text-amber-700">
                  Your appeal has been submitted and is being reviewed by our admin team.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Details Card */}
        <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
          <CardContent className="p-6">
            {editMode ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>First Name *</Label>
                      <Input value={formData.first_name} onChange={(e) => handleInputChange('first_name', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name *</Label>
                      <Input value={formData.last_name} onChange={(e) => handleInputChange('last_name', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Business Name *</Label>
                    <Input value={formData.business_name} onChange={(e) => handleInputChange('business_name', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Bio *</Label>
                    <Textarea value={formData.bio} onChange={(e) => handleInputChange('bio', e.target.value)} rows={3} required placeholder="Describe what you do and your experience..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Services *</Label>
                    <div className="grid grid-cols-2 gap-2 border border-stone-200 dark:border-stone-700 rounded-lg p-3 max-h-48 overflow-y-auto">
                      {Object.entries(serviceConfig).map(([key, config]) => (
                        <div key={key} className="flex items-center gap-2">
                          <Checkbox
                            id={`edit_service_${key}`}
                            checked={formData.service_types.includes(key)}
                            onCheckedChange={(checked) => {
                              handleInputChange(
                                'service_types',
                                checked
                                  ? [...formData.service_types, key]
                                  : formData.service_types.filter(s => s !== key)
                              );
                            }}
                          />
                          <Label htmlFor={`edit_service_${key}`} className="font-normal cursor-pointer text-sm">
                            {config.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Years of Experience *</Label>
                    <Input type="number" min="0" value={formData.experience_years} onChange={(e) => handleInputChange('experience_years', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Street Address *</Label>
                    <Input value={formData.street_address} onChange={(e) => handleInputChange('street_address', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2 col-span-2">
                      <Label>City *</Label>
                      <Input value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>State *</Label>
                      <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                        <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Zip Code *</Label>
                    <Input value={formData.zip_code} onChange={(e) => handleInputChange('zip_code', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Service States</Label>
                    <div className="grid grid-cols-3 gap-2 border border-stone-200 dark:border-stone-700 rounded-lg p-3 max-h-48 overflow-y-auto">
                      {US_STATES.map((state) => (
                        <div key={state} className="flex items-center gap-1">
                          <Checkbox
                            id={`edit_state_${state}`}
                            checked={formData.service_states.includes(state)}
                            onCheckedChange={(checked) => {
                              handleInputChange(
                                'service_states',
                                checked
                                  ? [...formData.service_states, state]
                                  : formData.service_states.filter(s => s !== state)
                              );
                            }}
                          />
                          <Label htmlFor={`edit_state_${state}`} className="font-normal cursor-pointer text-xs">
                            {state}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Portfolio Links * (at least 1 required)</Label>
                    {formData.portfolio_links.map((link, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={link}
                          onChange={(e) => handlePortfolioChange(index, e.target.value)}
                          placeholder="https://instagram.com/yourprofile or website"
                          required={index === 0}
                        />
                        {formData.portfolio_links.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removePortfolioLink(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addPortfolioLink}>
                      Add Link
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Selfie *</Label>
                    {formData.selfie_url && (
                      <img src={formData.selfie_url} alt="Selfie" className="w-20 h-20 rounded-full object-cover mb-2" />
                    )}
                    <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'selfie_url')} disabled={isUploading} />
                    <p className="text-xs text-stone-500">📋 This photo will be visible to other users on your profile</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Business Logo (Optional)</Label>
                    {formData.business_logo_url && (
                      <img src={formData.business_logo_url} alt="Logo" className="w-20 h-20 rounded-lg object-cover mb-2" />
                    )}
                    <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'business_logo_url')} disabled={isUploading} />
                  </div>
                  <div className="space-y-2">
                    <Label>Insurance Certificate (Optional)</Label>
                    <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e, 'insurance_url')} disabled={isUploading} />
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setEditMode(false)} className="flex-1">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      if (!formData.phone?.trim()) {
                        toast.error('Phone number is required');
                        return;
                      }
                      if (!formData.portfolio_links || formData.portfolio_links.filter(l => l.trim()).length === 0) {
                        toast.error('Please add at least one portfolio link (website, social media, etc.)');
                        return;
                      }
                      if (!formData.bio?.trim()) {
                        toast.error('Bio is required - please describe what you do');
                        return;
                      }
                      saveMutation.mutate(formData);
                    }} 
                    disabled={saveMutation.isLoading || isUploading} 
                    className="flex-1 bg-stone-900 hover:bg-stone-800"
                  >
                    {saveMutation.isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-stone-500 mb-1">Name</p>
                    <p className="text-stone-900 dark:text-stone-100">{formData.first_name} {formData.last_name}</p>
                  </div>
                  <div>
                    <p className="font-medium text-stone-500 mb-1">Business</p>
                    <p className="text-stone-900 dark:text-stone-100">{formData.business_name}</p>
                  </div>
                  <div>
                    <p className="font-medium text-stone-500 mb-1">Phone</p>
                    <p className="text-stone-900 dark:text-stone-100">{formData.phone}</p>
                  </div>
                  <div>
                    <p className="font-medium text-stone-500 mb-1">Email</p>
                    <p className="text-stone-900 dark:text-stone-100">{formData.email}</p>
                  </div>
                  <div>
                    <p className="font-medium text-stone-500 mb-1">Services</p>
                    <p className="text-stone-900 dark:text-stone-100">{formData.service_types?.map(s => serviceConfig[s]?.label).join(', ')}</p>
                  </div>
                  <div>
                    <p className="font-medium text-stone-500 mb-1">Experience</p>
                    <p className="text-stone-900 dark:text-stone-100">{formData.experience_years} years</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-medium text-stone-500 mb-1">Location</p>
                    <p className="text-stone-900 dark:text-stone-100">
                      {formData.street_address}, {formData.city}, {formData.state} {formData.zip_code}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-medium text-stone-500 mb-1">Service States</p>
                    <p className="text-stone-900 dark:text-stone-100">{formData.service_states?.length > 0 ? formData.service_states.join(', ') : 'Not specified'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-medium text-stone-500 mb-1">Portfolio Links</p>
                    <div className="flex flex-col gap-1">
                      {formData.portfolio_links?.filter(l => l.trim()).map((link, idx) => (
                        <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline break-all">
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                  {formData.bio && (
                    <div className="col-span-2">
                      <p className="font-medium text-stone-500 mb-1">Bio</p>
                      <p className="text-stone-900 dark:text-stone-100 text-sm">{formData.bio}</p>
                    </div>
                  )}
                  <div className="col-span-2 flex gap-4">
                    {formData.selfie_url && (
                      <div>
                        <p className="font-medium text-stone-500 mb-2">Your Photo</p>
                        <img src={formData.selfie_url} alt="Selfie" className="w-20 h-20 rounded-full object-cover" />
                      </div>
                    )}
                    {formData.business_logo_url && (
                      <div>
                        <p className="font-medium text-stone-500 mb-2">Logo</p>
                        <img src={formData.business_logo_url} alt="Logo" className="w-20 h-20 rounded-lg object-cover" />
                      </div>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditMode(true)} className="w-full mt-4">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Information
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}