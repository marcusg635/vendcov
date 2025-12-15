import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getAdminDisplayName } from '@/components/utils/adminUtils';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/components/shared/useCurrentUser';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AIRiskAssessment from '@/components/admin/AIRiskAssessment';
import { format } from 'date-fns';
import { formatTimestamp } from '@/components/shared/formatTimestamp';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import ServiceBadge, { serviceConfig } from '@/components/ui/ServiceBadge';
import { 
  Briefcase, Calendar, DollarSign, ArrowRight, ArrowLeft,
  PlusCircle, TrendingUp, Clock, CheckCircle2, AlertCircle,
  Users, XCircle, Shield, Trash2, ExternalLink, MapPin, MessageSquare, MoreVertical, Search, Mail, User, FileText, Send
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import JobCard from '@/components/jobs/JobCard';
import CompletedTasksDropdown from '@/components/admin/CompletedTasksDropdown';
import AssignedTasksDropdown from '@/components/admin/AssignedTasksDropdown';
import OnlineUsers, { OnlineUsersDialog } from '@/components/admin/OnlineUsers';
import GuidedTour from '@/components/onboarding/GuidedTour';
import ProfileCompleteness from '@/components/onboarding/ProfileCompleteness';
import EmailVerificationPrompt from '@/components/onboarding/EmailVerificationPrompt';

// Task Components
function UserSubmittedInfoTask({ selectedTask, setSelectedTask, showFullProfile, setShowFullProfile, approveMutation, setActionRequiredDialog, setRejectDialog, unassignTaskMutation, setSendToManagerDialog, user, setManagerResolutionDialog, assignToMeFromOtherMutation, setAiAssessmentModal }) {
  const { data: verification, isLoading } = useQuery({
    queryKey: ['verification', selectedTask.profile.id],
    queryFn: async () => {
      const requests = await base44.entities.ProfileVerification.filter({ 
        profile_id: selectedTask.profile.id,
        status: 'user_responded'
      }, '-created_date');
      return requests[0] || null;
    }
  });

  if (isLoading) {
    return <div className="text-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-stone-800 mx-auto"></div></div>;
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to List
      </Button>
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>User Submitted Information: {selectedTask.profile.full_name}</span>
            <Badge className="bg-green-600 text-white">Info Submitted</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {verification && (
            <div className="bg-white rounded-lg p-4 border-2 border-green-300">
              <h4 className="font-semibold text-green-900 mb-2">User's Response:</h4>
              <p className="text-sm text-stone-700 whitespace-pre-wrap mb-3">{verification.user_response}</p>
              
              {verification.user_files && verification.user_files.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-stone-600 mb-2">Uploaded Files:</p>
                  <div className="space-y-2">
                    {verification.user_files.map((file, idx) => (
                      <a 
                        key={idx}
                        href={file.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline bg-stone-50 p-2 rounded"
                      >
                        <FileText className="w-4 h-4" />
                        {file.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-stone-500 mt-3">
                Submitted: {verification.updated_date && formatTimestamp(verification.updated_date)}
              </p>
            </div>
          )}

          <Button 
            variant="outline" 
            onClick={() => setShowFullProfile(!showFullProfile)}
            className="w-full"
          >
            {showFullProfile ? 'Hide' : 'View'} Full Profile Details
          </Button>

          {showFullProfile && (
            <div className="space-y-4 bg-white rounded-lg p-4 border border-stone-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium text-stone-500">Name:</span> {selectedTask.profile.full_name}</div>
                <div><span className="font-medium text-stone-500">Business:</span> {selectedTask.profile.business_name}</div>
                <div><span className="font-medium text-stone-500">Phone:</span> {selectedTask.profile.phone}</div>
                <div><span className="font-medium text-stone-500">Email:</span> {selectedTask.profile.email}</div>
                <div className="col-span-2"><span className="font-medium text-stone-500">Services:</span> {selectedTask.profile.service_types?.map(s => serviceConfig[s]?.label).join(', ')}</div>
                <div className="col-span-2"><span className="font-medium text-stone-500">Location:</span> {selectedTask.profile.city}, {selectedTask.profile.state}</div>
                <div className="col-span-2"><span className="font-medium text-stone-500">Experience:</span> {selectedTask.profile.experience_years} years</div>
                {selectedTask.profile.bio && (
                  <div className="col-span-2"><span className="font-medium text-stone-500">Bio:</span> {selectedTask.profile.bio}</div>
                )}
                {selectedTask.profile.portfolio_links?.length > 0 && (
                  <div className="col-span-2">
                    <span className="font-medium text-stone-500">Portfolio:</span>
                    <div className="mt-1 space-y-1">
                      {selectedTask.profile.portfolio_links.map((link, idx) => (
                        <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-600 hover:underline break-all">
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <span className="font-medium text-stone-500 text-sm block mb-2">Photos:</span>
                <div className="flex gap-4">
                  {selectedTask.profile.selfie_url && (
                    <div>
                      <p className="text-xs text-stone-500 mb-1">Profile Photo</p>
                      <img src={selectedTask.profile.selfie_url} alt="Profile" className="w-24 h-24 rounded-lg object-cover border-2 border-stone-200" />
                    </div>
                  )}
                  {selectedTask.profile.business_logo_url && (
                    <div>
                      <p className="text-xs text-stone-500 mb-1">Business Logo</p>
                      <img src={selectedTask.profile.business_logo_url} alt="Logo" className="w-24 h-24 rounded-lg object-cover border-2 border-stone-200" />
                    </div>
                  )}
                </div>
              </div>

              {(selectedTask.profile.insurance_url || selectedTask.profile.credentials_url) && (
                <div>
                  <span className="font-medium text-stone-500 text-sm block mb-2">Documents:</span>
                  <div className="space-y-2">
                    {selectedTask.profile.insurance_url && (
                      <a 
                        href={selectedTask.profile.insurance_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <FileText className="w-4 h-4" />
                        Insurance Certificate
                      </a>
                    )}
                    {selectedTask.profile.credentials_url && (
                      <a 
                        href={selectedTask.profile.credentials_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <FileText className="w-4 h-4" />
                        Credentials/Certifications
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedTask.profile.sent_to_manager_reason && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Sent to Manager By: {selectedTask.profile.sent_to_manager_by_name}</h4>
              <p className="text-sm text-blue-700 mb-2"><span className="font-medium">Reason:</span> {selectedTask.profile.sent_to_manager_reason}</p>
            </div>
          )}

          <div className="space-y-2 pt-4 border-t">
            {selectedTask.profile.reviewing_admin_id === user?.email ? (
              <>
                {user?.email === 'team@twofoldvisuals.com' && selectedTask.profile.sent_to_manager_by_id ? (
                  <Button
                    onClick={() => setManagerResolutionDialog({ open: true, profileId: selectedTask.profile.id })}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Complete Task & Send Resolution
                  </Button>
                ) : null}
                {selectedTask.profile.ai_risk_assessment && (
                  <Button
                    onClick={() => setAiAssessmentModal({ open: true, assessment: selectedTask.profile.ai_risk_assessment })}
                    variant="outline"
                    className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    View AI Risk Assessment
                  </Button>
                )}
                {selectedTask.profile.ai_assessment_status === 'in_progress' && (
                  <div className="w-full bg-blue-50 rounded-lg p-3 border border-blue-200 text-center">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-blue-700">AI analysis in progress...</p>
                  </div>
                )}
                {selectedTask.profile.ai_assessment_status === 'failed' && (
                  <div className="w-full bg-amber-50 rounded-lg p-3 border border-amber-200 text-center">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                    <p className="text-xs text-amber-700">AI analysis failed - manual review needed</p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => {
                      approveMutation.mutate(selectedTask.profile.id);
                      setSelectedTask(null);
                      setShowFullProfile(false);
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    disabled={approveMutation.isLoading}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve Profile
                  </Button>
                  <Button
                    onClick={() => {
                      setActionRequiredDialog({ open: true, profileId: selectedTask.profile.id });
                    }}
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Request More Info
                  </Button>
                  <Button
                    onClick={() => {
                      setRejectDialog({ open: true, profileId: selectedTask.profile.id });
                    }}
                    variant="outline"
                    className="flex-1 text-red-600 hover:text-red-700"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => unassignTaskMutation.mutate({ profileId: selectedTask.profile.id })}
                    variant="outline"
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Unassign Task
                  </Button>
                  <Button
                    onClick={() => setSendToManagerDialog({ open: true, profileId: selectedTask.profile.id })}
                    variant="outline"
                    className="flex-1"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send to Manager
                  </Button>
                </div>
              </>
            ) : (
              <Button
                onClick={() => assignToMeFromOtherMutation.mutate({ profileId: selectedTask.profile.id })}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <User className="w-4 h-4 mr-2" />
                Assign to Me (Take Over Task)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RejectionAppealTask({ selectedTask, setSelectedTask, showFullProfile, setShowFullProfile, approveMutation, setDenyAppealDialog, unassignTaskMutation, setSendToManagerDialog, user, setManagerResolutionDialog, assignToMeFromOtherMutation, setAiAssessmentModal }) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to List
      </Button>
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Rejection Appeal: {selectedTask.profile.full_name}</span>
            <Badge className="bg-purple-600 text-white">Appeal Pending</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white rounded-lg p-4 border-2 border-purple-300">
            <h4 className="font-semibold text-purple-900 mb-2">User's Appeal:</h4>
            <p className="text-sm text-stone-700 whitespace-pre-wrap mb-3">{selectedTask.profile.appeal_message}</p>
            <p className="text-xs text-stone-500">
              Submitted: {selectedTask.profile.appeal_submitted_date && formatTimestamp(selectedTask.profile.appeal_submitted_date)}
            </p>
          </div>

          {selectedTask.profile.rejection_reason && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h4 className="font-semibold text-red-900 mb-2">Original Rejection Reason:</h4>
              <p className="text-sm text-red-700">{selectedTask.profile.rejection_reason}</p>
            </div>
          )}

          <Button 
            variant="outline" 
            onClick={() => setShowFullProfile(!showFullProfile)}
            className="w-full"
          >
            {showFullProfile ? 'Hide' : 'View'} Full Profile Details
          </Button>

          {showFullProfile && (
            <div className="space-y-4 bg-white rounded-lg p-4 border border-stone-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium text-stone-500">Name:</span> {selectedTask.profile.full_name}</div>
                <div><span className="font-medium text-stone-500">Business:</span> {selectedTask.profile.business_name}</div>
                <div><span className="font-medium text-stone-500">Phone:</span> {selectedTask.profile.phone}</div>
                <div><span className="font-medium text-stone-500">Email:</span> {selectedTask.profile.email}</div>
                <div className="col-span-2"><span className="font-medium text-stone-500">Services:</span> {selectedTask.profile.service_types?.map(s => serviceConfig[s]?.label).join(', ')}</div>
                <div className="col-span-2"><span className="font-medium text-stone-500">Location:</span> {selectedTask.profile.city}, {selectedTask.profile.state}</div>
                <div className="col-span-2"><span className="font-medium text-stone-500">Experience:</span> {selectedTask.profile.experience_years} years</div>
                {selectedTask.profile.bio && (
                  <div className="col-span-2"><span className="font-medium text-stone-500">Bio:</span> {selectedTask.profile.bio}</div>
                )}
                {selectedTask.profile.portfolio_links?.length > 0 && (
                  <div className="col-span-2">
                    <span className="font-medium text-stone-500">Portfolio:</span>
                    <div className="mt-1 space-y-1">
                      {selectedTask.profile.portfolio_links.map((link, idx) => (
                        <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-600 hover:underline break-all">
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <span className="font-medium text-stone-500 text-sm block mb-2">Photos:</span>
                <div className="flex gap-4">
                  {selectedTask.profile.selfie_url && (
                    <div>
                      <p className="text-xs text-stone-500 mb-1">Profile Photo</p>
                      <img src={selectedTask.profile.selfie_url} alt="Profile" className="w-24 h-24 rounded-lg object-cover border-2 border-stone-200" />
                    </div>
                  )}
                  {selectedTask.profile.business_logo_url && (
                    <div>
                      <p className="text-xs text-stone-500 mb-1">Business Logo</p>
                      <img src={selectedTask.profile.business_logo_url} alt="Logo" className="w-24 h-24 rounded-lg object-cover border-2 border-stone-200" />
                    </div>
                  )}
                </div>
              </div>

              {(selectedTask.profile.insurance_url || selectedTask.profile.credentials_url) && (
                <div>
                  <span className="font-medium text-stone-500 text-sm block mb-2">Documents:</span>
                  <div className="space-y-2">
                    {selectedTask.profile.insurance_url && (
                      <a 
                        href={selectedTask.profile.insurance_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <FileText className="w-4 h-4" />
                        Insurance Certificate
                      </a>
                    )}
                    {selectedTask.profile.credentials_url && (
                      <a 
                        href={selectedTask.profile.credentials_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <FileText className="w-4 h-4" />
                        Credentials/Certifications
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 pt-4 border-t">
            {selectedTask.profile.ai_risk_assessment && (
              <Button
                onClick={() => setAiAssessmentModal({ open: true, assessment: selectedTask.profile.ai_risk_assessment })}
                variant="outline"
                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Shield className="w-4 h-4 mr-2" />
                View AI Risk Assessment
              </Button>
            )}
            {selectedTask.profile.ai_assessment_status === 'in_progress' && (
              <div className="w-full bg-blue-50 rounded-lg p-3 border border-blue-200 text-center">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-blue-700">AI analysis in progress...</p>
              </div>
            )}
            {selectedTask.profile.ai_assessment_status === 'failed' && (
              <div className="w-full bg-amber-50 rounded-lg p-3 border border-amber-200 text-center">
                <AlertCircle className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <p className="text-xs text-amber-700">AI analysis failed - manual review needed</p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => {
                  approveMutation.mutate(selectedTask.profile.id);
                  setSelectedTask(null);
                  setShowFullProfile(false);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={approveMutation.isLoading}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve Appeal
              </Button>
              <Button
                onClick={() => {
                  setDenyAppealDialog({ open: true, profileId: selectedTask.profile.id });
                }}
                variant="outline"
                className="flex-1 text-red-600 hover:text-red-700"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Deny Appeal
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => unassignTaskMutation.mutate({ profileId: selectedTask.profile.id })}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Unassign Task
              </Button>
              <Button
                onClick={() => setSendToManagerDialog({ open: true, profileId: selectedTask.profile.id })}
                variant="outline"
                className="flex-1"
              >
                <Send className="w-4 h-4 mr-2" />
                Send to Manager
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SuspensionAppealTask({ selectedTask, setSelectedTask, showFullProfile, setShowFullProfile, user, queryClient, setDenyAppealDialog, unassignTaskMutation, setSendToManagerDialog, setManagerResolutionDialog, assignToMeFromOtherMutation, setAiAssessmentModal }) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to List
      </Button>
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Suspension Appeal: {selectedTask.profile.full_name}</span>
            <Badge className="bg-amber-600 text-white">Appeal Pending</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white rounded-lg p-4 border-2 border-amber-300">
            <h4 className="font-semibold text-amber-900 mb-2">User's Appeal:</h4>
            <p className="text-sm text-stone-700 whitespace-pre-wrap mb-3">{selectedTask.profile.appeal_message}</p>
            <p className="text-xs text-stone-500">
              Submitted: {selectedTask.profile.appeal_submitted_date && formatTimestamp(selectedTask.profile.appeal_submitted_date)}
            </p>
          </div>

          {selectedTask.profile.suspension_reason && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h4 className="font-semibold text-red-900 mb-2">Original Suspension Reason:</h4>
              <p className="text-sm text-red-700">{selectedTask.profile.suspension_reason}</p>
            </div>
          )}

          <div className="space-y-2 pt-4 border-t">
            {selectedTask.profile.ai_risk_assessment && (
              <Button
                onClick={() => setAiAssessmentModal({ open: true, assessment: selectedTask.profile.ai_risk_assessment })}
                variant="outline"
                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Shield className="w-4 h-4 mr-2" />
                View AI Risk Assessment
              </Button>
            )}
            {selectedTask.profile.ai_assessment_status === 'in_progress' && (
              <div className="w-full bg-blue-50 rounded-lg p-3 border border-blue-200 text-center">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-blue-700">AI analysis in progress...</p>
              </div>
            )}
            {selectedTask.profile.ai_assessment_status === 'failed' && (
              <div className="w-full bg-amber-50 rounded-lg p-3 border border-amber-200 text-center">
                <AlertCircle className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <p className="text-xs text-amber-700">AI analysis failed - manual review needed</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  await base44.entities.VendorProfile.update(selectedTask.profile.id, {
                    suspended: false,
                    suspension_reason: null,
                    appeal_status: 'approved',
                    appeal_message: null
                  });
                  await base44.entities.Notification.create({
                    user_id: selectedTask.profile.user_id,
                    type: 'new_message',
                    title: 'Suspension Appeal Approved',
                    message: 'Your suspension has been lifted. You can now access the platform.',
                    reference_id: selectedTask.profile.id
                  });
                  await base44.entities.AdminAction.create({
                    admin_id: user.email,
                    admin_name: getAdminDisplayName(user),
                    action_type: 'appeal_approved',
                    target_id: selectedTask.profile.user_id,
                    target_name: selectedTask.profile.full_name
                  });
                  queryClient.invalidateQueries(['allVendorProfiles']);
                  setSelectedTask(null);
                  setShowFullProfile(false);
                  toast.success('Suspension appeal approved');
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve Appeal
              </Button>
              <Button
                onClick={() => {
                  setDenyAppealDialog({ open: true, profileId: selectedTask.profile.id });
                }}
                variant="outline"
                className="flex-1 text-red-600 hover:text-red-700"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Deny Appeal
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => unassignTaskMutation.mutate({ profileId: selectedTask.profile.id })}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Unassign Task
              </Button>
              <Button
                onClick={() => setSendToManagerDialog({ open: true, profileId: selectedTask.profile.id })}
                variant="outline"
                className="flex-1"
              >
                <Send className="w-4 h-4 mr-2" />
                Send to Manager
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PendingApprovalTask({ selectedTask, setSelectedTask, approveMutation, setActionRequiredDialog, setRejectDialog, setSendForReviewDialog, unassignTaskMutation, setSendToManagerDialog, user, setManagerResolutionDialog, assignToMeFromOtherMutation, setAiAssessmentModal }) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to List
      </Button>
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Profile Review: {selectedTask.profile.full_name}</span>
            <Badge className="bg-amber-600 text-white">Pending Approval</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedTask.profile.ai_risk_assessment && (
            <div className="bg-white rounded-lg p-4 border border-orange-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-orange-900 text-sm">AI Risk Assessment</h4>
                <Badge className={
                  selectedTask.profile.ai_risk_assessment.risk_score < 35 ? 'bg-emerald-100 text-emerald-800' :
                  selectedTask.profile.ai_risk_assessment.risk_score < 65 ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-800'
                }>
                  {selectedTask.profile.ai_risk_assessment.risk_score}/100 - {selectedTask.profile.ai_risk_assessment.risk_label?.replace(/_/g, ' ')}
                </Badge>
              </div>
              
              <p className="text-xs text-stone-700">{selectedTask.profile.ai_risk_assessment.summary}</p>
              
              {selectedTask.profile.ai_risk_assessment.green_flags?.length > 0 && (
                <div className="bg-emerald-50 rounded p-2 border border-emerald-200">
                  <p className="text-xs font-medium text-emerald-900 mb-1">✓ Verified Indicators ({selectedTask.profile.ai_risk_assessment.green_flags.length})</p>
                  <ul className="text-xs text-emerald-800 space-y-0.5">
                    {selectedTask.profile.ai_risk_assessment.green_flags.slice(0, 3).map((flag, idx) => (
                      <li key={idx}>• {flag}</li>
                    ))}
                    {selectedTask.profile.ai_risk_assessment.green_flags.length > 3 && (
                      <li className="text-emerald-600">+ {selectedTask.profile.ai_risk_assessment.green_flags.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}
              
              {selectedTask.profile.ai_risk_assessment.red_flags?.length > 0 && (
                <div className="bg-red-50 rounded p-2 border border-red-200">
                  <p className="text-xs font-medium text-red-900 mb-1">⚠ Risk Indicators ({selectedTask.profile.ai_risk_assessment.red_flags.length})</p>
                  <ul className="text-xs text-red-800 space-y-0.5">
                    {selectedTask.profile.ai_risk_assessment.red_flags.slice(0, 3).map((flag, idx) => (
                      <li key={idx}>• {flag}</li>
                    ))}
                    {selectedTask.profile.ai_risk_assessment.red_flags.length > 3 && (
                      <li className="text-red-600">+ {selectedTask.profile.ai_risk_assessment.red_flags.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}

              <Button
                onClick={() => setAiAssessmentModal({ open: true, assessment: selectedTask.profile.ai_risk_assessment })}
                variant="outline"
                className="w-full text-xs"
              >
                View Complete Assessment Details
              </Button>
            </div>
          )}
          {selectedTask.profile.ai_assessment_status === 'in_progress' && (
            <div className="w-full bg-blue-50 rounded-lg p-3 border border-blue-200 text-center">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-blue-700">AI analysis in progress...</p>
            </div>
          )}
          {selectedTask.profile.ai_assessment_status === 'failed' && (
            <div className="w-full bg-amber-50 rounded-lg p-3 border border-amber-200 text-center">
              <AlertCircle className="w-5 h-5 text-amber-600 mx-auto mb-1" />
              <p className="text-xs text-amber-700">AI analysis failed - manual review needed</p>
            </div>
          )}
          <div className="space-y-4 bg-white rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium text-stone-500">Name:</span> {selectedTask.profile.full_name}</div>
              <div><span className="font-medium text-stone-500">Business:</span> {selectedTask.profile.business_name}</div>
              <div><span className="font-medium text-stone-500">Phone:</span> {selectedTask.profile.phone}</div>
              <div><span className="font-medium text-stone-500">Email:</span> {selectedTask.profile.email}</div>
              <div className="col-span-2"><span className="font-medium text-stone-500">Services:</span> {selectedTask.profile.service_types?.map(s => serviceConfig[s]?.label).join(', ')}</div>
              <div className="col-span-2"><span className="font-medium text-stone-500">Location:</span> {selectedTask.profile.city}, {selectedTask.profile.state}</div>
              <div className="col-span-2"><span className="font-medium text-stone-500">Experience:</span> {selectedTask.profile.experience_years} years</div>
              {selectedTask.profile.bio && (
                <div className="col-span-2"><span className="font-medium text-stone-500">Bio:</span> {selectedTask.profile.bio}</div>
              )}
              {selectedTask.profile.portfolio_links?.length > 0 && (
                <div className="col-span-2">
                  <span className="font-medium text-stone-500">Portfolio:</span>
                  <div className="mt-1 space-y-1">
                    {selectedTask.profile.portfolio_links.map((link, idx) => (
                      <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-600 hover:underline break-all">
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <span className="font-medium text-stone-500 text-sm block mb-2">Photos:</span>
              <div className="flex gap-4">
                {selectedTask.profile.selfie_url && (
                  <div>
                    <p className="text-xs text-stone-500 mb-1">Profile Photo</p>
                    <img src={selectedTask.profile.selfie_url} alt="Profile" className="w-24 h-24 rounded-lg object-cover border-2 border-stone-200" />
                  </div>
                )}
                {selectedTask.profile.business_logo_url && (
                  <div>
                    <p className="text-xs text-stone-500 mb-1">Business Logo</p>
                    <img src={selectedTask.profile.business_logo_url} alt="Logo" className="w-24 h-24 rounded-lg object-cover border-2 border-stone-200" />
                  </div>
                )}
              </div>
            </div>

            {(selectedTask.profile.insurance_url || selectedTask.profile.credentials_url) && (
              <div>
                <span className="font-medium text-stone-500 text-sm block mb-2">Documents:</span>
                <div className="space-y-2">
                  {selectedTask.profile.insurance_url && (
                    <a 
                      href={selectedTask.profile.insurance_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      Insurance Certificate
                    </a>
                  )}
                  {selectedTask.profile.credentials_url && (
                    <a 
                      href={selectedTask.profile.credentials_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      Credentials/Certifications
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-4 border-t">
            {selectedTask.profile.ai_risk_assessment && (
              <Button
                onClick={() => setAiAssessmentModal({ open: true, assessment: selectedTask.profile.ai_risk_assessment })}
                variant="outline"
                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Shield className="w-4 h-4 mr-2" />
                View AI Risk Assessment
              </Button>
            )}
            {selectedTask.profile.ai_assessment_status === 'in_progress' && (
              <div className="w-full bg-blue-50 rounded-lg p-3 border border-blue-200 text-center">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-blue-700">AI analysis in progress...</p>
              </div>
            )}
            {selectedTask.profile.ai_assessment_status === 'failed' && (
              <div className="w-full bg-amber-50 rounded-lg p-3 border border-amber-200 text-center">
                <AlertCircle className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <p className="text-xs text-amber-700">AI analysis failed - manual review needed</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  approveMutation.mutate(selectedTask.profile.id);
                  setSelectedTask(null);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={approveMutation.isLoading}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve Profile
              </Button>
              <Button
                onClick={() => {
                  setActionRequiredDialog({ open: true, profileId: selectedTask.profile.id });
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Request More Info
              </Button>
              <Button
                onClick={() => {
                  setRejectDialog({ open: true, profileId: selectedTask.profile.id });
                }}
                variant="outline"
                className="flex-1 text-red-600 hover:text-red-700"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Decline
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => unassignTaskMutation.mutate({ profileId: selectedTask.profile.id })}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Unassign Task
              </Button>
              <Button
                onClick={() => setSendToManagerDialog({ open: true, profileId: selectedTask.profile.id })}
                variant="outline"
                className="flex-1"
              >
                <Send className="w-4 h-4 mr-2" />
                Send to Manager
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useCurrentUser();
  const [profile, setProfile] = useState(null);
  const [rejectDialog, setRejectDialog] = useState({ open: false, profileId: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionRequiredDialog, setActionRequiredDialog] = useState({ open: false, profileId: null });
  const [actionRequiredNotes, setActionRequiredNotes] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [todoModal, setTodoModal] = useState({ open: false, type: null });
  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [suspendDialog, setSuspendDialog] = useState({ open: false, profileId: null, profileName: '', fromRiskReview: false });
  const [suspensionReason, setSuspensionReason] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, profileId: null, profileName: '' });
  const [deleteReason, setDeleteReason] = useState('');
  const [sendForReviewDialog, setSendForReviewDialog] = useState({ open: false, profileId: null });
  const [reviewNotes, setReviewNotes] = useState('');
  const [denyAppealDialog, setDenyAppealDialog] = useState({ open: false, profileId: null });
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [sendToManagerDialog, setSendToManagerDialog] = useState({ open: false, profileId: null });
  const [managerReason, setManagerReason] = useState('');
  const [managerResolutionDialog, setManagerResolutionDialog] = useState({ open: false, profileId: null });
  const [managerResolution, setManagerResolution] = useState('');
  const [aiAssessmentModal, setAiAssessmentModal] = useState({ open: false, assessment: null });
  const [onlineUsersDialog, setOnlineUsersDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: vendorProfile } = useQuery({
    queryKey: ['vendorProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.VendorProfile.filter({ user_id: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
    onSuccess: (data) => setProfile(data)
  });

  const { data: myRequests = [] } = useQuery({
    queryKey: ['myRequests', user?.email],
    queryFn: () => base44.entities.HelpRequest.filter({ requester_id: user.email }),
    enabled: !!user?.email,
    staleTime: 30000
  });

  const { data: myApplications = [] } = useQuery({
    queryKey: ['myApplications', user?.email],
    queryFn: () => base44.entities.JobApplication.filter({ applicant_id: user.email }),
    enabled: !!user?.email,
    staleTime: 30000
  });

  // Fetch applications to jobs I posted
  const jobIds = myRequests?.map(r => r.id) || [];
  const { data: applicationsToMyJobs = [] } = useQuery({
    queryKey: ['applicationsToMyJobs', jobIds],
    queryFn: async () => {
      if (jobIds.length === 0) return [];
      const allApps = await base44.entities.JobApplication.list();
      return allApps.filter(app => jobIds.includes(app.help_request_id));
    },
    enabled: jobIds.length > 0 && !!user?.email
  });

  const { data: appliedJobs = [] } = useQuery({
    queryKey: ['appliedJobs', myApplications.map(a => a.help_request_id)],
    queryFn: async () => {
      if (myApplications.length === 0) return [];
      const jobs = await base44.entities.HelpRequest.list();
      return jobs.filter(job => myApplications.some(app => app.help_request_id === job.id));
    },
    enabled: myApplications.length > 0
  });

  const { data: agreements = [] } = useQuery({
    queryKey: ['agreements', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allAgreements = await base44.entities.SubcontractAgreement.list();
      return allAgreements.filter(a => 
        a.requester_id === user.email || a.vendor_id === user.email
      );
    },
    enabled: !!user?.email,
    staleTime: 30000
  });

  const { data: recentJobs = [] } = useQuery({
    queryKey: ['recentJobs'],
    queryFn: () => base44.entities.HelpRequest.filter({ status: 'open' }, '-created_date', 3),
    enabled: !!user?.email,
    staleTime: 60000
  });

  const openRequests = myRequests?.filter(r => r.status === 'open').length || 0;
  const filledRequests = myRequests?.filter(r => r.status === 'filled').length || 0;
  const pendingApplications = myApplications?.filter(a => a.status === 'pending').length || 0;
  const acceptedApplications = myApplications?.filter(a => a.status === 'accepted').length || 0;

  const totalEarned = (myApplications || [])
    .filter(a => a.status === 'accepted')
    .reduce((sum, app) => {
      const request = myRequests?.find(r => r.id === app.help_request_id);
      return sum + (request?.pay_amount || 0);
    }, 0);

  // Calculate tasks and upcoming jobs for dashboard
  const myAcceptedJobs = (appliedJobs || []).filter(job => 
    job.accepted_vendor_id === user?.email && job.status === 'filled'
  );
  const myFilledRequests = (myRequests || []).filter(job => job.status === 'filled');

  const upcomingJobs = [...myAcceptedJobs, ...myFilledRequests].filter(job => {
    const eventDate = new Date(job.event_date);
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    return eventDate >= today && eventDate <= sevenDaysFromNow;
  }).sort((a, b) => new Date(a.event_date) - new Date(b.event_date)).slice(0, 3);

  // Calculate tasks count
  let tasksCount = 0;
  
  (myAcceptedJobs || []).forEach(job => {
    const agreement = (agreements || []).find(a => a.help_request_id === job.id);
    if (agreement && !agreement.vendor_confirmed) tasksCount++;
  });

  (myFilledRequests || []).forEach(job => {
    const agreement = (agreements || []).find(a => a.help_request_id === job.id);
    if (agreement && !agreement.requester_confirmed) tasksCount++;
    if (job.status === 'completed' && job.payment_status === 'pending') tasksCount++;
  });

  (myAcceptedJobs || []).forEach(job => {
    if (job.status === 'completed' && job.payment_status === 'pending') tasksCount++;
  });

  // Admin data
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

  const suspendedProfiles = (allProfiles || []).filter(p => p.suspended);
  const pendingAppeals = (allProfiles || []).filter(p => p.appeal_status === 'pending' && p.suspended);
  const rejectionAppeals = (allProfiles || []).filter(p => p.appeal_status === 'pending' && p.approval_status === 'rejected');

  // Tasks assigned to current admin
  const myAssignedProfiles = (allProfiles || []).filter(p => 
    p.reviewing_admin_id === user?.email || 
    (p.needs_risk_review && p.risk_review_admin_id === user?.email)
  );
  
  const { data: allSupportChats = [] } = useQuery({
    queryKey: ['allSupportChats'],
    queryFn: () => base44.entities.SupportChat.list('-created_date'),
    enabled: !!user?.email && user?.role === 'admin'
  });
  
  const myAssignedSupportChats = (allSupportChats || []).filter(c => c.assigned_admin_id === user?.email && c.status !== 'closed');

  const { data: allRequests = [] } = useQuery({
    queryKey: ['allHelpRequests'],
    queryFn: () => base44.entities.HelpRequest.list('-created_date'),
    enabled: !!user?.email && user?.role === 'admin'
  });

  const { data: unassignedSupportChats = [] } = useQuery({
    queryKey: ['unassignedSupportChats'],
    queryFn: async () => {
      const chats = await base44.entities.SupportChat.list('-created_date');
      return chats.filter(c => !c.assigned_admin_id && c.status !== 'closed');
    },
    enabled: !!user?.email && user?.role === 'admin',
    refetchInterval: 10000
  });

  const { data: adminActions = [] } = useQuery({
    queryKey: ['adminActions'],
    queryFn: () => base44.entities.AdminAction.list('-created_date'),
    enabled: !!user?.email && user?.role === 'admin'
  });

  const assignToMeMutation = useMutation({
    mutationFn: async ({ profileId }) => {
      await base44.entities.VendorProfile.update(profileId, {
        reviewing_admin_id: user.email,
        reviewing_admin_name: getAdminDisplayName(user)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allVendorProfiles']);
      toast.success('Task assigned to you');
    }
  });

  const unassignTaskMutation = useMutation({
    mutationFn: async ({ profileId }) => {
      await base44.entities.VendorProfile.update(profileId, {
        reviewing_admin_id: null,
        reviewing_admin_name: null,
        sent_to_manager_by_id: null,
        sent_to_manager_by_name: null,
        sent_to_manager_reason: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allVendorProfiles']);
      setSelectedTask(null);
      toast.success('Task moved back to unassigned');
    }
  });

  const assignToMeFromOtherMutation = useMutation({
    mutationFn: async ({ profileId }) => {
      await base44.entities.VendorProfile.update(profileId, {
        reviewing_admin_id: user.email,
        reviewing_admin_name: getAdminDisplayName(user),
        sent_to_manager_by_id: null,
        sent_to_manager_by_name: null,
        sent_to_manager_reason: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allVendorProfiles']);
      toast.success('Task reassigned to you');
    }
  });

  const completeManagerTaskMutation = useMutation({
    mutationFn: async ({ profileId, resolution }) => {
      const profile = allProfiles.find(p => p.id === profileId);
      
      await base44.entities.VendorProfile.update(profileId, {
        reviewing_admin_id: null,
        reviewing_admin_name: null,
        manager_resolution: resolution
      });

      if (profile.sent_to_manager_by_id && profile.sent_to_manager_by_id !== user.email) {
        await base44.entities.AdminMessage.create({
          admin_id: user.email,
          admin_name: getAdminDisplayName(user),
          recipient_id: profile.sent_to_manager_by_id,
          recipient_name: profile.sent_to_manager_by_name,
          subject: 'Manager Resolution - Educational Notes',
          message: `Review the following manager notes from a task you sent to the manager. No further action is needed - this is just educational.\n\nOriginal Task: ${profile.full_name} - ${profile.approval_status}\n\nYour Reason for Escalation:\n${profile.sent_to_manager_reason}\n\nManager Resolution:\n${resolution}`,
          related_entity_type: 'profile',
          related_entity_id: profileId
        });
      }

      await base44.entities.VendorProfile.update(profileId, {
        sent_to_manager_by_id: null,
        sent_to_manager_by_name: null,
        sent_to_manager_reason: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allVendorProfiles']);
      setSelectedTask(null);
      setManagerResolutionDialog({ open: false, profileId: null });
      setManagerResolution('');
      toast.success('Task completed - Original admin has been notified');
    }
  });

  const sendToManagerMutation = useMutation({
    mutationFn: async ({ profileId, reason }) => {
      const profile = allProfiles.find(p => p.id === profileId);
      await base44.entities.VendorProfile.update(profileId, {
        reviewing_admin_id: 'team@twofoldvisuals.com',
        reviewing_admin_name: 'Manager',
        sent_to_manager_by_id: user.email,
        sent_to_manager_by_name: getAdminDisplayName(user),
        sent_to_manager_reason: reason
      });
      await base44.entities.AdminAction.create({
        admin_id: user.email,
        admin_name: getAdminDisplayName(user),
        action_type: 'profile_reviewed',
        target_id: profile.user_id,
        target_name: profile.full_name,
        details: { profile_id: profileId },
        notes: `Sent to manager: ${reason}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allVendorProfiles']);
      setSelectedTask(null);
      setSendToManagerDialog({ open: false, profileId: null });
      setManagerReason('');
      toast.success('Task sent to manager');
    }
  });

  const sendForReviewMutation = useMutation({
    mutationFn: async ({ profileId, notes }) => {
      const profile = allProfiles.find(p => p.id === profileId);
      await base44.entities.VendorProfile.update(profileId, {
        reviewing_admin_id: 'team@twofoldvisuals.com',
        reviewing_admin_name: 'Admin Team'
      });
      
      await base44.entities.AdminAction.create({
        admin_id: user.email,
        admin_name: getAdminDisplayName(user),
        action_type: 'profile_reviewed',
        target_id: profile.user_id,
        target_name: profile.full_name,
        details: { profile_id: profileId },
        notes: notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allVendorProfiles']);
      setSendForReviewDialog({ open: false, profileId: null });
      setReviewNotes('');
      setSelectedTask(null);
      toast.success('Profile sent for admin review');
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (profileId) => {
      const profile = allProfiles.find(p => p.id === profileId);
      await base44.entities.VendorProfile.update(profileId, { 
        approval_status: 'approved',
        rejection_reason: null,
        action_required_notes: null,
        approved_by_id: user.email,
        approved_by_name: getAdminDisplayName(user),
        approved_at: new Date().toISOString(),
        reviewing_admin_id: null,
        reviewing_admin_name: null
      });
      
      // Log admin action
      await base44.entities.AdminAction.create({
        admin_id: user.email,
        admin_name: getAdminDisplayName(user),
        action_type: 'profile_approved',
        target_id: profile.user_id,
        target_name: profile.full_name,
        details: { profile_id: profileId }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allVendorProfiles']);
      toast.success('User approved');
    },
    onError: (error) => {
      console.error('Approve error:', error);
      toast.error('Failed to approve user: ' + error.message);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ profileId, reason }) => {
      const profile = allProfiles.find(p => p.id === profileId);
      await base44.entities.VendorProfile.update(profileId, { 
        approval_status: 'rejected',
        rejection_reason: reason,
        rejected_by_id: user.email,
        rejected_by_name: getAdminDisplayName(user),
        rejected_at: new Date().toISOString(),
        reviewing_admin_id: null,
        reviewing_admin_name: null
      });
      
      // Log admin action
      await base44.entities.AdminAction.create({
        admin_id: user.email,
        admin_name: getAdminDisplayName(user),
        action_type: 'profile_rejected',
        target_id: profile.user_id,
        target_name: profile.full_name,
        details: { profile_id: profileId },
        notes: reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allVendorProfiles']);
      toast.success('User rejected');
    }
  });

  const actionRequiredMutation = useMutation({
    mutationFn: async ({ profileId, notes }) => {
      const profile = allProfiles.find(p => p.id === profileId);
      await base44.entities.VendorProfile.update(profileId, { 
        approval_status: 'action_required',
        action_required_notes: notes,
        reviewing_admin_id: null,
        reviewing_admin_name: null
      });

      // Create verification request
      await base44.entities.ProfileVerification.create({
        profile_id: profileId,
        user_id: profile.user_id,
        admin_id: user.email,
        admin_name: getAdminDisplayName(user),
        request_message: notes,
        status: 'waiting_for_user'
      });
      
      // Notify user
      await base44.entities.Notification.create({
        user_id: profile.user_id,
        type: 'new_message',
        title: 'Additional Information Needed',
        message: 'An admin has requested more information for your profile verification',
        reference_id: profileId
      });
      
      // Log admin action
      await base44.entities.AdminAction.create({
        admin_id: user.email,
        admin_name: getAdminDisplayName(user),
        action_type: 'action_required',
        target_id: profile.user_id,
        target_name: profile.full_name,
        details: { profile_id: profileId },
        notes: notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allVendorProfiles']);
      setSelectedTask(null);
      toast.success('Task completed - User will be notified');
    }
  });

  const assignSupportChatMutation = useMutation({
    mutationFn: async (chatId) => {
      await base44.entities.SupportChat.update(chatId, {
        assigned_admin_id: user.email,
        assigned_admin_name: getAdminDisplayName(user),
        status: 'assigned'
      });
    },
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries(['unassignedSupportChats']);
      navigate(createPageUrl(`SupportChatView?id=${chatId}`));
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId) => {
      // Delete all related data
      const applications = await base44.entities.JobApplication.filter({ help_request_id: postId });
      const agreements = await base44.entities.SubcontractAgreement.filter({ help_request_id: postId });
      const messages = await base44.entities.ChatMessage.filter({ help_request_id: postId });
      const reviews = await base44.entities.Review.filter({ help_request_id: postId });
      const notifications = await base44.entities.Notification.filter({ reference_id: postId });

      // Notify all applicants
      for (const app of applications) {
        await base44.entities.Notification.create({
          user_id: app.applicant_id,
          type: 'new_message',
          title: 'Job Deleted',
          message: 'A job you applied for has been removed by an administrator',
          reference_id: null
        });
      }

      // Delete related records
      for (const app of applications) await base44.entities.JobApplication.delete(app.id);
      for (const agreement of agreements) await base44.entities.SubcontractAgreement.delete(agreement.id);
      for (const message of messages) await base44.entities.ChatMessage.delete(message.id);
      for (const review of reviews) await base44.entities.Review.delete(review.id);
      for (const notification of notifications) await base44.entities.Notification.delete(notification.id);

      // Delete the job itself
      await base44.entities.HelpRequest.delete(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allHelpRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
      queryClient.invalidateQueries({ queryKey: ['helpRequests'] });
      queryClient.invalidateQueries({ queryKey: ['job'] });
      queryClient.invalidateQueries({ queryKey: ['recentJobs'] });
      toast.success('Post and all related data deleted');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete post: ' + error.message);
    }
  });

  const suspendUserMutation = useMutation({
    mutationFn: async ({ profileId, reason, fromRiskReview }) => {
      const profile = allProfiles.find(p => p.id === profileId);
      await base44.entities.VendorProfile.update(profileId, {
        suspended: true,
        suspension_reason: reason,
        approval_status: 'suspended',
        needs_risk_review: false,
        risk_review_admin_id: null,
        risk_review_admin_name: null
      });
      
      await base44.entities.AdminAction.create({
        admin_id: user.email,
        admin_name: getAdminDisplayName(user),
        action_type: 'user_suspended',
        target_id: profile.user_id,
        target_name: profile.full_name,
        details: { 
          profile_id: profileId,
          from_risk_review: fromRiskReview || false
        },
        notes: reason
      });

      await base44.entities.Notification.create({
        user_id: profile.user_id,
        type: 'new_message',
        title: 'Account Suspended',
        message: `Your account has been suspended. Reason: ${reason}`,
        reference_id: profileId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allVendorProfiles']);
      setSelectedTask(null);
      toast.success('User suspended');
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async ({ profileId, reason }) => {
      const profile = allProfiles.find(p => p.id === profileId);
      const userId = profile.user_id;
      
      // Log admin action
      await base44.entities.AdminAction.create({
        admin_id: user.email,
        admin_name: getAdminDisplayName(user),
        action_type: 'user_deleted',
        target_id: userId,
        target_name: profile.full_name,
        details: { profile_id: profileId },
        notes: reason
      });
      
      // Delete ALL user data
      const [
        helpRequests, applications, directMessages, chatMessages, 
        notifications, reviews, supportChats, supportMessages, tickets,
        userSessions, adminMessages, agreements, counterOffers,
        reviewsReceived, messagesReceived
      ] = await Promise.all([
        base44.entities.HelpRequest.filter({ requester_id: userId }),
        base44.entities.JobApplication.filter({ applicant_id: userId }),
        base44.entities.DirectMessage.filter({ sender_id: userId }),
        base44.entities.ChatMessage.filter({ sender_id: userId }),
        base44.entities.Notification.filter({ user_id: userId }),
        base44.entities.Review.filter({ reviewer_id: userId }),
        base44.entities.SupportChat.filter({ user_id: userId }),
        base44.entities.SupportMessage.filter({ sender_id: userId }),
        base44.entities.SupportTicket.filter({ user_id: userId }),
        base44.entities.UserSession.filter({ user_id: userId }),
        base44.entities.AdminMessage.filter({ recipient_id: userId }),
        base44.entities.SubcontractAgreement.list().then(all => all.filter(a => a.requester_id === userId || a.vendor_id === userId)),
        base44.entities.CounterOffer.list().then(all => all.filter(c => c.sender_id === userId)),
        base44.entities.Review.filter({ reviewee_id: userId }),
        base44.entities.DirectMessage.filter({ recipient_id: userId })
      ]);

      // Get applications to their job posts
      const userJobIds = helpRequests.map(r => r.id);
      const applicationsToTheirJobs = await base44.entities.JobApplication.list().then(all => 
        all.filter(a => userJobIds.includes(a.help_request_id))
      );

      // Delete all related records
      await Promise.all([
        ...helpRequests.map(r => base44.entities.HelpRequest.delete(r.id)),
        ...applications.map(a => base44.entities.JobApplication.delete(a.id)),
        ...directMessages.map(m => base44.entities.DirectMessage.delete(m.id)),
        ...chatMessages.map(m => base44.entities.ChatMessage.delete(m.id)),
        ...notifications.map(n => base44.entities.Notification.delete(n.id)),
        ...reviews.map(r => base44.entities.Review.delete(r.id)),
        ...supportChats.map(c => base44.entities.SupportChat.delete(c.id)),
        ...supportMessages.map(m => base44.entities.SupportMessage.delete(m.id)),
        ...tickets.map(t => base44.entities.SupportTicket.delete(t.id)),
        ...userSessions.map(s => base44.entities.UserSession.delete(s.id)),
        ...adminMessages.map(m => base44.entities.AdminMessage.delete(m.id)),
        ...agreements.map(a => base44.entities.SubcontractAgreement.delete(a.id)),
        ...counterOffers.map(c => base44.entities.CounterOffer.delete(c.id)),
        ...reviewsReceived.map(r => base44.entities.Review.delete(r.id)),
        ...messagesReceived.map(m => base44.entities.DirectMessage.delete(m.id)),
        ...applicationsToTheirJobs.map(a => base44.entities.JobApplication.delete(a.id))
      ]);
      
      // Delete vendor profile
      await base44.entities.VendorProfile.delete(profileId);
      
      // Delete the user account itself
      const users = await base44.entities.User.filter({ email: userId });
      if (users.length > 0) {
        await base44.entities.User.delete(users[0].id);
      }
    },
    onSuccess: () => {
      setDeleteDialog({ open: false, profileId: null, profileName: '' });
      setDeleteReason('');
      queryClient.invalidateQueries(['allVendorProfiles']);
      queryClient.invalidateQueries(['allUsers']);
      toast.success('User and all associated data deleted');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete user: ' + error.message);
    }
  });

  const sendInviteMutation = useMutation({
    mutationFn: async (email) => {
      await base44.entities.Invitation.create({
        email: email,
        invited_by: user.email,
        invited_by_name: getAdminDisplayName(user),
        status: 'sent'
      });

      // Open email client
      const inviteLink = 'https://gig-flow-d5add602.base44.app/login?from_url=https%3A%2F%2Fgig-flow-d5add602.base44.app%2F';
      const subject = encodeURIComponent('You\'re invited to join VendorCover!');
      const body = encodeURIComponent(`Hi there!\n\nYou've been invited to join VendorCover - the platform connecting wedding and event vendors for last-minute coverage and support.\n\nClick on the VendorCover app link below to sign up and create your profile:\n${inviteLink}\n\nOnce you sign up, you'll be able to:\n• Find last-minute coverage opportunities\n• Post requests when you need help\n• Connect with other professional vendors\n• Build your reputation through reviews\n\nWelcome to the VendorCover community!\n\nBest regards,\nThe VendorCover Team`);

      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;

      return email;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['invitations']);
      toast.success('Email client opened! Invitation tracked.');
      setInviteDialog(false);
      setInviteEmail('');
    },
    onError: () => {
      toast.error('Failed to track invite');
    }
  });

  const makeAdminMutation = useMutation({
    mutationFn: async (userEmail) => {
      // Only team@twofoldvisuals.com can manage admin access
      if (user?.email !== 'team@twofoldvisuals.com') {
        throw new Error('Unauthorized');
      }
      // Update user role using the User entity
      const users = await base44.entities.User.filter({ email: userEmail });
      if (users.length > 0) {
        await base44.entities.User.update(users[0].id, { role: 'admin' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allVendorProfiles']);
      toast.success('User promoted to admin');
    },
    onError: () => {
      toast.error('You do not have permission to manage admin access');
    }
  });

  const removeAdminMutation = useMutation({
    mutationFn: async (userEmail) => {
      // Only team@twofoldvisuals.com can manage admin access
      if (user?.email !== 'team@twofoldvisuals.com') {
        throw new Error('Unauthorized');
      }
      // Update user role back to 'user'
      const users = await base44.entities.User.filter({ email: userEmail });
      if (users.length > 0) {
        await base44.entities.User.update(users[0].id, { role: 'user' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allVendorProfiles']);
      toast.success('Admin access removed');
    },
    onError: () => {
      toast.error('You do not have permission to manage admin access');
    }
  });

  if (!vendorProfile) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-stone-200">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-stone-400" />
            </div>
            <h2 className="text-xl font-semibold text-stone-900 mb-2 text-center">Welcome to VendorCover</h2>
            <p className="text-stone-600 mb-6 text-center">
              Complete these steps to get started:
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-stone-50 rounded-lg">
                <div className="w-8 h-8 bg-stone-900 text-white rounded-full flex items-center justify-center shrink-0 font-semibold">1</div>
                <div>
                  <h3 className="font-medium text-stone-900">Create your profile</h3>
                  <p className="text-sm text-stone-600">Add your contact info and business details</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-stone-50 rounded-lg">
                <div className="w-8 h-8 bg-stone-300 text-stone-600 rounded-full flex items-center justify-center shrink-0 font-semibold">2</div>
                <div>
                  <h3 className="font-medium text-stone-900">Select your services</h3>
                  <p className="text-sm text-stone-600">Choose the services you offer (can select multiple)</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-stone-50 rounded-lg">
                <div className="w-8 h-8 bg-stone-300 text-stone-600 rounded-full flex items-center justify-center shrink-0 font-semibold">3</div>
                <div>
                  <h3 className="font-medium text-stone-900">Upload examples of your work</h3>
                  <p className="text-sm text-stone-600">Add portfolio images to showcase your skills</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-stone-50 rounded-lg">
                <div className="w-8 h-8 bg-stone-300 text-stone-600 rounded-full flex items-center justify-center shrink-0 font-semibold">4</div>
                <div>
                  <h3 className="font-medium text-stone-900">Wait for admin approval</h3>
                  <p className="text-sm text-stone-600">We'll review your profile and notify you when approved</p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (window.deferredPrompt) {
                    window.deferredPrompt.prompt();
                    window.deferredPrompt.userChoice.then(() => {
                      window.deferredPrompt = null;
                    });
                  } else {
                    alert('To install this app:\n\niPhone/iPad: Tap the Share button and select "Add to Home Screen"\n\nAndroid: Tap the menu (3 dots) and select "Add to Home Screen" or "Install App"');
                  }
                }}
                className="w-full mt-3 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                📱 Install VendorCover on your device
              </button>
            </div>

            <Button asChild className="bg-stone-900 hover:bg-stone-800 w-full mt-6">
              <Link to={createPageUrl('Profile')}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Start Setup
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (vendorProfile.approval_status === 'pending' || vendorProfile.approval_status === 'action_required' || vendorProfile.approval_status === 'user_submitted_info') {
    const hasServices = vendorProfile.service_types?.length > 0;
    const hasPortfolio = vendorProfile.portfolio_items?.length > 0;
    const hasBasicInfo = vendorProfile.full_name && vendorProfile.city && vendorProfile.state;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">{vendorProfile.approval_status === 'user_submitted_info' ? '📤' : vendorProfile.approval_status === 'action_required' ? '📋' : '⏳'}</span>
            </div>
            <h2 className="text-xl font-semibold text-amber-900 mb-2 text-center">
              {vendorProfile.approval_status === 'user_submitted_info' 
                ? 'Additional Information Submitted'
                : vendorProfile.approval_status === 'action_required' 
                  ? 'Admin Needs More Information' 
                  : 'Your account is pending admin approval'}
            </h2>
            <p className="text-amber-700 mb-6 text-center">
              {vendorProfile.approval_status === 'user_submitted_info'
                ? 'Your additional information has been submitted. Profile pending admin review.'
                : vendorProfile.approval_status === 'action_required'
                  ? 'An admin has requested additional information from you.'
                  : 'You can explore the app, but you cannot apply or post jobs until approved.'}
            </p>

            {vendorProfile.action_required_notes && (
              <div className="bg-white rounded-lg border border-amber-200 p-4 mb-6">
                <p className="text-sm font-medium text-amber-900 mb-2">Admin Request:</p>
                <p className="text-sm text-amber-800 whitespace-pre-wrap">{vendorProfile.action_required_notes}</p>
              </div>
            )}
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                {hasBasicInfo ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <div className="w-5 h-5 border-2 border-stone-300 rounded-full shrink-0" />
                )}
                <span className={hasBasicInfo ? 'text-stone-900' : 'text-stone-600'}>Profile information complete</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                {hasServices ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <div className="w-5 h-5 border-2 border-stone-300 rounded-full shrink-0" />
                )}
                <span className={hasServices ? 'text-stone-900' : 'text-stone-600'}>Services selected</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-stone-900">Portfolio link added</span>
              </div>
            </div>

            {vendorProfile.approval_status === 'action_required' && (
              <Button asChild className="w-full bg-stone-900 hover:bg-stone-800">
                <Link to={createPageUrl('VerificationRequest')}>
                  <Send className="w-4 h-4 mr-2" />
                  Respond to Admin
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (vendorProfile.approval_status === 'rejected') {
    return (
      <div className="max-w-2xl mx-auto w-full px-2 sm:px-0">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-xl font-semibold text-red-900 mb-2">Profile Rejected</h2>
            <p className="text-red-700 mb-2">
              {vendorProfile.rejection_reason || 'Your profile was rejected.'}
            </p>
            <p className="text-red-600 text-sm mb-6">
              Please update your profile and resubmit for review.
            </p>
            <Button asChild className="bg-stone-900 hover:bg-stone-800">
              <Link to={createPageUrl('Profile')}>
                Update Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin section (ONLY show for real admins, not when simulating)
  if (user?.role === 'admin' && !user?._isSimulated) {
    const pendingProfiles = (allProfiles || []).filter(p => 
      p.approval_status === 'pending' && 
      !p.suspended && 
      !p.reviewing_admin_id &&
      !p.needs_risk_review // Don't show pending profiles that are in risk review queue
    );
    const actionRequiredProfiles = (allProfiles || []).filter(p => p.approval_status === 'action_required' && !p.suspended);
    const rejectedProfiles = (allProfiles || []).filter(p => p.approval_status === 'rejected' && !p.suspended);
    const approvedProfiles = (allProfiles || []).filter(p => p.approval_status === 'approved' && !p.suspended);
    const userSubmittedInfoProfiles = (allProfiles || []).filter(p => p.approval_status === 'user_submitted_info' && !p.suspended && !p.reviewing_admin_id);
    const riskReviewProfiles = (allProfiles || []).filter(p => 
      p.needs_risk_review && 
      !p.risk_review_admin_id && 
      !p.suspended
      // Show for ALL profiles (pending, approved, etc) - risk review is separate from approval
    );
    
    // Filter profiles by search query
    const filterProfiles = (profiles) => {
      if (!searchQuery.trim()) return profiles;
      const query = searchQuery.toLowerCase();
      return profiles.filter(p => 
        p.full_name?.toLowerCase().includes(query) ||
        p.business_name?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query) ||
        p.city?.toLowerCase().includes(query) ||
        p.state?.toLowerCase().includes(query)
      );
    };
    
    const filteredPendingProfiles = filterProfiles(pendingProfiles);
    const filteredActionRequiredProfiles = filterProfiles(actionRequiredProfiles);
    const filteredRejectedProfiles = filterProfiles(rejectedProfiles);
    const filteredSuspendedProfiles = filterProfiles(suspendedProfiles);
    const filteredPendingAppeals = filterProfiles(pendingAppeals);
    const filteredRiskReviewProfiles = filterProfiles(riskReviewProfiles);
    const filteredAllProfiles = filterProfiles(allProfiles);

    return (
      <div className="space-y-8 w-full max-w-full overflow-x-hidden">
        {/* Admin Header */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Admin Dashboard</h1>
              <p className="text-stone-600 dark:text-stone-400 mt-1">Manage users and platform settings</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={async () => {
                if (!window.confirm('Run AI risk assessments for all profiles without one? This may take a few minutes.')) return;
                try {
                  const { data } = await base44.functions.invoke('runBulkAssessments');
                  toast.success(`Started assessments for ${data.results.started.length} profiles`);
                } catch (error) {
                  toast.error('Failed to start bulk assessments');
                }
              }}
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Shield className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Run Bulk AI Assessments</span>
              <span className="sm:hidden">Bulk AI</span>
            </Button>
            <Button
              onClick={() => navigate(createPageUrl('Invitations'))}
              variant="outline"
            >
              <span className="hidden sm:inline">View Invitations</span>
              <span className="sm:hidden">Invitations</span>
            </Button>
            <Button
              onClick={() => setInviteDialog(true)}
              className="bg-stone-900 hover:bg-stone-800"
            >
              <Mail className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Invite User</span>
              <span className="sm:hidden">Invite</span>
            </Button>
          </div>
        </div>

        {/* Assigned to Me */}
        {(myAssignedProfiles.length > 0 || myAssignedSupportChats.length > 0) && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Assigned to Me
              </CardTitle>
              <p className="text-sm text-blue-700">Tasks currently assigned to you</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {myAssignedProfiles.length > 0 && (
                  <Card 
                    className="border-blue-300 bg-white hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setTodoModal({ open: true, type: 'my_assigned' })}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <User className="w-8 h-8 text-blue-600" />
                        <Badge className="bg-blue-600 text-white">{myAssignedProfiles.length}</Badge>
                      </div>
                      <h3 className="font-semibold text-blue-900">Profile Reviews</h3>
                      <p className="text-xs text-blue-700 mt-1">Profiles you're reviewing</p>
                    </CardContent>
                  </Card>
                )}
                {myAssignedSupportChats.length > 0 && (
                  <Card 
                    className="border-blue-300 bg-white hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setTodoModal({ open: true, type: 'my_support_chats' })}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <MessageSquare className="w-8 h-8 text-blue-600" />
                        <Badge className="bg-blue-600 text-white">{myAssignedSupportChats.length}</Badge>
                      </div>
                      <h3 className="font-semibold text-blue-900">My Support Chats</h3>
                      <p className="text-xs text-blue-700 mt-1">Active chats assigned to you</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Unassigned Tasks */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Unassigned Tasks
            </CardTitle>
            <p className="text-sm text-stone-500">Click on any item to assign yourself and start working</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Pending Approvals */}
              {pendingProfiles.length > 0 && (
                <Card 
                  className="border-amber-200 bg-amber-50 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setTodoModal({ open: true, type: 'pending' })}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <Clock className="w-8 h-8 text-amber-600" />
                      <Badge className="bg-amber-600 text-white">{pendingProfiles.length}</Badge>
                    </div>
                    <h3 className="font-semibold text-amber-900">Pending Approvals</h3>
                    <p className="text-xs text-amber-700 mt-1">Review new profiles</p>
                  </CardContent>
                </Card>
              )}

              {/* User Submitted Info */}
              {userSubmittedInfoProfiles.length > 0 && (
                <Card 
                  className="border-green-200 bg-green-50 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setTodoModal({ open: true, type: 'user_submitted_info' })}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                      <Badge className="bg-green-600 text-white">{userSubmittedInfoProfiles.length}</Badge>
                    </div>
                    <h3 className="font-semibold text-green-900">Info Submitted</h3>
                    <p className="text-xs text-green-700 mt-1">Users responded</p>
                  </CardContent>
                </Card>
              )}

              {/* Rejection Appeals */}
              {rejectionAppeals.length > 0 && (
                <Card 
                  className="border-purple-200 bg-purple-50 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setTodoModal({ open: true, type: 'rejection_appeals' })}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <MessageSquare className="w-8 h-8 text-purple-600" />
                      <Badge className="bg-purple-600 text-white">{rejectionAppeals.length}</Badge>
                    </div>
                    <h3 className="font-semibold text-purple-900">Rejection Appeals</h3>
                    <p className="text-xs text-purple-700 mt-1">Users appealing rejection</p>
                  </CardContent>
                </Card>
              )}

              {/* Suspension Appeals */}
              {pendingAppeals.length > 0 && (
                <Card 
                  className="border-purple-200 bg-purple-50 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setTodoModal({ open: true, type: 'appeals' })}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <Shield className="w-8 h-8 text-purple-600" />
                      <Badge className="bg-purple-600 text-white">{pendingAppeals.length}</Badge>
                    </div>
                    <h3 className="font-semibold text-purple-900">Pending Appeals</h3>
                    <p className="text-xs text-purple-700 mt-1">Review suspension appeals</p>
                  </CardContent>
                </Card>
              )}

              {/* Risk Assessment Reviews */}
              {riskReviewProfiles.length > 0 && (
                <Card 
                  className="border-orange-200 bg-orange-50 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setTodoModal({ open: true, type: 'risk_reviews' })}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <Shield className="w-8 h-8 text-orange-600" />
                      <Badge className="bg-orange-600 text-white">{riskReviewProfiles.length}</Badge>
                    </div>
                    <h3 className="font-semibold text-orange-900">Risk Reviews</h3>
                    <p className="text-xs text-orange-700 mt-1">AI flagged profiles</p>
                  </CardContent>
                </Card>
              )}

              {/* Unassigned Support Chats */}
              {unassignedSupportChats.length > 0 && (
                <Card 
                  className="border-emerald-200 bg-emerald-50 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setTodoModal({ open: true, type: 'support_chats' })}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <MessageSquare className="w-8 h-8 text-emerald-600" />
                      <Badge className="bg-emerald-600 text-white">{unassignedSupportChats.length}</Badge>
                    </div>
                    <h3 className="font-semibold text-emerald-900">Support Chats</h3>
                    <p className="text-xs text-emerald-700 mt-1">Unassigned support requests</p>
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {pendingProfiles.length === 0 && userSubmittedInfoProfiles.length === 0 && rejectionAppeals.length === 0 && pendingAppeals.length === 0 && riskReviewProfiles.length === 0 && unassignedSupportChats.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-stone-900 mb-1">All caught up!</h3>
                  <p className="text-sm text-stone-500">No pending tasks at the moment</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tasks Assigned to Admins */}
        {(() => {
          const assignedToOthers = (allProfiles || []).filter(p => 
            (p.reviewing_admin_id &&
             (p.approval_status === 'pending' || 
              p.approval_status === 'user_submitted_info' || 
              (p.approval_status === 'rejected' && p.appeal_status === 'pending') ||
              (p.suspended && p.appeal_status === 'pending'))) ||
            (p.needs_risk_review && p.risk_review_admin_id) // Risk review tasks assigned to admins
          );

          return assignedToOthers.length > 0 ? (
            <AssignedTasksDropdown 
              assignedProfiles={assignedToOthers}
              onTaskClick={setSelectedTask}
            />
          ) : null;
        })()}

        {/* Completed Tasks */}
        <CompletedTasksDropdown adminActions={adminActions} />

        {/* Stats Overview */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <OnlineUsers onClick={() => setOnlineUsersDialog(true)} />
              <div 
                onClick={() => setTodoModal({ open: true, type: 'all_users' })}
                className="text-center p-4 bg-stone-50 rounded-lg hover:bg-stone-100 cursor-pointer transition-colors"
              >
                <p className="text-2xl font-bold text-stone-900">{allProfiles.length}</p>
                <p className="text-sm text-stone-500 mt-1">Total Users</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-900">{pendingProfiles.length}</p>
                <p className="text-sm text-amber-700 mt-1">Pending Users</p>
              </div>
              <div 
                onClick={() => setTodoModal({ open: true, type: 'approved' })}
                className="text-center p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 cursor-pointer transition-colors"
              >
                <p className="text-2xl font-bold text-emerald-900">{approvedProfiles.length}</p>
                <p className="text-sm text-emerald-700 mt-1">Approved</p>
              </div>
              <div 
                onClick={() => setTodoModal({ open: true, type: 'rejected' })}
                className="text-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 cursor-pointer transition-colors"
              >
                <p className="text-2xl font-bold text-orange-900">{rejectedProfiles.length}</p>
                <p className="text-sm text-orange-700 mt-1">Rejected</p>
              </div>
              <div 
                onClick={() => setTodoModal({ open: true, type: 'suspended' })}
                className="text-center p-4 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer transition-colors"
              >
                <p className="text-2xl font-bold text-red-900">{suspendedProfiles.length}</p>
                <p className="text-sm text-red-700 mt-1">Suspended</p>
              </div>
              <div className="text-center p-4 bg-violet-50 rounded-lg">
                <p className="text-2xl font-bold text-violet-900">{allRequests.length}</p>
                <p className="text-sm text-violet-700 mt-1">Total Jobs</p>
              </div>
              <div 
                onClick={() => setTodoModal({ open: true, type: 'open_jobs' })}
                className="text-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors"
              >
                <p className="text-2xl font-bold text-blue-900">{allRequests.filter(r => r.status === 'open').length}</p>
                <p className="text-sm text-blue-700 mt-1">Open Jobs</p>
              </div>
              <div 
                onClick={() => setTodoModal({ open: true, type: 'completed_jobs' })}
                className="text-center p-4 bg-green-50 rounded-lg hover:bg-green-100 cursor-pointer transition-colors"
              >
                <p className="text-2xl font-bold text-green-900">{allRequests.filter(r => r.status === 'completed').length}</p>
                <p className="text-sm text-green-700 mt-1">Completed Jobs</p>
              </div>
              <div 
                onClick={() => setTodoModal({ open: true, type: 'cancelled_jobs' })}
                className="text-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 cursor-pointer transition-colors"
              >
                <p className="text-2xl font-bold text-orange-900">{allRequests.filter(r => r.status === 'cancelled').length}</p>
                <p className="text-sm text-orange-700 mt-1">Cancelled Jobs</p>
              </div>
              <div 
                onClick={() => {
                  const totalTasks = pendingProfiles.length + userSubmittedInfoProfiles.length + rejectionAppeals.length + pendingAppeals.length + unassignedSupportChats.length;
                  if (totalTasks > 0) {
                    setTodoModal({ open: true, type: 'all_tasks' });
                  }
                }}
                className="text-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 cursor-pointer transition-colors"
              >
                <p className="text-2xl font-bold text-indigo-900">{pendingProfiles.length + userSubmittedInfoProfiles.length + rejectionAppeals.length + pendingAppeals.length + riskReviewProfiles.length + unassignedSupportChats.length}</p>
                <p className="text-sm text-indigo-700 mt-1">Total Open Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* To-Do Modal */}
        <Dialog open={todoModal.open} onOpenChange={(open) => setTodoModal({ open, type: null })}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>
                  {todoModal.type === 'pending' && 'Pending Approvals'}
                  {todoModal.type === 'user_submitted_info' && 'Users Submitted Info'}
                  {todoModal.type === 'action_required' && 'Action Required'}
                  {todoModal.type === 'rejection_appeals' && 'Rejection Appeals'}
                  {todoModal.type === 'appeals' && 'Suspension Appeals'}
                  {todoModal.type === 'risk_reviews' && 'AI Risk Assessment Reviews'}
                  {todoModal.type === 'support_chats' && 'Support Chats'}
                  {todoModal.type === 'my_assigned' && 'My Assigned Profiles'}
                  {todoModal.type === 'my_support_chats' && 'My Support Chats'}
                  {todoModal.type === 'all_users' && 'All Users'}
                  {todoModal.type === 'approved' && 'Approved Users'}
                  {todoModal.type === 'rejected' && 'Rejected Users'}
                  {todoModal.type === 'suspended' && 'Suspended Users'}
                  {todoModal.type === 'jobs' && 'All Jobs'}
                  {todoModal.type === 'open_jobs' && 'Open Jobs'}
                  {todoModal.type === 'completed_jobs' && 'Completed Jobs'}
                  {todoModal.type === 'cancelled_jobs' && 'Cancelled Jobs'}
                  {todoModal.type === 'all_tasks' && 'All Open Tasks'}
                </DialogTitle>
                <DialogDescription>
                  {(todoModal.type === 'pending' || todoModal.type === 'action_required' || todoModal.type === 'appeals' || todoModal.type === 'support_chats' || todoModal.type === 'risk_reviews') && 'Click to assign yourself and work on these items'}
                  {(todoModal.type === 'my_assigned' || todoModal.type === 'my_support_chats') && 'Tasks assigned to you'}
                  {(todoModal.type === 'all_users' || todoModal.type === 'approved' || todoModal.type === 'suspended') && 'View and manage users'}
                  {(todoModal.type === 'jobs' || todoModal.type === 'open_jobs' || todoModal.type === 'completed_jobs' || todoModal.type === 'cancelled_jobs') && 'View job posts'}
                  {todoModal.type === 'all_tasks' && 'All pending tasks across the platform'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {todoModal.type === 'pending' && !selectedTask && pendingProfiles.map((profile) => (
                <Card 
                  key={profile.id} 
                  className="border-stone-200 hover:border-amber-300 cursor-pointer transition-colors"
                  onClick={() => setSelectedTask({ type: 'pending', profile })}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
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
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-stone-900">{profile.full_name}</h3>
                            <Badge className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
                          </div>
                          {profile.business_name && (
                            <p className="text-sm text-stone-600 mb-2">{profile.business_name}</p>
                          )}
                          {profile.bio && (
                            <p className="text-sm text-stone-600 mb-3 line-clamp-2">{profile.bio}</p>
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
                          </div>
                          <p className="text-xs text-stone-500">
                            {profile.city}, {profile.state} • {profile.email}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          assignToMeMutation.mutate({ profileId: profile.id });
                        }}
                      >
                        Assign to Me
                      </Button>
                      </div>
                      </CardContent>
                      </Card>
                      ))}

                      {todoModal.type === 'pending' && selectedTask && selectedTask.type === 'pending' && (
                <div className="space-y-4">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to List
                  </Button>
                  <Card className="border-amber-200 bg-amber-50">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Profile Review: {selectedTask.profile.full_name}</span>
                        <Badge className="bg-amber-600 text-white">Pending Approval</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4 bg-white rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><span className="font-medium text-stone-500">Name:</span> {selectedTask.profile.full_name}</div>
                          <div><span className="font-medium text-stone-500">Business:</span> {selectedTask.profile.business_name}</div>
                          <div><span className="font-medium text-stone-500">Phone:</span> {selectedTask.profile.phone}</div>
                          <div><span className="font-medium text-stone-500">Email:</span> {selectedTask.profile.email}</div>
                          <div className="col-span-2"><span className="font-medium text-stone-500">Services:</span> {selectedTask.profile.service_types?.map(s => serviceConfig[s]?.label).join(', ')}</div>
                          <div className="col-span-2"><span className="font-medium text-stone-500">Location:</span> {selectedTask.profile.city}, {selectedTask.profile.state}</div>
                          <div className="col-span-2"><span className="font-medium text-stone-500">Experience:</span> {selectedTask.profile.experience_years} years</div>
                          {selectedTask.profile.bio && (
                            <div className="col-span-2"><span className="font-medium text-stone-500">Bio:</span> {selectedTask.profile.bio}</div>
                          )}
                          {selectedTask.profile.portfolio_links?.length > 0 && (
                            <div className="col-span-2">
                              <span className="font-medium text-stone-500">Portfolio:</span>
                              <div className="mt-1 space-y-1">
                                {selectedTask.profile.portfolio_links.map((link, idx) => (
                                  <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-600 hover:underline break-all">
                                    {link}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Photos Section */}
                        <div>
                          <span className="font-medium text-stone-500 text-sm block mb-2">Photos:</span>
                          <div className="flex gap-4">
                            {selectedTask.profile.selfie_url && (
                              <div>
                                <p className="text-xs text-stone-500 mb-1">Profile Photo</p>
                                <img src={selectedTask.profile.selfie_url} alt="Profile" className="w-24 h-24 rounded-lg object-cover border-2 border-stone-200" />
                              </div>
                            )}
                            {selectedTask.profile.business_logo_url && (
                              <div>
                                <p className="text-xs text-stone-500 mb-1">Business Logo</p>
                                <img src={selectedTask.profile.business_logo_url} alt="Logo" className="w-24 h-24 rounded-lg object-cover border-2 border-stone-200" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Documents Section */}
                        {(selectedTask.profile.insurance_url || selectedTask.profile.credentials_url) && (
                          <div>
                            <span className="font-medium text-stone-500 text-sm block mb-2">Documents:</span>
                            <div className="space-y-2">
                              {selectedTask.profile.insurance_url && (
                                <a 
                                  href={selectedTask.profile.insurance_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                >
                                  <FileText className="w-4 h-4" />
                                  Insurance Certificate
                                </a>
                              )}
                              {selectedTask.profile.credentials_url && (
                                <a 
                                  href={selectedTask.profile.credentials_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                >
                                  <FileText className="w-4 h-4" />
                                  Credentials/Certifications
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 pt-4 border-t">
                       <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            onClick={() => {
                              approveMutation.mutate(selectedTask.profile.id);
                              setSelectedTask(null);
                            }}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                            disabled={approveMutation.isLoading}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve Profile
                          </Button>
                          <Button
                            onClick={() => {
                              setActionRequiredDialog({ open: true, profileId: selectedTask.profile.id });
                            }}
                            className="flex-1 bg-amber-600 hover:bg-amber-700"
                          >
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Request More Info
                          </Button>
                          <Button
                            onClick={() => {
                              setRejectDialog({ open: true, profileId: selectedTask.profile.id });
                            }}
                            variant="outline"
                            className="flex-1 text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Decline
                          </Button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            onClick={() => unassignTaskMutation.mutate({ profileId: selectedTask.profile.id })}
                            variant="outline"
                            className="flex-1"
                          >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Unassign Task
                          </Button>
                          <Button
                            onClick={() => setSendToManagerDialog({ open: true, profileId: selectedTask.profile.id })}
                            variant="outline"
                            className="flex-1"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Send to Manager
                          </Button>
                        </div>
                        {selectedTask.profile.ai_risk_assessment && (
                          <Button
                            onClick={() => setAiAssessmentModal({ open: true, assessment: selectedTask.profile.ai_risk_assessment })}
                            variant="outline"
                            className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            View Full AI Risk Assessment
                          </Button>
                        )}
                        {selectedTask.profile.ai_assessment_status === 'in_progress' && (
                          <div className="w-full bg-blue-50 rounded-lg p-3 border border-blue-200 text-center">
                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-xs text-blue-700">AI analysis in progress...</p>
                          </div>
                        )}
                        {selectedTask.profile.ai_assessment_status === 'failed' && (
                          <div className="w-full bg-amber-50 rounded-lg p-3 border border-amber-200 text-center">
                            <AlertCircle className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                            <p className="text-xs text-amber-700">AI analysis failed - manual review needed</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

            {todoModal.type === 'user_submitted_info' && !selectedTask && userSubmittedInfoProfiles.map((profile) => (
              <Card 
                key={profile.id} 
                className="border-green-200 bg-green-50 hover:border-green-300 cursor-pointer transition-colors"
                onClick={() => setSelectedTask({ type: 'user_submitted_info', profile })}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        {profile.selfie_url ? (
                          <img src={profile.selfie_url} alt={profile.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <AvatarFallback className="bg-green-100 text-green-700">
                            {profile.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-green-900">{profile.full_name}</h3>
                          <Badge className="bg-green-100 text-green-800 border-green-300">Info Submitted</Badge>
                        </div>
                        {profile.business_name && (
                          <p className="text-sm text-green-700 mb-2">{profile.business_name}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {profile.service_types?.map(type => (
                            <ServiceBadge key={type} type={type} size="sm" />
                          ))}
                        </div>
                        <p className="text-xs text-green-600">
                          {profile.city}, {profile.state} • {profile.email}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        assignToMeMutation.mutate({ profileId: profile.id });
                        setSelectedTask({ type: 'user_submitted_info', profile });
                      }}
                    >
                      Assign to Me
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {todoModal.type === 'user_submitted_info' && selectedTask && selectedTask.type === 'user_submitted_info' && (() => {
              const VerificationDisplay = () => {
                const { data: verification, isLoading } = useQuery({
                  queryKey: ['verification', selectedTask.profile.id],
                  queryFn: async () => {
                    const requests = await base44.entities.ProfileVerification.filter({ 
                      profile_id: selectedTask.profile.id,
                      status: 'user_responded'
                    }, '-created_date');
                    return requests[0] || null;
                  }
                });

                if (isLoading) {
                  return <div className="text-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-stone-800 mx-auto"></div></div>;
                }

                return (
                  <div className="space-y-4">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to List
                    </Button>
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>User Submitted Information: {selectedTask.profile.full_name}</span>
                          <Badge className="bg-green-600 text-white">Info Submitted</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* User's Submitted Response */}
                        {verification && (
                          <div className="bg-white rounded-lg p-4 border-2 border-green-300">
                            <h4 className="font-semibold text-green-900 mb-2">User's Response:</h4>
                            <p className="text-sm text-stone-700 whitespace-pre-wrap mb-3">{verification.user_response}</p>
                            
                            {verification.user_files && verification.user_files.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-stone-600 mb-2">Uploaded Files:</p>
                                <div className="space-y-2">
                                  {verification.user_files.map((file, idx) => (
                                    <a 
                                      key={idx}
                                      href={file.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline bg-stone-50 p-2 rounded"
                                    >
                                      <FileText className="w-4 h-4" />
                                      {file.name}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            <p className="text-xs text-stone-500 mt-3">
                              Submitted: {verification.updated_date && formatTimestamp(verification.updated_date)}
                            </p>
                          </div>
                        )}

                        {/* Full Profile Toggle */}
                        <Button 
                          variant="outline" 
                          onClick={() => setShowFullProfile(!showFullProfile)}
                          className="w-full"
                        >
                          {showFullProfile ? 'Hide' : 'View'} Full Profile Details
                        </Button>

                        {/* Full Profile Details (Collapsible) */}
                        {showFullProfile && (
                          <div className="space-y-4 bg-white rounded-lg p-4 border border-stone-200">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div><span className="font-medium text-stone-500">Name:</span> {selectedTask.profile.full_name}</div>
                              <div><span className="font-medium text-stone-500">Business:</span> {selectedTask.profile.business_name}</div>
                              <div><span className="font-medium text-stone-500">Phone:</span> {selectedTask.profile.phone}</div>
                              <div><span className="font-medium text-stone-500">Email:</span> {selectedTask.profile.email}</div>
                              <div className="col-span-2"><span className="font-medium text-stone-500">Services:</span> {selectedTask.profile.service_types?.map(s => serviceConfig[s]?.label).join(', ')}</div>
                              <div className="col-span-2"><span className="font-medium text-stone-500">Location:</span> {selectedTask.profile.city}, {selectedTask.profile.state}</div>
                              <div className="col-span-2"><span className="font-medium text-stone-500">Experience:</span> {selectedTask.profile.experience_years} years</div>
                              {selectedTask.profile.bio && (
                                <div className="col-span-2"><span className="font-medium text-stone-500">Bio:</span> {selectedTask.profile.bio}</div>
                              )}
                              {selectedTask.profile.portfolio_links?.length > 0 && (
                                <div className="col-span-2">
                                  <span className="font-medium text-stone-500">Portfolio:</span>
                                  <div className="mt-1 space-y-1">
                                    {selectedTask.profile.portfolio_links.map((link, idx) => (
                                      <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-600 hover:underline break-all">
                                        {link}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div>
                              <span className="font-medium text-stone-500 text-sm block mb-2">Photos:</span>
                              <div className="flex gap-4">
                                {selectedTask.profile.selfie_url && (
                                  <div>
                                    <p className="text-xs text-stone-500 mb-1">Profile Photo</p>
                                    <img src={selectedTask.profile.selfie_url} alt="Profile" className="w-24 h-24 rounded-lg object-cover border-2 border-stone-200" />
                                  </div>
                                )}
                                {selectedTask.profile.business_logo_url && (
                                  <div>
                                    <p className="text-xs text-stone-500 mb-1">Business Logo</p>
                                    <img src={selectedTask.profile.business_logo_url} alt="Logo" className="w-24 h-24 rounded-lg object-cover border-2 border-stone-200" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {(selectedTask.profile.insurance_url || selectedTask.profile.credentials_url) && (
                              <div>
                                <span className="font-medium text-stone-500 text-sm block mb-2">Documents:</span>
                                <div className="space-y-2">
                                  {selectedTask.profile.insurance_url && (
                                    <a 
                                      href={selectedTask.profile.insurance_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                    >
                                      <FileText className="w-4 h-4" />
                                      Insurance Certificate
                                    </a>
                                  )}
                                  {selectedTask.profile.credentials_url && (
                                    <a 
                                      href={selectedTask.profile.credentials_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                    >
                                      <FileText className="w-4 h-4" />
                                      Credentials/Certifications
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-2 pt-4 border-t">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                approveMutation.mutate(selectedTask.profile.id);
                                setSelectedTask(null);
                                setShowFullProfile(false);
                              }}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                              disabled={approveMutation.isLoading}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Approve Profile
                            </Button>
                            <Button
                              onClick={() => {
                                setActionRequiredDialog({ open: true, profileId: selectedTask.profile.id });
                              }}
                              className="flex-1 bg-amber-600 hover:bg-amber-700"
                            >
                              <AlertCircle className="w-4 h-4 mr-2" />
                              Request More Info
                            </Button>
                            <Button
                              onClick={() => {
                                setRejectDialog({ open: true, profileId: selectedTask.profile.id });
                              }}
                              variant="outline"
                              className="flex-1 text-red-600 hover:text-red-700"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Decline
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => unassignTaskMutation.mutate({ profileId: selectedTask.profile.id })}
                              variant="outline"
                              className="flex-1"
                            >
                              <ArrowLeft className="w-4 h-4 mr-2" />
                              Unassign Task
                            </Button>
                            <Button
                              onClick={() => sendToManagerMutation.mutate({ profileId: selectedTask.profile.id })}
                              variant="outline"
                              className="flex-1"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Send to Manager
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              };

              return <VerificationDisplay />;
            })()}

            {todoModal.type === 'action_required' && actionRequiredProfiles.map((profile) => (
              <Card 
                key={profile.id} 
                className="border-orange-200 bg-orange-50 hover:border-orange-300 cursor-pointer transition-colors"
                onClick={() => {
                  assignToMeMutation.mutate({ profileId: profile.id });
                  setTodoModal({ open: false, type: null });
                  navigate(createPageUrl(`UserEdit?id=${profile.user_id}`));
                }}
              >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar className="h-12 w-12">
                          {profile.selfie_url ? (
                            <img src={profile.selfie_url} alt={profile.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <AvatarFallback className="bg-orange-100 text-orange-700">
                              {profile.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-orange-900">{profile.full_name}</h3>
                            <Badge className="bg-orange-100 text-orange-800 border-orange-300">Action Required</Badge>
                          </div>
                          {profile.business_name && (
                            <p className="text-sm text-orange-700 mb-2">{profile.business_name}</p>
                          )}
                          {profile.action_required_notes && (
                            <div className="bg-white rounded-lg p-3 mb-2 border border-orange-200">
                              <p className="text-xs font-medium text-orange-900 mb-1">Action Required:</p>
                              <p className="text-sm text-orange-800">{profile.action_required_notes}</p>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 mb-2">
                            {profile.service_types?.map(type => (
                              <ServiceBadge key={type} type={type} size="sm" />
                            ))}
                          </div>
                          <p className="text-xs text-orange-600">
                            {profile.city}, {profile.state} • {profile.email}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Actions
                            <MoreVertical className="w-4 h-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              approveMutation.mutate(profile.id);
                            }}
                            disabled={approveMutation.isLoading}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              setRejectDialog({ open: true, profileId: profile.id });
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-2 text-red-600" />
                            Reject
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {todoModal.type === 'all_users' && allProfiles.map((profile) => {
              const profileUser = allUsers.find(u => u.email === profile.user_id);
              const isAdmin = profileUser?.role === 'admin';
              const canManageThisUser = user?.email === 'team@twofoldvisuals.com' || !isAdmin;
              return (
                <Card key={profile.id} className="border-stone-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
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
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-stone-900">{profile.full_name}</h3>
                            {profile.user_id === 'team@twofoldvisuals.com' && (
                              <Badge className="bg-purple-50 text-purple-700 border-purple-200">Account Owner</Badge>
                            )}
                            {isAdmin && profile.user_id !== 'team@twofoldvisuals.com' && (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200">Admin</Badge>
                            )}
                            <Badge className={
                              profile.approval_status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              profile.approval_status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-red-50 text-red-700 border-red-200'
                            }>
                              {profile.approval_status}
                            </Badge>
                          </div>
                          {profile.business_name && <p className="text-sm text-stone-600 mb-2">{profile.business_name}</p>}
                          <div className="flex flex-wrap gap-2 mb-2">
                            {profile.service_types?.map(type => <ServiceBadge key={type} type={type} size="sm" />)}
                          </div>
                          <p className="text-xs text-stone-500">{profile.city}, {profile.state} • {profile.email}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Actions
                            <MoreVertical className="w-4 h-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl(`UserEdit?id=${profile.user_id}`)}>
                              View/Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl(`DirectMessageChat?userId=${profile.user_id}`)}>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Send Message
                            </Link>
                          </DropdownMenuItem>
                          {user?.email === 'team@twofoldvisuals.com' && (
                            <>
                              <DropdownMenuSeparator />
                              {!isAdmin ? (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    if (window.confirm(`Make ${profile.full_name} an admin?`)) {
                                      makeAdminMutation.mutate(profile.user_id);
                                    }
                                  }}
                                >
                                  <Shield className="w-4 h-4 mr-2 text-blue-600" />
                                  Make Admin
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    if (window.confirm(`Remove admin access from ${profile.full_name}?`)) {
                                      removeAdminMutation.mutate(profile.user_id);
                                    }
                                  }}
                                >
                                  <Shield className="w-4 h-4 mr-2 text-orange-600" />
                                  Remove Admin
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                          {canManageThisUser && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setSuspendDialog({ open: true, profileId: profile.id, profileName: profile.full_name })}
                                className="text-orange-600"
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Suspend User
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setDeleteDialog({ open: true, profileId: profile.id, profileName: profile.full_name })}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </>
                          )}
                          </DropdownMenuContent>
                          </DropdownMenu>
                          </div>
                          </CardContent>
                          </Card>
                          );
                          })}

                          {todoModal.type === 'approved' && approvedProfiles.map((profile) => {
              const profileUser = allUsers.find(u => u.email === profile.user_id);
              const isAdmin = profileUser?.role === 'admin';
              const canManageThisUser = user?.email === 'team@twofoldvisuals.com' || !isAdmin;
              return (
                <Card key={profile.id} className="border-emerald-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar className="h-12 w-12">
                          {profile.selfie_url ? (
                            <img src={profile.selfie_url} alt={profile.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <AvatarFallback className="bg-emerald-100 text-emerald-700">
                              {profile.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-emerald-900">{profile.full_name}</h3>
                            {profile.user_id === 'team@twofoldvisuals.com' && (
                              <Badge className="bg-purple-50 text-purple-700 border-purple-200">Account Owner</Badge>
                            )}
                            {isAdmin && profile.user_id !== 'team@twofoldvisuals.com' && (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200">Admin</Badge>
                            )}
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Approved</Badge>
                          </div>
                          {profile.business_name && <p className="text-sm text-emerald-700 mb-2">{profile.business_name}</p>}
                          <div className="flex flex-wrap gap-2 mb-2">
                            {profile.service_types?.map(type => <ServiceBadge key={type} type={type} size="sm" />)}
                          </div>
                          <p className="text-xs text-emerald-600">{profile.city}, {profile.state} • {profile.email}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Actions
                            <MoreVertical className="w-4 h-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl(`UserEdit?id=${profile.user_id}`)}>
                              View/Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl(`DirectMessageChat?userId=${profile.user_id}`)}>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Send Message
                            </Link>
                          </DropdownMenuItem>
                          {user?.email === 'team@twofoldvisuals.com' && (
                            <>
                              <DropdownMenuSeparator />
                              {!isAdmin ? (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    if (window.confirm(`Make ${profile.full_name} an admin?`)) {
                                      makeAdminMutation.mutate(profile.user_id);
                                    }
                                  }}
                                >
                                  <Shield className="w-4 h-4 mr-2 text-blue-600" />
                                  Make Admin
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    if (window.confirm(`Remove admin access from ${profile.full_name}?`)) {
                                      removeAdminMutation.mutate(profile.user_id);
                                    }
                                  }}
                                >
                                  <Shield className="w-4 h-4 mr-2 text-orange-600" />
                                  Remove Admin
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                          {canManageThisUser && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setSuspendDialog({ open: true, profileId: profile.id, profileName: profile.full_name })}
                                className="text-orange-600"
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Suspend User
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setDeleteDialog({ open: true, profileId: profile.id, profileName: profile.full_name })}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </>
                          )}
                          </DropdownMenuContent>
                          </DropdownMenu>
                          </div>
                          </CardContent>
                          </Card>
                          );
                          })}

                          {todoModal.type === 'rejected' && rejectedProfiles.map((profile) => {
              const profileUser = allUsers.find(u => u.email === profile.user_id);
              const isAdmin = profileUser?.role === 'admin';
              const canManageThisUser = user?.email === 'team@twofoldvisuals.com' || !isAdmin;
              return (
                <Card key={profile.id} className="border-orange-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar className="h-12 w-12">
                          {profile.selfie_url ? (
                            <img src={profile.selfie_url} alt={profile.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <AvatarFallback className="bg-orange-100 text-orange-700">
                              {profile.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-orange-900">{profile.full_name}</h3>
                            {profile.user_id === 'team@twofoldvisuals.com' && (
                              <Badge className="bg-purple-50 text-purple-700 border-purple-200">Account Owner</Badge>
                            )}
                            {isAdmin && profile.user_id !== 'team@twofoldvisuals.com' && (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200">Admin</Badge>
                            )}
                            <Badge className="bg-orange-100 text-orange-800 border-orange-300">Rejected</Badge>
                          </div>
                          {profile.business_name && <p className="text-sm text-orange-700 mb-2">{profile.business_name}</p>}
                          {profile.rejection_reason && (
                            <p className="text-sm text-orange-800 mb-2"><span className="font-medium">Reason:</span> {profile.rejection_reason}</p>
                          )}
                          <p className="text-xs text-orange-600">{profile.city}, {profile.state} • {profile.email}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Actions
                            <MoreVertical className="w-4 h-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl(`UserEdit?id=${profile.user_id}`)}>
                              View/Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl(`DirectMessageChat?userId=${profile.user_id}`)}>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Send Message
                            </Link>
                          </DropdownMenuItem>
                          {canManageThisUser && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setDeleteDialog({ open: true, profileId: profile.id, profileName: profile.full_name })}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </>
                          )}
                          </DropdownMenuContent>
                          </DropdownMenu>
                          </div>
                          </CardContent>
                          </Card>
                          );
                          })}

            {todoModal.type === 'suspended' && suspendedProfiles.map((profile) => {
              const profileUser = allUsers.find(u => u.email === profile.user_id);
              const isAdmin = profileUser?.role === 'admin';
              const canManageThisUser = user?.email === 'team@twofoldvisuals.com' || !isAdmin;
              return (
                <Card key={profile.id} className="border-red-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar className="h-12 w-12">
                          {profile.selfie_url ? (
                            <img src={profile.selfie_url} alt={profile.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <AvatarFallback className="bg-red-100 text-red-700">
                              {profile.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-red-900">{profile.full_name}</h3>
                            {profile.user_id === 'team@twofoldvisuals.com' && (
                              <Badge className="bg-purple-50 text-purple-700 border-purple-200">Account Owner</Badge>
                            )}
                            {isAdmin && profile.user_id !== 'team@twofoldvisuals.com' && (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200">Admin</Badge>
                            )}
                            <Badge className="bg-red-100 text-red-800 border-red-300">Suspended</Badge>
                          </div>
                          {profile.business_name && <p className="text-sm text-red-700 mb-2">{profile.business_name}</p>}
                          {profile.suspension_reason && (
                            <p className="text-sm text-red-800 mb-2"><span className="font-medium">Reason:</span> {profile.suspension_reason}</p>
                          )}
                          <p className="text-xs text-red-600">{profile.city}, {profile.state} • {profile.email}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Actions
                            <MoreVertical className="w-4 h-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl(`UserEdit?id=${profile.user_id}`)}>
                              View/Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl(`DirectMessageChat?userId=${profile.user_id}`)}>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Send Message
                            </Link>
                          </DropdownMenuItem>
                          {user?.email === 'team@twofoldvisuals.com' && (
                            <>
                              <DropdownMenuSeparator />
                              {!isAdmin ? (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    if (window.confirm(`Make ${profile.full_name} an admin?`)) {
                                      makeAdminMutation.mutate(profile.user_id);
                                    }
                                  }}
                                >
                                  <Shield className="w-4 h-4 mr-2 text-blue-600" />
                                  Make Admin
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    if (window.confirm(`Remove admin access from ${profile.full_name}?`)) {
                                      removeAdminMutation.mutate(profile.user_id);
                                    }
                                  }}
                                >
                                  <Shield className="w-4 h-4 mr-2 text-orange-600" />
                                  Remove Admin
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                          {canManageThisUser && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setSuspendDialog({ open: true, profileId: profile.id, profileName: profile.full_name })}
                                className="text-orange-600"
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Suspend User
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setDeleteDialog({ open: true, profileId: profile.id, profileName: profile.full_name })}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </>
                          )}
                          </DropdownMenuContent>
                          </DropdownMenu>
                          </div>
                          </CardContent>
                          </Card>
                          );
                          })}

                          {todoModal.type === 'open_jobs' && allRequests.filter(r => r.status === 'open').map((post) => (
              <Card key={post.id} className="border-stone-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-stone-900">{post.title}</h3>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Open</Badge>
                      </div>
                      <p className="text-sm text-stone-600 mb-3">Posted by {post.requester_business || post.requester_name}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-medium text-xs capitalize">
                          {post.service_type.replace(/_/g, ' ')} ({post.help_type.replace(/_/g, ' ')})
                        </Badge>
                        <Badge variant="outline" className="text-xs">${post.pay_amount}</Badge>
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
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button asChild size="sm" variant="outline">
                        <Link to={createPageUrl(`JobDetails?id=${post.id}`)}>
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (window.confirm('Delete this post and all related data? This cannot be undone.')) {
                            deletePostMutation.mutate(post.id);
                          }
                        }}
                        disabled={deletePostMutation.isLoading}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {todoModal.type === 'completed_jobs' && allRequests.filter(r => r.status === 'completed').map((post) => (
              <Card key={post.id} className="border-stone-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-stone-900">{post.title}</h3>
                        <Badge className="bg-stone-100 text-stone-600">Completed</Badge>
                      </div>
                      <p className="text-sm text-stone-600 mb-3">Posted by {post.requester_business || post.requester_name}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-medium text-xs capitalize">
                          {post.service_type.replace(/_/g, ' ')} ({post.help_type.replace(/_/g, ' ')})
                        </Badge>
                        <Badge variant="outline" className="text-xs">${post.pay_amount}</Badge>
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
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button asChild size="sm" variant="outline">
                        <Link to={createPageUrl(`JobDetails?id=${post.id}`)}>
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (window.confirm('Delete this post and all related data? This cannot be undone.')) {
                            deletePostMutation.mutate(post.id);
                          }
                        }}
                        disabled={deletePostMutation.isLoading}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {todoModal.type === 'cancelled_jobs' && allRequests.filter(r => r.status === 'cancelled').map((post) => (
              <Card key={post.id} className="border-stone-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-stone-900">{post.title}</h3>
                        <Badge className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>
                      </div>
                      <p className="text-sm text-stone-600 mb-3">Posted by {post.requester_business || post.requester_name}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-medium text-xs capitalize">
                          {post.service_type.replace(/_/g, ' ')} ({post.help_type.replace(/_/g, ' ')})
                        </Badge>
                        <Badge variant="outline" className="text-xs">${post.pay_amount}</Badge>
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
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button asChild size="sm" variant="outline">
                        <Link to={createPageUrl(`JobDetails?id=${post.id}`)}>
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (window.confirm('Delete this post and all related data? This cannot be undone.')) {
                            deletePostMutation.mutate(post.id);
                          }
                        }}
                        disabled={deletePostMutation.isLoading}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {todoModal.type === 'all_tasks' && (
              <div className="space-y-6">
                {pendingProfiles.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Pending Approvals ({pendingProfiles.length})
                    </h3>
                    <div className="space-y-2">
                      {pendingProfiles.slice(0, 3).map(profile => (
                        <Card key={profile.id} className="border-amber-200 bg-amber-50">
                          <CardContent className="p-3">
                            <p className="font-medium text-amber-900">{profile.full_name}</p>
                            <p className="text-xs text-amber-700">{profile.business_name}</p>
                          </CardContent>
                        </Card>
                      ))}
                      {pendingProfiles.length > 3 && (
                        <p className="text-xs text-stone-500 text-center">+ {pendingProfiles.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )}
                {userSubmittedInfoProfiles.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      User Submitted Info ({userSubmittedInfoProfiles.length})
                    </h3>
                    <div className="space-y-2">
                      {userSubmittedInfoProfiles.slice(0, 3).map(profile => (
                        <Card key={profile.id} className="border-green-200 bg-green-50">
                          <CardContent className="p-3">
                            <p className="font-medium text-green-900">{profile.full_name}</p>
                            <p className="text-xs text-green-700">{profile.business_name}</p>
                          </CardContent>
                        </Card>
                      ))}
                      {userSubmittedInfoProfiles.length > 3 && (
                        <p className="text-xs text-stone-500 text-center">+ {userSubmittedInfoProfiles.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )}
                {rejectionAppeals.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-purple-600" />
                      Rejection Appeals ({rejectionAppeals.length})
                    </h3>
                    <div className="space-y-2">
                      {rejectionAppeals.slice(0, 3).map(profile => (
                        <Card key={profile.id} className="border-purple-200 bg-purple-50">
                          <CardContent className="p-3">
                            <p className="font-medium text-purple-900">{profile.full_name}</p>
                            <p className="text-xs text-purple-700">{profile.business_name}</p>
                          </CardContent>
                        </Card>
                      ))}
                      {rejectionAppeals.length > 3 && (
                        <p className="text-xs text-stone-500 text-center">+ {rejectionAppeals.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )}
                {pendingAppeals.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      Pending Appeals ({pendingAppeals.length})
                    </h3>
                    <div className="space-y-2">
                      {pendingAppeals.slice(0, 3).map(profile => (
                        <Card key={profile.id} className="border-purple-200 bg-purple-50">
                          <CardContent className="p-3">
                            <p className="font-medium text-purple-900">{profile.full_name}</p>
                            <p className="text-xs text-purple-700">{profile.business_name}</p>
                          </CardContent>
                        </Card>
                      ))}
                      {pendingAppeals.length > 3 && (
                        <p className="text-xs text-stone-500 text-center">+ {pendingAppeals.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )}
                {unassignedSupportChats.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      Unassigned Support Chats ({unassignedSupportChats.length})
                    </h3>
                    <div className="space-y-2">
                      {unassignedSupportChats.slice(0, 3).map(chat => (
                        <Card key={chat.id} className="border-blue-200 bg-blue-50">
                          <CardContent className="p-3">
                            <p className="font-medium text-blue-900">{chat.user_name}</p>
                            <p className="text-xs text-blue-700 line-clamp-1">{chat.last_message}</p>
                          </CardContent>
                        </Card>
                      ))}
                      {unassignedSupportChats.length > 3 && (
                        <p className="text-xs text-stone-500 text-center">+ {unassignedSupportChats.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )}
                {riskReviewProfiles.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-orange-600" />
                      Risk Assessment Reviews ({riskReviewProfiles.length})
                    </h3>
                    <div className="space-y-2">
                      {riskReviewProfiles.slice(0, 3).map(profile => (
                        <Card key={profile.id} className="border-orange-200 bg-orange-50">
                          <CardContent className="p-3">
                            <p className="font-medium text-orange-900">{profile.full_name}</p>
                            <p className="text-xs text-orange-700">Risk: {profile.ai_risk_assessment?.risk_score}/100</p>
                          </CardContent>
                        </Card>
                      ))}
                      {riskReviewProfiles.length > 3 && (
                        <p className="text-xs text-stone-500 text-center">+ {riskReviewProfiles.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {todoModal.type === 'jobs' && allRequests.map((post) => (
              <Card key={post.id} className="border-stone-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-stone-900">{post.title}</h3>
                        <Badge className={
                          post.status === 'open' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          post.status === 'filled' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-stone-100 text-stone-600'
                        }>
                          {post.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-stone-600 mb-3">Posted by {post.requester_business || post.requester_name}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-medium text-xs capitalize">
                          {post.service_type.replace(/_/g, ' ')} ({post.help_type.replace(/_/g, ' ')})
                        </Badge>
                        <Badge variant="outline" className="text-xs">${post.pay_amount}</Badge>
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
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button asChild size="sm" variant="outline">
                        <Link to={createPageUrl(`JobDetails?id=${post.id}`)}>
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (window.confirm('Delete this post and all related data? This cannot be undone.')) {
                            deletePostMutation.mutate(post.id);
                          }
                        }}
                        disabled={deletePostMutation.isLoading}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {todoModal.type === 'support_chats' && unassignedSupportChats.map((chat) => (
              <Card 
                key={chat.id} 
                className="border-emerald-200 bg-emerald-50 hover:border-emerald-300 cursor-pointer transition-colors"
                onClick={() => assignSupportChatMutation.mutate(chat.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700">
                        {chat.user_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-emerald-900">{chat.user_name}</h3>
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">New</Badge>
                      </div>
                      {chat.last_message && (
                        <p className="text-sm text-emerald-800 mb-2 line-clamp-2">{chat.last_message}</p>
                      )}
                      <p className="text-xs text-emerald-600">
                        {chat.last_message_at && formatTimestamp(chat.last_message_at, 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {todoModal.type === 'my_assigned' && !selectedTask && myAssignedProfiles.map((profile) => {
              // Determine task type based on profile status
              const taskType = 
                profile.needs_risk_review && profile.risk_review_admin_id ? 'risk_review' :
                profile.approval_status === 'user_submitted_info' ? 'user_submitted_info' :
                profile.approval_status === 'rejected' && profile.appeal_status === 'pending' ? 'rejection_appeal' :
                profile.suspended && profile.appeal_status === 'pending' ? 'suspension_appeal' :
                'pending';
              
              const statusBadge = 
                profile.needs_risk_review && profile.risk_review_admin_id ? { 
                  label: `Risk Review (${profile.ai_risk_assessment?.risk_score}/100)`, 
                  class: profile.ai_risk_assessment?.risk_score >= 65 ? 'bg-red-100 text-red-800 border-red-300' : 'bg-orange-100 text-orange-800 border-orange-300'
                } :
                profile.approval_status === 'user_submitted_info' ? { label: 'Info Submitted', class: 'bg-green-100 text-green-800 border-green-300' } :
                profile.approval_status === 'rejected' && profile.appeal_status === 'pending' ? { label: 'Rejection Appeal', class: 'bg-purple-100 text-purple-800 border-purple-300' } :
                profile.suspended && profile.appeal_status === 'pending' ? { label: 'Suspension Appeal', class: 'bg-amber-100 text-amber-800 border-amber-300' } :
                { label: 'Pending', class: 'bg-amber-100 text-amber-800 border-amber-300' };

              return (
                <Card 
                  key={profile.id} 
                  className="border-blue-200 bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                  onClick={() => setSelectedTask({ type: taskType, profile })}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar className="h-12 w-12">
                          {profile.selfie_url ? (
                            <img src={profile.selfie_url} alt={profile.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {profile.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-blue-900">{profile.full_name}</h3>
                            <Badge className={statusBadge.class}>{statusBadge.label}</Badge>
                          </div>
                          {profile.business_name && (
                            <p className="text-sm text-blue-700 mb-2">{profile.business_name}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mb-2">
                            {profile.service_types?.map(type => (
                              <ServiceBadge key={type} type={type} size="sm" />
                            ))}
                          </div>
                          <p className="text-xs text-blue-600">
                            {profile.city}, {profile.state} • {profile.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {todoModal.type === 'my_assigned' && selectedTask && selectedTask.type === 'user_submitted_info' && (
              <UserSubmittedInfoTask 
                selectedTask={selectedTask} 
                setSelectedTask={setSelectedTask}
                showFullProfile={showFullProfile}
                setShowFullProfile={setShowFullProfile}
                approveMutation={approveMutation}
                setActionRequiredDialog={setActionRequiredDialog}
                setRejectDialog={setRejectDialog}
                unassignTaskMutation={unassignTaskMutation}
                setSendToManagerDialog={setSendToManagerDialog}
                user={user}
                setManagerResolutionDialog={setManagerResolutionDialog}
                assignToMeFromOtherMutation={assignToMeFromOtherMutation}
                setAiAssessmentModal={setAiAssessmentModal}
              />
            )}

            {todoModal.type === 'my_assigned' && selectedTask && selectedTask.type === 'rejection_appeal' && (
              <RejectionAppealTask 
                selectedTask={selectedTask}
                setSelectedTask={setSelectedTask}
                showFullProfile={showFullProfile}
                setShowFullProfile={setShowFullProfile}
                approveMutation={approveMutation}
                setDenyAppealDialog={setDenyAppealDialog}
                unassignTaskMutation={unassignTaskMutation}
                setSendToManagerDialog={setSendToManagerDialog}
                user={user}
                setManagerResolutionDialog={setManagerResolutionDialog}
                assignToMeFromOtherMutation={assignToMeFromOtherMutation}
                setAiAssessmentModal={setAiAssessmentModal}
              />
            )}

            {todoModal.type === 'my_assigned' && selectedTask && selectedTask.type === 'suspension_appeal' && (
              <SuspensionAppealTask 
                selectedTask={selectedTask}
                setSelectedTask={setSelectedTask}
                showFullProfile={showFullProfile}
                setShowFullProfile={setShowFullProfile}
                user={user}
                queryClient={queryClient}
                setDenyAppealDialog={setDenyAppealDialog}
                unassignTaskMutation={unassignTaskMutation}
                setSendToManagerDialog={setSendToManagerDialog}
                setManagerResolutionDialog={setManagerResolutionDialog}
                assignToMeFromOtherMutation={assignToMeFromOtherMutation}
                setAiAssessmentModal={setAiAssessmentModal}
              />
            )}

            {todoModal.type === 'my_assigned' && selectedTask && selectedTask.type === 'pending' && (
              <PendingApprovalTask 
                selectedTask={selectedTask}
                setSelectedTask={setSelectedTask}
                approveMutation={approveMutation}
                setActionRequiredDialog={setActionRequiredDialog}
                setRejectDialog={setRejectDialog}
                setSendForReviewDialog={setSendForReviewDialog}
                unassignTaskMutation={unassignTaskMutation}
                setSendToManagerDialog={setSendToManagerDialog}
                user={user}
                setManagerResolutionDialog={setManagerResolutionDialog}
                assignToMeFromOtherMutation={assignToMeFromOtherMutation}
                setAiAssessmentModal={setAiAssessmentModal}
              />
            )}

            {todoModal.type === 'my_assigned' && selectedTask && selectedTask.type === 'risk_review' && (
              <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to List
                </Button>
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-sm sm:text-base break-words">Risk Assessment: {selectedTask.profile.full_name}</span>
                      <Badge className={
                        selectedTask.profile.ai_risk_assessment?.risk_score >= 65 ? 'bg-red-600 text-white' :
                        'bg-orange-600 text-white'
                      }>
                        {selectedTask.profile.ai_risk_assessment?.risk_score}/100
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Full AI Assessment Display */}
                    {selectedTask.profile.ai_risk_assessment && (
                      <div className="bg-white rounded-lg p-4 border border-orange-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-orange-900 text-sm">AI Risk Assessment</h4>
                          <Badge className={
                            selectedTask.profile.ai_risk_assessment.risk_score < 35 ? 'bg-emerald-100 text-emerald-800' :
                            selectedTask.profile.ai_risk_assessment.risk_score < 65 ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {selectedTask.profile.ai_risk_assessment.risk_label?.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-stone-700">{selectedTask.profile.ai_risk_assessment.summary}</p>
                        
                        {selectedTask.profile.ai_risk_assessment.green_flags?.length > 0 && (
                          <div className="bg-emerald-50 rounded p-2 border border-emerald-200">
                            <p className="text-xs font-medium text-emerald-900 mb-1">✓ Positive Indicators ({selectedTask.profile.ai_risk_assessment.green_flags.length})</p>
                            <ul className="text-xs text-emerald-800 space-y-0.5">
                              {selectedTask.profile.ai_risk_assessment.green_flags.slice(0, 3).map((flag, idx) => (
                                <li key={idx}>• {flag}</li>
                              ))}
                              {selectedTask.profile.ai_risk_assessment.green_flags.length > 3 && (
                                <li className="text-emerald-600">+ {selectedTask.profile.ai_risk_assessment.green_flags.length - 3} more</li>
                              )}
                            </ul>
                          </div>
                        )}
                        
                        {selectedTask.profile.ai_risk_assessment.red_flags?.length > 0 && (
                          <div className="bg-red-50 rounded p-2 border border-red-200">
                            <p className="text-xs font-medium text-red-900 mb-1">⚠ Risk Indicators ({selectedTask.profile.ai_risk_assessment.red_flags.length})</p>
                            <ul className="text-xs text-red-800 space-y-0.5">
                              {selectedTask.profile.ai_risk_assessment.red_flags.slice(0, 3).map((flag, idx) => (
                                <li key={idx}>• {flag}</li>
                              ))}
                              {selectedTask.profile.ai_risk_assessment.red_flags.length > 3 && (
                                <li className="text-red-600">+ {selectedTask.profile.ai_risk_assessment.red_flags.length - 3} more</li>
                              )}
                            </ul>
                          </div>
                        )}

                        <Button
                          onClick={() => setAiAssessmentModal({ open: true, assessment: selectedTask.profile.ai_risk_assessment })}
                          variant="outline"
                          className="w-full text-xs"
                        >
                          View Complete Assessment Details
                        </Button>
                      </div>
                    )}

                    {/* Profile Details */}
                    <div className="bg-white rounded-lg p-4 border border-stone-200 space-y-3">
                      <h4 className="font-semibold text-stone-900 text-sm">Profile Information</h4>
                      <div className="space-y-2 text-xs">
                        <div className="break-words"><span className="font-medium text-stone-500">Name:</span> <span className="text-stone-700">{selectedTask.profile.full_name}</span></div>
                        <div className="break-words"><span className="font-medium text-stone-500">Business:</span> <span className="text-stone-700">{selectedTask.profile.business_name || 'N/A'}</span></div>
                        <div className="break-words"><span className="font-medium text-stone-500">Current Status:</span> <span className="text-stone-700">{selectedTask.profile.approval_status}</span></div>
                        <div className="break-all"><span className="font-medium text-stone-500">Email:</span> <span className="text-stone-700">{selectedTask.profile.email}</span></div>
                        <div className="break-words"><span className="font-medium text-stone-500">Phone:</span> <span className="text-stone-700">{selectedTask.profile.phone || 'N/A'}</span></div>
                        <div className="break-words"><span className="font-medium text-stone-500">Location:</span> <span className="text-stone-700">{selectedTask.profile.city}, {selectedTask.profile.state}</span></div>
                        <div className="break-words"><span className="font-medium text-stone-500">Services:</span> <span className="text-stone-700">{selectedTask.profile.service_types?.map(s => serviceConfig[s]?.label).join(', ')}</span></div>
                        {selectedTask.profile.bio && (
                          <div className="break-words"><span className="font-medium text-stone-500">Bio:</span> <span className="text-stone-700">{selectedTask.profile.bio}</span></div>
                        )}
                        
                        {selectedTask.profile.portfolio_links?.length > 0 ? (
                          <div>
                            <span className="font-medium text-stone-500 block mb-1">Portfolio Links:</span>
                            <div className="space-y-1">
                              {selectedTask.profile.portfolio_links.map((link, idx) => (
                                <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline break-all">
                                  {link}
                                </a>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-stone-500 italic">
                            No portfolio links (may be DJ, photobooth, etc.)
                          </div>
                        )}
                      </div>

                      {/* Photos */}
                      {(selectedTask.profile.selfie_url || selectedTask.profile.business_logo_url) && (
                        <div className="pt-2 border-t">
                          <span className="font-medium text-stone-500 text-xs block mb-2">Photos:</span>
                          <div className="flex gap-3">
                            {selectedTask.profile.selfie_url && (
                              <div>
                                <p className="text-xs text-stone-500 mb-1">Profile Photo</p>
                                <img src={selectedTask.profile.selfie_url} alt="Profile" className="w-20 h-20 rounded-lg object-cover border border-stone-200" />
                              </div>
                            )}
                            {selectedTask.profile.business_logo_url && (
                              <div>
                                <p className="text-xs text-stone-500 mb-1">Business Logo</p>
                                <img src={selectedTask.profile.business_logo_url} alt="Logo" className="w-20 h-20 rounded-lg object-cover border border-stone-200" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Documents */}
                      {(selectedTask.profile.insurance_url || selectedTask.profile.credentials_url) && (
                        <div className="pt-2 border-t">
                          <span className="font-medium text-stone-500 text-xs block mb-2">Documents:</span>
                          <div className="space-y-1">
                            {selectedTask.profile.insurance_url && (
                              <a href={selectedTask.profile.insurance_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                <FileText className="w-3 h-3" />
                                Insurance
                              </a>
                            )}
                            {selectedTask.profile.credentials_url && (
                              <a href={selectedTask.profile.credentials_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                <FileText className="w-3 h-3" />
                                Credentials
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                      <Button
                        onClick={async () => {
                          await base44.entities.VendorProfile.update(selectedTask.profile.id, {
                            needs_risk_review: false,
                            risk_review_admin_id: null,
                            risk_review_admin_name: null
                          });
                          await base44.entities.AdminAction.create({
                            admin_id: user.email,
                            admin_name: getAdminDisplayName(user),
                            action_type: 'profile_reviewed',
                            target_id: selectedTask.profile.user_id,
                            target_name: selectedTask.profile.full_name,
                            details: { 
                              profile_id: selectedTask.profile.id,
                              risk_score: selectedTask.profile.ai_risk_assessment?.risk_score
                            },
                            notes: 'Risk assessment reviewed - no action needed'
                          });
                          queryClient.invalidateQueries(['allVendorProfiles']);
                          setSelectedTask(null);
                          toast.success('Risk review completed');
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Complete Review
                      </Button>
                      
                      <Button
                        onClick={() => setSuspendDialog({ 
                          open: true, 
                          profileId: selectedTask.profile.id, 
                          profileName: selectedTask.profile.full_name,
                          fromRiskReview: true
                        })}
                        className="w-full bg-red-600 hover:bg-red-700 text-white text-sm"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Suspend User
                      </Button>

                      <Button
                        onClick={async () => {
                          await base44.entities.VendorProfile.update(selectedTask.profile.id, {
                            needs_risk_review: true,
                            risk_review_admin_id: null,
                            risk_review_admin_name: null
                          });
                          queryClient.invalidateQueries(['allVendorProfiles']);
                          setSelectedTask(null);
                          toast.success('Task unassigned');
                        }}
                        variant="outline"
                        className="w-full text-sm"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Unassign
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {todoModal.type === 'my_support_chats' && myAssignedSupportChats.map((chat) => (
              <Card 
                key={chat.id} 
                className="border-blue-200 bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                onClick={() => {
                  setTodoModal({ open: false, type: null });
                  navigate(createPageUrl(`SupportChatView?id=${chat.id}`));
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {chat.user_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-blue-900">{chat.user_name}</h3>
                        {chat.unread_admin && (
                          <Badge className="bg-red-500 text-white text-xs">New</Badge>
                        )}
                      </div>
                      {chat.last_message && (
                        <p className="text-sm text-blue-800 mb-2 line-clamp-2">{chat.last_message}</p>
                      )}
                      <p className="text-xs text-blue-600">
                        {chat.last_message_at && format(new Date(chat.last_message_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {todoModal.type === 'rejection_appeals' && !selectedTask && rejectionAppeals.map((profile) => (
              <Card 
                key={profile.id} 
                className="border-purple-200 bg-purple-50 hover:border-purple-300 cursor-pointer transition-colors"
                onClick={() => setSelectedTask({ type: 'rejection_appeal', profile })}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        {profile.selfie_url ? (
                          <img src={profile.selfie_url} alt={profile.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <AvatarFallback className="bg-purple-100 text-purple-700">
                            {profile.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-purple-900">{profile.full_name}</h3>
                          <Badge className="bg-purple-100 text-purple-800 border-purple-300">Rejection Appeal</Badge>
                        </div>
                        {profile.business_name && <p className="text-sm text-purple-700 mb-2">{profile.business_name}</p>}
                        <p className="text-sm text-purple-800 line-clamp-2">
                          {profile.appeal_message}
                        </p>
                        <p className="text-xs text-purple-600 mt-2">{profile.email}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        assignToMeMutation.mutate({ profileId: profile.id });
                        setSelectedTask({ type: 'rejection_appeal', profile });
                      }}
                    >
                      Assign to Me
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {todoModal.type === 'rejection_appeals' && selectedTask && selectedTask.type === 'rejection_appeal' && (
              <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to List
                </Button>
                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Rejection Appeal: {selectedTask.profile.full_name}</span>
                      <Badge className="bg-purple-600 text-white">Appeal Pending</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Appeal Message */}
                    <div className="bg-white rounded-lg p-4 border-2 border-purple-300">
                      <h4 className="font-semibold text-purple-900 mb-2">User's Appeal:</h4>
                      <p className="text-sm text-stone-700 whitespace-pre-wrap mb-3">{selectedTask.profile.appeal_message}</p>
                      <p className="text-xs text-stone-500">
                        Submitted: {selectedTask.profile.appeal_submitted_date && format(new Date(selectedTask.profile.appeal_submitted_date), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>

                    {/* Original Rejection Reason */}
                    {selectedTask.profile.rejection_reason && (
                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <h4 className="font-semibold text-red-900 mb-2">Original Rejection Reason:</h4>
                        <p className="text-sm text-red-700">{selectedTask.profile.rejection_reason}</p>
                      </div>
                    )}

                    {/* Full Profile Toggle */}
                    <Button 
                      variant="outline" 
                      onClick={() => setShowFullProfile(!showFullProfile)}
                      className="w-full"
                    >
                      {showFullProfile ? 'Hide' : 'View'} Full Profile Details
                    </Button>

                    {/* Full Profile Details */}
                    {showFullProfile && (
                      <div className="space-y-4 bg-white rounded-lg p-4 border border-stone-200">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><span className="font-medium text-stone-500">Name:</span> {selectedTask.profile.full_name}</div>
                          <div><span className="font-medium text-stone-500">Business:</span> {selectedTask.profile.business_name}</div>
                          <div><span className="font-medium text-stone-500">Phone:</span> {selectedTask.profile.phone}</div>
                          <div><span className="font-medium text-stone-500">Email:</span> {selectedTask.profile.email}</div>
                          <div className="col-span-2"><span className="font-medium text-stone-500">Services:</span> {selectedTask.profile.service_types?.map(s => serviceConfig[s]?.label).join(', ')}</div>
                          <div className="col-span-2"><span className="font-medium text-stone-500">Location:</span> {selectedTask.profile.city}, {selectedTask.profile.state}</div>
                          <div className="col-span-2"><span className="font-medium text-stone-500">Experience:</span> {selectedTask.profile.experience_years} years</div>
                          {selectedTask.profile.bio && (
                            <div className="col-span-2"><span className="font-medium text-stone-500">Bio:</span> {selectedTask.profile.bio}</div>
                          )}
                          {selectedTask.profile.portfolio_links?.length > 0 && (
                            <div className="col-span-2">
                              <span className="font-medium text-stone-500">Portfolio:</span>
                              <div className="mt-1 space-y-1">
                                {selectedTask.profile.portfolio_links.map((link, idx) => (
                                  <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-600 hover:underline break-all">
                                    {link}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <span className="font-medium text-stone-500 text-sm block mb-2">Photos:</span>
                          <div className="flex gap-4">
                            {selectedTask.profile.selfie_url && (
                              <div>
                                <p className="text-xs text-stone-500 mb-1">Profile Photo</p>
                                <img src={selectedTask.profile.selfie_url} alt="Profile" className="w-24 h-24 rounded-lg object-cover border-2 border-stone-200" />
                              </div>
                            )}
                            {selectedTask.profile.business_logo_url && (
                              <div>
                                <p className="text-xs text-stone-500 mb-1">Business Logo</p>
                                <img src={selectedTask.profile.business_logo_url} alt="Logo" className="w-24 h-24 rounded-lg object-cover border-2 border-stone-200" />
                              </div>
                            )}
                          </div>
                        </div>

                        {(selectedTask.profile.insurance_url || selectedTask.profile.credentials_url) && (
                          <div>
                            <span className="font-medium text-stone-500 text-sm block mb-2">Documents:</span>
                            <div className="space-y-2">
                              {selectedTask.profile.insurance_url && (
                                <a 
                                  href={selectedTask.profile.insurance_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                >
                                  <FileText className="w-4 h-4" />
                                  Insurance Certificate
                                </a>
                              )}
                              {selectedTask.profile.credentials_url && (
                                <a 
                                  href={selectedTask.profile.credentials_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                >
                                  <FileText className="w-4 h-4" />
                                  Credentials/Certifications
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() => {
                            approveMutation.mutate(selectedTask.profile.id);
                            setSelectedTask(null);
                            setShowFullProfile(false);
                          }}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                          disabled={approveMutation.isLoading}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Approve Appeal
                        </Button>
                        <Button
                          onClick={() => {
                            setDenyAppealDialog({ open: true, profileId: selectedTask.profile.id });
                          }}
                          variant="outline"
                          className="flex-1 text-red-600 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Deny Appeal
                        </Button>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() => unassignTaskMutation.mutate({ profileId: selectedTask.profile.id })}
                          variant="outline"
                          className="flex-1"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Unassign Task
                        </Button>
                        <Button
                          onClick={() => sendToManagerMutation.mutate({ profileId: selectedTask.profile.id })}
                          variant="outline"
                          className="flex-1"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send to Manager
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {todoModal.type === 'appeals' && !selectedTask && pendingAppeals.map((profile) => (
              <Card 
                key={profile.id} 
                className="border-amber-200 bg-amber-50 hover:border-amber-300 cursor-pointer transition-colors"
                onClick={() => setSelectedTask({ type: 'suspension_appeal', profile })}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        {profile.selfie_url ? (
                          <img src={profile.selfie_url} alt={profile.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <AvatarFallback className="bg-amber-100 text-amber-700">
                            {profile.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-amber-900">{profile.full_name}</h3>
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300">Suspension Appeal</Badge>
                        </div>
                        {profile.business_name && (
                          <p className="text-sm text-amber-700 mb-2">{profile.business_name}</p>
                        )}
                        <p className="text-sm text-amber-800 line-clamp-2">
                          {profile.appeal_message}
                        </p>
                        <p className="text-xs text-amber-600 mt-2">
                          {profile.city}, {profile.state} • {profile.email}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        assignToMeMutation.mutate({ profileId: profile.id });
                        setSelectedTask({ type: 'suspension_appeal', profile });
                      }}
                    >
                      Assign to Me
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {todoModal.type === 'risk_reviews' && !selectedTask && riskReviewProfiles.map((profile) => (
              <Card 
                key={profile.id} 
                className="border-orange-200 bg-orange-50 hover:border-orange-300 cursor-pointer transition-colors"
                onClick={() => setSelectedTask({ type: 'risk_review', profile })}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        {profile.selfie_url ? (
                          <img src={profile.selfie_url} alt={profile.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <AvatarFallback className="bg-orange-100 text-orange-700">
                            {profile.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-orange-900">{profile.full_name}</h3>
                          <Badge className={
                            profile.ai_risk_assessment?.risk_score >= 65 ? 'bg-red-100 text-red-800 border-red-300' :
                            'bg-orange-100 text-orange-800 border-orange-300'
                          }>
                            Risk: {profile.ai_risk_assessment?.risk_score}/100
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {profile.approval_status}
                          </Badge>
                        </div>
                        {profile.business_name && (
                          <p className="text-sm text-orange-700 mb-2">{profile.business_name}</p>
                        )}
                        <p className="text-xs text-orange-800 mb-2 line-clamp-2">
                          {profile.ai_risk_assessment?.summary}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {profile.service_types?.map(type => (
                            <ServiceBadge key={type} type={type} size="sm" />
                          ))}
                        </div>
                        <p className="text-xs text-orange-600">
                          {profile.city}, {profile.state} • {profile.email}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await base44.entities.VendorProfile.update(profile.id, {
                          risk_review_admin_id: user.email,
                          risk_review_admin_name: getAdminDisplayName(user)
                        });
                        queryClient.invalidateQueries(['allVendorProfiles']);
                        setSelectedTask({ type: 'risk_review', profile: { ...profile, risk_review_admin_id: user.email } });
                        toast.success('Risk review task assigned to you');
                      }}
                    >
                      Assign to Me
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {todoModal.type === 'risk_reviews' && selectedTask && selectedTask.type === 'risk_review' && (
              <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to List
                </Button>
                
                {/* Two Column Layout - Risk Assessment + Profile */}
                <div className="grid lg:grid-cols-2 gap-4">
                  {/* Left: Full Risk Assessment */}
                  <div>
                    {selectedTask.profile.ai_risk_assessment && (
                      <AIRiskAssessment
                        open={true}
                        onClose={() => {}}
                        assessment={selectedTask.profile.ai_risk_assessment}
                        inline={true}
                      />
                    )}
                  </div>

                  {/* Right: Complete Profile Details */}
                  <Card className="border-stone-200">
                    <CardHeader>
                      <CardTitle className="text-sm">Complete Profile Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="break-words"><span className="font-medium text-stone-500">Name:</span> <span className="text-stone-700">{selectedTask.profile.full_name}</span></div>
                          <div className="break-words"><span className="font-medium text-stone-500">Business:</span> <span className="text-stone-700">{selectedTask.profile.business_name || 'N/A'}</span></div>
                          <div className="break-words"><span className="font-medium text-stone-500">Status:</span> <Badge variant="outline" className="text-xs">{selectedTask.profile.approval_status}</Badge></div>
                          <div className="break-words"><span className="font-medium text-stone-500">Experience:</span> <span className="text-stone-700">{selectedTask.profile.experience_years || 0} years</span></div>
                        </div>
                        
                        <div className="break-all"><span className="font-medium text-stone-500">Email:</span> <span className="text-stone-700">{selectedTask.profile.email}</span></div>
                        <div className="break-words"><span className="font-medium text-stone-500">Phone:</span> <span className="text-stone-700">{selectedTask.profile.phone || 'N/A'}</span></div>
                        <div className="break-words"><span className="font-medium text-stone-500">Location:</span> <span className="text-stone-700">{selectedTask.profile.city}, {selectedTask.profile.state}</span></div>
                        <div className="break-words"><span className="font-medium text-stone-500">Services:</span> 
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedTask.profile.service_types?.map(s => (
                              <ServiceBadge key={s} type={s} size="sm" />
                            ))}
                          </div>
                        </div>
                        
                        {selectedTask.profile.bio && (
                          <div className="pt-2 border-t">
                            <span className="font-medium text-stone-500 block mb-1">Bio:</span>
                            <p className="text-stone-700 whitespace-pre-wrap">{selectedTask.profile.bio}</p>
                          </div>
                        )}
                        
                        {selectedTask.profile.portfolio_links?.length > 0 ? (
                          <div className="pt-2 border-t">
                            <span className="font-medium text-stone-500 block mb-1">Portfolio Links:</span>
                            <div className="space-y-1">
                              {selectedTask.profile.portfolio_links.map((link, idx) => (
                                <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline break-all">
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                  {link}
                                </a>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="pt-2 border-t text-stone-500 italic">
                            No portfolio links provided (may be DJ, photobooth, or similar service)
                          </div>
                        )}

                        {selectedTask.profile.portfolio_items?.length > 0 && (
                          <div className="pt-2 border-t">
                            <span className="font-medium text-stone-500 block mb-2">Portfolio Images ({selectedTask.profile.portfolio_items.length}):</span>
                            <div className="grid grid-cols-3 gap-2">
                              {selectedTask.profile.portfolio_items.map((item, idx) => (
                                <a key={idx} href={item.image_url} target="_blank" rel="noopener noreferrer">
                                  <img src={item.image_url} alt={item.title} className="w-full h-20 object-cover rounded border hover:opacity-75 transition-opacity" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Photos */}
                      {(selectedTask.profile.selfie_url || selectedTask.profile.business_logo_url) && (
                        <div className="pt-3 border-t">
                          <span className="font-medium text-stone-500 text-xs block mb-2">Profile Photos:</span>
                          <div className="flex gap-3">
                            {selectedTask.profile.selfie_url && (
                              <div>
                                <p className="text-xs text-stone-500 mb-1">Selfie</p>
                                <a href={selectedTask.profile.selfie_url} target="_blank" rel="noopener noreferrer">
                                  <img src={selectedTask.profile.selfie_url} alt="Profile" className="w-24 h-24 rounded-lg object-cover border border-stone-200 hover:opacity-75 transition-opacity" />
                                </a>
                              </div>
                            )}
                            {selectedTask.profile.business_logo_url && (
                              <div>
                                <p className="text-xs text-stone-500 mb-1">Logo</p>
                                <a href={selectedTask.profile.business_logo_url} target="_blank" rel="noopener noreferrer">
                                  <img src={selectedTask.profile.business_logo_url} alt="Logo" className="w-24 h-24 rounded-lg object-cover border border-stone-200 hover:opacity-75 transition-opacity" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Documents */}
                      {(selectedTask.profile.insurance_url || selectedTask.profile.credentials_url) && (
                        <div className="pt-3 border-t">
                          <span className="font-medium text-stone-500 text-xs block mb-2">Documents:</span>
                          <div className="space-y-1">
                            {selectedTask.profile.insurance_url && (
                              <a href={selectedTask.profile.insurance_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                <FileText className="w-3 h-3" />
                                Insurance Certificate
                              </a>
                            )}
                            {selectedTask.profile.credentials_url && (
                              <a href={selectedTask.profile.credentials_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                <FileText className="w-3 h-3" />
                                Credentials
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Action Buttons */}
                <Card className="border-orange-200">
                  <CardContent className="p-4 space-y-2">
                    <Button
                      onClick={async () => {
                        await base44.entities.VendorProfile.update(selectedTask.profile.id, {
                          needs_risk_review: false,
                          risk_review_admin_id: null,
                          risk_review_admin_name: null
                        });
                        await base44.entities.AdminAction.create({
                          admin_id: user.email,
                          admin_name: getAdminDisplayName(user),
                          action_type: 'profile_reviewed',
                          target_id: selectedTask.profile.user_id,
                          target_name: selectedTask.profile.full_name,
                          details: { 
                            profile_id: selectedTask.profile.id,
                            risk_score: selectedTask.profile.ai_risk_assessment?.risk_score
                          },
                          notes: 'Risk assessment reviewed - no action needed'
                        });
                        queryClient.invalidateQueries(['allVendorProfiles']);
                        setSelectedTask(null);
                        toast.success('Risk review completed');
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Complete Review (No Action Needed)
                    </Button>
                    
                    <Button
                      onClick={() => setSuspendDialog({ 
                        open: true, 
                        profileId: selectedTask.profile.id, 
                        profileName: selectedTask.profile.full_name,
                        fromRiskReview: true
                      })}
                      className="w-full bg-red-600 hover:bg-red-700 text-white text-sm"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Suspend User
                    </Button>

                    <Button
                      onClick={async () => {
                        await base44.entities.VendorProfile.update(selectedTask.profile.id, {
                          needs_risk_review: true,
                          risk_review_admin_id: null,
                          risk_review_admin_name: null
                        });
                        queryClient.invalidateQueries(['allVendorProfiles']);
                        setSelectedTask(null);
                        toast.success('Task unassigned');
                      }}
                      variant="outline"
                      className="w-full text-sm"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Unassign
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {todoModal.type === 'appeals' && selectedTask && selectedTask.type === 'suspension_appeal' && (
              <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to List
                </Button>
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Suspension Appeal: {selectedTask.profile.full_name}</span>
                      <Badge className="bg-amber-600 text-white">Appeal Pending</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Appeal Message */}
                    <div className="bg-white rounded-lg p-4 border-2 border-amber-300">
                      <h4 className="font-semibold text-amber-900 mb-2">User's Appeal:</h4>
                      <p className="text-sm text-stone-700 whitespace-pre-wrap mb-3">{selectedTask.profile.appeal_message}</p>
                      <p className="text-xs text-stone-500">
                        Submitted: {selectedTask.profile.appeal_submitted_date && format(new Date(selectedTask.profile.appeal_submitted_date), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>

                    {/* Original Suspension Reason */}
                    {selectedTask.profile.suspension_reason && (
                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <h4 className="font-semibold text-red-900 mb-2">Original Suspension Reason:</h4>
                        <p className="text-sm text-red-700">{selectedTask.profile.suspension_reason}</p>
                      </div>
                    )}

                    {/* Full Profile Toggle */}
                    <Button 
                      variant="outline" 
                      onClick={() => setShowFullProfile(!showFullProfile)}
                      className="w-full"
                    >
                      {showFullProfile ? 'Hide' : 'View'} Full Profile Details
                    </Button>

                    {/* Full Profile Details */}
                    {showFullProfile && (
                      <div className="space-y-4 bg-white rounded-lg p-4 border border-stone-200">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><span className="font-medium text-stone-500">Name:</span> {selectedTask.profile.full_name}</div>
                          <div><span className="font-medium text-stone-500">Business:</span> {selectedTask.profile.business_name}</div>
                          <div><span className="font-medium text-stone-500">Phone:</span> {selectedTask.profile.phone}</div>
                          <div><span className="font-medium text-stone-500">Email:</span> {selectedTask.profile.email}</div>
                          <div className="col-span-2"><span className="font-medium text-stone-500">Services:</span> {selectedTask.profile.service_types?.map(s => serviceConfig[s]?.label).join(', ')}</div>
                          <div className="col-span-2"><span className="font-medium text-stone-500">Location:</span> {selectedTask.profile.city}, {selectedTask.profile.state}</div>
                          <div className="col-span-2"><span className="font-medium text-stone-500">Experience:</span> {selectedTask.profile.experience_years} years</div>
                          {selectedTask.profile.bio && (
                            <div className="col-span-2"><span className="font-medium text-stone-500">Bio:</span> {selectedTask.profile.bio}</div>
                          )}
                          {selectedTask.profile.portfolio_links?.length > 0 && (
                            <div className="col-span-2">
                              <span className="font-medium text-stone-500">Portfolio:</span>
                              <div className="mt-1 space-y-1">
                                {selectedTask.profile.portfolio_links.map((link, idx) => (
                                  <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-600 hover:underline break-all">
                                    {link}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <span className="font-medium text-stone-500 text-sm block mb-2">Photos:</span>
                          <div className="flex gap-4">
                            {selectedTask.profile.selfie_url && (
                              <div>
                                <p className="text-xs text-stone-500 mb-1">Profile Photo</p>
                                <img src={selectedTask.profile.selfie_url} alt="Profile" className="w-24 h-24 rounded-lg object-cover border-2 border-stone-200" />
                              </div>
                            )}
                            {selectedTask.profile.business_logo_url && (
                              <div>
                                <p className="text-xs text-stone-500 mb-1">Business Logo</p>
                                <img src={selectedTask.profile.business_logo_url} alt="Logo" className="w-24 h-24 rounded-lg object-cover border-2 border-stone-200" />
                              </div>
                            )}
                          </div>
                        </div>

                        {(selectedTask.profile.insurance_url || selectedTask.profile.credentials_url) && (
                          <div>
                            <span className="font-medium text-stone-500 text-sm block mb-2">Documents:</span>
                            <div className="space-y-2">
                              {selectedTask.profile.insurance_url && (
                                <a 
                                  href={selectedTask.profile.insurance_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                >
                                  <FileText className="w-4 h-4" />
                                  Insurance Certificate
                                </a>
                              )}
                              {selectedTask.profile.credentials_url && (
                                <a 
                                  href={selectedTask.profile.credentials_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                >
                                  <FileText className="w-4 h-4" />
                                  Credentials/Certifications
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={async () => {
                            await base44.entities.VendorProfile.update(selectedTask.profile.id, {
                              suspended: false,
                              suspension_reason: null,
                              appeal_status: 'approved',
                              appeal_message: null
                            });
                            await base44.entities.Notification.create({
                              user_id: selectedTask.profile.user_id,
                              type: 'new_message',
                              title: 'Suspension Appeal Approved',
                              message: 'Your suspension has been lifted. You can now access the platform.',
                              reference_id: selectedTask.profile.id
                            });
                            await base44.entities.AdminAction.create({
                              admin_id: user.email,
                              admin_name: getAdminDisplayName(user),
                              action_type: 'appeal_approved',
                              target_id: selectedTask.profile.user_id,
                              target_name: selectedTask.profile.full_name
                            });
                            queryClient.invalidateQueries(['allVendorProfiles']);
                            setSelectedTask(null);
                            setShowFullProfile(false);
                            toast.success('Suspension appeal approved');
                          }}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Approve Appeal
                        </Button>
                        <Button
                          onClick={() => {
                            setDenyAppealDialog({ open: true, profileId: selectedTask.profile.id });
                          }}
                          variant="outline"
                          className="flex-1 text-red-600 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Deny Appeal
                        </Button>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() => unassignTaskMutation.mutate({ profileId: selectedTask.profile.id })}
                          variant="outline"
                          className="flex-1"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Unassign Task
                        </Button>
                        <Button
                          onClick={() => sendToManagerMutation.mutate({ profileId: selectedTask.profile.id })}
                          variant="outline"
                          className="flex-1"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send to Manager
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

        {/* Request More Info Dialog */}
        <Dialog open={actionRequiredDialog.open} onOpenChange={(open) => setActionRequiredDialog({ open, profileId: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request More Information</DialogTitle>
              <DialogDescription>
                Tell the user what additional information or documents they need to provide
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={actionRequiredNotes}
              onChange={(e) => setActionRequiredNotes(e.target.value)}
              placeholder="Example: Please upload a photo of your business license and provide at least 3 examples of your recent work..."
              rows={5}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setActionRequiredDialog({ open: false, profileId: null });
                setActionRequiredNotes('');
              }}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  actionRequiredMutation.mutate({ profileId: actionRequiredDialog.profileId, notes: actionRequiredNotes });
                  setActionRequiredDialog({ open: false, profileId: null });
                  setActionRequiredNotes('');
                }}
                disabled={!actionRequiredNotes.trim()}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Request to User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, profileId: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject User</DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting this user's profile
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialog({ open: false, profileId: null })}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  rejectMutation.mutate({ profileId: rejectDialog.profileId, reason: rejectionReason });
                  setRejectDialog({ open: false, profileId: null });
                  setRejectionReason('');
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Reject User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Suspend User Dialog */}
        <Dialog open={suspendDialog.open} onOpenChange={(open) => setSuspendDialog({ open, profileId: null, profileName: '', fromRiskReview: false })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspend User</DialogTitle>
              <DialogDescription>
                Suspend {suspendDialog.profileName}? They will not be able to access the platform and will see your reason.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              placeholder="Reason for suspension (will be shown to the user)..."
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setSuspendDialog({ open: false, profileId: null, profileName: '', fromRiskReview: false })}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  suspendUserMutation.mutate({ 
                    profileId: suspendDialog.profileId, 
                    reason: suspensionReason,
                    fromRiskReview: suspendDialog.fromRiskReview || false
                  });
                  setSuspendDialog({ open: false, profileId: null, profileName: '', fromRiskReview: false });
                  setSuspensionReason('');
                }}
                disabled={!suspensionReason.trim()}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Suspend User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, profileId: null, profileName: '' })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to permanently delete {deleteDialog.profileName}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Reason for deletion (required)..."
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog({ open: false, profileId: null, profileName: '' })}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!deleteReason.trim()) {
                    toast.error('Please provide a reason for deletion');
                    return;
                  }
                  deleteUserMutation.mutate({ profileId: deleteDialog.profileId, reason: deleteReason });
                  setDeleteDialog({ open: false, profileId: null, profileName: '' });
                  setDeleteReason('');
                }}
                disabled={!deleteReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                Confirm Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send for Review Dialog */}
        <Dialog open={sendForReviewDialog.open} onOpenChange={(open) => setSendForReviewDialog({ open, profileId: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send for Admin Review</DialogTitle>
              <DialogDescription>
                Why are you sending this profile for further review by team@twofoldvisuals.com?
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Example: Need additional verification of credentials, unusual business structure, etc..."
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setSendForReviewDialog({ open: false, profileId: null });
                setReviewNotes('');
              }}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  sendForReviewMutation.mutate({ profileId: sendForReviewDialog.profileId, notes: reviewNotes });
                }}
                disabled={!reviewNotes.trim() || sendForReviewMutation.isLoading}
                className="bg-stone-900 hover:bg-stone-800"
              >
                <Send className="w-4 h-4 mr-2" />
                Send for Review
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Deny Appeal Dialog */}
        <Dialog open={denyAppealDialog.open} onOpenChange={(open) => setDenyAppealDialog({ open, profileId: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deny Rejection Appeal</DialogTitle>
              <DialogDescription>
                This user will not be able to access the platform. Provide a clear reason for the denial.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                placeholder="Explain why the appeal is being denied..."
                value={denyAppealDialog.reason || ''}
                onChange={(e) => setDenyAppealDialog({ ...denyAppealDialog, reason: e.target.value })}
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDenyAppealDialog({ open: false, profileId: null })}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  const profile = allProfiles.find(p => p.id === denyAppealDialog.profileId);
                  await base44.entities.VendorProfile.update(denyAppealDialog.profileId, {
                    appeal_status: 'denied',
                    appeal_denial_reason: denyAppealDialog.reason
                  });
                  await base44.entities.Notification.create({
                    user_id: profile.user_id,
                    type: 'new_message',
                    title: 'Appeal Denied',
                    message: 'Your rejection appeal has been reviewed and denied.',
                    reference_id: profile.id
                  });
                  await base44.entities.AdminAction.create({
                    admin_id: user.email,
                    admin_name: getAdminDisplayName(user),
                    action_type: 'appeal_denied',
                    target_id: profile.user_id,
                    target_name: profile.full_name,
                    notes: denyAppealDialog.reason
                  });
                  queryClient.invalidateQueries(['allVendorProfiles']);
                  setDenyAppealDialog({ open: false, profileId: null });
                  toast.success('Appeal denied');
                }}
                disabled={!denyAppealDialog.reason?.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                Deny Appeal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send to Manager Dialog */}
        <Dialog open={sendToManagerDialog.open} onOpenChange={(open) => setSendToManagerDialog({ open, profileId: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Task to Manager</DialogTitle>
              <DialogDescription>
                Explain why you're escalating this task to team@twofoldvisuals.com
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={managerReason}
              onChange={(e) => setManagerReason(e.target.value)}
              placeholder="Example: Need clarification on verification requirements, unsure about policy, etc..."
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setSendToManagerDialog({ open: false, profileId: null });
                setManagerReason('');
              }}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  sendToManagerMutation.mutate({ 
                    profileId: sendToManagerDialog.profileId, 
                    reason: managerReason 
                  });
                }}
                disabled={!managerReason.trim() || sendToManagerMutation.isLoading}
                className="bg-stone-900 hover:bg-stone-800"
              >
                <Send className="w-4 h-4 mr-2" />
                Send to Manager
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manager Resolution Dialog */}
        <Dialog open={managerResolutionDialog.open} onOpenChange={(open) => setManagerResolutionDialog({ open, profileId: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Task - Manager Resolution</DialogTitle>
              <DialogDescription>
                Your notes will be sent to the admin who escalated this task for educational purposes
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={managerResolution}
              onChange={(e) => setManagerResolution(e.target.value)}
              placeholder="Explain how you handled this task and what the admin should know for future similar cases..."
              rows={5}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setManagerResolutionDialog({ open: false, profileId: null });
                setManagerResolution('');
              }}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  completeManagerTaskMutation.mutate({ 
                    profileId: managerResolutionDialog.profileId, 
                    resolution: managerResolution 
                  });
                }}
                disabled={!managerResolution.trim() || completeManagerTaskMutation.isLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Complete & Notify Admin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI Risk Assessment Modal */}
        <AIRiskAssessment
          open={aiAssessmentModal.open}
          onClose={() => setAiAssessmentModal({ open: false, assessment: null })}
          assessment={aiAssessmentModal.assessment}
        />

        {/* Invite User Dialog */}
        <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite User to VendorCover</DialogTitle>
              <DialogDescription>
                Send an email invitation to join the platform
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium text-stone-700 mb-2 block">
                Email Address
              </label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="vendor@example.com"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => sendInviteMutation.mutate(inviteEmail)}
                disabled={!inviteEmail || sendInviteMutation.isLoading}
                className="bg-stone-900 hover:bg-stone-800"
              >
                <Mail className="w-4 h-4 mr-2" />
                {sendInviteMutation.isLoading ? 'Sending...' : 'Send Invite'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Online Users Dialog */}
        <OnlineUsersDialog 
          open={onlineUsersDialog} 
          onClose={() => setOnlineUsersDialog(false)} 
        />
        </div>
        );
        }

  return (
    <div className="space-y-8 w-full max-w-full overflow-x-hidden">
      {/* Guided Tour for first-time users */}
      {user && vendorProfile?.approval_status === 'approved' && (
        <GuidedTour userEmail={user.email} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            Welcome back, {vendorProfile.full_name?.split(' ')[0]}
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">Here's what's happening with your vendor account</p>
        </div>
        <Button asChild className="bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900">
          <Link to={createPageUrl('PostRequest')}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Post a Job
          </Link>
        </Button>
      </div>

      {/* Email Verification Prompt */}
      <EmailVerificationPrompt user={user} />

      {/* Profile Completeness */}
      {vendorProfile?.approval_status === 'approved' && (
        <ProfileCompleteness profile={vendorProfile} />
      )}

      {/* Tasks to Review */}
      {(() => {
        if (!user || !myRequests || !applicationsToMyJobs || !agreements) return null;
        
        const tasks = [];
        
        // Applications pending review (for requesters)
        myRequests.forEach(job => {
          if (job.status === 'open') {
            const jobApps = applicationsToMyJobs.filter(a => a.help_request_id === job.id && a.status === 'pending');
            if (jobApps.length > 0) {
              tasks.push({
                id: `apps-${job.id}`,
                title: `${jobApps.length} Application${jobApps.length > 1 ? 's' : ''} to Review`,
                description: `New applicants for "${job.title}"`,
                url: createPageUrl(`JobDetails?id=${job.id}`),
                icon: Briefcase,
                color: 'blue',
                urgent: false
              });
            }
          }
        });

        // Agreements to sign
        agreements.forEach(agreement => {
          const isRequester = agreement.requester_id === user?.email;
          const isVendor = agreement.vendor_id === user?.email;
          const needsSignature = (isRequester && !agreement.requester_confirmed) || (isVendor && !agreement.vendor_confirmed);
          
          if (needsSignature) {
            tasks.push({
              id: `agreement-${agreement.id}`,
              title: 'Sign Agreement',
              description: `Agreement pending for job`,
              url: createPageUrl(`Agreement?jobId=${agreement.help_request_id}`),
              icon: FileText,
              color: 'amber',
              urgent: true
            });
          }
        });

        // Job status updates needed (when it's event day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const acceptedJobs = appliedJobs?.filter(job => 
          job.accepted_vendor_id === user?.email && job.status === 'filled'
        ) || [];
        const filledRequests = myRequests?.filter(job => job.status === 'filled') || [];
        
        [...acceptedJobs, ...filledRequests].forEach(job => {
          const eventDate = new Date(job.event_date);
          eventDate.setHours(0, 0, 0, 0);
          const isToday = eventDate.getTime() === today.getTime();
          
          if (isToday && job.status === 'filled' && job.job_status === 'pending') {
            tasks.push({
              id: `status-${job.id}`,
              title: 'Update Job Status',
              description: `"${job.title}" is today - update status`,
              url: createPageUrl(`JobDetails?id=${job.id}`),
              icon: Clock,
              color: 'orange',
              urgent: true
            });
          }
        });

        // Payment confirmations needed
        filledRequests.forEach(job => {
          if (job.status === 'completed' && job.payment_status === 'pending') {
            tasks.push({
              id: `payment-${job.id}`,
              title: 'Confirm Payment',
              description: `Mark payment as complete for "${job.title}"`,
              url: createPageUrl(`JobDetails?id=${job.id}`),
              icon: DollarSign,
              color: 'emerald',
              urgent: false
            });
          }
        });

        return tasks.length > 0 ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <AlertCircle className="w-5 h-5" />
                Tasks to Review ({tasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks.map(task => {
                const Icon = task.icon;
                const colorClasses = {
                  blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-900',
                  amber: 'bg-amber-100 border-amber-300 hover:bg-amber-200 text-amber-900',
                  orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-900',
                  emerald: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-900'
                };
                
                return (
                  <Link
                    key={task.id}
                    to={task.url}
                    className={`block p-3 rounded-lg border transition-all ${colorClasses[task.color]}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        task.color === 'blue' ? 'bg-blue-100' :
                        task.color === 'amber' ? 'bg-amber-200' :
                        task.color === 'orange' ? 'bg-orange-100' :
                        'bg-emerald-100'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold line-clamp-1">{task.title}</p>
                          {task.urgent && (
                            <Badge className="bg-red-500 text-white text-xs">Urgent</Badge>
                          )}
                        </div>
                        <p className="text-sm opacity-90 line-clamp-1 mt-0.5">{task.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 shrink-0 mt-2" />
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        ) : null;
      })()}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to={createPageUrl('MyJobs')} className="block">
          <Card className="border-stone-200 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500 dark:text-stone-400">Posted Jobs</p>
                  <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">{openRequests}</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('MyJobs')} className="block">
          <Card className="border-stone-200 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500 dark:text-stone-400">Pending Apps</p>
                  <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">{pendingApplications}</p>
                </div>
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('MyJobs')} className="block">
          <Card className="border-stone-200 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500 dark:text-stone-400">Jobs Booked</p>
                  <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">{acceptedApplications}</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('PayHistory')} className="block">
          <Card className="border-stone-200 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500 dark:text-stone-400">Total Earned</p>
                  <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">${totalEarned.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('MyJobs')} className="block">
          <Card className="border-stone-200 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500 dark:text-stone-400">Action Items</p>
                  <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">{tasksCount}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Confirm agreements & payments</p>
                </div>
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Upcoming Jobs */}
      {upcomingJobs.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Calendar className="w-5 h-5" />
              Upcoming Jobs (Next 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingJobs.map(job => (
              <Link 
                key={job.id}
                to={createPageUrl(`JobDetails?id=${job.id}`)}
                className="block p-3 bg-white rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-blue-900 line-clamp-1">{job.title}</p>
                    <p className="text-xs text-blue-700 mt-1">
                      {format(new Date(job.event_date), 'MMM d, yyyy')} • {job.city}, {job.state}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-600 shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions & Recent Jobs */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="border-stone-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link 
              to={createPageUrl('AvailableJobs')}
              className="flex items-center justify-between p-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <Briefcase className="w-5 h-5 text-stone-600" />
                </div>
                <span className="font-medium text-stone-900">Browse Jobs</span>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to={createPageUrl('MyJobs')}
              className="flex items-center justify-between p-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <Calendar className="w-5 h-5 text-stone-600" />
                </div>
                <span className="font-medium text-stone-900">My Jobs</span>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to={createPageUrl('Profile')}
              className="flex items-center justify-between p-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-5 h-5 text-stone-600" />
                </div>
                <span className="font-medium text-stone-900">Update Profile</span>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>

        {/* Recent Jobs */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Latest Job Opportunities</h2>
            <Link 
              to={createPageUrl('AvailableJobs')}
              className="text-sm font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentJobs.length > 0 ? (
              recentJobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))
            ) : (
              <Card className="border-stone-200">
                <CardContent className="p-8 text-center">
                  <AlertCircle className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
                  <p className="text-stone-500 dark:text-stone-400">No open jobs at the moment</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}