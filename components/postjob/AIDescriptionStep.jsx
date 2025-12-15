import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function AIDescriptionStep({ jobData, updateJobData, onNext }) {
  const [description, setDescription] = useState(jobData.description || '');
  const [fullAddress, setFullAddress] = useState(jobData.full_address || '');
  const [receptionAddress, setReceptionAddress] = useState(jobData.reception_address || '');
  const [sameLocation, setSameLocation] = useState(jobData.same_location !== false);

  const isWedding = jobData.event_type === 'wedding';

  const handleContinue = () => {
    if (!description.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    if (!fullAddress.trim()) {
      toast.error('Please enter the event address');
      return;
    }

    if (isWedding && !sameLocation && !receptionAddress.trim()) {
      toast.error('Please enter the reception address');
      return;
    }

    updateJobData({
      description,
      full_address: fullAddress,
      ceremony_address: fullAddress,
      reception_address: isWedding && !sameLocation ? receptionAddress : fullAddress,
      same_location: sameLocation
    });

    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Describe the job</h2>
        <p className="text-sm text-stone-600">
          Describe what help you need. Be clear and honest.
        </p>
      </div>

      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={6}
        placeholder="Example: Need a backup photographer due to illness..."
      />

      <div className="p-4 border rounded bg-stone-50 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <h3 className="font-semibold">Event Location</h3>
        </div>

        <Input
          placeholder="Full event address"
          value={fullAddress}
          onChange={(e) => setFullAddress(e.target.value)}
        />

        {isWedding && (
          <>
            <RadioGroup
              value={sameLocation ? 'yes' : 'no'}
              onValueChange={(v) => setSameLocation(v === 'yes')}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" />
                <Label>Same ceremony & reception location</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" />
                <Label>Different reception location</Label>
              </div>
            </RadioGroup>

            {!sameLocation && (
              <Input
                placeholder="Reception address"
                value={receptionAddress}
                onChange={(e) => setReceptionAddress(e.target.value)}
              />
            )}
          </>
        )}
      </div>

      <Button
        onClick={handleContinue}
        className="w-full bg-stone-900 hover:bg-stone-800"
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}
