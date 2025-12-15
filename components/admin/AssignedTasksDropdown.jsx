import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronDown, ChevronUp, User } from 'lucide-react';
import { serviceConfig } from '@/components/ui/ServiceBadge';

export default function AssignedTasksDropdown({ assignedProfiles, onTaskClick }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-stone-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-stone-900">Tasks Assigned to Admins</h3>
            <p className="text-sm text-stone-500">{assignedProfiles.length} tasks currently in progress</p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-stone-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-stone-400" />
        )}
      </button>

      {isOpen && (
        <CardContent className="pt-0 pb-6 space-y-2 max-h-96 overflow-y-auto">
          <div className="border-t border-stone-200 pt-4">
            {assignedProfiles.map((profile) => {
              const taskType = 
                profile.approval_status === 'user_submitted_info' ? 'user_submitted_info' :
                profile.approval_status === 'rejected' && profile.appeal_status === 'pending' ? 'rejection_appeal' :
                profile.suspended && profile.appeal_status === 'pending' ? 'suspension_appeal' :
                'pending';
              
              const statusBadge = 
                profile.approval_status === 'user_submitted_info' ? { label: 'Info Submitted', class: 'bg-green-100 text-green-800 border-green-300' } :
                profile.approval_status === 'rejected' && profile.appeal_status === 'pending' ? { label: 'Rejection Appeal', class: 'bg-purple-100 text-purple-800 border-purple-300' } :
                profile.suspended && profile.appeal_status === 'pending' ? { label: 'Suspension Appeal', class: 'bg-amber-100 text-amber-800 border-amber-300' } :
                { label: 'Pending', class: 'bg-amber-100 text-amber-800 border-amber-300' };

              return (
                <button
                  key={profile.id}
                  onClick={() => onTaskClick({ type: taskType, profile })}
                  className="w-full p-3 bg-stone-50 rounded-lg hover:bg-stone-100 cursor-pointer transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      {profile.selfie_url ? (
                        <img src={profile.selfie_url} alt={profile.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <AvatarFallback className="bg-orange-100 text-orange-700 text-sm">
                          {profile.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-stone-900 text-sm">{profile.full_name}</h3>
                        <Badge className={statusBadge.class + ' text-xs'}>{statusBadge.label}</Badge>
                      </div>
                      <p className="text-xs text-orange-700 mb-1">
                        Assigned to: {profile.reviewing_admin_name}
                      </p>
                      <p className="text-xs text-stone-500 truncate">
                        {profile.business_name || profile.email}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {assignedProfiles.length === 0 && (
            <div className="text-center py-8 border-t border-stone-200">
              <User className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-sm text-stone-500">No tasks currently assigned to admins</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}