import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, X, Send, FileText, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function VerificationRequest() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['vendorProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.VendorProfile.filter({ user_id: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email
  });

  const { data: verificationRequest } = useQuery({
    queryKey: ['verificationRequest', profile?.id],
    queryFn: async () => {
      const requests = await base44.entities.ProfileVerification.filter({ 
        profile_id: profile.id,
        status: 'waiting_for_user'
      }, '-created_date');
      return requests[0] || null;
    },
    enabled: !!profile?.id
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return {
          name: file.name,
          url: file_url,
          uploaded_at: new Date().toISOString()
        };
      });
      
      const newFiles = await Promise.all(uploadPromises);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      toast.success('Files uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload files');
    }
    setIsUploading(false);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const submitResponseMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.ProfileVerification.update(verificationRequest.id, {
        user_response: responseMessage,
        user_files: uploadedFiles,
        status: 'user_responded'
      });

      // Update profile to user_submitted_info status - creates new unassigned task for admins
      await base44.entities.VendorProfile.update(profile.id, {
        approval_status: 'user_submitted_info',
        action_required_notes: null,
        reviewing_admin_id: null,
        reviewing_admin_name: null
      });

      // Notify admin
      await base44.entities.Notification.create({
        user_id: verificationRequest.admin_id,
        type: 'new_message',
        title: 'Verification Response Received',
        message: `${profile.full_name} has responded to your verification request`,
        reference_id: verificationRequest.id
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries(['verificationRequest']);
      await queryClient.invalidateQueries(['vendorProfile']);
      toast.success('Information submitted - awaiting admin review');
      navigate(createPageUrl('Dashboard'));
    },
    onError: () => {
      toast.error('Failed to send response');
    }
  });

  if (!user || !profile || !verificationRequest) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Verification Request</h1>
          <p className="text-sm text-stone-600">Respond to admin's request</p>
        </div>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-900">Admin Needs More Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-lg p-4 border border-amber-200">
            <p className="text-sm font-medium text-stone-700 mb-1">
              From: {verificationRequest.admin_name}
            </p>
            <p className="text-sm text-stone-600 whitespace-pre-wrap">
              {verificationRequest.request_message}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Response</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Message to Admin</Label>
            <Textarea
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              placeholder="Provide the requested information..."
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label>Upload Files/Photos</Label>
            <Input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <p className="text-xs text-stone-500">
              Upload any documents or photos requested by admin
            </p>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Uploaded Files ({uploadedFiles.length})</Label>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg">
                    {file.name.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-stone-600" />
                    )}
                    <span className="text-sm text-stone-700 flex-1 truncate">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={() => submitResponseMutation.mutate()}
            disabled={!responseMessage.trim() || submitResponseMutation.isLoading}
            className="w-full bg-stone-900 hover:bg-stone-800"
          >
            {submitResponseMutation.isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Response to Admin
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}