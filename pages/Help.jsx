import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  HelpCircle, MessageSquare, UserPlus, Mail, Key, Users,
  Shield, Briefcase, DollarSign, Calendar, Bell, Lock, LogIn, Clock, CheckCircle2
} from 'lucide-react';

export default function Help() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (e) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  const isAdmin = user?.role === 'admin';

  // Fetch user's support chat history
  const { data: chatHistory = [] } = useQuery({
    queryKey: ['mySupportChats', user?.email],
    queryFn: async () => {
      const chats = await base44.entities.SupportChat.filter({ user_id: user.email }, '-created_date');
      return chats;
    },
    enabled: !!user?.email
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Help & Support</h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">Get help with using VendorCover</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link to={createPageUrl('SupportChatUser')}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat with Admin
          </Link>
        </Button>
      </div>

      {/* Quick Actions */}
      <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-stone-100">
            <HelpCircle className="w-5 h-5" />
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <Button asChild variant="outline" className="h-auto py-4">
            <Link to={createPageUrl('SupportChatUser')} className="flex flex-col items-start">
              <MessageSquare className="w-5 h-5 mb-2" />
              <span className="font-semibold">Chat with Support</span>
              <span className="text-xs text-stone-500 dark:text-stone-400">Get help from our admin team</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4">
            <Link to={createPageUrl('ReportProblem')} className="flex flex-col items-start">
              <Mail className="w-5 h-5 mb-2" />
              <span className="font-semibold">Report a Problem</span>
              <span className="text-xs text-stone-500 dark:text-stone-400">Submit a bug report or feedback</span>
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Support Chat History */}
      {chatHistory.length > 0 && (
        <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-stone-100">
              <Clock className="w-5 h-5" />
              Previous Support Chats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {chatHistory.map((chat) => (
              <div key={chat.id} className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={
                        chat.status === 'closed' ? 'bg-stone-100 text-stone-600' :
                        chat.status === 'assigned' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }>
                        {chat.status === 'closed' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                        {chat.status === 'closed' ? 'Closed' : chat.status === 'assigned' ? 'In Progress' : 'Open'}
                      </Badge>
                      {chat.assigned_admin_name && (
                        <span className="text-xs text-stone-500 dark:text-stone-400">
                          with {chat.assigned_admin_name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-1">
                      {chat.last_message}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                      {format(new Date(chat.last_message_at || chat.created_date), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                   <Link to={createPageUrl(`SupportChatView?id=${chat.id}`)}>
                     {chat.status === 'closed' ? 'View' : 'Continue'}
                   </Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Getting Started */}
      <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-stone-100">
            <UserPlus className="w-5 h-5" />
            Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">How to Sign Up</h3>
            <ol className="list-decimal list-inside text-sm text-stone-600 dark:text-stone-400 space-y-1 ml-4">
              <li>Visit the login page and click "Sign Up"</li>
              <li>Choose to sign up with your email or Google account</li>
              <li>Complete your vendor profile with your services and portfolio</li>
              <li>Wait for admin approval (typically 24-48 hours)</li>
              <li>Start browsing jobs or posting help requests!</li>
            </ol>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Installing the App:</strong> For the best experience, install VendorCover on your phone. On iPhone, tap Share → "Add to Home Screen". On Android, tap the menu (⋮) → "Install App".
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Login & Passwords */}
      <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-stone-100">
            <LogIn className="w-5 h-5" />
            Login & Password Help
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">Two Ways to Log In</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">Email</Badge>
                <div className="flex-1">
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    Sign up with your email address and create a password. You can change your password anytime in your account settings.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-green-100 text-green-700 border-green-200">Google</Badge>
                <div className="flex-1">
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    Sign in with your Google account. No password needed - Google handles authentication for you. More secure and convenient!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">Password Issues</h3>
            <ul className="list-disc list-inside text-sm text-stone-600 dark:text-stone-400 space-y-1 ml-4">
              <li><strong>Forgot your password?</strong> Click "Forgot Password" on the login page to reset it</li>
              <li><strong>Created by admin?</strong> You'll receive a temporary password via email - change it on first login</li>
              <li><strong>Using Google?</strong> No password needed! Just click "Sign in with Google"</li>
            </ul>
          </div>

          {isAdmin && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Admin Note:</strong> You can only reset passwords for users who signed up with email. Users who signed up with Google must manage their account through Google.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How the Platform Works */}
      <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-stone-100">
            <Briefcase className="w-5 h-5" />
            How VendorCover Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Finding Coverage
              </h4>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Browse available jobs, apply to opportunities, and get hired by other vendors who need help with their events.
              </p>
            </div>
            <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Posting Jobs
              </h4>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Need help? Post a job with event details, review applications, and hire verified vendors to assist you.
              </p>
            </div>
            <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Managing Jobs
              </h4>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Track your upcoming jobs, clock in/out for hourly work, communicate with clients, and update job status.
              </p>
            </div>
            <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Getting Paid
              </h4>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Payment is arranged directly between vendors. Track your earnings and payment status in Pay & History.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Features */}
      <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-stone-100">
            <Bell className="w-5 h-5" />
            Key Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
            <li className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Verified Vendors:</strong> All profiles are reviewed and approved by our admin team</span>
            </li>
            <li className="flex items-start gap-2">
              <Bell className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Real-time Notifications:</strong> Get instant alerts for new jobs, applications, and messages</span>
            </li>
            <li className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Direct Messaging:</strong> Communicate directly with other vendors about job details</span>
            </li>
            <li className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Time Tracking:</strong> Built-in clock in/out system for hourly jobs</span>
            </li>
            <li className="flex items-start gap-2">
              <Users className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Reviews & Ratings:</strong> Build your reputation through completed jobs</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Admin Features */}
      {isAdmin && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <Shield className="w-5 h-5" />
              Admin Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2 text-sm text-red-800">
              <Key className="w-4 h-4 shrink-0 mt-0.5" />
              <span><strong>Create Users:</strong> Manually create user accounts and send credentials via email</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-red-800">
              <Lock className="w-4 h-4 shrink-0 mt-0.5" />
              <span><strong>Reset Passwords:</strong> Reset passwords for email-based accounts (not Google accounts)</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-red-800">
              <Users className="w-4 h-4 shrink-0 mt-0.5" />
              <span><strong>User Management:</strong> Approve profiles, suspend users, handle appeals</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-red-800">
              <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
              <span><strong>Support System:</strong> Respond to user support chats and tickets</span>
            </div>
            <Button asChild className="mt-4 w-full" variant="outline">
              <Link to={createPageUrl('AdminGuide')}>
                View Complete Admin Guide
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* More Resources */}
      <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
        <CardHeader>
          <CardTitle className="dark:text-stone-100">More Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button asChild variant="outline" className="w-full justify-start">
            <Link to={createPageUrl('HowToUseApp')}>
              <HelpCircle className="w-4 h-4 mr-2" />
              Complete User Guide
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start">
            <Link to={createPageUrl('About')}>
              About VendorCover
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start">
            <Link to={createPageUrl('PrivacyPolicy')}>
              Privacy Policy
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start">
            <Link to={createPageUrl('UserAgreement')}>
              User Agreement
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}