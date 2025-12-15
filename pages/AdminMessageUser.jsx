import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, MessageSquare } from 'lucide-react';

export default function AdminMessageUser() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
      if (u?.role !== 'admin') {
        navigate(createPageUrl('Dashboard'));
      }
    };
    loadUser();
  }, [navigate]);

  const { data: allProfiles = [] } = useQuery({
    queryKey: ['allVendorProfiles'],
    queryFn: () => base44.entities.VendorProfile.list('-created_date'),
    enabled: !!user && user.role === 'admin'
  });

  const filteredProfiles = allProfiles.filter(profile => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      profile.full_name?.toLowerCase().includes(query) ||
      profile.business_name?.toLowerCase().includes(query) ||
      profile.user_id?.toLowerCase().includes(query) ||
      profile.email?.toLowerCase().includes(query)
    );
  });

  if (user?.role !== 'admin') return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Message User</h1>
        <p className="text-stone-600 mt-1">Search for a user to start a direct message</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <Input
          placeholder="Search by name, business, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results */}
      <div className="space-y-3">
        {filteredProfiles.length > 0 ? (
          filteredProfiles.map(profile => (
            <Card key={profile.id} className="border-stone-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    {profile.selfie_url ? (
                      <img src={profile.selfie_url} alt={profile.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-stone-100 text-stone-600">
                        {profile.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-stone-900">{profile.full_name}</p>
                    {profile.business_name && (
                      <p className="text-sm text-stone-500">{profile.business_name}</p>
                    )}
                    <p className="text-xs text-stone-400">{profile.user_id}</p>
                  </div>
                  <Button asChild>
                    <a href={createPageUrl(`DirectMessageChat?userId=${profile.user_id}`)}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-stone-200">
            <CardContent className="p-12 text-center">
              <Search className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500 text-sm">
                {searchQuery ? 'No users found matching your search' : 'Search for a user to start messaging'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}