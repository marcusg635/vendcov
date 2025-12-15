import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import ServiceBadge from '@/components/ui/ServiceBadge';
import { 
  Shield, Users, Briefcase, AlertTriangle, Trash2, 
  Search, ExternalLink, Calendar, MapPin 
} from 'lucide-react';

export default function Admin() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, id: null, name: '' });
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
      if (u.role !== 'admin') {
        window.location.href = createPageUrl('Dashboard');
      }
    };
    loadUser();
  }, []);

  const { data: allRequests = [] } = useQuery({
    queryKey: ['adminRequests'],
    queryFn: () => base44.entities.HelpRequest.list('-created_date'),
    enabled: !!user
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ['adminProfiles'],
    queryFn: () => base44.entities.VendorProfile.list('-created_date'),
    enabled: !!user
  });

  const { data: allApplications = [] } = useQuery({
    queryKey: ['adminApplications'],
    queryFn: () => base44.entities.JobApplication.list('-created_date'),
    enabled: !!user
  });

  const approveMutation = useMutation({
    mutationFn: async (profileId) => {
      return base44.entities.VendorProfile.update(profileId, { 
        approval_status: 'approved',
        rejection_reason: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('Profile approved');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ profileId, reason }) => {
      return base44.entities.VendorProfile.update(profileId, { 
        approval_status: 'rejected',
        rejection_reason: reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('Profile rejected');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }) => {
      if (type === 'request') {
        return base44.entities.HelpRequest.delete(id);
      } else if (type === 'profile') {
        return base44.entities.VendorProfile.delete(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('Deleted successfully');
      setDeleteDialog({ open: false, type: null, id: null, name: '' });
    }
  });

  const handleDelete = (type, id, name) => {
    setDeleteDialog({ open: true, type, id, name });
  };

  const confirmDelete = () => {
    deleteMutation.mutate({ type: deleteDialog.type, id: deleteDialog.id });
  };

  const filteredRequests = allRequests.filter(r => 
    r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.requester_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProfiles = allProfiles.filter(p =>
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Admin Dashboard</h1>
          <p className="text-stone-600">Manage and moderate platform content</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-stone-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Total Vendors</p>
                <p className="text-2xl font-bold text-stone-900 mt-1">{allProfiles.length}</p>
              </div>
              <Users className="w-8 h-8 text-stone-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Total Jobs</p>
                <p className="text-2xl font-bold text-stone-900 mt-1">{allRequests.length}</p>
              </div>
              <Briefcase className="w-8 h-8 text-stone-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Applications</p>
                <p className="text-2xl font-bold text-stone-900 mt-1">{allApplications.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-stone-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <Input
          placeholder="Search vendors, jobs, or locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="jobs" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Approval ({allProfiles.filter(p => p.approval_status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="vendors">All Users ({allProfiles.length})</TabsTrigger>
          <TabsTrigger value="jobs">Help Requests ({allRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="space-y-3">
            {allProfiles.filter(p => p.approval_status === 'pending').map(profile => (
              <Card key={profile.id} className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-amber-100 text-amber-700">PENDING REVIEW</Badge>
                        <h3 className="font-semibold text-stone-900">{profile.full_name}</h3>
                        {profile.business_name && (
                          <span className="text-sm text-stone-500">• {profile.business_name}</span>
                        )}
                      </div>
                      {profile.bio && (
                        <p className="text-sm text-stone-600 mb-3">{profile.bio}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {profile.service_types?.map(type => (
                          <ServiceBadge key={type} type={type} size="sm" />
                        ))}
                        {profile.experience_years && (
                          <Badge variant="outline" className="text-xs">
                            {profile.experience_years} years exp
                          </Badge>
                        )}
                        {profile.portfolio_items?.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {profile.portfolio_items.length} portfolio items
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-stone-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {profile.city}, {profile.state}
                        </div>
                        {profile.email && (
                          <span>{profile.email}</span>
                        )}
                        {profile.phone && (
                          <span>{profile.phone}</span>
                        )}
                      </div>
                      {profile.portfolio_links?.length > 0 && (
                        <div className="mt-2">
                          {profile.portfolio_links.map((link, i) => (
                            <a 
                              key={i} 
                              href={link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline mr-3"
                            >
                              Portfolio {i + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate(profile.id)}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const reason = prompt('Reason for rejection (optional):');
                          rejectMutation.mutate({ profileId: profile.id, reason: reason || '' });
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        Reject
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete('profile', profile.id, profile.full_name)}
                        className="text-stone-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {allProfiles.filter(p => p.approval_status === 'pending').length === 0 && (
              <Card className="border-stone-200">
                <CardContent className="p-12 text-center text-stone-500">
                  No profiles pending review
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="mt-6">
          <div className="space-y-3">
            {filteredRequests.map(job => (
              <Card key={job.id} className="border-stone-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-stone-900">{job.title}</h3>
                        <Badge variant="outline" className={
                          job.status === 'open' ? 'bg-emerald-50 text-emerald-700' :
                          job.status === 'filled' ? 'bg-blue-50 text-blue-700' :
                          'bg-stone-100 text-stone-600'
                        }>
                          {job.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-stone-600 mb-3">
                        Posted by {job.requester_business || job.requester_name}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <ServiceBadge type={job.service_type} size="sm" />
                        <Badge variant="outline" className="text-xs">
                          ${job.pay_amount}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-stone-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(job.event_date), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {job.city}, {job.state}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                      >
                        <Link to={createPageUrl(`JobDetails?id=${job.id}`)}>
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete('request', job.id, job.title)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredRequests.length === 0 && (
              <Card className="border-stone-200">
                <CardContent className="p-12 text-center text-stone-500">
                  No jobs found
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="vendors" className="mt-6">
          <div className="space-y-3">
            {filteredProfiles.map(profile => (
              <Card key={profile.id} className={
                profile.approval_status === 'pending' ? 'border-amber-200 bg-amber-50' :
                profile.approval_status === 'rejected' ? 'border-red-200 bg-red-50' :
                'border-stone-200'
              }>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={
                          profile.approval_status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          profile.approval_status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }>
                          {profile.approval_status}
                        </Badge>
                        <h3 className="font-semibold text-stone-900">{profile.full_name}</h3>
                        {profile.business_name && (
                          <span className="text-sm text-stone-500">• {profile.business_name}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <ServiceBadge type={profile.service_type} size="sm" />
                        {profile.experience_years && (
                          <Badge variant="outline" className="text-xs">
                            {profile.experience_years} years exp
                          </Badge>
                        )}
                        {profile.completed_jobs_count > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {profile.completed_jobs_count} jobs completed
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-stone-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {profile.city}, {profile.state}
                        </div>
                        {profile.email && (
                          <span>{profile.email}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {profile.approval_status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(profile.id)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const reason = prompt('Reason for rejection (optional):');
                              rejectMutation.mutate({ profileId: profile.id, reason: reason || '' });
                            }}
                            className="text-red-600"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {profile.approval_status === 'rejected' && (
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(profile.id)}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          Approve
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete('profile', profile.id, profile.full_name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredProfiles.length === 0 && (
              <Card className="border-stone-200">
                <CardContent className="p-12 text-center text-stone-500">
                  No vendors found
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteDialog.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}