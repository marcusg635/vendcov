import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, CheckCircle2, XCircle, AlertCircle, MessageSquare, TrendingUp, Eye, Mail, Trash2, Ban, Sparkles } from 'lucide-react';

export default function AdminGuide() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      if (u?.role !== 'admin') {
        navigate(createPageUrl('Dashboard'));
        return;
      }
      setUser(u);
    };
    loadUser();
  }, [navigate]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Admin Guide</h1>
        <p className="text-stone-600 mt-1">Complete guide to managing VendorCover as an administrator</p>
      </div>

      {/* Dashboard Overview */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Admin Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Task Management</h3>
            <p className="text-stone-600 text-sm mb-2">
              The dashboard shows all pending tasks that need attention:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li><Badge className="bg-blue-600 text-white">Profile Reviews</Badge> - New user profiles awaiting initial approval</li>
              <li><Badge className="bg-orange-600 text-white">Risk Reviews</Badge> - Profiles flagged by AI for potential fraud or legitimacy concerns</li>
              <li><Badge className="bg-amber-600 text-white">User Submitted Info</Badge> - Users who provided additional requested information</li>
              <li><Badge className="bg-purple-600 text-white">Pending Appeals</Badge> - Rejected or suspended users appealing their status</li>
              <li><Badge className="bg-emerald-600 text-white">Support Chats</Badge> - Unassigned user support requests</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Assigning Tasks</h3>
            <p className="text-stone-600 text-sm">
              Click "Assign to Me" on any unassigned task to claim it. Once assigned, it appears in your "Assigned to Me" section. 
              This prevents multiple admins from working on the same task simultaneously. You can unassign, reassign to another admin, 
              or send complex cases to the account owner for review.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Quick Stats</h3>
            <p className="text-stone-600 text-sm">
              Click on any stat card to view detailed information. Track total users, approved/pending users, suspended accounts, 
              active jobs, and pending tasks across all categories.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Risk Assessment */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-700" />
            AI Risk Assessment System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">How It Works</h3>
            <p className="text-blue-800 text-sm mb-2">
              VendorCover uses AI to automatically assess profile legitimacy and detect potential fraud:
            </p>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1 ml-4">
              <li>AI reverse-image searches profile photos to verify authenticity</li>
              <li>Searches for social media profiles (Facebook, Instagram, LinkedIn) and verifies name matches</li>
              <li>Checks if social profiles mention the business (positive signal if they do)</li>
              <li>Validates portfolio links and analyzes website content</li>
              <li>Investigates email addresses for associations with multiple unrelated businesses</li>
              <li>Checks phone numbers for legitimacy (flags VoIP/burner numbers)</li>
              <li>Searches for fraud reports, scam warnings, or complaints</li>
              <li>Calculates a risk score (0-100) and provides detailed findings</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Risk Assessment Triggers</h3>
            <p className="text-blue-800 text-sm mb-2">
              AI assessments run automatically when:
            </p>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1 ml-4">
              <li>New profiles are created (during initial review)</li>
              <li>Users update their profile information (to catch changes)</li>
              <li>Admins manually trigger re-assessment from user edit page</li>
              <li>Bulk assessments are run on existing profiles</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Using Assessment Results</h3>
            <p className="text-blue-800 text-sm mb-2">
              When reviewing risk assessments:
            </p>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1 ml-4">
              <li><strong>Low Risk (&lt;45):</strong> Auto-approved if pending, no action needed</li>
              <li><strong>Moderate Risk (45-70):</strong> Review green/red flags and profile details carefully</li>
              <li><strong>High Risk (&gt;70):</strong> Investigate thoroughly, likely scam or fake</li>
              <li>Click URLs in findings to manually verify information online</li>
              <li>Use "Mark as No Risk" button to clear flags after manual review</li>
              <li>View assessment history to see changes over time</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Important Notes</h3>
            <p className="text-blue-800 text-sm">
              AI is a tool to assist you, not replace your judgment. Always review findings, check linked sources, and make 
              final decisions based on the full context. Some legitimate vendors may lack online presence (new businesses, privacy preferences). 
              Use your discretion and request additional info when needed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* User Approval */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Reviewing User Profiles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Profile Review Process</h3>
            <p className="text-stone-600 text-sm mb-2">
              When reviewing new or updated user profiles:
            </p>
            <ol className="list-decimal list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Click on a pending task to assign it to yourself</li>
              <li>Review AI risk assessment (if available) - check risk score and findings</li>
              <li>Examine profile details: name, business, bio, services, location</li>
              <li>View and verify profile photo and business logo</li>
              <li>Check portfolio links - click them to verify they work and look legitimate</li>
              <li>Review uploaded documents (insurance, credentials)</li>
              <li>Make a decision: Approve, Request More Info, Reject, or Send to Manager</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Approval Actions</h3>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li><CheckCircle2 className="w-4 h-4 inline text-emerald-600 mr-1" /><strong>Approve:</strong> User gains immediate platform access</li>
              <li><AlertCircle className="w-4 h-4 inline text-amber-600 mr-1" /><strong>Request Info:</strong> Ask for specific missing/unclear information</li>
              <li><XCircle className="w-4 h-4 inline text-red-600 mr-1" /><strong>Reject:</strong> Deny access with clear reason (user can appeal)</li>
              <li><Shield className="w-4 h-4 inline text-blue-600 mr-1" /><strong>Send to Manager:</strong> Escalate complex cases for owner review</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">What to Look For</h3>
            <p className="text-stone-600 text-sm mb-2">Good profiles should have:</p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Clear, genuine selfie photo (not stock photo or celebrity)</li>
              <li>Professional business name or legitimate personal name</li>
              <li>Bio that describes their services and experience</li>
              <li>At least one working portfolio link or social media profile</li>
              <li>Complete contact info (phone, email) and accurate location</li>
              <li>Relevant service types and realistic experience years</li>
              <li>Matching information across profile, links, and AI findings</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Red Flags to Watch For</h3>
            <p className="text-stone-600 text-sm mb-2">Be cautious if you see:</p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Stock photos, celebrity photos, or stolen images (check AI findings)</li>
              <li>Broken or non-existent portfolio links</li>
              <li>Email associated with multiple unrelated businesses</li>
              <li>VoIP/burner phone numbers (not always bad, but investigate)</li>
              <li>Name mismatches between profile and social media</li>
              <li>Social profiles showing different employer/business</li>
              <li>Vague or generic bios with no specific experience</li>
              <li>Incomplete profile or refusal to provide required information</li>
              <li>Fraud warnings or complaints found online</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Risk Review Tasks */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-700" />
            Risk Assessment Review Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-orange-900 mb-2">When Risk Tasks Are Created</h3>
            <p className="text-orange-800 text-sm mb-2">
              Risk review tasks are created separately from profile approval tasks for profiles flagged as moderate/high risk:
            </p>
            <ul className="list-disc list-inside text-sm text-orange-800 space-y-1 ml-4">
              <li>Created ONLY when AI risk score is 45 or higher (moderate to high risk)</li>
              <li>Generated for ALL profiles regardless of approval status (pending, approved, or rejected)</li>
              <li>Triggered by bulk AI assessments or profile updates</li>
              <li>Completely independent from "Profile Review" tasks (which are only for new pending profiles)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-orange-900 mb-2">Reviewing Risk Tasks</h3>
            <p className="text-orange-800 text-sm mb-2">
              Risk tasks show side-by-side view of AI assessment and full profile:
            </p>
            <ul className="list-disc list-inside text-sm text-orange-800 space-y-1 ml-4">
              <li>Review AI findings: green flags, red flags, risk score</li>
              <li>Click all URLs in findings to manually verify information</li>
              <li>Check social media profiles found by AI</li>
              <li>Verify portfolio links and photo authenticity</li>
              <li>Review profile details alongside assessment results</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-orange-900 mb-2">Risk Review Actions</h3>
            <ul className="list-disc list-inside text-sm text-orange-800 space-y-1 ml-4">
              <li><strong>Complete Review (No Action):</strong> Profile checked, no issues found, clear risk flag</li>
              <li><strong>Mark as No Risk:</strong> Manually override AI and clear risk flag (also on user edit page)</li>
              <li><strong>Suspend User:</strong> Serious fraud/safety concerns, suspend account with reason</li>
              <li><strong>Unassign:</strong> Return to pool for another admin or future review</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Managing Users
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Viewing and Editing User Profiles</h3>
            <p className="text-stone-600 text-sm mb-2">
              Access full user details from All Users page or by clicking usernames anywhere:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>View complete profile information and verification status</li>
              <li>See job history, earnings, applications, and completed work</li>
              <li>Check reviews, ratings, and reliability scores</li>
              <li>Review admin actions, reports filed against user, and internal notes</li>
              <li>View login history and session data</li>
              <li>Access full AI risk assessment and verification history</li>
              <li>Edit profile information if corrections are needed</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Suspending Users</h3>
            <p className="text-stone-600 text-sm mb-2">
              If a user violates terms, behaves inappropriately, or is flagged as high-risk:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Click "Suspend User" from their profile or task actions</li>
              <li>Provide a clear, specific reason for suspension</li>
              <li>User is immediately locked out and notified</li>
              <li>Suspended users can submit an appeal through their dashboard</li>
              <li>Review appeals from the Admin Dashboard pending tasks</li>
              <li>Approve appeal to restore access, or deny to make suspension permanent</li>
              <li>Denied appeals can result in permanent account disablement</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Adding Internal Notes</h3>
            <p className="text-stone-600 text-sm">
              Click "Add Internal Note" on user profiles to document observations, decisions, or concerns. Notes are private 
              (admin-only) and timestamped with your name. Use notes to track behavior patterns, verification attempts, or 
              communicate with other admins about specific users.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Direct Messaging</h3>
            <p className="text-stone-600 text-sm">
              Send direct messages to users for quick communication about their profile, requests for clarification, or follow-ups. 
              Users receive notifications and can respond through their messages inbox.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Support Management */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Support & Communication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Support Chats</h3>
            <p className="text-stone-600 text-sm mb-2">
              Handle user support requests:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>View all support chats from "Support Chats" page</li>
              <li>Unassigned chats show in dashboard - click to assign to yourself</li>
              <li>Respond to user questions, resolve issues, provide guidance</li>
              <li>Close chats when issues are resolved</li>
              <li>Closing a chat for a user with denied appeal permanently disables their account</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Support Tickets</h3>
            <p className="text-stone-600 text-sm">
              Review bug reports, feature requests, and suggestions from the Support Tickets page. Update ticket status 
              (open, in progress, resolved, denied) and provide responses to keep users informed about progress.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">User Reports</h3>
            <p className="text-stone-600 text-sm mb-2">
              Handle reports of misconduct, fraud, no-shows, and policy violations:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Review report details, reporter information, and context</li>
              <li>Investigate by viewing reported user's profile, history, and activity</li>
              <li>Add admin notes documenting your investigation</li>
              <li>Take appropriate action: warning, suspension, or dismiss if unfounded</li>
              <li>Update report status and document action taken</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Admin Chat</h3>
            <p className="text-stone-600 text-sm">
              Use Admin Chat to communicate with other administrators about platform issues, difficult decisions, policy questions, 
              or coordination. This ensures consistency across admin actions and helps share knowledge.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Job Management */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Managing Jobs and Marketplace
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Viewing All Jobs</h3>
            <p className="text-stone-600 text-sm">
              Click on job stat cards in the dashboard or go to My Jobs page as admin to view all jobs filtered by status 
              (open, filled, completed, cancelled). Search within each category to find specific jobs quickly.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Deleting Jobs</h3>
            <p className="text-stone-600 text-sm mb-2">
              If a job violates terms, is spam, or is fraudulent:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Open the job details page</li>
              <li>Click the delete button (trash icon)</li>
              <li>Provide a clear reason for deletion (logged in admin actions)</li>
              <li>Confirm deletion - this permanently removes the job and all related data</li>
              <li>All applicants are automatically notified of the deletion</li>
              <li>Related applications, agreements, and messages are deleted</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Monitoring Job Activity</h3>
            <p className="text-stone-600 text-sm">
              Admins can view all job postings, applications, messages, and agreements. Use this to identify patterns of abuse, 
              monitor platform health, and ensure users are following Terms of Service.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Analytics */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Analytics & Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Platform Analytics</h3>
            <p className="text-stone-600 text-sm mb-2">
              View detailed analytics including:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>User growth over time and registration trends</li>
              <li>Job posting activity and completion rates</li>
              <li>Service type distribution and demand patterns</li>
              <li>Geographic activity by state (most active states)</li>
              <li>Platform engagement metrics (applications, messages, reviews)</li>
              <li>Approval/rejection rates and reasons</li>
              <li>Average risk scores and verification outcomes</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">State Analytics</h3>
            <p className="text-stone-600 text-sm">
              Click on any state in the analytics dashboard to see detailed regional metrics including top vendors, recent activity, 
              job concentration, and service demand by area.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Simulate User */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Simulate User Feature
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Testing User Experience</h3>
            <p className="text-stone-600 text-sm mb-2">
              View the app as any user to troubleshoot issues or understand their perspective:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Go to "Simulate User" from the admin menu</li>
              <li>Search for a user by name, email, or business</li>
              <li>Click "Simulate" to view the app as that user</li>
              <li>Blue banner indicates simulation mode</li>
              <li>See exactly what they see: jobs, messages, profile status</li>
              <li>Click "Back to Admin View" when done</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Restrictions</h3>
            <p className="text-stone-600 text-sm">
              Regular admins cannot simulate other admins or team@twofoldvisuals.com. Only the account owner can simulate other admins.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Invitations */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Inviting New Users
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Sending Invitations</h3>
            <p className="text-stone-600 text-sm mb-2">
              Click "Invite User" from the dashboard:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Enter the vendor's email address</li>
              <li>Your email client opens with a pre-filled invitation message</li>
              <li>The invitation is tracked in the system</li>
              <li>When they register, invitation status updates to "Registered"</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Tracking Invitations</h3>
            <p className="text-stone-600 text-sm">
              View all sent invitations, who sent them, and their status (sent/registered) from the Invitations page. 
              Delete unused invitations if needed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Admin Activity (team@twofoldvisuals.com only) */}
      {user?.email === 'team@twofoldvisuals.com' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-700" />
              Admin Activity Log (Account Owner Only)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-800 mb-2">
              As the account owner, you have access to the Admin Activity page which logs all admin actions including:
            </p>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1 ml-4">
              <li>Profile approvals, rejections, and info requests</li>
              <li>User suspensions, appeals, and restorations</li>
              <li>Risk assessments completed and overrides</li>
              <li>Job deletions and content moderation</li>
              <li>Admin permission changes and account management</li>
              <li>Timestamps, reasons, and admin names for all actions</li>
            </ul>
            <p className="text-sm text-blue-800 mt-2">
              This maintains accountability, transparency, and helps audit admin decisions and platform integrity.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Best Practices */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            Admin Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside text-sm text-emerald-800 space-y-2">
            <li>Review pending profiles within 24 hours to keep users engaged and platform active</li>
            <li>Always provide clear, specific reasons when rejecting or requesting more information</li>
            <li>Check AI risk assessment findings before making approval decisions</li>
            <li>Click URLs in AI findings to manually verify social media, portfolios, and business info</li>
            <li>Be lenient when personal social media doesn't mention business (normal privacy behavior)</li>
            <li>Focus on red flags: stolen photos, multiple businesses for same email, fraud warnings</li>
            <li>Use "Mark as No Risk" for legitimate profiles incorrectly flagged by AI</li>
            <li>Respond to support chats promptly and professionally</li>
            <li>Investigate user reports thoroughly before taking disciplinary action</li>
            <li>Document all important decisions with internal notes</li>
            <li>Use simulate feature to understand user-reported issues from their perspective</li>
            <li>Check the dashboard daily for urgent tasks and time-sensitive reviews</li>
            <li>Communicate with other admins through Admin Chat for consistency and collaboration</li>
            <li>Escalate complex or uncertain cases to the account owner for final decision</li>
            <li>Monitor analytics to identify trends, issues, or areas needing attention</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}