import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "What is VendorCover?",
        a: "VendorCover is a platform that connects event vendors with last-minute coverage opportunities. Whether you need a backup photographer, extra help, or full replacement, we help vendors find work and requesters find reliable professionals quickly."
      },
      {
        q: "How do I create an account?",
        a: "Click 'Sign Up' to create your account. You'll need to complete your vendor profile with your services, experience, and portfolio. An admin will review and approve your profile before you can start applying to jobs or posting requests."
      },
      {
        q: "Is VendorCover free to use?",
        a: "Yes! Creating an account, browsing jobs, and applying is completely free for vendors. Requesters can also post jobs for free."
      }
    ]
  },
  {
    category: "For Vendors",
    questions: [
      {
        q: "How do I apply for jobs?",
        a: "Browse available jobs in the 'Available Jobs' section. Click on any job to see full details, then click 'Apply Now'. Include your payment information (CashApp, Venmo, PayPal, or Zelle username/email) and an optional message."
      },
      {
        q: "How does the time clock work?",
        a: "Once you're accepted for a job, you can clock in when you start work and clock out when finished. This tracks your hours automatically. For hourly jobs, the system calculates your total pay based on hours worked."
      },
      {
        q: "How do I get paid?",
        a: "Payment is handled directly between you and the requester using the payment method specified in the job (CashApp, Venmo, PayPal, Zelle, Cash, or Check). Once paid, the requester will mark the job as 'Paid' in the system."
      },
      {
        q: "Can I update my job status?",
        a: "Yes! When you're on an active job, you can update the status to show: In Route, Arrived, In Progress, or Done. This helps the requester track your progress."
      }
    ]
  },
  {
    category: "For Requesters",
    questions: [
      {
        q: "How do I post a job request?",
        a: "Go to 'Post Request' and fill out the form with your event details, location, payment information, and requirements. Once posted, vendors matching your criteria will be notified."
      },
      {
        q: "How do I choose a vendor?",
        a: "Review applications on the job detail page. View each vendor's full profile, portfolio, ratings, and reviews. Click 'View Full Profile & Portfolio' on any application to see more details."
      },
      {
        q: "What happens after I accept a vendor?",
        a: "A subcontract agreement is automatically created. You can communicate via the built-in chat, and the vendor can update their job status. Track their hours worked via the time clock feature."
      },
      {
        q: "How do I mark a job as paid?",
        a: "After paying the vendor via your chosen method, go to the job details and mark it as 'Paid'. This completes the job and allows both parties to leave reviews."
      }
    ]
  },
  {
    category: "Reviews & Ratings",
    questions: [
      {
        q: "How do reviews work?",
        a: "After a job is completed, both the vendor and requester can leave a review. Rate your experience from 1-5 stars and optionally write a detailed review. Reviews help build trust in the community."
      },
      {
        q: "Can I see reviews before accepting an applicant?",
        a: "Yes! When viewing vendor profiles and applications, you'll see their average rating and all past reviews from other requesters."
      }
    ]
  },
  {
    category: "Account & Security",
    questions: [
      {
        q: "How do I change my password?",
        a: "Go to your Profile page and click on the 'Change Password' section. Enter your current password and your new password to update it."
      },
      {
        q: "What if I forgot my password?",
        a: "Click 'Forgot Password' on the login page. You'll receive an email with instructions to reset your password."
      },
      {
        q: "Is my payment information secure?",
        a: "Your payment information (usernames/emails for payment services) is only shared with requesters when you apply for their jobs. We never store sensitive financial data like card numbers or bank accounts."
      }
    ]
  }
];

export default function FAQ() {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto">
          <HelpCircle className="w-8 h-8 text-stone-600" />
        </div>
        <h1 className="text-3xl font-bold text-stone-900">Frequently Asked Questions</h1>
        <p className="text-stone-600">Everything you need to know about VendorCover</p>
      </div>

      <div className="space-y-8">
        {faqs.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            <h2 className="text-xl font-semibold text-stone-900 mb-4">{category.category}</h2>
            <div className="space-y-3">
              {category.questions.map((item, questionIndex) => {
                const key = `${categoryIndex}-${questionIndex}`;
                const isOpen = openItems[key];
                
                return (
                  <Card key={questionIndex} className="border-stone-200">
                    <button
                      onClick={() => toggleItem(categoryIndex, questionIndex)}
                      className="w-full text-left"
                    >
                      <CardHeader className="flex flex-row items-center justify-between py-4">
                        <CardTitle className="text-base font-medium text-stone-900 pr-4">
                          {item.q}
                        </CardTitle>
                        <ChevronDown 
                          className={cn(
                            "w-5 h-5 text-stone-400 transition-transform shrink-0",
                            isOpen && "transform rotate-180"
                          )}
                        />
                      </CardHeader>
                    </button>
                    {isOpen && (
                      <CardContent className="pt-0 pb-4">
                        <p className="text-stone-600">{item.a}</p>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Card className="border-stone-200 bg-stone-50">
        <CardContent className="p-6 text-center">
          <h3 className="font-semibold text-stone-900 mb-2">Still have questions?</h3>
          <p className="text-sm text-stone-600">
            Contact our support team or check out the How It Works page for more information.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}