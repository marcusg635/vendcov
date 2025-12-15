import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Users, TrendingUp } from 'lucide-react';
import ServiceBadge, { serviceConfig } from '@/components/ui/ServiceBadge';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

export default function StateAnalytics() {
  const [selectedState, setSelectedState] = useState('all');

  const { data: allProfiles = [], isLoading } = useQuery({
    queryKey: ['allVendorProfiles'],
    queryFn: () => base44.entities.VendorProfile.list()
  });

  // Aggregate data by state - count vendors in each state they service
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

  const totalVendors = allProfiles.length;
  const topState = stateData[0];
  const statesWithVendors = stateData.length;

  // Filter by selected state
  const displayData = selectedState === 'all' 
    ? stateData 
    : stateData.filter(d => d.state === selectedState);

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
        <h1 className="text-2xl font-bold text-stone-900">State Analytics</h1>
        <p className="text-stone-600 mt-1">Vendor distribution across states and service types</p>
      </div>

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
    </div>
  );
}