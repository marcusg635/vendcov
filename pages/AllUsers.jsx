import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Users as UsersIcon, ChevronRight, Shield } from 'lucide-react';
import ServiceBadge from '@/components/ui/ServiceBadge';

export default function AllUsers() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: allProfiles = [] } = useQuery({
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
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      profile.full_name?.toLowerCase().includes(query) ||
      profile.business_name?.toLowerCase().includes(query) ||
      profile.email?.toLowerCase().includes(query) ||
      profile.city?.toLowerCase().includes(query) ||
      profile.state?.toLowerCase().includes(query) ||
      profile.phone?.toLowerCase().includes(query)
    );
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-stone-600">Access denied</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">All Users</h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">Search and manage user profiles</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <Input
          placeholder="Search by name, business, email, location, phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Total Users</p>
                <p className="text-2xl font-bold text-stone-900 mt-1">{allProfiles.length}</p>
              </div>
              <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-stone-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Approved</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">
                  {allProfiles.filter(p => p.approval_status === 'approved').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Pending</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">
                  {allProfiles.filter(p => p.approval_status === 'pending').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Suspended</p>
                <p className="text-2xl font-bold text-red-900 mt-1">
                  {allProfiles.filter(p => p.suspended).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <div>
        <p className="text-sm text-stone-600 mb-4">
          {filteredProfiles.length} {filteredProfiles.length === 1 ? 'user' : 'users'} found
        </p>

        <div className="space-y-3">
          {filteredProfiles.map(profile => {
            const profileUser = allUsers.find(u => u.email === profile.user_id);
            const isAdmin = profileUser?.role === 'admin';
            
            // Determine risk label - use latest assessment from history
            let riskBadge = null;
            const latestAssessment = profile.ai_assessment_history?.length > 0 
              ? profile.ai_assessment_history[profile.ai_assessment_history.length - 1]
              : profile.ai_risk_assessment;
            
            if (latestAssessment?.risk_score !== undefined) {
              const score = latestAssessment.risk_score;
              if (score < 20) {
                riskBadge = { label: 'No Risk', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
              } else if (score < 40) {
                riskBadge = { label: 'Minimal Risk', color: 'bg-green-100 text-green-800 border-green-200' };
              } else if (score < 65) {
                riskBadge = { label: 'Moderate Risk', color: 'bg-amber-100 text-amber-800 border-amber-200' };
              } else {
                riskBadge = { label: 'High Risk', color: 'bg-red-100 text-red-800 border-red-200' };
              }
            }
            
            return (
              <Link
                key={profile.id}
                to={createPageUrl(`UserEdit?id=${profile.user_id}`)}
                className="block"
              >
                <Card className="border-stone-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <Avatar className="h-12 w-12 shrink-0">
                          {profile.selfie_url ? (
                            <img src={profile.selfie_url} alt={profile.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <AvatarFallback className="bg-stone-100 text-stone-600">
                              {profile.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                           <h3 className="font-semibold text-stone-900 truncate">{profile.full_name}</h3>
                           {profile.user_id === 'team@twofoldvisuals.com' && (
                             <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs">Owner</Badge>
                           )}
                           {isAdmin && profile.user_id !== 'team@twofoldvisuals.com' && (
                             <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">Admin</Badge>
                           )}
                           {(profileUser?.subscription_status === 'active' || profileUser?.subscription_status === 'trialing') && (
                             <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                               ✓ Subscribed
                             </Badge>
                           )}
                           <Badge className={
                             profile.approval_status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs' :
                             profile.approval_status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200 text-xs' :
                             profile.approval_status === 'action_required' ? 'bg-orange-50 text-orange-700 border-orange-200 text-xs' :
                             'bg-red-50 text-red-700 border-red-200 text-xs'
                           }>
                             {profile.approval_status === 'action_required' ? 'Info Needed' : profile.approval_status}
                           </Badge>
                           {profile.suspended && (
                             <Badge className="bg-red-100 text-red-800 border-red-300 text-xs">Suspended</Badge>
                           )}
                           {riskBadge && (
                             <Badge className={`${riskBadge.color} text-xs flex items-center gap-1`}>
                               <Shield className="w-3 h-3" />
                               {riskBadge.label}
                             </Badge>
                           )}
                          </div>
                          {profile.business_name && (
                            <p className="text-sm text-stone-600 mb-2 truncate">{profile.business_name}</p>
                          )}
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {profile.service_types?.slice(0, 3).map(type => (
                              <ServiceBadge key={type} type={type} size="sm" />
                            ))}
                            {profile.service_types?.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{profile.service_types.length - 3} more
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-stone-500">
                            <span className="truncate">{profile.email}</span>
                            <span>•</span>
                            <span className="truncate">{profile.city}, {profile.state}</span>
                            {profile.phone && (
                              <>
                                <span>•</span>
                                <span>{profile.phone}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-stone-400 shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}

          {filteredProfiles.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UsersIcon className="w-6 h-6 text-stone-400" />
                </div>
                <h3 className="font-semibold text-stone-900 mb-1">No users found</h3>
                <p className="text-stone-500 text-sm">Try adjusting your search</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}