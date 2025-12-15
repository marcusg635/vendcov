import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from '@/components/shared/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, TrendingUp, Briefcase, Calendar, 
  ArrowUpRight, ArrowDownRight, CreditCard, Building2, X
} from 'lucide-react';
import ServiceBadge from '@/components/ui/ServiceBadge';

export default function PayHistory() {
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'earned', 'spent', 'completed', 'upcoming'

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  // Jobs where I was the hired vendor (money earned)
  const { data: acceptedApplications = [] } = useQuery({
    queryKey: ['acceptedApps', user?.email],
    queryFn: () => base44.entities.JobApplication.filter({ applicant_id: user.email, status: 'accepted' }),
    enabled: !!user?.email
  });

  // Get the corresponding jobs
  const { data: earnedJobs = [], isLoading: earnedLoading } = useQuery({
    queryKey: ['earnedJobs', acceptedApplications.map(a => a.help_request_id)],
    queryFn: async () => {
      if (acceptedApplications.length === 0) return [];
      const allJobs = await base44.entities.HelpRequest.list();
      return allJobs.filter(job => 
        acceptedApplications.some(app => app.help_request_id === job.id)
      );
    },
    enabled: acceptedApplications.length > 0
  });

  // Jobs where I hired someone (money spent)
  const { data: myRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['myFilledRequests', user?.email],
    queryFn: () => base44.entities.HelpRequest.filter({ 
      requester_id: user.email, 
      status: 'filled' 
    }),
    enabled: !!user?.email
  });

  // Calculate totals
  const totalEarned = earnedJobs.reduce((sum, job) => sum + (job.pay_amount || 0), 0);
  const totalSpent = myRequests.reduce((sum, job) => sum + (job.pay_amount || 0), 0);
  const completedJobs = earnedJobs.filter(job => 
    new Date(job.event_date) < new Date()
  ).length;
  const upcomingJobs = earnedJobs.filter(job => 
    new Date(job.event_date) >= new Date()
  ).length;

  // Payment method breakdown
  const paymentMethodBreakdown = earnedJobs.reduce((acc, job) => {
    const method = job.payment_method || 'other';
    acc[method] = (acc[method] || 0) + (job.pay_amount || 0);
    return acc;
  }, {});

  const isLoading = earnedLoading || requestsLoading;

  const JobHistoryItem = ({ job, type }) => (
    <div className="flex items-center justify-between py-4 border-b border-stone-100 dark:border-stone-800 last:border-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          type === 'earned' ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-amber-50 dark:bg-amber-950'
        }`}>
          {type === 'earned' ? (
            <ArrowDownRight className="w-5 h-5 text-emerald-600" />
          ) : (
            <ArrowUpRight className="w-5 h-5 text-amber-600" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-stone-900 dark:text-stone-100 truncate">{job.title}</p>
          <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(job.event_date), 'MMM d, yyyy')}
            <span className="text-stone-300">•</span>
            {job.city}, {job.state}
          </div>
        </div>
      </div>
      <div className="text-right shrink-0 ml-4">
        <p className={`font-semibold ${type === 'earned' ? 'text-emerald-600' : 'text-stone-900 dark:text-stone-100'}`}>
          {type === 'earned' ? '+' : '-'}${job.pay_amount}
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-400 capitalize">{job.payment_method}</p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Pay & History</h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">Track your earnings and job history</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="border-stone-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setViewMode(viewMode === 'earned' ? 'overview' : 'earned')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500 dark:text-stone-400">Total Earned</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  ${totalEarned.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-stone-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setViewMode(viewMode === 'spent' ? 'overview' : 'spent')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500 dark:text-stone-400">Total Spent</p>
                <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                  ${totalSpent.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-stone-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setViewMode(viewMode === 'completed' ? 'overview' : 'completed')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500 dark:text-stone-400">Jobs Completed</p>
                <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">{completedJobs}</p>
              </div>
              <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-stone-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setViewMode(viewMode === 'upcoming' ? 'overview' : 'upcoming')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500 dark:text-stone-400">Upcoming Jobs</p>
                <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">{upcomingJobs}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed View */}
      {viewMode !== 'overview' && (
        <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg dark:text-stone-100">
                {viewMode === 'earned' && 'All Earnings'}
                {viewMode === 'spent' && 'All Spending'}
                {viewMode === 'completed' && 'Completed Jobs'}
                {viewMode === 'upcoming' && 'Upcoming Jobs'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setViewMode('overview')}>
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-stone-100">
              {viewMode === 'earned' && earnedJobs
                .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
                .map(job => <JobHistoryItem key={job.id} job={job} type="earned" />)}
              
              {viewMode === 'spent' && myRequests
                .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
                .map(job => <JobHistoryItem key={job.id} job={job} type="spent" />)}
              
              {viewMode === 'completed' && earnedJobs
                .filter(job => new Date(job.event_date) < new Date())
                .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
                .map(job => <JobHistoryItem key={job.id} job={job} type="earned" />)}
              
              {viewMode === 'upcoming' && earnedJobs
                .filter(job => new Date(job.event_date) >= new Date())
                .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
                .map(job => <JobHistoryItem key={job.id} job={job} type="earned" />)}
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'overview' && (
        <>
          {/* Payment Methods Breakdown */}
          {Object.keys(paymentMethodBreakdown).length > 0 && (
            <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 dark:text-stone-100">
                  <CreditCard className="w-5 h-5" />
                  Earnings by Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.entries(paymentMethodBreakdown).map(([method, amount]) => (
                    <div key={method} className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg text-center">
                      <p className="text-xs text-stone-500 dark:text-stone-400 capitalize mb-1">{method}</p>
                      <p className="font-semibold text-stone-900 dark:text-stone-100">${amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transaction History */}
          <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
            <CardHeader>
              <CardTitle className="text-lg dark:text-stone-100">Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="earned" className="w-full">
                <TabsList className="grid w-full max-w-sm grid-cols-2 mb-4">
                  <TabsTrigger value="earned">
                    Earned ({earnedJobs.length})
                  </TabsTrigger>
                  <TabsTrigger value="spent">
                    Spent ({myRequests.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="earned">
                  {earnedJobs.length > 0 ? (
                    <div className="divide-y divide-stone-100">
                      {earnedJobs
                        .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
                        .map(job => (
                          <JobHistoryItem key={job.id} job={job} type="earned" />
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-stone-500 dark:text-stone-400">
                      <Briefcase className="w-8 h-8 mx-auto mb-2 text-stone-300 dark:text-stone-600" />
                      <p>No earnings yet</p>
                      <p className="text-sm">Jobs you complete will appear here</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="spent">
                  {myRequests.length > 0 ? (
                    <div className="divide-y divide-stone-100">
                      {myRequests
                        .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
                        .map(job => (
                          <JobHistoryItem key={job.id} job={job} type="spent" />
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-stone-500 dark:text-stone-400">
                      <DollarSign className="w-8 h-8 mx-auto mb-2 text-stone-300 dark:text-stone-600" />
                      <p>No payments made</p>
                      <p className="text-sm">Vendors you hire will appear here</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}