import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';
import { Loader2, Send, Sparkles, FileText, Settings, Upload, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProfileAIAssistant({ onComplete, onUseManualForm, initialManualMode = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [useManualForm, setUseManualForm] = useState(initialManualMode);
  const [isUploadingSelfie, setIsUploadingSelfie] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingInsurance, setIsUploadingInsurance] = useState(false);
  const messagesEndRef = useRef(null);

  const requiredFields = [
    'first_name', 'last_name', 'business_name', 'service_types', 
    'phone', 'street_address', 'city', 'state', 'zip_code',
    'experience_years', 'travel_radius_miles', 'portfolio_links', 'selfie_url', 'bio'
  ];

  useEffect(() => {
    if (!useManualForm) {
      addMessage('assistant', "Hi and welcome to VendorCover! I'm here to help you set up your profile. Let's get started - what's your first and last name?");
    }
  }, [useManualForm]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content, timestamp: new Date() }]);
  };

  const handleFileUpload = async (e, field, setUploading) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const newData = { ...profileData, [field]: file_url };
      setProfileData(newData);
      
      const fieldNames = {
        selfie_url: 'selfie',
        business_logo_url: 'business logo',
        insurance_url: 'insurance document'
      };
      
      toast.success(`${fieldNames[field]} uploaded!`);
      
      // Tell AI about the upload and continue conversation
      const uploadMessage = `I uploaded my ${fieldNames[field]}`;
      addMessage('user', uploadMessage);
      
      // Process with AI
      processWithAI(uploadMessage, newData);
      
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const getMissingFields = (data) => {
    const missing = [];
    if (!data.first_name || !data.last_name) missing.push('full name');
    if (!data.business_name) missing.push('business name');
    if (!data.service_types?.length) missing.push('service type');
    if (!data.phone) missing.push('phone number');
    if (!data.street_address || !data.city || !data.state || !data.zip_code) missing.push('full address');
    if (!data.experience_years && data.experience_years !== 0) missing.push('years of experience');
    if (!data.travel_radius_miles && data.travel_radius_miles !== 0) missing.push('travel radius');
    if (!data.portfolio_links?.length) missing.push('portfolio link');
    if (!data.selfie_url) missing.push('selfie photo');
    if (!data.bio) missing.push('bio/description of services');
    return missing;
  };

  const getNextQuestion = (data) => {
    if (!data.first_name || !data.last_name) return "What's your business name?";
    if (!data.business_name) return "What type of services do you offer? (e.g., photography, videography, DJ, etc.)";
    if (!data.service_types?.length) return "What's your phone number?";
    if (!data.phone) return "What's your full address? (street, city, state, zip)";
    if (!data.street_address || !data.city || !data.state || !data.zip_code) return "What's your full address? (street, city, state, zip)";
    if (!data.experience_years && data.experience_years !== 0) return "How many years of experience do you have?";
    if (!data.travel_radius_miles && data.travel_radius_miles !== 0) return "What's your travel radius in miles? (or say 'any' for no limit)";
    if (!data.service_states || data.service_states.length === 0) return "What states do you service? (e.g., IA, MN, IL or say 'just my state' or 'all states')";
    if (!data.portfolio_links?.length) return "Please share a link to your portfolio, website, or social media.";
    if (!data.bio) return "Tell me briefly what services you provide so I can write your bio.";
    if (!data.selfie_url) return "Please upload your selfie using the button below.";
    if (!data.business_logo_url) return "Would you like to upload your business logo? (say 'yes' to upload, or 'skip' to continue)";
    if (!data.insurance_url && data.insurance_check !== 'asked') return "Do you have insurance you'd like to upload? (say 'yes' to upload, or 'no' to continue)";
    return "All set! Click 'Generate Profile' below to continue.";
  };

  const processWithAI = async (userMessage, currentData = profileData) => {
    setIsProcessing(true);

    try {
      // PRE-PROCESS: Extract obvious patterns before sending to AI
      const updatedData = { ...currentData };
      const lowerMsg = userMessage.toLowerCase().trim();
      
      // Check what we're currently asking for
      const missing = getMissingFields(updatedData);
      
      // Smart extraction based on what we need
      if (missing.includes('travel radius')) {
        if (lowerMsg === 'any' || lowerMsg === 'anywhere' || lowerMsg.includes('no limit')) {
          updatedData.travel_radius_miles = 0;
        } else {
          const num = parseInt(lowerMsg);
          if (!isNaN(num)) updatedData.travel_radius_miles = num;
        }
      }
      
      if (missing.includes('years of experience')) {
        const num = parseInt(lowerMsg);
        if (!isNaN(num)) updatedData.experience_years = num;
      }
      
      if (missing.includes('phone number')) {
        const cleaned = userMessage.replace(/\D/g, '');
        if (cleaned.length >= 10) updatedData.phone = userMessage;
      }
      
      // Smart address parsing - handle full addresses
      if (missing.includes('full address')) {
        // Look for zip code (5 digits)
        const zipMatch = userMessage.match(/\b\d{5}\b/);
        if (zipMatch) updatedData.zip_code = zipMatch[0];
        
        // Look for state (2 letters, case insensitive)
        const stateMatch = userMessage.match(/\b([A-Z]{2})\b/i);
        if (stateMatch) updatedData.state = stateMatch[1].toUpperCase();
        
        // Parse city and street
        if (stateMatch && zipMatch) {
          // Get everything before the state
          const beforeState = userMessage.substring(0, stateMatch.index).trim();
          const parts = beforeState.split(/[\s,]+/).filter(w => w.length > 0);
          
          if (parts.length > 0) {
            // Last word before state is city
            updatedData.city = parts[parts.length - 1];
            
            // Everything before city is street
            if (parts.length > 1) {
              updatedData.street_address = parts.slice(0, -1).join(' ');
            }
          }
        }
        
        // If we got all 4 parts, mark as complete
        if (updatedData.street_address && updatedData.city && updatedData.state && updatedData.zip_code) {
          console.log('Address fully parsed:', updatedData);
        }
      }
      
      // Portfolio link extraction - detect URLs
      if (missing.includes('portfolio link')) {
        const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|net|org|io)[^\s]*)/i;
        if (urlPattern.test(userMessage)) {
          // Extract URL from message
          const match = userMessage.match(urlPattern);
          if (match) {
            let url = match[0];
            // Add https:// if missing
            if (!url.startsWith('http')) {
              url = 'https://' + url;
            }
            updatedData.portfolio_links = [url];
          }
        }
      }
      
      // Bio generation trigger - if they describe services and we need bio, mark it for AI to process
      if (missing.includes('bio/description of services')) {
        // Any non-empty response counts as a bio trigger
        if (userMessage.trim().length > 5) {
          // Let AI generate the bio from this description
          // Don't set it here, let AI process it properly
        }
      }

      const isComplete = missing.length === 0;

      // Build context about what we have
      const collectedInfo = [];
      if (updatedData.first_name) collectedInfo.push(`first_name: ${updatedData.first_name}`);
      if (updatedData.last_name) collectedInfo.push(`last_name: ${updatedData.last_name}`);
      if (updatedData.business_name) collectedInfo.push(`business_name: ${updatedData.business_name}`);
      if (updatedData.service_types?.length) collectedInfo.push(`service_types: ${JSON.stringify(updatedData.service_types)}`);
      if (updatedData.phone) collectedInfo.push(`phone: ${updatedData.phone}`);
      if (updatedData.street_address) collectedInfo.push(`street_address: ${updatedData.street_address}`);
      if (updatedData.city) collectedInfo.push(`city: ${updatedData.city}`);
      if (updatedData.state) collectedInfo.push(`state: ${updatedData.state}`);
      if (updatedData.zip_code) collectedInfo.push(`zip_code: ${updatedData.zip_code}`);
      if (updatedData.experience_years || updatedData.experience_years === 0) collectedInfo.push(`experience_years: ${updatedData.experience_years}`);
      if (updatedData.travel_radius_miles || updatedData.travel_radius_miles === 0) collectedInfo.push(`travel_radius_miles: ${updatedData.travel_radius_miles}`);
      if (updatedData.portfolio_links?.length) collectedInfo.push(`portfolio_links: ${JSON.stringify(updatedData.portfolio_links)}`);
      if (updatedData.service_states?.length) collectedInfo.push(`service_states: ${JSON.stringify(updatedData.service_states)}`);
      if (updatedData.bio) collectedInfo.push(`bio: ${updatedData.bio}`);
      if (updatedData.selfie_url) collectedInfo.push(`selfie_url: uploaded`);

      const nextQuestion = getNextQuestion(updatedData);

      const prompt = `You are a profile setup assistant for VendorCover.

      WHAT WE'VE COLLECTED SO FAR:
      ${collectedInfo.join('\n') || 'Nothing yet'}

      USER'S LATEST MESSAGE: "${userMessage}"

      NEXT QUESTION TO ASK: "${nextQuestion}"

      INSTRUCTIONS:
      1. EXTRACT DATA from the user's message:
      - First/last name: "john smith" → first_name: "john", last_name: "smith" (if just one word, assume it's first name)
      - Business name: ANYTHING they say → business_name: "whatever they said"
      - Services: "photo", "photographer", "photography" → ["photographer"], "video", "videographer" → ["videographer"], "dj" → ["dj"], etc.
      - Phone: any format → phone: "cleaned up"
      - Address: "123 main st, newton, ia 50208" → parse street_address, city, state, zip_code
      - Experience: any number → experience_years: number
      - Travel: "50", "100" → travel_radius_miles: number, "any"/"anywhere"/"no limit" → travel_radius_miles: 0
      - States: "IA", "IA MN" → service_states: ["IA","MN"], "just my state" → use home state, "all" → all US states
      - Portfolio: any URL/link → portfolio_links: ["url"]
      - Bio: if they describe services → write a professional 2-3 sentence bio
      - Logo/Insurance: "yes" → ask to use button, "no"/"skip" → set insurance_check: "asked"

      2. BUILD YOUR RESPONSE:
      - If user answered the question: Say "Got it!" + IMMEDIATELY ask next question
      - If user said "I told you" / "I already said": Check collected data, apologize if we have it, ask next question
      - If user asked a question: Answer briefly + ask next question
      - ALWAYS end with the next question (unless complete)

      3. CRITICAL RULES:
      - NEVER ask for data we already have in "WHAT WE'VE COLLECTED SO FAR"
      - NEVER ask for data you JUST extracted from user's current message
      - If user gives you business name "twofold visuals", extract it AND move to next question
      - Always check: does "NEXT QUESTION TO ASK" ask for something we now have? If yes, recalculate next question.

      RESPOND WITH JSON:
      {
      "message": "your brief response ending with the next question",
      "extracted_data": { /* data you extracted from their message */ }
      }`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            message: { type: "string" },
            extracted_data: { type: "object" }
          },
          required: ["message", "extracted_data"]
        }
      });

      // Merge extracted data with pre-processed data
      const finalData = { ...updatedData };
      if (response.extracted_data && Object.keys(response.extracted_data).length > 0) {
        Object.entries(response.extracted_data).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            finalData[key] = value;
          }
        });
      }
      setProfileData(finalData);

      // Show AI response
      addMessage('assistant', response.message);

      // Check if complete
      const newMissing = getMissingFields(finalData);
      if (newMissing.length === 0) {
        setTimeout(() => {
          addMessage('assistant', "Perfect! Click 'Generate Profile' below to continue to the profile form.");
        }, 1000);
      }

    } catch (error) {
      console.error('AI Error:', error);
      addMessage('assistant', "Sorry, I had trouble processing that. Could you try rephrasing?");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);

    await processWithAI(userMessage);
  };

  const isComplete = () => {
    return getMissingFields(profileData).length === 0;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3 flex-1">
            <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">AI Profile Setup Assistant</h3>
              <p className="text-sm text-blue-700">
                Chat with me to set up your profile - I'll help you every step of the way
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (onUseManualForm) {
                  onUseManualForm(profileData);
                }
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Use Form Instead
            </Button>
            <Link to={createPageUrl('AccountSettings')}>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Account Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="h-[500px] overflow-y-auto space-y-4 p-4 bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </AvatarFallback>
              </Avatar>
            )}
            <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
              msg.role === 'user' 
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900' 
                : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === 'user' && (
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                  {profileData.first_name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex gap-3 justify-start">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-blue-100 dark:bg-blue-900">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* File Uploads */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-stone-700">
            Selfie {profileData.selfie_url && <CheckCircle2 className="w-3 h-3 inline text-green-600 ml-1" />}
          </Label>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e, 'selfie_url', setIsUploadingSelfie)}
            disabled={isUploadingSelfie}
            id="selfie-upload"
          />
          {profileData.selfie_url ? (
            <div className="border border-green-200 bg-green-50 rounded-md p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-700 font-medium">Uploaded</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => document.getElementById('selfie-upload').click()}
                >
                  Change
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              disabled={isUploadingSelfie}
              onClick={() => document.getElementById('selfie-upload').click()}
            >
              {isUploadingSelfie ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Selfie
                </>
              )}
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-stone-700">
            Logo (Optional) {profileData.business_logo_url && <CheckCircle2 className="w-3 h-3 inline text-green-600 ml-1" />}
          </Label>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e, 'business_logo_url', setIsUploadingLogo)}
            disabled={isUploadingLogo}
            id="logo-upload"
          />
          {profileData.business_logo_url ? (
            <div className="border border-green-200 bg-green-50 rounded-md p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-700 font-medium">Uploaded</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => document.getElementById('logo-upload').click()}
                >
                  Change
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              disabled={isUploadingLogo}
              onClick={() => document.getElementById('logo-upload').click()}
            >
              {isUploadingLogo ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo
                </>
              )}
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-stone-700">
            Insurance (Optional) {profileData.insurance_url && <CheckCircle2 className="w-3 h-3 inline text-green-600 ml-1" />}
          </Label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => handleFileUpload(e, 'insurance_url', setIsUploadingInsurance)}
            disabled={isUploadingInsurance}
            id="insurance-upload"
          />
          {profileData.insurance_url ? (
            <div className="border border-green-200 bg-green-50 rounded-md p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-700 font-medium">Uploaded</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => document.getElementById('insurance-upload').click()}
                >
                  Change
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              disabled={isUploadingInsurance}
              onClick={() => document.getElementById('insurance-upload').click()}
            >
              {isUploadingInsurance ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Insurance
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {isComplete() && (
        <Button 
          onClick={() => {
            if (onUseManualForm) {
              onUseManualForm(profileData);
            }
          }}
          className="w-full bg-stone-900 hover:bg-stone-800 text-white py-6 text-lg font-semibold"
          size="lg"
        >
          Generate Profile →
        </Button>
      )}

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Type your answer or ask me a question..."
          disabled={isProcessing}
          className="flex-1"
        />
        <Button 
          onClick={handleSend} 
          disabled={isProcessing || !input.trim()} 
          size="icon"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}