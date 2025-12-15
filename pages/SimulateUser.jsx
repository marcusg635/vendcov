import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, User, AlertCircle, Eye } from 'lucide-react';
import ServiceBadge from '@/components/ui/ServiceBadge';

export default function SimulateUser() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      if (u?.role !== 'admin') {
        navigate(createPageUrl('Dashboard'));
        return;
      }
      setUser(u);
    };
    loadUser();
  }, [navigate]);

  const { data: allProfiles = [], isLoading } = useQuery({
    queryKey: ['allVendorProfiles'],
    queryFn: () => base44.entities.VendorProfile.list('-created_date'),
    enabled: !!user?.email && user?.role === 'admin'
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user?.email && user?.role === 'admin'
  });

  const filteredProfiles = allProfiles.filter(profile => {
    // Block team@twofoldvisuals.com from being simulated by anyone except themselves
    if (profile.user_id === 'team@twofoldvisuals.com' && user?.email !== 'team@twofoldvisuals.com') {
      return false;
    }
    
    // Block regular admins from simulating other admins (only team@twofoldvisuals.com can)
    if (user?.email !== 'team@twofoldvisuals.com') {
      const profileUser = allUsers.find(u => u.email === profile.user_id);
      if (profileUser?.role === 'admin') {
        return false;
      }
    }
    
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      profile.full_name?.toLowerCase().includes(query) ||
      profile.business_name?.toLowerCase().includes(query) ||
      profile.email?.toLowerCase().includes(query) ||
      profile.user_id?.toLowerCase().includes(query)
    );
  });

  const handleSimulate = (userId) => {
    localStorage.setItem('simulatedUserId', userId);
    window.location.href = createPageUrl('Dashboard');
  };

  const currentSimulation = localStorage.getItem('simulatedUserId');

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Simulate User</h1>
        <p className="text-stone-600 mt-1">View the app as any user to identify issues</p>
      </div>

      {currentSimulation && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">
                  Currently simulating: {currentSimulation}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  localStorage.removeItem('simulatedUserId');
                  window.location.reload();
                }}
              >
                Exit Simulation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle>Select User to Simulate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Search by name, business, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 bg-stone-50 rounded-lg animate-pulse">
                  <div className="h-6 bg-stone-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-stone-100 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : filteredProfiles.length > 0 ? (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredProfiles.map(profile => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-4 bg-stone-50 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10">
                      {profile.selfie_url ? (
                        <img src={profile.selfie_url} alt={profile.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <AvatarFallback className="bg-stone-200 text-stone-600">
                          {profile.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-stone-900 truncate">{profile.full_name}</h3>
                        {profile.approval_status && (
                          <Badge className={
                            profile.approval_status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            profile.approval_status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }>
                            {profile.approval_status}
                          </Badge>
                        )}
                      </div>
                      {profile.business_name && (
                        <p className="text-sm text-stone-600 truncate">{profile.business_name}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {profile.service_types?.slice(0, 2).map(type => (
                          <ServiceBadge key={type} type={type} size="sm" showIcon={false} />
                        ))}
                        {profile.service_types?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{profile.service_types.length - 2}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-1">{profile.user_id}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSimulate(profile.user_id)}
                    className="bg-stone-900 hover:bg-stone-800 shrink-0"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Simulate
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}