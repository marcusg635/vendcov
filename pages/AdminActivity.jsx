import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, XCircle, AlertCircle, MessageSquare, 
  Shield, Trash2, Clock, TrendingUp, User, Eye
} from 'lucide-react';

export default function AdminActivity() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState('all');

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: allAdmins = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter(u => u.role === 'admin');
    },
    enabled: !!user && user.email === 'team@twofoldvisuals.com'
  });

  const { data: adminActions = [] } = useQuery({
    queryKey: ['adminActions'],
    queryFn: () => base44.entities.AdminAction.list('-created_date'),
    enabled: !!user && user.email === 'team@twofoldvisuals.com',
    refetchInterval: 10000
  });

  const filteredActions = selectedAdmin === 'all' 
    ? adminActions 
    : adminActions.filter(a => a.admin_id === selectedAdmin);

  // Calculate stats per admin
  const adminStats = allAdmins.map(admin => {
    const actions = adminActions.filter(a => a.admin_id === admin.email);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayActions = actions.filter(a => new Date(a.created_date) >= today);
    
    return {
      admin,
      totalActions: actions.length,
      todayActions: todayActions.length,
      approvals: actions.filter(a => a.action_type === 'profile_approved').length,
      rejections: actions.filter(a => a.action_type === 'profile_rejected').length,
      supportChats: actions.filter(a => ['support_chat_assigned', 'support_chat_closed'].includes(a.action_type)).length
    };
  });

  const getActionIcon = (type) => {
    switch(type) {
      case 'profile_approved': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'profile_rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'action_required': return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case 'support_chat_assigned':
      case 'support_chat_closed': return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'user_suspended':
      case 'user_unsuspended': return <Shield className="w-4 h-4 text-purple-600" />;
      case 'job_deleted':
      case 'user_deleted': return <Trash2 className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-stone-600" />;
    }
  };

  const getActionLabel = (type) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (!user || user.email !== 'team@twofoldvisuals.com') {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-stone-900">Access Denied</h2>
        <p className="text-stone-600 mt-2">Only the owner can access this page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Admin Activity</h1>
        <p className="text-stone-600 mt-1">Monitor admin performance and actions</p>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminStats.map(({ admin, totalActions, todayActions, approvals, rejections, supportChats }) => (
          <Card 
            key={admin.email}
            className="border-stone-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedAdmin(admin.email)}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-stone-100 text-stone-600">
                    {admin.full_name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-stone-900">{admin.full_name}</h3>
                  <p className="text-xs text-stone-500 mb-3">{admin.email}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-stone-500">Total Actions</p>
                      <p className="font-semibold text-stone-900">{totalActions}</p>
                    </div>
                    <div>
                      <p className="text-stone-500">Today</p>
                      <p className="font-semibold text-blue-600">{todayActions}</p>
                    </div>
                    <div>
                      <p className="text-stone-500">Approvals</p>
                      <p className="font-semibold text-emerald-600">{approvals}</p>
                    </div>
                    <div>
                      <p className="text-stone-500">Support</p>
                      <p className="font-semibold text-purple-600">{supportChats}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Button
          variant={selectedAdmin === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedAdmin('all')}
          size="sm"
        >
          All Admins
        </Button>
        {allAdmins.map(admin => (
          <Button
            key={admin.email}
            variant={selectedAdmin === admin.email ? 'default' : 'outline'}
            onClick={() => setSelectedAdmin(admin.email)}
            size="sm"
          >
            {admin.full_name}
          </Button>
        ))}
      </div>

      {/* Activity Feed */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Activity Log
            <Badge variant="outline" className="ml-auto">{filteredActions.length} actions</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredActions.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-stone-300" />
              <p>No activity yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActions.map((action) => (
                <div key={action.id} className="flex items-start gap-4 p-4 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                    {getActionIcon(action.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-stone-900">{action.admin_name}</p>
                          <Badge variant="outline" className="text-xs">
                            {getActionLabel(action.action_type)}
                          </Badge>
                        </div>
                        <p className="text-sm text-stone-600">
                          Target: <span className="font-medium">{action.target_name}</span>
                        </p>
                        {action.notes && (
                          <p className="text-sm text-stone-500 mt-1 italic">"{action.notes}"</p>
                        )}
                        {action.details && Object.keys(action.details).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                              View Details
                            </summary>
                            <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(action.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-stone-400">
                          {format(new Date(action.created_date), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-stone-400">
                          {format(new Date(action.created_date), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}