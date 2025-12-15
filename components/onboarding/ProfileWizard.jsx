import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, ArrowLeft, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { serviceConfig } from '@/components/ui/ServiceBadge';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

export default function ProfileWizard({ user, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    email: user?.email || '',
    insurance_url: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (field, file) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleInputChange(field, file_url);
      toast.success('File uploaded');
    } catch (error) {
      toast.error('Failed to upload');
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

  const generateBioWithAI = async () => {
    if (!formData.bio?.trim()) {
      toast.error('Please write a brief description first');
      return;
    }
    setIsGeneratingBio(true);
    try {
      const services = formData.service_types.map(s => serviceConfig[s]?.label).join(', ');
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a professional, engaging 2-3 sentence bio for a vendor profile. They offer: ${services}. Years of experience: ${formData.experience_years}. Their description: "${formData.bio}". Make it sound professional and appealing to potential clients. Return ONLY the bio text, nothing else.`
      });
      handleInputChange('bio', response);
      toast.success('Bio generated!');
    } catch (error) {
      toast.error('Failed to generate bio');
    }
    setIsGeneratingBio(false);
  };

  const canProceed = () => {
    switch(currentStep) {
      case 0: return true;
      case 1: return formData.first_name.trim() && formData.last_name.trim();
      case 2: return formData.business_name.trim();
      case 3: return formData.phone.trim() && formData.email.trim();
      case 4: return formData.selfie_url;
      case 5: return formData.service_types.length > 0;
      case 6: return formData.experience_years !== '';
      case 7: return formData.street_address.trim() && formData.city.trim() && formData.state && formData.zip_code.trim();
      case 8: return formData.portfolio_links.some(link => link.trim() !== '');
      case 9: return formData.bio?.trim();
      default: return true;
    }
  };

  const handleNext = () => {
    if (canProceed()) {
      setCurrentStep(prev => prev + 1);
    } else {
      toast.error('Please complete this step before continuing');
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleWizardComplete = async (wizardData) => {
    setIsSubmitting(true);
    try {
      await onComplete(wizardData);
      // Don't set isSubmitting false here - let onComplete handle navigation
    } catch (error) {
      console.error('Error submitting profile:', error);
      toast.error('Failed to submit profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Your progress will be lost and you will be logged out.')) {
      base44.auth.logout();
    }
  };

  const steps = [
    {
      title: "Welcome to VendorCover",
      content: (
        <div className="text-center space-y-6 py-8">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-stone-900 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-3xl">VC</span>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-stone-900">Welcome to VendorCover</h2>
            <p className="text-stone-600 max-w-md mx-auto">
              The platform connecting wedding and event vendors for last-minute coverage and support
            </p>
          </div>
          <div className="bg-stone-50 rounded-lg p-6 max-w-md mx-auto text-left">
            <p className="text-sm text-stone-700 mb-3 font-medium">Let's get you set up in just a few steps:</p>
            <ul className="space-y-2 text-sm text-stone-600">
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 bg-stone-900 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</div>
                Basic information
              </li>
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 bg-stone-900 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</div>
                Upload your photo
              </li>
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 bg-stone-900 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</div>
                Select your services
              </li>
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 bg-stone-900 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</div>
                Add portfolio links
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "What's your name?",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              placeholder="John"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              placeholder="Smith"
            />
          </div>
        </div>
      )
    },
    {
      title: "What's your business name?",
      content: (
        <div className="space-y-2">
          <Label htmlFor="business_name">Business Name</Label>
          <Input
            id="business_name"
            value={formData.business_name}
            onChange={(e) => handleInputChange('business_name', e.target.value)}
            placeholder="Your Business Name"
            autoFocus
          />
        </div>
      )
    },
    {
      title: "Contact Information",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="you@example.com"
            />
          </div>
        </div>
      )
    },
    {
      title: "Upload Your Photo",
      content: (
        <div className="space-y-4">
          <Label>Selfie (Required for verification)</Label>
          <div className="flex flex-col items-center gap-4">
            {formData.selfie_url && (
              <img 
                src={formData.selfie_url} 
                alt="Your selfie" 
                className="w-32 h-32 rounded-full object-cover border-4 border-stone-200"
              />
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload('selfie_url', e.target.files[0])}
              disabled={isUploading}
            />
            <div className="text-center space-y-2">
              <p className="text-sm text-stone-500">Upload a clear photo of yourself</p>
              <p className="text-xs text-blue-600 font-medium">📋 This photo will be visible to other users on your profile</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "What do you do?",
      content: (
        <div className="space-y-2">
          <Label>Select all that apply</Label>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {Object.entries(serviceConfig).map(([key, config]) => (
              <div key={key} className="flex items-center gap-2">
                <Checkbox
                  id={`service_${key}`}
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
                <Label htmlFor={`service_${key}`} className="font-normal cursor-pointer">
                  {config.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "How many years of experience do you have?",
      content: (
        <div className="space-y-2">
          <Label htmlFor="experience_years">Years of Experience</Label>
          <Input
            id="experience_years"
            type="number"
            min="0"
            value={formData.experience_years}
            onChange={(e) => handleInputChange('experience_years', e.target.value)}
            placeholder="5"
            autoFocus
          />
        </div>
      )
    },
    {
      title: "Where are you located?",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street_address">Street Address</Label>
            <Input
              id="street_address"
              value={formData.street_address}
              onChange={(e) => handleInputChange('street_address', e.target.value)}
              placeholder="123 Main Street"
              autoFocus
            />
            <p className="text-xs text-stone-500">Your address is private and only shown to you</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Select 
                value={formData.state} 
                onValueChange={(value) => handleInputChange('state', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="State" />
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
            <Label htmlFor="zip_code">Zip Code</Label>
            <Input
              id="zip_code"
              value={formData.zip_code}
              onChange={(e) => handleInputChange('zip_code', e.target.value)}
              placeholder="12345"
              maxLength="10"
            />
          </div>
          <div className="space-y-2">
            <Label>States You Service</Label>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-stone-200 rounded-lg p-3">
              {US_STATES.map((state) => (
                <div key={state} className="flex items-center gap-1">
                  <Checkbox
                    id={`service_state_${state}`}
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
                  <Label htmlFor={`service_state_${state}`} className="font-normal cursor-pointer text-sm">
                    {state}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Portfolio Links",
      content: (
        <div className="space-y-4">
          <Label>Add at least one link (website, social media, etc.)</Label>
          {formData.portfolio_links.map((link, index) => (
            <div key={index} className="space-y-2">
              <Input
                value={link}
                onChange={(e) => handlePortfolioChange(index, e.target.value)}
                placeholder="https://instagram.com/your-profile"
                autoFocus={index === 0}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPortfolioLink}
          >
            Add Another Link
          </Button>
        </div>
      )
    },
    {
      title: "Tell us about yourself",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio">
              Describe your services <span className="text-red-600">*</span>
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell potential clients what you do and what makes you great..."
              rows={4}
              required
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateBioWithAI}
              disabled={isGeneratingBio || !formData.bio?.trim()}
              className="w-full"
            >
              {isGeneratingBio ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-600 border-t-transparent rounded-full animate-spin mr-2" />
                  Generating professional bio...
                </>
              ) : (
                '✨ Re-write with AI'
              )}
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Business Logo (Optional)</Label>
            <div className="flex flex-col items-center gap-3">
              {formData.business_logo_url && (
                <img 
                  src={formData.business_logo_url} 
                  alt="Business logo" 
                  className="w-24 h-24 rounded-lg object-cover border-2 border-stone-200"
                />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('business_logo_url', e.target.files[0])}
                disabled={isUploading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Insurance Certificate (Optional)</Label>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileUpload('insurance_url', e.target.files[0])}
              disabled={isUploading}
            />
          </div>
        </div>
      )
    }
  ];

  const isReviewStep = currentStep === steps.length;

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            {!isReviewStep && currentStep > 0 ? (
              <>
                <span className="text-sm text-stone-500">
                  Step {currentStep} of {steps.length - 1}
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {steps.slice(1).map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index < currentStep ? 'bg-stone-900' : 'bg-stone-200'
                        }`}
                      />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="text-stone-500 hover:text-red-600"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-stone-500 hover:text-red-600 ml-auto"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
          <CardTitle className="text-2xl">
            {isReviewStep ? 'Review Your Profile' : steps[currentStep].title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isReviewStep ? (
            editMode ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input value={formData.first_name} onChange={(e) => handleInputChange('first_name', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input value={formData.last_name} onChange={(e) => handleInputChange('last_name', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Business Name</Label>
                    <Input value={formData.business_name} onChange={(e) => handleInputChange('business_name', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <Textarea value={formData.bio} onChange={(e) => handleInputChange('bio', e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Street Address</Label>
                    <Input value={formData.street_address} onChange={(e) => handleInputChange('street_address', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2 col-span-2">
                      <Label>City</Label>
                      <Input value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Zip Code</Label>
                    <Input value={formData.zip_code} onChange={(e) => handleInputChange('zip_code', e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setEditMode(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={() => setEditMode(false)} className="flex-1 bg-stone-900 hover:bg-stone-800">
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-stone-500">Name</p>
                    <p className="text-stone-900">{formData.first_name} {formData.last_name}</p>
                  </div>
                  <div>
                    <p className="font-medium text-stone-500">Business</p>
                    <p className="text-stone-900">{formData.business_name}</p>
                  </div>
                  <div>
                    <p className="font-medium text-stone-500">Phone</p>
                    <p className="text-stone-900">{formData.phone}</p>
                  </div>
                  <div>
                    <p className="font-medium text-stone-500">Email</p>
                    <p className="text-stone-900">{formData.email}</p>
                  </div>
                  <div>
                    <p className="font-medium text-stone-500">Services</p>
                    <p className="text-stone-900">{formData.service_types.map(s => serviceConfig[s]?.label).join(', ')}</p>
                  </div>
                  <div>
                    <p className="font-medium text-stone-500">Experience</p>
                    <p className="text-stone-900">{formData.experience_years} years</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-medium text-stone-500">Location</p>
                    <p className="text-stone-900">
                      {formData.street_address}, {formData.city}, {formData.state} {formData.zip_code}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-medium text-stone-500">Service States</p>
                    <p className="text-stone-900">{formData.service_states.length > 0 ? formData.service_states.join(', ') : 'Not specified'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-medium text-stone-500">Portfolio Links</p>
                    <p className="text-stone-900 text-xs break-all">
                      {formData.portfolio_links.filter(l => l.trim()).join(', ')}
                    </p>
                  </div>
                  {formData.bio && (
                    <div className="col-span-2">
                      <p className="font-medium text-stone-500">Bio</p>
                      <p className="text-stone-900">{formData.bio}</p>
                    </div>
                  )}
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
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditMode(true)}
                  className="w-full mt-4"
                >
                  Edit Information
                </Button>
              </div>
            )
          ) : (
            steps[currentStep].content
          )}

          <div className="flex justify-between mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || editMode}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            {isReviewStep && !editMode ? (
              <Button 
                onClick={() => handleWizardComplete(formData)}
                disabled={isSubmitting}
                className="bg-stone-900 hover:bg-stone-800"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Submit for Review
                  </>
                )}
              </Button>
            ) : !editMode ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isUploading}
                className="bg-stone-900 hover:bg-stone-800"
              >
                {currentStep === steps.length - 1 ? 'Review' : currentStep === 0 ? "Let's Start" : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}