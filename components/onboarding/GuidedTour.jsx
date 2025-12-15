import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, X, Briefcase, Calendar, DollarSign, User } from 'lucide-react';

const tourSteps = [
  {
    title: "Welcome to VendorCover! 🎉",
    description: "Let's take a quick tour to help you get started. This will only take a minute!",
    icon: User,
    image: null
  },
  {
    title: "Browse Available Jobs",
    description: "Find last-minute coverage opportunities posted by other vendors in your area. Filter by service type, location, and date to find jobs that match your skills.",
    icon: Briefcase,
    highlight: "dashboard-jobs"
  },
  {
    title: "Post Your Own Requests",
    description: "Need coverage for an event? Post a job request with details about the date, location, and compensation. Qualified vendors will apply, and you can choose who to hire.",
    icon: Calendar,
    highlight: "post-job-button"
  },
  {
    title: "Track Your Earnings",
    description: "View your payment history, completed jobs, and earnings all in one place. Keep track of your income and performance ratings.",
    icon: DollarSign,
    highlight: "pay-history"
  },
  {
    title: "Complete Your Profile",
    description: "Make sure your profile is 100% complete to get more job opportunities. Add your portfolio, services, and experience to stand out!",
    icon: User,
    highlight: "profile-link"
  }
];

export default function GuidedTour({ onComplete, userEmail }) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const tourCompleted = localStorage.getItem(`tour_completed_${userEmail}`);
    if (!tourCompleted) {
      // Delay opening to let the page load
      const timer = setTimeout(() => setOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [userEmail]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(`tour_completed_${userEmail}`, 'true');
    setOpen(false);
    if (onComplete) onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem(`tour_completed_${userEmail}`, 'true');
    setOpen(false);
  };

  const step = tourSteps[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl" hideClose>
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>

        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-stone-900 rounded-full flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{step.title}</DialogTitle>
              <p className="text-xs text-stone-500 mt-1">
                Step {currentStep + 1} of {tourSteps.length}
              </p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-stone-900 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </DialogHeader>

        <DialogDescription className="text-base text-stone-700 py-6">
          {step.description}
        </DialogDescription>

        <DialogFooter className="flex flex-row justify-between items-center">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-stone-500"
          >
            Skip Tour
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="bg-stone-900 hover:bg-stone-800"
            >
              {currentStep === tourSteps.length - 1 ? "Get Started" : "Next"}
              {currentStep < tourSteps.length - 1 && (
                <ArrowRight className="w-4 h-4 ml-2" />
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}