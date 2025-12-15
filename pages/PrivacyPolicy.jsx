import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-stone-900">Privacy Policy</h1>
        <p className="text-stone-600 mt-1">Last updated: January 2025</p>
      </div>

      <Card className="border-stone-200">
        <CardContent className="p-6 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">1. Subscription and Payment Information</h2>
            <p className="text-stone-600 text-sm leading-relaxed mb-2">
              VendorCover offers both free and paid subscription tiers. To access premium features such as posting jobs, applying to jobs, and live chat support, users must maintain an active paid subscription at $9.99 per month.
            </p>
            <p className="text-stone-600 text-sm leading-relaxed mb-2">
              When you subscribe, we use Stripe as our payment processor to securely handle all subscription payments and billing information. Stripe collects and processes your payment information according to their privacy policy. We do not store your credit card details on our servers.
            </p>
            <p className="text-stone-600 text-sm leading-relaxed">
              We store the following subscription-related data:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Stripe customer ID (to link your account with Stripe)</li>
              <li>Subscription status (active, past due, canceled, etc.)</li>
              <li>Subscription ID and billing cycle dates</li>
              <li>Payment history and transaction records</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">2. Information We Collect</h2>
            <p className="text-stone-600 text-sm leading-relaxed mb-2">
              We collect the following types of information:
            </p>
            <p className="text-stone-600 text-sm font-medium mb-1">Information You Provide:</p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4 mb-3">
              <li>Profile information (name, email, phone number, business name, bio)</li>
              <li>Photos (selfie, business logo) and portfolio examples you upload</li>
              <li>Service types, specialties, and experience level</li>
              <li>Location data (address, city, state, service areas)</li>
              <li>Portfolio links and social media URLs</li>
              <li>Insurance documents and credentials</li>
              <li>Messages and communications through the platform</li>
              <li>Job postings, applications, and agreements</li>
              <li>Payment information you share with other users (we do not store payment credentials)</li>
              <li>Support tickets, appeals, and feedback</li>
            </ul>
            <p className="text-stone-600 text-sm font-medium mb-1">Information Collected Automatically:</p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4 mb-3">
              <li>Usage data, browsing activity, and feature interactions</li>
              <li>Device information (type, operating system, browser)</li>
              <li>IP addresses, session data, and login history</li>
              <li>Location data (approximate based on IP or device settings)</li>
              <li>Time stamps for all activities and interactions</li>
              <li>Click-through rates, page views, and navigation patterns</li>
            </ul>
            <p className="text-stone-600 text-sm font-medium mb-1">Information from Third-Party Sources:</p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Public social media profiles and business listings</li>
              <li>Online portfolio websites and professional directories</li>
              <li>Business verification databases</li>
              <li>Fraud detection and risk assessment services</li>
              <li>Reverse image search results from public sources</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">3. How We Use Your Information</h2>
            <p className="text-stone-600 text-sm leading-relaxed mb-2">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Provide, maintain, operate, and improve our services and features</li>
              <li>Process and manage subscription payments and billing</li>
              <li>Connect vendors with coverage opportunities and job postings</li>
              <li>Verify your identity and authenticate your profile</li>
              <li>Conduct AI-powered risk assessments and fraud detection</li>
              <li>Prevent fraud, scams, fake profiles, and platform abuse</li>
              <li>Process and display your profile to other users</li>
              <li>Send notifications about jobs, applications, messages, and platform updates</li>
              <li>Respond to support requests and provide customer service</li>
              <li>Monitor platform safety, user conduct, and Terms compliance</li>
              <li>Generate analytics, insights, and usage statistics</li>
              <li>Enforce our Terms of Service and User Agreement</li>
              <li>Comply with legal obligations and law enforcement requests</li>
              <li>Train and improve AI systems and algorithms</li>
              <li>Conduct research and development to enhance the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">4. How We Share Your Information</h2>
            <p className="text-stone-600 text-sm leading-relaxed mb-2">
              We share your information in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li><strong>With other vendors:</strong> Your profile, portfolio, services, location, and contact information are 
                  visible to other approved vendors on the platform</li>
              <li><strong>When you apply to jobs:</strong> Your full profile and application details are shared with the job poster</li>
              <li><strong>When you post jobs:</strong> Your name, business, and job details are visible to potential applicants</li>
              <li><strong>With administrators:</strong> All admins can view all user data, profiles, messages, jobs, applications, 
                  documents, and activity for management, safety, and verification purposes</li>
              <li><strong>With Stripe:</strong> Subscription and payment data is shared with Stripe to process payments</li>
              <li><strong>Service providers:</strong> We use third-party services for hosting, analytics, communications, AI processing, 
                  and platform infrastructure</li>
              <li><strong>AI and verification services:</strong> Your photos, links, and profile data may be sent to AI providers 
                  for risk assessment and verification</li>
              <li><strong>Legal requirements:</strong> We may disclose information if required by law, court order, subpoena, or 
                  to protect our rights and safety</li>
              <li><strong>Business transfers:</strong> Information may be transferred in connection with a merger, acquisition, 
                  sale, or reorganization</li>
              <li><strong>With your consent:</strong> We may share information for purposes you explicitly approve</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">5. AI Risk Assessment and Automated Processing</h2>
            <p className="text-stone-600 text-sm leading-relaxed mb-2">
              VendorCover uses AI-powered systems to assess profile legitimacy and platform safety. By using the App, you consent to:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Automated analysis of your photos using reverse image search technology</li>
              <li>AI-driven searches for your social media profiles, business listings, and online presence</li>
              <li>Verification of portfolio links, websites, and provided URLs</li>
              <li>Cross-referencing your email and phone number against fraud databases</li>
              <li>Calculation of risk scores based on verification results</li>
              <li>Automated decisions regarding profile approval or flagging for manual review</li>
              <li>Re-assessment when you update your profile information</li>
              <li>Storage of assessment history and verification results</li>
            </ul>
            <p className="text-stone-600 text-sm leading-relaxed mt-2">
              AI assessments are used to assist admin review but do not replace human judgment. You may appeal AI-based decisions 
              through the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">6. Data Security</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              We implement reasonable technical and organizational measures to protect your personal information, including 
              encryption, access controls, and secure hosting. However, no method of transmission over the internet or electronic 
              storage is 100% secure. We cannot guarantee absolute security and are not liable for unauthorized access, data 
              breaches, or security incidents. You are responsible for maintaining the security of your account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">7. Your Rights and Choices</h2>
            <p className="text-stone-600 text-sm leading-relaxed mb-2">
              Subject to applicable law and platform policies, you have the right to:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Access and view your profile information and data</li>
              <li>Update or correct your profile details at any time</li>
              <li>Request a copy of your data (subject to technical limitations)</li>
              <li>Opt out of marketing communications (but not platform or legal notices)</li>
              <li>Close your account at any time through account settings</li>
              <li>Appeal suspensions or rejections through the platform</li>
              <li>Cancel your subscription at any time</li>
            </ul>
            <p className="text-stone-600 text-sm leading-relaxed mt-2">
              Note: Certain data may be retained after account closure for legal compliance, dispute resolution, fraud prevention, 
              and enforcing our agreements. Deleted accounts cannot be recovered.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">8. Data Retention</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              We retain your information for as long as your account is active or as needed to provide services. After account 
              closure or termination, we may retain certain information indefinitely for the following purposes: legal compliance, 
              tax records, dispute resolution, fraud prevention, enforcing our agreements, protecting user safety, maintaining 
              platform integrity, and business analytics. Specific retention periods vary by data type and legal requirements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">9. Cookies and Tracking Technologies</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              We use cookies, local storage, and similar technologies to remember your preferences, maintain your session, 
              track usage patterns, and improve user experience. By using the App, you consent to our use of these technologies. 
              You may disable cookies in your browser, but this may limit platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">10. Children's Privacy</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              VendorCover is not intended for users under 18 years of age. We do not knowingly collect, use, or share information 
              from individuals under 18. If we become aware of a user under 18, we will immediately terminate their account and 
              delete their information. Parents or guardians who believe a minor has created an account should contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">11. California Privacy Rights</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              California residents may have additional rights under the California Consumer Privacy Act (CCPA). You may request 
              information about the categories of personal information we collect, the purposes for collection, and the categories 
              of third parties with whom we share information. Contact us to exercise these rights. Note that certain requests may 
              be subject to verification and legal limitations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">12. International Users</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              VendorCover is operated in the United States. If you access the App from outside the U.S., your information will be 
              transferred to and processed in the United States, which may have different data protection laws than your jurisdiction. 
              By using the App, you consent to this transfer and processing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">13. Changes to This Policy</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              We may update this privacy policy from time to time to reflect changes in our practices, technology, legal requirements, 
              or business operations. We will notify you of material changes by posting the new policy on this page and updating the 
              "Last updated" date. We may also send email or in-app notifications for significant changes. Your continued use after 
              changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">14. Contact Us</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              If you have questions, concerns, or requests regarding this privacy policy or your personal information, please contact us at{' '}
              <a href="mailto:team@twofoldvisuals.com" className="text-blue-600 hover:underline">
                team@twofoldvisuals.com
              </a>
              {' '}or use the "Report Problem" feature in the App. We will respond to inquiries within a reasonable timeframe.
            </p>
          </section>

          <section className="border-t pt-4 mt-6">
            <p className="text-sm italic text-stone-600">
              By using VendorCover, you acknowledge that you have read and understood this Privacy Policy and consent to the 
              collection, use, and sharing of your information as described herein.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}