import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getAdminDisplayName } from '@/components/utils/adminUtils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import ServiceBadge, { serviceConfig } from '@/components/ui/ServiceBadge';
import HelpTypeBadge from '@/components/ui/HelpTypeBadge';
import { ArrowLeft, Save, Star, Briefcase, Calendar, DollarSign, MapPin, Ban, CheckCircle, ExternalLink, FileText, Image, Link as LinkIcon, Shield } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import AIRiskAssessment from '@/components/admin/AIRiskAssessment';

export default function UserEdit() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
      if (u.role !== 'admin') {
        navigate(createPageUrl('Dashboard'));
      }
    };
    loadUser();
  }, []);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      const profiles = await base44.entities.VendorProfile.filter({ user_id: userId });
      return profiles[0] || null;
    },
    enabled: !!userId
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['userReviews', userId],
    queryFn: () => base44.entities.Review.filter({ reviewee_id: userId }),
    enabled: !!userId
  });

  const { data: userPosts = [] } = useQuery({
    queryKey: ['userPosts', userId],
    queryFn: () => base44.entities.HelpRequest.filter({ requester_id: userId }, '-created_date'),
    enabled: !!userId
  });

  const { data: userApplications = [] } = useQuery({
    queryKey: ['userApplications', userId],
    queryFn: () => base44.entities.JobApplication.filter({ applicant_id: userId }, '-created_date'),
    enabled: !!userId
  });

  const { data: allJobs = [] } = useQuery({
    queryKey: ['allJobsForUser', userId],
    queryFn: async () => {
      const allRequests = await base44.entities.HelpRequest.list();
      return allRequests;
    },
    enabled: !!userId
  });

  const { data: loginHistory = [] } = useQuery({
    queryKey: ['userLoginHistory', userId],
    queryFn: () => base44.entities.UserSession.filter({ user_id: userId }, '-created_date'),
    enabled: !!userId
  });

  const { data: adminActions = [] } = useQuery({
    queryKey: ['userAdminActions', userId],
    queryFn: async () => {
      const actions = await base44.entities.AdminAction.list('-created_date');
      return actions.filter(a => a.target_id === userId);
    },
    enabled: !!userId
  });

  const { data: userReports = [] } = useQuery({
    queryKey: ['userReports', userId],
    queryFn: async () => {
      const reports = await base44.entities.UserReport.list('-created_date');
      return reports.filter(r => r.reported_user_id === userId);
    },
    enabled: !!userId
  });

  const { data: allAdmins = [] } = useQuery({
    queryKey: ['allAdmins'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter(u => u.role === 'admin' && u.email !== user?.email);
    },
    enabled: !!user?.email
  });

  const [formData, setFormData] = useState({});
  const [suspendDialog, setSuspendDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [addNoteDialog, setAddNoteDialog] = useState(false);
  const [aiAssessmentModal, setAiAssessmentModal] = useState({ open: false, assessment: null });
  const [isRunningAssessment, setIsRunningAssessment] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const updatedData = { ...data };
      
      // If approval status changed to approved or rejected, clear reviewing admin
      if (data.approval_status === 'approved' || data.approval_status === 'rejected') {
        updatedData.reviewing_admin_id = null;
        updatedData.reviewing_admin_name = null;
        
        // Log admin action
        await base44.entities.AdminAction.create({
          admin_id: user.email,
          admin_name: getAdminDisplayName(user),
          action_type: data.approval_status === 'approved' ? 'profile_approved' : 'profile_rejected',
          target_id: profile.user_id,
          target_name: profile.full_name,
          details: { profile_id: profile.id }
        });
      }
      
      await base44.entities.VendorProfile.update(profile.id, updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      queryClient.invalidateQueries(['allVendorProfiles']);
      navigate(createPageUrl('ProfileUpdated'));
    }
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const suspendMutation = useMutation({
    mutationFn: async (reason) => {
      await base44.entities.VendorProfile.update(profile.id, {
        suspended: true,
        suspension_reason: reason,
        appeal_status: 'none',
        appeal_message: null,
        appeal_submitted_date: null,
        approval_status: 'suspended'
      });
      
      await base44.entities.AdminAction.create({
        admin_id: user.email,
        admin_name: getAdminDisplayName(user),
        action_type: 'user_suspended',
        target_id: profile.user_id,
        target_name: profile.full_name,
        details: { profile_id: profile.id },
        notes: reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      queryClient.invalidateQueries(['allVendorProfiles']);
      queryClient.invalidateQueries(['userAdminActions']);
      setSuspendDialog(false);
      setSuspendReason('');
      toast.success('User suspended');
    }
  });

  const unsuspendMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.VendorProfile.update(profile.id, {
        suspended: false,
        suspension_reason: null,
        appeal_status: 'none',
        appeal_message: null,
        appeal_submitted_date: null,
        approval_status: 'approved'
      });
      
      await base44.entities.AdminAction.create({
        admin_id: user.email,
        admin_name: getAdminDisplayName(user),
        action_type: 'user_unsuspended',
        target_id: profile.user_id,
        target_name: profile.full_name,
        details: { profile_id: profile.id }
      });

      await base44.entities.Notification.create({
        user_id: profile.user_id,
        type: 'new_message',
        title: 'Account Restored',
        message: 'Your account suspension has been lifted. You now have full access to VendorCover.'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      queryClient.invalidateQueries(['allVendorProfiles']);
      queryClient.invalidateQueries(['userAdminActions']);
      toast.success('User unsuspended');
    }
  });

  const approveAppealMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.VendorProfile.update(profile.id, {
        suspended: false,
        suspension_reason: null,
        appeal_status: 'approved',
        appeal_message: null,
        appeal_submitted_date: null,
        approval_status: 'approved'
      });
      
      await base44.entities.AdminAction.create({
        admin_id: user.email,
        admin_name: getAdminDisplayName(user),
        action_type: 'appeal_approved',
        target_id: profile.user_id,
        target_name: profile.full_name,
        details: { profile_id: profile.id }
      });
      
      await base44.entities.Notification.create({
        user_id: profile.user_id,
        type: 'new_message',
        title: 'Appeal Approved',
        message: 'Your suspension appeal has been approved. Your account has been restored.'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      queryClient.invalidateQueries(['allVendorProfiles']);
      queryClient.invalidateQueries(['userAdminActions']);
      toast.success('Appeal approved - user restored');
    }
  });

  const denyAppealMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.VendorProfile.update(profile.id, {
        appeal_status: 'denied'
      });
      
      // Delete user's job posts and notify applicants
      const userPosts = await base44.entities.HelpRequest.filter({ requester_id: profile.user_id });
      for (const post of userPosts) {
        const applications = await base44.entities.JobApplication.filter({ help_request_id: post.id });
        
        // Notify all applicants
        for (const app of applications) {
          await base44.entities.Notification.create({
            user_id: app.applicant_id,
            type: 'new_message',
            title: 'Job Posting Removed',
            message: `The job "${post.title}" has been permanently removed due to account suspension.`,
            reference_id: null
          });
        }
        
        // Delete related data
        for (const app of applications) await base44.entities.JobApplication.delete(app.id);
        const agreements = await base44.entities.SubcontractAgreement.filter({ help_request_id: post.id });
        for (const agreement of agreements) await base44.entities.SubcontractAgreement.delete(agreement.id);
        const messages = await base44.entities.ChatMessage.filter({ help_request_id: post.id });
        for (const message of messages) await base44.entities.ChatMessage.delete(message.id);
        
        await base44.entities.HelpRequest.delete(post.id);
      }
      
      await base44.entities.AdminAction.create({
        admin_id: user.email,
        admin_name: getAdminDisplayName(user),
        action_type: 'appeal_denied',
        target_id: profile.user_id,
        target_name: profile.full_name,
        details: { profile_id: profile.id, deleted_posts: userPosts.length }
      });
      
      await base44.entities.Notification.create({
        user_id: profile.user_id,
        type: 'new_message',
        title: 'Appeal Denied',
        message: 'Your suspension appeal has been reviewed and denied.'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      queryClient.invalidateQueries(['allVendorProfiles']);
      queryClient.invalidateQueries(['userAdminActions']);
      toast.success('Appeal denied and posts deleted');
    }
  });

  const unassignMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.VendorProfile.update(profile.id, {
        reviewing_admin_id: null,
        reviewing_admin_name: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      queryClient.invalidateQueries(['allVendorProfiles']);
      toast.success('Task unassigned');
    }
  });

  const assignToAdminMutation = useMutation({
    mutationFn: async (adminEmail) => {
      const admin = allAdmins.find(a => a.email === adminEmail);
      await base44.entities.VendorProfile.update(profile.id, {
        reviewing_admin_id: adminEmail,
        reviewing_admin_name: getAdminDisplayName(admin) || adminEmail
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      queryClient.invalidateQueries(['allVendorProfiles']);
      setAssignDialog(false);
      setSelectedAdmin('');
      toast.success('Task assigned');
    }
  });

  const submitForReviewMutation = useMutation({
    mutationFn: async (notes) => {
      await base44.entities.VendorProfile.update(profile.id, {
        reviewing_admin_id: 'team@twofoldvisuals.com',
        reviewing_admin_name: 'Account Owner',
        action_required_notes: notes
      });
      
      await base44.entities.AdminAction.create({
        admin_id: user.email,
        admin_name: getAdminDisplayName(user),
        action_type: 'profile_reviewed',
        target_id: profile.user_id,
        target_name: profile.full_name,
        details: { profile_id: profile.id },
        notes: notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      queryClient.invalidateQueries(['allVendorProfiles']);
      setReviewDialog(false);
      setReviewNotes('');
      toast.success('Submitted for further review');
    }
  });

  const handleSuspend = () => {
    if (!suspendReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    suspendMutation.mutate(suspendReason);
  };

  const addNoteMutation = useMutation({
    mutationFn: async (note) => {
      const currentNotes = profile.internal_notes || [];
      await base44.entities.VendorProfile.update(profile.id, {
        internal_notes: [...currentNotes, {
          note,
          admin_id: user.email,
          admin_name: getAdminDisplayName(user),
          created_at: new Date().toISOString()
        }]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      setAddNoteDialog(false);
      setInternalNote('');
      toast.success('Note added');
    }
  });

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  // Calculate job history and pay
  const acceptedApplicationJobs = userApplications
    .filter(app => app.status === 'accepted')
    .map(app => allJobs.find(job => job.id === app.help_request_id))
    .filter(Boolean);

  const completedJobs = acceptedApplicationJobs.filter(job => job.status === 'completed');
  const totalEarned = completedJobs.reduce((sum, job) => sum + (job.calculated_pay || job.pay_amount || 0), 0);

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(createPageUrl('Dashboard'))}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex gap-2">
          {profile?.reviewing_admin_id === user?.email && (
            <>
              <Button
                onClick={() => unassignMutation.mutate()}
                disabled={unassignMutation.isLoading}
                variant="outline"
              >
                Unassign from Me
              </Button>
              <Button
                onClick={() => setAssignDialog(true)}
                variant="outline"
              >
                Assign to Another Admin
              </Button>
              <Button
                onClick={() => setReviewDialog(true)}
                variant="outline"
              >
                Submit for Review
              </Button>
            </>
          )}
          {profile?.suspended ? (
            <Button
              onClick={() => unsuspendMutation.mutate()}
              disabled={unsuspendMutation.isLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Unsuspend User
            </Button>
          ) : (
            <Button
              onClick={() => setSuspendDialog(true)}
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Ban className="w-4 h-4 mr-2" />
              Suspend User
            </Button>
          )}
          <Button onClick={handleSave} disabled={updateMutation.isLoading} className="bg-stone-900 hover:bg-stone-800">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Card className="border-stone-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {profile.selfie_url ? (
                  <img src={profile.selfie_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-stone-100 text-stone-600 text-xl">
                    {profile.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle>{profile.full_name}</CardTitle>
                  {profile?.suspended && (
                    <Badge className="bg-red-50 text-red-700 border-red-200">
                      <Ban className="w-3 h-3 mr-1" />
                      {profile?.appeal_status === 'denied' ? 'Appeal Denied' : 'Suspended'}
                    </Badge>
                  )}
                  {profile?.appeal_status === 'pending' && profile?.suspended && (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                      Appeal Pending
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-stone-500">{profile.email}</p>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{avgRating}</span>
                    </div>
                    <span className="text-xs text-stone-500">({reviews.length} reviews)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Appeal Review Section */}
      {profile?.appeal_status === 'pending' && profile?.suspended && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900">Suspension Appeal Pending Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-amber-900">Appeal Message:</Label>
              <p className="text-sm text-amber-800 mt-2 bg-white rounded-lg p-3 border border-amber-200">
                {profile.appeal_message}
              </p>
              {profile.appeal_submitted_date && (
                <p className="text-xs text-amber-700 mt-2">
                  Submitted on {format(new Date(profile.appeal_submitted_date), 'MMM d, yyyy h:mm a')}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => approveAppealMutation.mutate()}
                disabled={approveAppealMutation.isLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Appeal
              </Button>
              <Button
                onClick={() => denyAppealMutation.mutate()}
                disabled={denyAppealMutation.isLoading}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Deny Appeal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input 
                value={formData.full_name || ''}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
            </div>
            <div>
              <Label>Business Name</Label>
              <Input 
                value={formData.business_name || ''}
                onChange={(e) => setFormData({...formData, business_name: e.target.value})}
              />
            </div>
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea 
              value={formData.bio || ''}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              <Input 
                value={formData.phone || ''}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div>
              <Label>Experience Years</Label>
              <Input 
                type="number"
                value={formData.experience_years || ''}
                onChange={(e) => setFormData({...formData, experience_years: parseInt(e.target.value)})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>City</Label>
              <Input 
                value={formData.city || ''}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
              />
            </div>
            <div>
              <Label>State</Label>
              <Input 
                value={formData.state || ''}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Travel Radius (miles)</Label>
              <Input 
                type="number"
                value={formData.travel_radius_miles || ''}
                onChange={(e) => setFormData({...formData, travel_radius_miles: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <Label>Approval Status</Label>
              <Select 
                value={formData.approval_status || 'pending'}
                onValueChange={(value) => setFormData({...formData, approval_status: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle>Services Offered</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(serviceConfig).map(([key, config]) => {
              const Icon = config.icon;
              const isChecked = formData.service_types?.includes(key);
              return (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const current = formData.service_types || [];
                      const updated = checked 
                        ? [...current, key]
                        : current.filter(s => s !== key);
                      setFormData({...formData, service_types: updated});
                    }}
                  />
                  <label
                    htmlFor={key}
                    className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </label>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle>Photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {profile.selfie_url && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Selfie</Label>
                <a href={profile.selfie_url} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={profile.selfie_url} 
                    alt="User selfie" 
                    className="w-full h-40 object-cover rounded-lg border border-stone-200 hover:opacity-90 transition-opacity"
                  />
                </a>
              </div>
            )}
            {profile.business_logo_url && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Business Logo</Label>
                <a href={profile.business_logo_url} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={profile.business_logo_url} 
                    alt="Business logo" 
                    className="w-full h-40 object-contain rounded-lg border border-stone-200 hover:opacity-90 transition-opacity bg-white"
                  />
                </a>
              </div>
            )}
          </div>
          {!profile.selfie_url && !profile.business_logo_url && (
            <p className="text-sm text-stone-500 text-center py-4">No photos uploaded</p>
          )}
        </CardContent>
      </Card>

      {/* Portfolio & Documents */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle>Portfolio & Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.portfolio_links?.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Portfolio Links</Label>
              <div className="space-y-2">
                {profile.portfolio_links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline break-all"
                  >
                    <LinkIcon className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{link}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {profile.portfolio_items?.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Portfolio Items</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {profile.portfolio_items.map((item, idx) => (
                  <div key={idx} className="border border-stone-200 rounded-lg overflow-hidden">
                    {item.type === 'image' && (
                      <a href={item.image_url} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={item.image_url} 
                          alt={item.title || 'Portfolio item'} 
                          className="w-full h-40 object-cover hover:opacity-90 transition-opacity"
                        />
                      </a>
                    )}
                    {(item.title || item.description) && (
                      <div className="p-3">
                        {item.title && <p className="text-sm font-medium text-stone-900">{item.title}</p>}
                        {item.description && <p className="text-xs text-stone-600 mt-1 line-clamp-2">{item.description}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!profile.portfolio_links?.length && !profile.portfolio_items?.length && (
            <p className="text-sm text-stone-500 text-center py-4">No portfolio items uploaded</p>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle>Documents & Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.insurance_url && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Insurance Certificate</Label>
              <a
                href={profile.insurance_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors w-fit"
              >
                <FileText className="w-4 h-4 text-stone-600" />
                <span className="text-sm text-stone-900">View Insurance Document</span>
                <ExternalLink className="w-3 h-3 text-stone-500" />
              </a>
            </div>
          )}

          {profile.credentials_url && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Credentials/Certifications</Label>
              <a
                href={profile.credentials_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors w-fit"
              >
                <FileText className="w-4 h-4 text-stone-600" />
                <span className="text-sm text-stone-900">View Credentials Document</span>
                <ExternalLink className="w-3 h-3 text-stone-500" />
              </a>
            </div>
          )}

          {!profile.insurance_url && !profile.credentials_url && (
            <p className="text-sm text-stone-500 text-center py-4">No documents uploaded</p>
          )}
        </CardContent>
      </Card>

      {/* Additional Profile Details */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle>Additional Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-xs text-stone-500">Street Address</Label>
              <p className="text-stone-900">{profile.street_address || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-xs text-stone-500">Services Offered</Label>
              <p className="text-stone-900">{profile.services_offered?.join(', ') || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-xs text-stone-500">Completed Jobs</Label>
              <p className="text-stone-900">{profile.completed_jobs_count || 0}</p>
            </div>
            <div>
              <Label className="text-xs text-stone-500">Reliability Score</Label>
              <p className="text-stone-900">{profile.reliability_score ? `${profile.reliability_score}/5` : 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle>Activity & History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="w-full flex flex-wrap justify-start gap-1 h-auto">
              <TabsTrigger value="posts" className="flex-1 min-w-[120px]">Posts ({userPosts.length})</TabsTrigger>
              <TabsTrigger value="applications" className="flex-1 min-w-[120px]">Applications ({userApplications.length})</TabsTrigger>
              <TabsTrigger value="jobs" className="flex-1 min-w-[120px]">Jobs ({acceptedApplicationJobs.length})</TabsTrigger>
              <TabsTrigger value="reviews" className="flex-1 min-w-[120px]">Reviews ({reviews.length})</TabsTrigger>
              <TabsTrigger value="adminHistory" className="flex-1 min-w-[120px]">Admin History ({adminActions.length})</TabsTrigger>
              <TabsTrigger value="reports" className="flex-1 min-w-[120px]">Reports ({userReports.length})</TabsTrigger>
              <TabsTrigger value="notes" className="flex-1 min-w-[120px]">Notes ({(profile?.internal_notes || []).length})</TabsTrigger>
              <TabsTrigger value="logins" className="flex-1 min-w-[120px]">Logins ({loginHistory.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-3 mt-4">
              {userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <Card key={post.id} className="border-stone-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-stone-900">{post.title}</h4>
                            <Badge className={
                              post.status === 'open' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              post.status === 'filled' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-stone-100 text-stone-600'
                            }>
                              {post.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <ServiceBadge type={post.service_type} size="sm" />
                            <HelpTypeBadge type={post.help_type} size="sm" />
                          </div>
                          <div className="flex items-center gap-4 text-xs text-stone-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(post.event_date), 'MMM d, yyyy')}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {post.city}, {post.state}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ${post.pay_amount}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-stone-500 text-center py-8">No posts yet</p>
              )}
            </TabsContent>

            <TabsContent value="applications" className="space-y-3 mt-4">
              {userApplications.length > 0 ? (
                userApplications.map((app) => {
                  const job = allJobs.find(j => j.id === app.help_request_id);
                  if (!job) return null;
                  return (
                    <Card key={app.id} className="border-stone-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-stone-900">{job.title}</h4>
                              <Badge className={
                                app.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                app.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-stone-100 text-stone-600'
                              }>
                                {app.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-stone-600 mb-2">Posted by {job.requester_business || job.requester_name}</p>
                            <div className="flex items-center gap-4 text-xs text-stone-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(job.event_date), 'MMM d, yyyy')}
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                ${job.pay_amount}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <p className="text-sm text-stone-500 text-center py-8">No applications yet</p>
              )}
            </TabsContent>

            <TabsContent value="jobs" className="space-y-3 mt-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Card className="border-stone-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-stone-900">{acceptedApplicationJobs.length}</p>
                    <p className="text-xs text-stone-500">Jobs Booked</p>
                  </CardContent>
                </Card>
                <Card className="border-stone-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-stone-900">{completedJobs.length}</p>
                    <p className="text-xs text-stone-500">Completed</p>
                  </CardContent>
                </Card>
                <Card className="border-stone-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-stone-900">${totalEarned.toLocaleString()}</p>
                    <p className="text-xs text-stone-500">Total Earned</p>
                  </CardContent>
                </Card>
              </div>

              {acceptedApplicationJobs.length > 0 ? (
                acceptedApplicationJobs.map((job) => (
                  <Card key={job.id} className="border-stone-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-stone-900">{job.title}</h4>
                            <Badge className={
                              job.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              job.status === 'filled' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-stone-100 text-stone-600'
                            }>
                              {job.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-stone-600 mb-2">Client: {job.requester_business || job.requester_name}</p>
                          <div className="flex items-center gap-4 text-xs text-stone-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(job.event_date), 'MMM d, yyyy')}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ${job.calculated_pay || job.pay_amount}
                            </div>
                            {job.payment_status && (
                              <Badge variant="outline" className="text-xs">
                                {job.payment_status === 'paid' ? '✓ Paid' : 'Pending Payment'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-stone-500 text-center py-8">No job history yet</p>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="space-y-3 mt-4">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="border border-stone-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-stone-900">{review.reviewer_name}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {review.review_type === 'requester_to_vendor' ? 'As Client' : 'As Vendor'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.review_text && (
                      <p className="text-sm text-stone-600">{review.review_text}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-stone-500 text-center py-8">No reviews yet</p>
              )}
            </TabsContent>

            <TabsContent value="adminHistory" className="space-y-3 mt-4">
              {adminActions.length > 0 ? (
                <div className="space-y-2">
                  {adminActions.map((action) => (
                    <div key={action.id} className="border border-stone-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={
                              action.action_type.includes('approved') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              action.action_type.includes('rejected') || action.action_type.includes('denied') ? 'bg-red-50 text-red-700 border-red-200' :
                              action.action_type.includes('suspended') ? 'bg-orange-50 text-orange-700 border-orange-200' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                            }>
                              {action.action_type.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-stone-900">
                            {action.admin_name} ({action.admin_id})
                          </p>
                          <p className="text-xs text-stone-500 mt-1">
                            {format(new Date(action.created_date), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      {action.notes && (
                        <div className="bg-stone-50 rounded-lg p-3 mt-2">
                          <p className="text-xs font-medium text-stone-700 mb-1">Notes:</p>
                          <p className="text-sm text-stone-600 whitespace-pre-wrap">{action.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-500 text-center py-8">No admin actions recorded</p>
              )}
            </TabsContent>

            <TabsContent value="reports" className="space-y-3 mt-4">
              {userReports.length > 0 ? (
                <div className="space-y-3">
                  {userReports.map((report) => (
                    <Card key={report.id} className="border-red-200 bg-red-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={
                                report.status === 'open' ? 'bg-red-100 text-red-800 border-red-300' :
                                report.status === 'investigating' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                report.status === 'resolved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                'bg-stone-100 text-stone-700'
                              }>
                                {report.status}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {report.report_type.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-red-900 mb-1">
                              Reported by {report.reporter_name}
                            </p>
                            <p className="text-xs text-red-700 mb-2">
                              {format(new Date(report.created_date), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 mb-3 border border-red-200">
                          <p className="text-sm text-red-900 whitespace-pre-wrap">{report.description}</p>
                        </div>
                        {report.admin_notes && (
                          <div className="bg-amber-50 rounded-lg p-3 mb-2 border border-amber-200">
                            <p className="text-xs font-medium text-amber-900 mb-1">Admin Notes:</p>
                            <p className="text-sm text-amber-800 whitespace-pre-wrap">{report.admin_notes}</p>
                          </div>
                        )}
                        {report.action_taken && (
                          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                            <p className="text-xs font-medium text-emerald-900 mb-1">Action Taken:</p>
                            <p className="text-sm text-emerald-800 whitespace-pre-wrap">{report.action_taken}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-500 text-center py-8">No reports filed against this user</p>
              )}
            </TabsContent>

            <TabsContent value="notes" className="space-y-3 mt-4">
              <Button 
                onClick={() => setAddNoteDialog(true)}
                className="w-full bg-stone-900 hover:bg-stone-800 mb-4"
              >
                Add Internal Note
              </Button>
              {(profile?.internal_notes || []).length > 0 ? (
                <div className="space-y-2">
                  {[...(profile.internal_notes || [])].reverse().map((noteItem, idx) => (
                    <div key={idx} className="border border-stone-200 rounded-lg p-4 bg-stone-50">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-stone-900">{noteItem.admin_name}</p>
                          <p className="text-xs text-stone-500">
                            {format(new Date(noteItem.created_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-stone-700 whitespace-pre-wrap">{noteItem.note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-500 text-center py-8">No internal notes yet</p>
              )}
            </TabsContent>

            <TabsContent value="logins" className="space-y-3 mt-4">
              {loginHistory.length > 0 ? (
                <div className="space-y-2">
                  {loginHistory.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border border-stone-200 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-stone-900">
                          {format(new Date(session.created_date), 'MMM d, yyyy h:mm a')}
                        </p>
                        {session.device_info && (
                          <p className="text-xs text-stone-500 mt-1">{session.device_info}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Login
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-500 text-center py-8">No login history recorded</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* AI Risk Assessment */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Shield className="w-5 h-5" />
            AI Risk Assessment
            {profile.ai_assessment_history?.length > 0 && (
              <Badge variant="outline" className="text-xs ml-auto">
                {profile.ai_assessment_history.length} assessment{profile.ai_assessment_history.length > 1 ? 's' : ''} in history
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile.ai_risk_assessment ? (
            <>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-stone-700">Latest Risk Score:</span>
                  <Badge className={
                    profile.ai_risk_assessment.risk_score < 35 ? 'bg-emerald-100 text-emerald-800' :
                    profile.ai_risk_assessment.risk_score < 65 ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {profile.ai_risk_assessment.risk_score}/100
                  </Badge>
                </div>
                <p className="text-xs text-stone-600 mb-2">{profile.ai_risk_assessment.summary}</p>
                <p className="text-xs text-stone-400">
                  Assessed {format(new Date(profile.ai_risk_assessment.assessed_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => setAiAssessmentModal({ open: true, assessment: profile.ai_risk_assessment })}
                  variant="outline"
                  className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  View Full Assessment
                </Button>
                <Button
                  onClick={async () => {
                    if (!window.confirm('Re-run AI risk assessment? This will add a new assessment to the history.')) return;
                    setIsRunningAssessment(true);
                    try {
                      await base44.functions.invoke('analyzeVendorProfile', { profileId: profile.id });
                      toast.success('AI analysis started - refresh in a moment');
                      setTimeout(() => {
                        queryClient.invalidateQueries(['userProfile']);
                      }, 5000);
                    } catch (error) {
                      toast.error('Failed to start analysis');
                    }
                    setIsRunningAssessment(false);
                  }}
                  disabled={isRunningAssessment}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  {isRunningAssessment ? 'Running...' : 'Re-run'}
                </Button>
              </div>

              {profile.needs_risk_review && (
                <Button
                  onClick={async () => {
                    if (!window.confirm('Mark this profile as no risk? This will clear the risk review flag.')) return;
                    await base44.entities.VendorProfile.update(profile.id, {
                      needs_risk_review: false,
                      risk_review_admin_id: null,
                      risk_review_admin_name: null
                    });
                    await base44.entities.AdminAction.create({
                      admin_id: user.email,
                      admin_name: getAdminDisplayName(user),
                      action_type: 'profile_reviewed',
                      target_id: profile.user_id,
                      target_name: profile.full_name,
                      details: { profile_id: profile.id },
                      notes: 'Manually marked as no risk after review'
                    });
                    queryClient.invalidateQueries(['userProfile']);
                    queryClient.invalidateQueries(['allVendorProfiles']);
                    toast.success('Profile marked as no risk');
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as No Risk
                </Button>
              )}

              {profile.ai_assessment_history?.length > 1 && (
                <div className="bg-white rounded-lg border border-blue-200 p-3">
                  <p className="text-xs font-medium text-stone-700 mb-2">Assessment History</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {[...profile.ai_assessment_history].reverse().map((hist, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 bg-stone-50 rounded">
                        <span className="text-stone-600">
                          {format(new Date(hist.assessed_at), 'MMM d, h:mm a')}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            hist.risk_score < 35 ? 'bg-emerald-100 text-emerald-800 text-xs' :
                            hist.risk_score < 65 ? 'bg-amber-100 text-amber-800 text-xs' :
                            'bg-red-100 text-red-800 text-xs'
                          }>
                            {hist.risk_score}/100
                          </Badge>
                          <Button
                            onClick={() => setAiAssessmentModal({ open: true, assessment: hist })}
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : profile.ai_assessment_status === 'in_progress' ? (
            <div className="bg-white rounded-lg p-4 border border-blue-200 text-center">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-blue-700">AI analysis in progress...</p>
            </div>
          ) : profile.ai_assessment_status === 'failed' ? (
            <div className="space-y-3">
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <p className="text-sm text-amber-800">AI analysis failed - you can manually trigger it again</p>
              </div>
              <Button
                onClick={async () => {
                  setIsRunningAssessment(true);
                  try {
                    await base44.functions.invoke('analyzeVendorProfile', { profileId: profile.id });
                    toast.success('AI analysis started - refresh in a moment');
                    setTimeout(() => {
                      queryClient.invalidateQueries(['userProfile']);
                    }, 5000);
                  } catch (error) {
                    toast.error('Failed to start analysis');
                  }
                  setIsRunningAssessment(false);
                }}
                disabled={isRunningAssessment}
                variant="outline"
                className="w-full"
              >
                {isRunningAssessment ? 'Starting...' : 'Run AI Assessment'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-stone-700">No AI assessment has been run for this profile yet</p>
              </div>
              <Button
                onClick={async () => {
                  setIsRunningAssessment(true);
                  try {
                    await base44.functions.invoke('analyzeVendorProfile', { profileId: profile.id });
                    toast.success('AI analysis started - refresh in a moment');
                    setTimeout(() => {
                      queryClient.invalidateQueries(['userProfile']);
                    }, 5000);
                  } catch (error) {
                    toast.error('Failed to start analysis');
                  }
                  setIsRunningAssessment(false);
                }}
                disabled={isRunningAssessment}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isRunningAssessment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Running Analysis...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Run AI Risk Assessment
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Risk Assessment Modal */}
      <AIRiskAssessment
        open={aiAssessmentModal.open}
        onClose={() => setAiAssessmentModal({ open: false, assessment: null })}
        assessment={aiAssessmentModal.assessment}
      />

      {/* Suspend Dialog */}
      <Dialog open={suspendDialog} onOpenChange={setSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Provide a reason for suspending {profile?.full_name}'s account
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="Reason for suspension..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSuspend}
              disabled={suspendMutation.isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign to Another Admin Dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Another Admin</DialogTitle>
            <DialogDescription>
              Select an admin to assign this profile review to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Select Admin</Label>
            <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an admin" />
              </SelectTrigger>
              <SelectContent>
                {allAdmins.map((admin) => (
                  <SelectItem key={admin.email} value={admin.email}>
                    {admin.full_name} ({admin.email})
                    {admin.email === 'team@twofoldvisuals.com' && ' - Account Owner'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => assignToAdminMutation.mutate(selectedAdmin)}
              disabled={!selectedAdmin || assignToAdminMutation.isLoading}
              className="bg-stone-900 hover:bg-stone-800"
            >
              Assign Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit for Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit for Further Review</DialogTitle>
            <DialogDescription>
              This will assign the profile to the account owner for additional review
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Add notes about why this needs further review (optional)..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => submitForReviewMutation.mutate(reviewNotes)}
              disabled={submitForReviewMutation.isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Submit for Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Internal Note Dialog */}
      <Dialog open={addNoteDialog} onOpenChange={setAddNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Internal Note</DialogTitle>
            <DialogDescription>
              Add a private note about this user (only visible to admins)
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            placeholder="Add your note here..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddNoteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!internalNote.trim()) {
                  toast.error('Please enter a note');
                  return;
                }
                addNoteMutation.mutate(internalNote);
              }}
              disabled={addNoteMutation.isLoading}
              className="bg-stone-900 hover:bg-stone-800"
            >
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}