import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UserAgreement() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-stone-900">User Agreement</h1>
        <p className="text-stone-600 mt-1">Last updated: January 2025</p>
      </div>

      <Card className="border-stone-200">
        <CardContent className="p-6 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">1. Acceptance of Terms</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              By accessing and using VendorCover, you accept and agree to be bound by the terms and provisions of this agreement, 
              along with our Terms of Service and Privacy Policy. If you do not agree to these terms, you must immediately cease 
              using our services and delete your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">2. Eligibility and Professional Requirements</h2>
            <p className="text-stone-600 text-sm leading-relaxed mb-2">
              You must meet the following requirements to use VendorCover:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Be at least 18 years of age</li>
              <li>Be a professional vendor in the wedding or events industry</li>
              <li>Have legal authorization to work in your jurisdiction</li>
              <li>Carry appropriate insurance and licenses for your services</li>
              <li>Provide accurate, complete, and verifiable information</li>
              <li>Submit to identity verification and background assessment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">3. Subscription and Payment Terms</h2>
            <p className="text-stone-600 text-sm leading-relaxed mb-2">
              VendorCover offers free and paid subscription plans. Premium features, including job posting, job applications, and live chat support, require an active paid subscription at $9.99 per month.
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4 mb-3">
              <li>Subscriptions automatically renew monthly unless canceled</li>
              <li>You may cancel your subscription at any time through your account settings</li>
              <li>Upon cancellation, you retain access until the end of your current billing period</li>
              <li>All subscription payments are processed securely through Stripe</li>
              <li>Refunds are handled according to our Refund Policy (generally non-refundable)</li>
              <li>We reserve the right to change subscription pricing with 30 days advance notice</li>
              <li>Failure to pay subscription fees may result in loss of premium features</li>
              <li>Past due subscriptions will lose access to premium features until payment is resolved</li>
            </ul>
            <p className="text-stone-600 text-sm leading-relaxed">
              Free plan users can browse jobs, view profiles, and submit support tickets but cannot post jobs, apply for jobs, or access live chat support.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">4. Account Registration and Security</h2>
            <p className="text-stone-600 text-sm leading-relaxed mb-2">
              When creating an account, you MUST provide:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li><strong>Required:</strong> First and last name</li>
              <li><strong>Required:</strong> Business name (or your full name if sole proprietor)</li>
              <li><strong>Required:</strong> Valid phone number</li>
              <li><strong>Required:</strong> Email address</li>
              <li><strong>Required:</strong> Profile photo (selfie for verification)</li>
              <li><strong>Required:</strong> Bio describing your services and experience</li>
              <li><strong>Required:</strong> At least one portfolio link or social media profile</li>
              <li><strong>Required:</strong> Service types, location, and experience level</li>
              <li><strong>Optional:</strong> Business logo, insurance certificate, credentials</li>
            </ul>
            <p className="text-stone-600 text-sm leading-relaxed mt-3">
              You also agree to:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Maintain accurate and up-to-date profile information</li>
              <li>Keep your account credentials secure and confidential</li>
              <li>Notify us immediately of any unauthorized access or security breach</li>
              <li>Accept full responsibility for all activities under your account</li>
              <li>Submit to profile review, approval, and ongoing verification by our team</li>
              <li>Update your profile whenever your business information changes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">5. Profile Verification and AI Risk Assessment</h2>
            <p className="text-stone-600 text-sm leading-relaxed mb-2">
              VendorCover uses AI-powered verification to ensure platform safety:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Your profile photo will be reverse-image searched to verify authenticity</li>
              <li>AI systems will search for your social media profiles and verify your identity</li>
              <li>Portfolio links will be validated and analyzed for legitimacy</li>
              <li>Email addresses and phone numbers may be cross-checked against fraud databases</li>
              <li>Business information will be verified against public records and online sources</li>
              <li>Profile updates trigger re-assessment to maintain accuracy</li>
              <li>Risk scores are calculated based on verification results</li>
              <li>High-risk profiles may be flagged for manual admin review or automatically rejected</li>
            </ul>
            <p className="text-stone-600 text-sm leading-relaxed mt-2">
              By creating a profile, you consent to these verification processes and understand that VendorCover may approve, 
              reject, or suspend your account based on AI and manual review findings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">6. User Conduct and Prohibited Activities</h2>
            <p className="text-stone-600 text-sm leading-relaxed mb-2">
              You agree NOT to:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Provide false, misleading, fraudulent, or stolen information or photos</li>
              <li>Impersonate another person, business, or entity</li>
              <li>Use photos or portfolio items that you don't own or have permission to use</li>
              <li>Engage in harassment, discrimination, threats, or abusive behavior toward any user</li>
              <li>Post inappropriate, offensive, defamatory, or illegal content</li>
              <li>Attempt to defraud, scam, deceive, or manipulate other users</li>
              <li>No-show for accepted jobs without valid reason or prior notice</li>
              <li>Fail to honor agreements made through the platform</li>
              <li>Violate intellectual property rights or copyright laws</li>
              <li>Use the App for any unlawful purpose or to facilitate illegal activities</li>
              <li>Interfere with, disrupt, hack, or compromise the App's functionality or security</li>
              <li>Create multiple accounts or circumvent suspensions or bans</li>
              <li>Scrape, harvest, or collect user data without authorization</li>
              <li>Spam users with unsolicited messages or advertisements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">7. Job Postings and Applications</h2>
            <p className="text-stone-600 text-sm leading-relaxed mb-2">
              When posting jobs or applying for work:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Posting jobs requires an active paid subscription</li>
              <li>Applying to jobs requires an active paid subscription</li>
              <li>All job postings must be legitimate, accurate, and comply with labor laws</li>
              <li>Payment terms, amounts, and methods must be clearly stated</li>
              <li>Event details (date, time, location) must be accurate</li>
              <li>Vendors are independent contractors, not employees of VendorCover or requesters</li>
              <li>VendorCover does not process, facilitate, or guarantee payments between users</li>
              <li>You must honor commitments and agreements made through the platform</li>
              <li>No-shows, cancellations, or contract breaches should be reported immediately</li>
              <li>Disputes must be resolved directly between parties</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">8. Payment Arrangements Between Users</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              Payment for services is arranged directly between vendors and requesters. VendorCover does not process, hold, or facilitate these payments. 
              We are not responsible for payment processing, disputes, non-payment, late payment, or any financial issues between users. 
              All financial transactions are handled independently between parties. Users must resolve payment disputes directly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">9. Content, Portfolio, and Intellectual Property</h2>
            <p className="text-stone-600 text-sm leading-relaxed mb-2">
              You retain ownership of your content (photos, portfolio items, documents, etc.) but grant VendorCover a 
              non-exclusive, worldwide, royalty-free, perpetual, irrevocable license to:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Display, reproduce, modify, and distribute your content within the App</li>
              <li>Use your content for marketing, promotional, and advertising purposes</li>
              <li>Store, process, and analyze your content to provide and improve services</li>
              <li>Use your content in AI training, verification, and fraud detection systems</li>
              <li>Share your content with other users as part of platform functionality</li>
            </ul>
            <p className="text-stone-600 text-sm leading-relaxed mt-2">
              You represent and warrant that you have all necessary rights to grant this license and that your content does not 
              violate any third-party rights or laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">10. Insurance and Liability Coverage</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              You are solely responsible for obtaining and maintaining appropriate insurance coverage for your services, including 
              but not limited to general liability, professional liability, equipment insurance, and workers compensation (if applicable). 
              VendorCover does not provide any insurance coverage. You agree to indemnify clients and VendorCover for any claims 
              arising from your services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">11. Taxes and Legal Compliance</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              You are responsible for all taxes, licenses, permits, and legal requirements related to your services and income 
              earned through VendorCover. This includes income taxes, self-employment taxes, sales taxes, business licenses, and 
              any other applicable fees or registrations. VendorCover does not provide tax advice or withhold taxes on your behalf.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">12. Account Suspension and Termination</h2>
            <p className="text-stone-600 text-sm leading-relaxed mb-2">
              We reserve the right to suspend, terminate, or permanently disable your account if you:
            </p>
            <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 ml-4">
              <li>Violate these terms, the Terms of Service, or platform policies</li>
              <li>Engage in fraudulent, suspicious, or illegal activity</li>
              <li>Receive multiple negative reports, reviews, or complaints from other users</li>
              <li>Fail to maintain accurate, complete, or verifiable profile information</li>
              <li>Are flagged as high-risk by AI assessment or manual review</li>
              <li>Exhibit patterns of misconduct, unreliability, or unprofessional behavior</li>
              <li>Compromise platform safety, integrity, or reputation</li>
              <li>Fail to pay subscription fees or maintain active subscription status</li>
            </ul>
            <p className="text-stone-600 text-sm leading-relaxed mt-2">
              You may appeal suspensions or rejections through the platform. Appeals are reviewed at VendorCover's sole 
              discretion and are not guaranteed to be granted. Denied appeals may result in permanent account disablement 
              with no further recourse. Account closures may result in deletion of your data, job postings, and application history.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">13. Dispute Resolution Between Users</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              Disputes between users (payment, services, conduct, etc.) must be resolved directly between the parties involved. 
              VendorCover may assist in communication or mediation but is not obligated to intervene, investigate, or resolve 
              any user-to-user disputes. Legal disputes require independent legal action between parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">14. Limitation of Liability</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              VendorCover is a platform connecting vendors. We do not employ, endorse, guarantee, or verify any vendor. We are not 
              liable for the quality, safety, legality, or reliability of services performed through the platform. You acknowledge 
              and accept that using VendorCover and working with other vendors carries inherent risks including but not limited to 
              non-payment, poor service quality, property damage, injuries, fraud, identity theft, and contract disputes. You assume 
              all such risks voluntarily and agree to hold VendorCover harmless.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">15. Changes to Terms</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              We may modify this agreement at any time without prior notice. We will update the "Last updated" date and may 
              notify users via email or in-app notification. Continued use of VendorCover after changes constitutes acceptance 
              of the modified terms. It is your responsibility to review this agreement periodically.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">16. Contact</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              Questions about this agreement? Contact us at{' '}
              <a href="mailto:team@twofoldvisuals.com" className="text-blue-600 hover:underline">
                team@twofoldvisuals.com
              </a>
              {' '}or use the "Report Problem" feature in the App.
            </p>
          </section>

          <section className="border-t pt-4 mt-6">
            <p className="text-sm italic text-stone-600">
              By using VendorCover, you acknowledge that you have read, understood, and agree to be bound by this User Agreement.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}