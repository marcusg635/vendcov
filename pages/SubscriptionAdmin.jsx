import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  CreditCard,
  UserPlus,
  Gift,
  Search,
  Clock,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { format, addMonths, isValid } from 'date-fns';

export default function SubscriptionAdmin() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Grant modal state is separate and "frozen" (no stale refs)
  const [grantModal, setGrantModal] = useState({
    open: false,
    userId: null,
    full_name: '',
    email: '',
  });

  const [grantMonths, setGrantMonths] = useState('1');
  const [syncing, setSyncing] = useState(false);

  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.asServiceRole.entities.User.list('-created_date'),
  });

  // Base44 user objects can vary; be defensive
  const getUserId = (u) => u?.id ?? u?._id ?? u?.user_id ?? null;

  const grantMutation = useMutation({
    mutationFn: async ({ userId, months }) => {
      const endDate = addMonths(new Date(), parseInt(months, 10));

      await base44.asServiceRole.entities.User.update(userId, {
        subscription_status: 'active',
        subscription_end_date: endDate.toISOString(),

        subscription_granted_by_admin: true,
        subscription_source: 'admin',

        // ensure app doesn't treat as Stripe-paid
        stripe_subscription_id: null,
        stripe_customer_id: null,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success('Free subscription granted successfully');

      setGrantModal({ open: false, userId: null, full_name: '', email: '' });
      setGrantMonths('1');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to grant subscription');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (userId) => {
      await base44.asServiceRole.entities.User.update(userId, {
        subscription_status: 'canceled',
        subscription_end_date: null,
        subscription_granted_by_admin: false,
        subscription_source: 'none',
        stripe_subscription_id: null,
        stripe_customer_id: null,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success('Subscription revoked');
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to revoke subscription');
    },
  });

  const handleSyncStripe = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke('syncStripeSubscriptions');
      const payload = res?.data ?? res ?? {};
      const syncedCount = payload?.synced_count ?? payload?.syncedCount ?? payload?.count ?? 0;

      await queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success(`Synced ${syncedCount} Stripe subscriptions`);
    } catch (error) {
      toast.error(error?.message || 'Failed to sync');
    } finally {
      setSyncing(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const email = (u.email || '').toLowerCase();
      const name = (u.full_name || '').toLowerCase();
      return email.includes(q) || name.includes(q);
    });
  }, [users, searchQuery]);

  const subscribedUsers = useMemo(
    () => filteredUsers.filter((u) => u.subscription_status === 'active' || u.subscription_status === 'trialing'),
    [filteredUsers]
  );

  const stripeSubscribers = useMemo(
    () => subscribedUsers.filter((u) => u.stripe_customer_id && !u.subscription_granted_by_admin),
    [subscribedUsers]
  );

  const adminGrantedUsers = useMemo(
    () => subscribedUsers.filter((u) => u.subscription_granted_by_admin),
    [subscribedUsers]
  );

  const totalRevenue = stripeSubscribers.length * 9.99;

  const getStatusBadge = (status, isGranted) => {
    if (status === 'active' || status === 'trialing') {
      if (isGranted) {
        return { label: '✓ Free Access', className: 'bg-purple-100 text-purple-700 border-purple-200' };
      }
      return { label: '✓ Active', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }
    if (status === 'past_due') {
      return { label: 'Past Due', className: 'bg-amber-100 text-amber-700 border-amber-200' };
    }
    if (status === 'canceled') {
      return { label: 'Canceled', className: 'bg-stone-200 text-stone-600 border-stone-300' };
    }
    return { label: 'Free', className: 'bg-stone-100 text-stone-600 border-stone-200' };
  };

  const safeFormatDate = (value, fmt = 'MMM d, yyyy') => {
    if (!value) return '—';
    const d = new Date(value);
    if (!isValid(d)) return '—';
    return format(d, fmt);
  };

  const grantExpiryPreview = useMemo(() => {
    const months = parseInt(grantMonths, 10);
    if (!months || Number.isNaN(months)) return null;
    return addMonths(new Date(), months);
  }, [grantMonths]);

  const openGrantFlow = (user) => {
    const userId = getUserId(user);
    if (!userId) {
      toast.error('Could not determine user ID for this account.');
      return;
    }

    // Critical: close details first (prevents dialog focus-trap issues)
    setSelectedUser(null);

    // Open grant dialog next microtask so overlays fully release
    queueMicrotask(() => {
      setGrantModal({
        open: true,
        userId,
        full_name: user?.full_name || 'Unnamed User',
        email: user?.email || '—',
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Subscription Management</h1>
          <p className="text-stone-600 mt-1">View all subscriptions, grant free access, and track revenue</p>
        </div>
        <Button
          type="button"
          onClick={handleSyncStripe}
          disabled={syncing}
          variant="outline"
          className="shrink-0"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          {syncing ? 'Syncing...' : 'Sync Stripe'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600">Paid Subscribers</p>
                <p className="text-3xl font-bold text-stone-900">{stripeSubscribers.length}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600">Free Access</p>
                <p className="text-3xl font-bold text-purple-900">{adminGrantedUsers.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Gift className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600">Monthly Revenue</p>
                <p className="text-3xl font-bold text-stone-900">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600">Total Users</p>
                <p className="text-3xl font-bold text-stone-900">{users.length}</p>
              </div>
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-stone-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => {
                const userId = getUserId(user);
                const hasActiveSub = user.subscription_status === 'active' || user.subscription_status === 'trialing';
                const isGranted = !!user.subscription_granted_by_admin;
                const statusBadge = getStatusBadge(user.subscription_status, isGranted);

                return (
                  <button
                    key={userId || `${user.email}-${user.created_date}`}
                    type="button"
                    className="w-full text-left flex items-center justify-between p-4 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-stone-900">{user.full_name || 'Unnamed User'}</p>
                      <p className="text-sm text-stone-600">{user.email || 'No email'}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={statusBadge.className}>{statusBadge.label}</Badge>

                      {hasActiveSub && (user.subscription_source === 'admin' || isGranted) && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                        >
                          <Gift className="w-3 h-3 mr-1" />
                          Admin Granted
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-stone-900">User Information</h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-stone-50 rounded-lg">
                  <div>
                    <p className="text-sm text-stone-600">Name</p>
                    <p className="font-medium text-stone-900">{selectedUser.full_name || 'Unnamed User'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-600">Email</p>
                    <p className="font-medium text-stone-900">{selectedUser.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-600">User ID</p>
                    <p className="font-mono text-xs text-stone-700">{String(getUserId(selectedUser) || '—')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-600">Role</p>
                    <Badge variant="outline">{selectedUser.role || 'user'}</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-stone-900">Subscription Status</h3>
                <div className="p-4 bg-stone-50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-600">Status</span>
                    <Badge className={getStatusBadge(selectedUser.subscription_status, selectedUser.subscription_granted_by_admin).className}>
                      {getStatusBadge(selectedUser.subscription_status, selectedUser.subscription_granted_by_admin).label}
                    </Badge>
                  </div>

                  {selectedUser.subscription_granted_by_admin && (
                    <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded">
                      <Gift className="w-4 h-4 text-purple-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-purple-900">Free Access Granted</p>
                        <p className="text-xs text-purple-700">This user has been given free access by an admin</p>
                      </div>
                    </div>
                  )}

                  {selectedUser.stripe_customer_id && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-600">Stripe Customer ID</span>
                      <code className="text-xs bg-white px-2 py-1 rounded border">{selectedUser.stripe_customer_id}</code>
                    </div>
                  )}

                  {selectedUser.stripe_subscription_id && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-600">Stripe Subscription ID</span>
                      <code className="text-xs bg-white px-2 py-1 rounded border">{selectedUser.stripe_subscription_id}</code>
                    </div>
                  )}

                  {selectedUser.subscription_end_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-600">End Date</span>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-stone-400" />
                        <span className="text-sm font-medium text-stone-900">
                          {safeFormatDate(selectedUser.subscription_end_date)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-600">Joined</span>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-stone-400" />
                      <span className="text-sm text-stone-700">{safeFormatDate(selectedUser.created_date)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedUser.stripe_customer_id && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-stone-900">Payment Method</h3>
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="font-medium text-emerald-900">Connected to Stripe</p>
                        <p className="text-sm text-emerald-700">User is paying $9.99/month via Stripe</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                {!selectedUser.subscription_granted_by_admin && (
                  <Button type="button" onClick={() => openGrantFlow(selectedUser)} className="flex-1">
                    <Gift className="w-4 h-4 mr-2" />
                    Grant Free Access
                  </Button>
                )}

                {(selectedUser.subscription_status === 'active' || selectedUser.subscription_status === 'trialing') && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const ok = window.confirm(
                        `Revoke subscription for ${selectedUser.full_name || 'this user'}? This will cancel their access immediately.`
                      );
                      const userId = getUserId(selectedUser);
                      if (ok && userId) revokeMutation.mutate(userId);
                    }}
                    disabled={revokeMutation.isLoading}
                    className="text-red-600 hover:text-red-700 border-red-200"
                  >
                    {revokeMutation.isLoading ? 'Revoking...' : 'Revoke Access'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Grant Dialog */}
      <Dialog
        open={grantModal.open}
        onOpenChange={(open) => {
          if (!open) setGrantModal({ open: false, userId: null, full_name: '', email: '' });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Free Subscription</DialogTitle>
            <DialogDescription>Give this user free access to all premium features</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Granting access to: {grantModal.full_name}</p>
              <p className="text-xs text-blue-700 mt-1">{grantModal.email}</p>
            </div>

            <div>
              <Label>Access Duration</Label>
              <Select value={grantMonths} onValueChange={setGrantMonths}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Month</SelectItem>
                  <SelectItem value="2">2 Months</SelectItem>
                  <SelectItem value="3">3 Months</SelectItem>
                  <SelectItem value="6">6 Months</SelectItem>
                  <SelectItem value="12">1 Year</SelectItem>
                  <SelectItem value="24">2 Years</SelectItem>
                  <SelectItem value="120">10 Years (Lifetime)</SelectItem>
                </SelectContent>
              </Select>

              <p className="text-xs text-stone-500 mt-2">
                Access will expire on:{' '}
                {grantExpiryPreview ? format(grantExpiryPreview, 'MMMM d, yyyy') : '—'}
              </p>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-xs text-amber-800">
                  This will give the user full premium access. They won’t be charged through Stripe.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setGrantModal({ open: false, userId: null, full_name: '', email: '' })}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={() => {
                if (!grantModal.userId) {
                  toast.error('Missing user ID for grant.');
                  return;
                }
                grantMutation.mutate({ userId: grantModal.userId, months: grantMonths });
              }}
              disabled={grantMutation.isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {grantMutation.isLoading ? 'Granting...' : 'Grant Free Access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
