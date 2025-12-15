
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Home, Briefcase, PlusCircle, User, Bell, MessageSquare,
  Menu, X, DollarSign, Calendar, LogOut, AlertCircle, XCircle, MapPin, TrendingUp, Shield, Sparkles, Users, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import InstallPrompt from '@/components/shared/InstallPrompt';
import NotificationPermission from '@/components/shared/NotificationPermission';
import TermsAcceptanceDialog from '@/components/shared/TermsAcceptanceDialog';
import SuspensionDialog from '@/components/shared/SuspensionDialog';
import AdminAIModal from '@/components/ai/AdminAIModal';
import UserAIModal from '@/components/ai/UserAIModal';
import DraggableAdminAI from '@/components/ai/DraggableAdminAI';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showDevDialog, setShowDevDialog] = useState(() => {
    return localStorage.getItem('hideDevDialog') !== 'true';
  });
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [userAIOpen, setUserAIOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user?.email) return;

    const updateActivity = async () => {
      try {
        const sessions = await base44.entities.UserSession.filter({ user_id: user.email });
        const now = new Date().toISOString();
        
        if (sessions.length > 0) {
          const latestSession = sessions.sort((a, b) => 
            new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime()
          )[0];
          await base44.entities.UserSession.update(latestSession.id, { 
            login_timestamp: now 
          });
        }
      } catch (error) {
        // Silently fail
      }
    };

    updateActivity();
    const interval = setInterval(updateActivity, 30000);

    return () => clearInterval(interval);
  }, [user?.email]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const actualUser = await base44.auth.me();
        const simulatedUserId = localStorage.getItem('simulatedUserId');
        
        if (simulatedUserId && actualUser?.role === 'admin') {
          try {
            const simulatedUsers = await base44.entities.User.filter({ email: simulatedUserId });
            if (simulatedUsers && simulatedUsers.length > 0) {
              const simulatedUser = simulatedUsers[0];
              setUser({ ...simulatedUser, _isSimulated: true, _actualAdmin: actualUser });
              setTermsAccepted(simulatedUser?.terms_accepted === true);
              return;
            }
          } catch (simError) {
            console.error('Failed to load simulated user:', simError);
            localStorage.removeItem('simulatedUserId');
          }
        }
        
        setUser(actualUser);
        setTermsAccepted(actualUser?.terms_accepted === true);
        
        try {
          const lastLogin = localStorage.getItem('lastLogin');
          const now = new Date().toISOString();
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
          
          if (!lastLogin || lastLogin < oneHourAgo) {
            localStorage.setItem('lastLogin', now);
            const deviceInfo = navigator.userAgent;
            await base44.entities.UserSession.create({
              user_id: actualUser.email,
              user_name: actualUser.full_name,
              login_timestamp: now,
              device_info: deviceInfo
            });
          }
        } catch (sessionError) {
          console.error('Session tracking failed:', sessionError);
        }
      } catch (e) {
        console.error('Auth error:', e);
        setUser(null);
      }
    };
    loadUser();
  }, []);

  const { data: vendorProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['vendorProfile', user?.email],
    queryFn: async () => {
      try {
        const userId = user._isSimulated ? user.email : user.email;
        const profiles = await base44.entities.VendorProfile.filter({ user_id: userId });
        return profiles[0] || null;
      } catch (error) {
        console.error('Error loading vendor profile:', error);
        return null;
      }
    },
    enabled: !!user?.email,
    retry: 1
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_id: user?.email, read: false }),
    enabled: !!user?.email,
    refetchInterval: 30000
  });

  const { data: unreadMessages = [] } = useQuery({
    queryKey: ['unreadMessages', user?.email],
    queryFn: () => base44.entities.ChatMessage.filter({ recipient_id: user?.email, read: false }),
    enabled: !!user?.email,
    refetchInterval: 15000
  });

  const { data: unreadAdminMessages = [] } = useQuery({
    queryKey: ['unreadAdminMessages', user?.email],
    queryFn: () => base44.entities.AdminMessage.filter({ recipient_id: user?.email, read: false }),
    enabled: !!user?.email,
    refetchInterval: 15000
  });

  const totalUnreadMessages = (unreadMessages?.length || 0) + (unreadAdminMessages?.length || 0);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const isRestricted = vendorProfile && (
    vendorProfile.approval_status === 'pending' ||
    vendorProfile.approval_status === 'rejected' ||
    vendorProfile.approval_status === 'action_required' ||
    vendorProfile.approval_status === 'user_submitted_info' ||
    vendorProfile.suspended
  );

  const navItems = isRestricted ? [] : [
    { name: 'Dashboard', page: 'Dashboard', icon: Home },
    { name: 'Available Jobs', page: 'AvailableJobs', icon: Briefcase },
    { name: 'My Jobs', page: 'MyJobs', icon: Calendar },
    { name: 'Pay & History', page: 'PayHistory', icon: DollarSign },
    { name: 'My Reviews', page: 'Reviews', icon: User },
    { name: 'Help', page: 'Help', icon: MessageSquare },
  ];

  const adminHowToItem = (user?.role === 'admin' && !user?._isSimulated) ? 
    { name: 'Admin Guide', page: 'AdminGuide', icon: Shield } : null;

  const adminNavItems = (user?.role === 'admin' && !user?._isSimulated) ? [
    { name: 'Support Chats', page: 'AdminSupport', icon: MessageSquare },
    { name: 'Support Tickets', page: 'SupportTickets', icon: MessageSquare },
    { name: 'User Reports', page: 'UserReports', icon: AlertCircle },
    { name: 'Admin Chat', page: 'AdminChat', icon: MessageSquare },
    { name: 'Analytics', page: 'Analytics', icon: TrendingUp },
    { name: 'Subscriptions', page: 'SubscriptionAdmin', icon: CreditCard },
    { name: 'Simulate User', page: 'SimulateUser', icon: User },
    ...(user?.email === 'team@twofoldvisuals.com' ? [{ name: 'Admin Activity', page: 'AdminActivity', icon: Shield }] : [])
  ] : [];

  const showAdminAI = user?.role === 'admin' && !user?._isSimulated;
  const showUserAI = user?.role !== 'admin' && !user?._isSimulated;

  if (currentPageName === 'Landing' || currentPageName === 'TermsOfService' || currentPageName === 'InstallApp' || currentPageName === 'Pricing') {
    return <>{children}</>;
  }
  
  if (!user || profileLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentPageName === 'Profile' && !vendorProfile) {
    return <>{children}</>;
  }
  
  if (currentPageName === 'AccountSettings' && !vendorProfile) {
    return <>{children}</>;
  }

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone || 
                      document.referrer.includes('android-app://');
  const hasMarkedInstalled = localStorage.getItem('appInstalled') === 'true';

  if (!isStandalone && !hasMarkedInstalled) {
    navigate(createPageUrl('InstallApp'));
    return null;
  }

  if (user && vendorProfile && vendorProfile.approval_status === 'user_submitted_info' && user.role !== 'admin' && !user?._viewingAsStandard) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <Card className="max-w-md border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 text-3xl">📤</span>
            </div>
            <h2 className="text-xl font-bold text-blue-900 mb-2">Information Submitted</h2>
            <p className="text-sm text-blue-700 mb-4">
              Your additional information has been submitted to our admin team for review. You'll be notified once a decision is made.
            </p>
            <Button onClick={() => base44.auth.logout()} variant="outline" className="w-full">
              Log Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user && vendorProfile && vendorProfile.suspended) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <SuspensionDialog profile={vendorProfile} />
      </div>
    );
  }

  if (user && !termsAccepted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <TermsAcceptanceDialog 
          user={user} 
          onAccept={() => setTermsAccepted(true)} 
        />
      </div>
    );
  }
  
  if (user && termsAccepted && !vendorProfile && currentPageName !== 'Profile' && currentPageName !== 'AccountSettings') {
    if (location.pathname !== createPageUrl('Profile')) {
      navigate(createPageUrl('Profile'));
    }
    return null;
  }

  return (
    <>
      {user?._isSimulated && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-orange-600 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              Simulating: {user?.full_name} ({user?.email})
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="bg-white text-orange-600 hover:bg-orange-50"
            onClick={() => {
              localStorage.removeItem('simulatedUserId');
              window.location.reload();
            }}
          >
            Exit Simulation
          </Button>
        </div>
      )}

      <Dialog open={showDevDialog} onOpenChange={setShowDevDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              🚧 Under Development
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Please feel free to create test requests and apply for available jobs as a test. All test data will be deleted once app is launched in app stores.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button 
              onClick={() => {
                setShowDevDialog(false);
                localStorage.setItem('hideDevDialog', 'true');
              }} 
              className="w-full bg-stone-900 hover:bg-stone-800"
            >
              Don't show again
            </Button>
            <Button 
              onClick={() => setShowDevDialog(false)} 
              variant="outline"
              className="w-full"
            >
              Got it!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-stone-50 dark:bg-stone-950" style={{ paddingTop: user?._isSimulated ? '40px' : '0' }}>
        <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col" style={{ top: user?._isSimulated ? '40px' : '0', height: user?._isSimulated ? 'calc(100vh - 40px)' : '100vh' }}>
        <div className="flex flex-col flex-grow bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800">
          <div className="flex items-center h-16 px-6 border-b border-stone-100 dark:border-stone-800">
            <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-stone-900 dark:bg-stone-100 rounded-lg flex items-center justify-center">
                <span className="text-white dark:text-stone-900 font-bold text-sm">VC</span>
              </div>
              <span className="text-lg font-semibold text-stone-900 dark:text-stone-100">VendorCover</span>
            </Link>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                      : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
            
            {!isRestricted && user?.role !== 'admin' && (
              <Link
                to={createPageUrl('Pricing')}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  currentPageName === 'Pricing'
                    ? "bg-emerald-600 text-white"
                    : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                )}
              >
                <CreditCard className="w-5 h-5" />
                Subscription
              </Link>
            )}
            
            {adminHowToItem && (
              <Link
                to={createPageUrl(adminHowToItem.page)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  currentPageName === adminHowToItem.page
                    ? "bg-stone-900 text-white"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                )}
              >
                <Shield className="w-5 h-5" />
                {adminHowToItem.name}
              </Link>
            )}
            
            {adminNavItems.length > 0 && (
              <>
                <div className="my-3 border-t border-stone-200 dark:border-stone-800" />
                <Link
                  to={createPageUrl('AllUsers')}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    currentPageName === 'AllUsers'
                      ? "bg-red-600 text-white"
                      : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                  )}
                >
                  <Users className="w-5 h-5" />
                  All Users
                </Link>
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                        isActive
                          ? "bg-red-600 text-white"
                          : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          <div className="p-4 border-t border-stone-100 dark:border-stone-800">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                  <div className="w-9 h-9 bg-stone-200 dark:bg-stone-800 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">{user?.full_name}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{user?.email}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {!isRestricted && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Profile')} className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('AccountSettings')} className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                {!isRestricted && user?.role !== 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Pricing')} className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Subscription
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {!isRestricted && (
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('ReportProblem')} className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Report Problem
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('SupportChatUser')} className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Chat with Admins
                  </Link>
                </DropdownMenuItem>
                {!isRestricted && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('About')} className="text-stone-500">
                        About VendorCover
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('PrivacyPolicy')} className="text-stone-500">
                        Privacy Policy
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('UserAgreement')} className="text-stone-500">
                        User Agreement
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
                </div>
                </div>
                </aside>

      <header className="lg:hidden fixed left-0 right-0 z-50 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800" style={{ top: user?._isSimulated ? '40px' : '0' }}>
        <div className="flex items-center justify-between px-4" style={{ height: '56px' }}>
          <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2">
            <div className="w-7 h-7 bg-stone-900 dark:bg-stone-100 rounded-lg flex items-center justify-center">
              <span className="text-white dark:text-stone-900 font-bold text-xs">VC</span>
            </div>
            <span className="font-semibold text-stone-900 dark:text-stone-100">VendorCover</span>
          </Link>

          <div className="flex items-center -mr-2" style={{ height: '56px' }}>
            <Link 
              to={createPageUrl('Messages')} 
              className="relative flex items-center justify-center hover:bg-stone-100 transition-colors"
              style={{ width: '48px', height: '56px' }}
            >
              <div className="pointer-events-none">
                <MessageSquare className="w-5 h-5 text-stone-600 dark:text-stone-400" />
              </div>
              {totalUnreadMessages > 0 && (
                <span className="absolute top-4 right-2 w-2 h-2 bg-rose-500 rounded-full pointer-events-none" />
              )}
            </Link>
            <Link 
              to={createPageUrl('Notifications')} 
              className="relative flex items-center justify-center hover:bg-stone-100 transition-colors"
              style={{ width: '48px', height: '56px' }}
            >
              <div className="pointer-events-none">
                <Bell className="w-5 h-5 text-stone-600 dark:text-stone-400" />
              </div>
              {notifications.length > 0 && (
                <span className="absolute top-4 right-2 w-2 h-2 bg-rose-500 rounded-full pointer-events-none" />
              )}
            </Link>
            {showUserAI && (
              <button 
                onClick={() => setUserAIOpen(true)}
                className="relative flex items-center justify-center hover:bg-stone-100 transition-colors"
                style={{ width: '48px', height: '56px' }}
                title="AI Help"
              >
                <div className="pointer-events-none">
                  <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center justify-center hover:bg-stone-100 transition-colors"
              style={{ width: '48px', height: '56px' }}
            >
              <div className="pointer-events-none">
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                ) : (
                  <Menu className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                )}
              </div>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="px-4 py-3 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 shadow-lg max-h-[calc(100vh-56px)] overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                    isActive
                      ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                      : "text-stone-600 dark:text-stone-400"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
            
            {!isRestricted && user?.role !== 'admin' && (
              <Link
                to={createPageUrl('Pricing')}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                  currentPageName === 'Pricing'
                    ? "bg-emerald-600 text-white"
                    : "text-emerald-600"
                )}
              >
                <CreditCard className="w-5 h-5" />
                Subscription
              </Link>
            )}
            
            {adminHowToItem && (
              <Link
                to={createPageUrl(adminHowToItem.page)}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                  currentPageName === adminHowToItem.page
                    ? "bg-stone-900 text-white"
                    : "text-stone-600"
                )}
              >
                <Shield className="w-5 h-5" />
                {adminHowToItem.name}
              </Link>
            )}
            
            {adminNavItems.length > 0 && (
              <>
                <div className="my-2 border-t border-stone-200 dark:border-stone-800" />
                <Link
                  to={createPageUrl('AllUsers')}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                    currentPageName === 'AllUsers'
                      ? "bg-red-600 text-white"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  <Users className="w-5 h-5" />
                  All Users
                </Link>
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                        isActive
                          ? "bg-red-600 text-white"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </>
            )}
            <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                {!isRestricted && (
                  <Link
                    to={createPageUrl('Profile')}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-stone-600 dark:text-stone-400"
                  >
                    <User className="w-5 h-5" />
                    My Profile
                  </Link>
                )}
                <Link
                  to={createPageUrl('AccountSettings')}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-stone-600 dark:text-stone-400"
                >
                  <Shield className="w-5 h-5" />
                  Account Settings
                </Link>
                {!isRestricted && (
                  <Link
                    to={createPageUrl('ReportProblem')}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-stone-600 dark:text-stone-400"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Report Problem
                  </Link>
                )}
                <Link
                  to={createPageUrl('SupportChatUser')}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-stone-600 dark:text-stone-400"
                >
                  <MessageSquare className="w-5 h-5" />
                  Chat with Admins
                </Link>
                {!isRestricted && (
                  <>
                    <div className="border-t border-stone-100 dark:border-stone-800 my-2" />
                    <Link
                      to={createPageUrl('About')}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-stone-500 dark:text-stone-400"
                    >
                      About VendorCover
                    </Link>
                    <Link
                      to={createPageUrl('PrivacyPolicy')}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-stone-500 dark:text-stone-400"
                    >
                      Privacy Policy
                    </Link>
                    <Link
                      to={createPageUrl('UserAgreement')}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-stone-500 dark:text-stone-400"
                    >
                      User Agreement
                    </Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 w-full mt-2"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </nav>
            )}
      </header>

      <div className="hidden lg:flex lg:ml-64 h-16 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 items-center justify-end px-6 gap-4 fixed right-0 left-64 z-40" style={{ top: user?._isSimulated ? '40px' : '0' }}>
        <Link to={createPageUrl('Messages')} className="relative p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors">
          <MessageSquare className="w-5 h-5 text-stone-600 dark:text-stone-400" />
          {totalUnreadMessages > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-rose-500 text-xs">
              {totalUnreadMessages}
            </Badge>
          )}
        </Link>
        <Link to={createPageUrl('Notifications')} className="relative p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-stone-600 dark:text-stone-400" />
          {notifications.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-rose-500 text-xs">
              {notifications.length}
            </Badge>
          )}
        </Link>
        {showUserAI && (
          <button 
            onClick={() => setUserAIOpen(true)} 
            className="relative p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors group" 
            title="AI Assistant"
          >
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="absolute -bottom-8 right-0 text-xs text-stone-500 dark:text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              AI Help
            </span>
          </button>
        )}
      </div>

        <main className="lg:ml-64 min-h-screen pt-14 lg:pt-16">
          <div className="p-4 lg:p-8 w-full max-w-full">
            <div className="max-w-full overflow-x-hidden">
              {children}
            </div>
          </div>
        </main>

        <InstallPrompt />
        <NotificationPermission user={user} />

        {showAdminAI && <DraggableAdminAI user={user} />}
        {showUserAI && (
          <UserAIModal 
            open={userAIOpen} 
            onClose={() => setUserAIOpen(false)} 
            currentPage={currentPageName}
            user={user}
          />
        )}
        </div>
        </>
        );
        }
