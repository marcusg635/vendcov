import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/components/shared/useCurrentUser';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Key, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: userLoading } = useCurrentUser();
  const [displayName, setDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
    }
  }, [user]);

  const { data: vendorProfile } = useQuery({
    queryKey: ['vendorProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.VendorProfile.filter({ user_id: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email
  });
  
  const isNewUser = !vendorProfile;

  const updateDisplayNameMutation = useMutation({
    mutationFn: async (newDisplayName) => {
      await base44.auth.updateMe({ display_name: newDisplayName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      toast.success('Display name updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update display name: ' + error.message);
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }) => {
      // Base44 password change - this will be handled through the auth system
      // For now, we'll use a placeholder that should be replaced with actual auth API
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to change password');
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const userId = user.email;
      
      try {
        // Fetch all user-related data
        const [
          requests, 
          applications, 
          directMessages, 
          notifications, 
          reviews, 
          supportChats, 
          tickets,
          userSessions,
          chatMessages,
          supportMessages,
          adminMessages,
          reviewsAsReviewee,
          messagesAsRecipient,
          agreements,
          counterOffers,
          profiles
        ] = await Promise.all([
          base44.entities.HelpRequest.filter({ requester_id: userId }),
          base44.entities.JobApplication.filter({ applicant_id: userId }),
          base44.entities.DirectMessage.filter({ sender_id: userId }),
          base44.entities.Notification.filter({ user_id: userId }),
          base44.entities.Review.filter({ reviewer_id: userId }),
          base44.entities.SupportChat.filter({ user_id: userId }),
          base44.entities.SupportTicket.filter({ user_id: userId }),
          base44.entities.UserSession.filter({ user_id: userId }),
          base44.entities.ChatMessage.filter({ sender_id: userId }),
          base44.entities.SupportMessage.filter({ sender_id: userId }),
          base44.entities.AdminMessage.filter({ recipient_id: userId }),
          base44.entities.Review.filter({ reviewee_id: userId }),
          base44.entities.DirectMessage.filter({ recipient_id: userId }),
          base44.entities.SubcontractAgreement.list().then(all => all.filter(a => a.requester_id === userId || a.vendor_id === userId)),
          base44.entities.CounterOffer.list().then(all => all.filter(c => c.sender_id === userId)),
          base44.entities.VendorProfile.filter({ user_id: userId })
        ]);

        const applicationsToMyJobs = await base44.entities.JobApplication.list().then(all => {
          const userJobIds = requests.map(r => r.id);
          return all.filter(a => userJobIds.includes(a.help_request_id));
        });

        // Delete all records
        await Promise.all([
          ...requests.map(r => base44.entities.HelpRequest.delete(r.id)),
          ...applications.map(a => base44.entities.JobApplication.delete(a.id)),
          ...directMessages.map(m => base44.entities.DirectMessage.delete(m.id)),
          ...notifications.map(n => base44.entities.Notification.delete(n.id)),
          ...reviews.map(r => base44.entities.Review.delete(r.id)),
          ...supportChats.map(c => base44.entities.SupportChat.delete(c.id)),
          ...tickets.map(t => base44.entities.SupportTicket.delete(t.id)),
          ...userSessions.map(s => base44.entities.UserSession.delete(s.id)),
          ...chatMessages.map(m => base44.entities.ChatMessage.delete(m.id)),
          ...supportMessages.map(m => base44.entities.SupportMessage.delete(m.id)),
          ...adminMessages.map(m => base44.entities.AdminMessage.delete(m.id)),
          ...reviewsAsReviewee.map(r => base44.entities.Review.delete(r.id)),
          ...messagesAsRecipient.map(m => base44.entities.DirectMessage.delete(m.id)),
          ...agreements.map(a => base44.entities.SubcontractAgreement.delete(a.id)),
          ...counterOffers.map(c => base44.entities.CounterOffer.delete(c.id)),
          ...applicationsToMyJobs.map(a => base44.entities.JobApplication.delete(a.id)),
          ...profiles.map(p => base44.entities.VendorProfile.delete(p.id))
        ]);
        
        // Clean up localStorage
        localStorage.removeItem(`profile_ai_seen_${userId}`);
        localStorage.removeItem(`profile_ai_active_${userId}`);
        localStorage.removeItem('lastLogin');
        localStorage.removeItem('hideDevDialog');
        
        // Delete the user account itself
        const users = await base44.entities.User.filter({ email: userId });
        if (users.length > 0) {
          await base44.entities.User.delete(users[0].id);
        }
      } catch (error) {
        console.error('Delete account error:', error);
      }

      // Logout
      base44.auth.logout();
    },
    onSuccess: () => {
      toast.success('Account deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete account: ' + error.message);
    }
  });

  const handleChangePassword = (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    
    deleteAccountMutation.mutate();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  // Check if user signed up with Google (cannot change password)
  const isGoogleAuth = user.email?.includes('@') && !user.password_set;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(isNewUser ? '/profile' : -1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Account Settings</h1>
            <p className="text-stone-600 dark:text-stone-400 mt-1">
              {isNewUser ? 'Manage your account settings' : 'Manage your account security and preferences'}
            </p>
          </div>
        </div>

      {/* Display Name (Admin Only) */}
      {user?.role === 'admin' && (
        <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
          <CardHeader>
            <CardTitle className="dark:text-stone-100">Admin Display Name</CardTitle>
            <CardDescription>
              This name will be shown in all admin actions, activity logs, and support chats instead of your registered name
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                />
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Leave empty to use your registered name ({user.full_name})
                </p>
              </div>
              <Button 
                onClick={() => updateDisplayNameMutation.mutate(displayName)}
                disabled={updateDisplayNameMutation.isLoading}
                className="bg-stone-900 hover:bg-stone-800 w-full"
              >
                {updateDisplayNameMutation.isLoading ? 'Saving...' : 'Save Display Name'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Change Password */}
      <Card className="border-stone-200 dark:border-stone-700 dark:bg-stone-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-stone-100">
            <Key className="w-5 h-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            {isGoogleAuth 
              ? 'You signed in with Google. Password changes are managed through your Google account.'
              : 'Update your password to keep your account secure'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isGoogleAuth ? (
            <div className="text-center py-8 text-stone-500">
              <p>Password management is handled by Google</p>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Minimum 8 characters</p>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <Button 
                type="submit" 
                disabled={changePasswordMutation.isLoading}
                className="bg-stone-900 hover:bg-stone-800 w-full"
              >
                {changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            Delete Account
          </CardTitle>
          <CardDescription className="text-red-700 dark:text-red-300">
            {isNewUser 
              ? 'Delete your account. You can always create a new one later.'
              : 'Permanently delete your account and all associated data. This action cannot be undone.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialog(true)}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete My Account
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="text-red-700">
              This will permanently delete your account and all data including:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-stone-600">
            <ul className="list-disc list-inside space-y-1">
              <li>Your profile and portfolio</li>
              <li>All job postings and applications</li>
              <li>Messages and conversations</li>
              <li>Reviews and ratings</li>
              <li>Support tickets</li>
            </ul>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deleteConfirm">
              Type <span className="font-bold">DELETE</span> to confirm
            </Label>
            <Input
              id="deleteConfirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'DELETE' || deleteAccountMutation.isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteAccountMutation.isLoading ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}