import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UserPlus, Briefcase, Send, CheckCircle, Clock, 
  DollarSign, Star, ArrowRight 
} from 'lucide-react';

export default function HowItWorks() {
  const forVendors = [
    {
      icon: UserPlus,
      title: "Create Your Profile",
      description: "Sign up and build your vendor profile with services, portfolio, and credentials."
    },
    {
      icon: Briefcase,
      title: "Browse Jobs",
      description: "Find last-minute event coverage opportunities that match your skills and location."
    },
    {
      icon: Send,
      title: "Apply",
      description: "Submit applications with your payment info and a message to stand out."
    },
    {
      icon: CheckCircle,
      title: "Get Booked",
      description: "When accepted, view the agreement and communicate with the requester."
    },
    {
      icon: Clock,
      title: "Track Your Work",
      description: "Clock in/out of jobs, update job status (in route, arrived, in progress, done)."
    },
    {
      icon: DollarSign,
      title: "Get Paid",
      description: "Once marked as paid by the requester, the job is complete. Build your reviews!"
    }
  ];

  const forRequesters = [
    {
      icon: UserPlus,
      title: "Create Your Account",
      description: "Sign up and create your vendor profile to post requests."
    },
    {
      icon: Briefcase,
      title: "Post a Request",
      description: "Describe your event, location, payment, and what help you need."
    },
    {
      icon: Send,
      title: "Review Applications",
      description: "View vendor profiles, portfolios, and ratings. See their payment info."
    },
    {
      icon: CheckCircle,
      title: "Accept an Applicant",
      description: "Choose your vendor and a subcontract agreement is created automatically."
    },
    {
      icon: Clock,
      title: "Track Progress",
      description: "Monitor the vendor's job status and hours worked via the time clock."
    },
    {
      icon: DollarSign,
      title: "Pay & Review",
      description: "Pay the vendor via your chosen method, mark as paid, and leave a review."
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-stone-900">How VendorCover Works</h1>
        <p className="text-lg text-stone-600 max-w-2xl mx-auto">
          Connect event vendors with last-minute coverage opportunities. Fast, reliable, and built for the industry.
        </p>
      </div>

      {/* For Vendors */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900">For Vendors</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {forVendors.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className="border-stone-200">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-stone-600" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-stone-900 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </span>
                    <h3 className="font-semibold text-stone-900">{step.title}</h3>
                  </div>
                  <p className="text-sm text-stone-600">{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* For Requesters */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900">For Requesters</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {forRequesters.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className="border-stone-200">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-stone-600" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </span>
                    <h3 className="font-semibold text-stone-900">{step.title}</h3>
                  </div>
                  <p className="text-sm text-stone-600">{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <Card className="border-stone-200 bg-stone-50">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold text-stone-900 mb-2">Ready to Get Started?</h3>
          <p className="text-stone-600 mb-6">Join VendorCover today and start connecting with event professionals.</p>
          <Button asChild className="bg-stone-900 hover:bg-stone-800">
            <Link to={createPageUrl('Dashboard')}>
              Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}