import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Users, TrendingUp, DollarSign, Briefcase, CheckCircle, Clock, XCircle, X, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import ServiceBadge, { serviceConfig } from '@/components/ui/ServiceBadge';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

export default function Analytics() {
  const [selectedState, setSelectedState] = useState('all');
  const [viewMode, setViewMode] = useState(null); // 'earnings', 'vendors', 'jobs', 'open_jobs'
  const [selectedStatus, setSelectedStatus] = useState(null); // 'completed', 'filled', 'open', 'cancelled'

  const { data: allProfiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['allVendorProfiles'],
    queryFn: () => base44.entities.VendorProfile.list()
  });

  const { data: allJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['allHelpRequests'],
    queryFn: () => base44.entities.HelpRequest.list()
  });

  const isLoading = profilesLoading || jobsLoading;

  // Platform Analytics
  const totalJobs = allJobs.length;
  const completedJobs = allJobs.filter(j => j.status === 'completed').length;
  const openJobs = allJobs.filter(j => j.status === 'open').length;
  const filledJobs = allJobs.filter(j => j.status === 'filled').length;

  const totalMoneyMade = allJobs
    .filter(j => j.status === 'completed')
    .reduce((sum, job) => sum + (job.calculated_pay || job.pay_amount || 0), 0);

  const totalVendors = allProfiles.length;
  const approvedVendors = allProfiles.filter(p => p.approval_status === 'approved').length;

  // State Analytics
  const stateData = US_STATES.map(state => {
    const stateProfiles = allProfiles.filter(p => 
      p.service_states?.includes(state) || (!p.service_states?.length && p.state === state)
    );
    const serviceBreakdown = {};
    
    Object.keys(serviceConfig).forEach(serviceType => {
      serviceBreakdown[serviceType] = stateProfiles.filter(p => 
        p.service_types?.includes(serviceType)
      ).length;
    });

    return {
      state,
      total: stateProfiles.length,
      approved: stateProfiles.filter(p => p.approval_status === 'approved').length,
      pending: stateProfiles.filter(p => p.approval_status === 'pending').length,
      serviceBreakdown
    };
  }).filter(data => data.total > 0)
    .sort((a, b) => b.total - a.total);

  const topState = stateData[0];
  const statesWithVendors = stateData.length;

  const displayData = selectedState === 'all' 
    ? stateData 
    : stateData.filter(d => d.state === selectedState);

  const statusLabel = {
    completed: 'Completed Jobs',
    filled: 'Filled Jobs',
    open: 'Open Jobs',
    cancelled: 'Cancelled Jobs'
  };

  const statusCards = [
    {
      key: 'completed',
      count: completedJobs,
      icon: CheckCircle,
      container: 'bg-emerald-50 border-emerald-200',
      iconColor: 'text-emerald-600',
      value: 'text-emerald-900',
      label: 'text-emerald-700'
    },
    {
      key: 'filled',
      count: filledJobs,
      icon: Briefcase,
      container: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600',
      value: 'text-blue-900',
      label: 'text-blue-700'
    },
    {
      key: 'open',
      count: openJobs,
      icon: Clock,
      container: 'bg-amber-50 border-amber-200',
      iconColor: 'text-amber-600',
      value: 'text-amber-900',
      label: 'text-amber-700'
    },
    {
      key: 'cancelled',
      count: allJobs.filter(j => j.status === 'cancelled').length,
      icon: XCircle,
      container: 'bg-stone-50 border-stone-200',
      iconColor: 'text-stone-600',
      value: 'text-stone-900',
      label: 'text-stone-700'
    }
  ];

  const statusFilteredJobs = selectedStatus
    ? allJobs.filter(job => job.status === selectedStatus)
    : [];

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
        <h1 className="text-2xl font-bold text-stone-900">Platform Analytics</h1>
        <p className="text-stone-600 mt-1">Key metrics and insights across the platform</p>
      </div>

      <Tabs defaultValue="platform" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="platform">Platform Overview</TabsTrigger>
          <TabsTrigger value="states">State Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="space-y-6 mt-6">
          {/* Platform Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card 
              className="border-stone-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setViewMode(viewMode === 'earnings' ? null : 'earnings')}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-500">Total Earned</p>
                    <p className="text-2xl font-bold text-stone-900 mt-1">
                      ${totalMoneyMade.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="border-stone-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setViewMode(viewMode === 'vendors' ? null : 'vendors')}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-500">Total Vendors</p>
                    <p className="text-2xl font-bold text-stone-900 mt-1">{totalVendors}</p>
                    <p className="text-xs text-stone-500 mt-1">{approvedVendors} approved</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="border-stone-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setViewMode(viewMode === 'jobs' ? null : 'jobs')}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-500">Total Jobs</p>
                    <p className="text-2xl font-bold text-stone-900 mt-1">{totalJobs}</p>
                    <p className="text-xs text-stone-500 mt-1">{completedJobs} completed</p>
                  </div>
                  <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-violet-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="border-stone-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setViewMode(viewMode === 'open_jobs' ? null : 'open_jobs')}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-500">Open Jobs</p>
                    <p className="text-2xl font-bold text-stone-900 mt-1">{openJobs}</p>
                    <p className="text-xs text-stone-500 mt-1">{filledJobs} filled</p>
                  </div>
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Views */}
          {viewMode && (
            <Card className="border-stone-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {viewMode === 'earnings' && 'All Completed Jobs - Earnings Breakdown'}
                    {viewMode === 'vendors' && 'All Vendors'}
                    {viewMode === 'jobs' && 'All Jobs'}
                    {viewMode === 'open_jobs' && 'Open Jobs'}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setViewMode(null)}>
                    <X className="w-4 h-4 mr-2" />
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === 'earnings' && (
                  <div className="space-y-3">
                    {allJobs.filter(j => j.status === 'completed').map(job => (
                      <div key={job.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-stone-900">{job.title}</p>
                          <p className="text-sm text-stone-600">{job.requester_business || job.requester_name}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(job.event_date), 'MMM d, yyyy')}
                            </span>
                            <span>{job.city}, {job.state}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600">${(job.calculated_pay || job.pay_amount || 0).toLocaleString()}</p>
                          <p className="text-xs text-stone-500 capitalize">{job.payment_method}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {viewMode === 'vendors' && (
                  <div className="space-y-3">
                    {allProfiles.map(profile => (
                      <div key={profile.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                        <div>
                          <p className="font-medium text-stone-900">{profile.full_name}</p>
                          <p className="text-sm text-stone-600">{profile.business_name}</p>
                          <p className="text-xs text-stone-500 mt-1">{profile.city}, {profile.state}</p>
                        </div>
                        <Badge className={
                          profile.approval_status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                          profile.approval_status === 'pending' ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }>
                          {profile.approval_status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                
                {viewMode === 'jobs' && (
                  <div className="space-y-3">
                    {allJobs.map(job => (
                      <div key={job.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-stone-900">{job.title}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(job.event_date), 'MMM d, yyyy')}
                            </span>
                            <span>{job.city}, {job.state}</span>
                            <span>${job.pay_amount}</span>
                          </div>
                        </div>
                        <Badge className={
                          job.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                          job.status === 'filled' ? 'bg-blue-50 text-blue-700' :
                          job.status === 'open' ? 'bg-amber-50 text-amber-700' :
                          'bg-stone-100 text-stone-600'
                        }>
                          {job.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                
                {viewMode === 'open_jobs' && (
                  <div className="space-y-3">
                    {allJobs.filter(j => j.status === 'open').map(job => (
                      <div key={job.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-stone-900">{job.title}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(job.event_date), 'MMM d, yyyy')}
                            </span>
                            <span>{job.city}, {job.state}</span>
                            <span>${job.pay_amount}</span>
                          </div>
                        </div>
                        <ServiceBadge type={job.service_type} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Job Status Breakdown */}
          {!viewMode && (
            <Card className="border-stone-200">
              <CardHeader>
                <CardTitle>Job Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {statusCards.map(({ key, count, icon: Icon, container, value, label, iconColor }) => (
                    <div
                      key={key}
                      className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${container} ${selectedStatus === key ? 'ring-2 ring-offset-2 ring-blue-300' : ''}`}
                      onClick={() => setSelectedStatus(selectedStatus === key ? null : key)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-5 h-5 ${iconColor}`} />
                        <span className={`text-2xl font-bold ${value}`}>{count}</span>
                      </div>
                      <p className={`text-sm font-medium capitalize ${label}`}>{key}</p>
                    </div>
                  ))}
                </div>

                {selectedStatus && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-stone-900">{statusLabel[selectedStatus]}</h3>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedStatus(null)}>
                        <X className="w-4 h-4 mr-2" />
                        Close
                      </Button>
                    </div>

                    {statusFilteredJobs.length > 0 ? (
                      statusFilteredJobs.map(job => (
                        <div
                          key={job.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-stone-200 bg-white"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-stone-900">{job.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-stone-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(job.event_date), 'MMM d, yyyy')}
                              </span>
                              <span>{job.city}, {job.state}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-stone-900">${(job.calculated_pay || job.pay_amount || 0).toLocaleString()}</p>
                            <ServiceBadge type={job.service_type} size="sm" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-stone-500 bg-stone-50 rounded-lg border border-stone-200">
                        No jobs found for this status.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Marketing Stats */}
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>Marketing Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
                  <p className="text-sm text-stone-600 mb-1">Total Platform Value</p>
                  <p className="text-3xl font-bold text-stone-900">
                    ${totalMoneyMade.toLocaleString()}
                  </p>
                  <p className="text-sm text-stone-600 mt-2">
                    VendorCover has helped vendors earn over ${totalMoneyMade.toLocaleString()} through {completedJobs} completed jobs
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700 mb-1">Active Vendors</p>
                    <p className="text-2xl font-bold text-blue-900">{approvedVendors}</p>
                    <p className="text-xs text-blue-600 mt-1">Across {statesWithVendors} states</p>
                  </div>

                  <div className="p-4 bg-violet-50 rounded-lg border border-violet-200">
                    <p className="text-sm text-violet-700 mb-1">Success Rate</p>
                    <p className="text-2xl font-bold text-violet-900">
                      {totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0}%
                    </p>
                    <p className="text-xs text-violet-600 mt-1">Jobs completed</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="states" className="space-y-6 mt-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-stone-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-500">Total Vendors</p>
                    <p className="text-2xl font-bold text-stone-900 mt-1">{totalVendors}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-stone-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-500">States Active</p>
                    <p className="text-2xl font-bold text-stone-900 mt-1">{statesWithVendors}</p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {topState && (
              <Card className="border-stone-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone-500">Top State</p>
                      <p className="text-2xl font-bold text-stone-900 mt-1">{topState.state}</p>
                      <p className="text-xs text-stone-500 mt-1">{topState.total} vendors</p>
                    </div>
                    <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-violet-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Filter */}
          <Card className="border-stone-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-stone-500" />
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {stateData.map(data => (
                      <SelectItem key={data.state} value={data.state}>
                        {data.state} ({data.total})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* State List */}
          <div className="space-y-4">
            {displayData.map(data => (
              <Card key={data.state} className="border-stone-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-stone-600" />
                      {data.state}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <p className="text-stone-500">Total</p>
                        <p className="font-bold text-stone-900">{data.total}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-stone-500">Approved</p>
                        <p className="font-bold text-emerald-600">{data.approved}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-stone-500">Pending</p>
                        <p className="font-bold text-amber-600">{data.pending}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-stone-700">Service Type Breakdown:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {Object.entries(data.serviceBreakdown)
                        .filter(([_, count]) => count > 0)
                        .sort((a, b) => b[1] - a[1])
                        .map(([serviceType, count]) => (
                          <div key={serviceType} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200">
                            <ServiceBadge type={serviceType} size="sm" showIcon={false} />
                            <span className="font-bold text-stone-900">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {displayData.length === 0 && (
            <Card className="border-stone-200">
              <CardContent className="p-12 text-center">
                <MapPin className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <h3 className="font-semibold text-stone-900 mb-1">No vendors in this state</h3>
                <p className="text-stone-500 text-sm">Try selecting a different state</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}