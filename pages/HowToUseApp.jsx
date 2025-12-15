import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Search, Calendar, MessageSquare, DollarSign, CheckCircle2, User, Bell, Shield } from 'lucide-react';

export default function HowToUseApp() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">How to Use VendorCover</h1>
        <p className="text-stone-600 mt-1">Your complete guide to finding coverage and posting help requests</p>
      </div>

      {/* Getting Started */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">1. Complete Your Profile</h3>
            <p className="text-stone-600 text-sm mb-2">
              Go to your profile and fill in all required information:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Add a selfie and business logo</li>
              <li>Select your service types (photographer, videographer, DJ, etc.)</li>
              <li>Upload portfolio examples</li>
              <li>Add your location and service areas</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">2. Wait for Approval</h3>
            <p className="text-stone-600 text-sm">
              An admin will review your profile. You'll receive a notification once approved. You can update your profile while waiting.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">3. Install the App</h3>
            <p className="text-stone-600 text-sm">
              For the best experience, install VendorCover on your phone:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li><strong>iPhone/iPad:</strong> Tap the Share button and select "Add to Home Screen"</li>
              <li><strong>Android:</strong> Tap the menu (3 dots) and select "Add to Home Screen" or "Install App"</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Finding Jobs */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Finding Coverage Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Browse Available Jobs</h3>
            <p className="text-stone-600 text-sm mb-2">
              Go to the "Jobs" tab and select "Available Jobs" to see all open positions:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Use filters to find jobs by service type, location, and help type</li>
              <li><Badge className="bg-red-500 text-white">URGENT!</Badge> jobs are happening within 24 hours</li>
              <li>Search by city, venue name, or job title</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Applying to Jobs</h3>
            <p className="text-stone-600 text-sm mb-2">
              When you find a job you're interested in:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Click "View Details" to see full job information</li>
              <li>Click "Apply" and add an optional message</li>
              <li>The poster will review your profile and application</li>
              <li>You'll get a notification when they respond</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">After Being Accepted</h3>
            <p className="text-stone-600 text-sm">
              Once accepted, you'll receive an agreement to sign. Review and confirm the details including payment, location, and job requirements.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Posting Requests */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Posting Help Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Creating a Request</h3>
            <p className="text-stone-600 text-sm mb-2">
              Click "Post Request" from the Jobs tab or Dashboard:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Add a clear title describing what you need</li>
              <li>Select service type and help type (full replacement, second shooter, etc.)</li>
              <li>Enter event details (date, time, location)</li>
              <li>Set payment amount and method</li>
              <li>Toggle "Do you need more than one person?" to add multiple positions</li>
              <li>Add any special requirements or notes</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Multiple Positions</h3>
            <p className="text-stone-600 text-sm">
              If you need multiple people for the same event (like a lead + second shooter), enable the multiple positions option. All positions must be for related roles at the same event. Maximum 5 total positions.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Managing Applications</h3>
            <p className="text-stone-600 text-sm mb-2">
              When vendors apply to your request:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Review their profiles and application messages</li>
              <li>Click "Accept" to hire them or "Decline" to pass</li>
              <li>Both parties must sign the agreement before the job is confirmed</li>
              <li>You can message the vendor through the job chat</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Job Day */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            On the Job Day
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Time Tracking (Hourly Jobs)</h3>
            <p className="text-stone-600 text-sm mb-2">
              For hourly paid jobs, vendors can clock in and out:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Go to the job details and click "Clock In" when starting</li>
              <li>Update job status as you progress (Arrived, In Progress, etc.)</li>
              <li>Click "Clock Out" when finished</li>
              <li>Total hours are automatically calculated</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Communication</h3>
            <p className="text-stone-600 text-sm">
              Use the job chat to communicate about details, ask questions, or coordinate during the event.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Completing the Job</h3>
            <p className="text-stone-600 text-sm">
              When the job is finished, the requester marks it as "Complete" and confirms payment. Both parties can then leave reviews.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment & Reviews */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Payment & Reviews
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Getting Paid</h3>
            <p className="text-stone-600 text-sm mb-2">
              Payment is handled directly between vendors:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Payment method and amount are agreed upon before accepting the job</li>
              <li>VendorCover tracks payment status but doesn't process payments</li>
              <li>View all your earnings in "Pay & History"</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Leaving Reviews</h3>
            <p className="text-stone-600 text-sm">
              After a completed job, both parties can leave reviews. Good reviews help build your reputation on the platform.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications & Messages */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Staying Connected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Notifications</h3>
            <p className="text-stone-600 text-sm">
              Enable notifications to get alerts for new jobs, applications, messages, and important updates.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Messages</h3>
            <p className="text-stone-600 text-sm">
              Check the Messages tab to view all your job-related conversations. The bell icon shows unread messages.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Support</h3>
            <p className="text-stone-600 text-sm">
              Need help? Use "Chat with Admins" or "Report Problem" from the menu to get support.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            Tips for Success
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside text-sm text-emerald-800 space-y-2">
            <li>Keep your profile updated with recent work and accurate availability</li>
            <li>Respond quickly to applications and messages</li>
            <li>Be professional and clear in your communication</li>
            <li>Leave honest reviews to help build trust in the community</li>
            <li>Mark your calendar dates as available/unavailable to get relevant job notifications</li>
            <li>Upload quality portfolio examples to showcase your work</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}