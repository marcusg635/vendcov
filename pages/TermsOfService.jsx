import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-stone-200">
        <CardContent className="p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-stone-500 mb-6">Last Updated: December 14, 2025</p>

          <div className="prose prose-stone max-w-none space-y-6 text-stone-700">
            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using VendorCover (the "App"), you agree to be bound by these Terms of Service ("Terms"). 
                If you do not agree to these Terms, you may not access or use the App. We reserve the right to modify these 
                Terms at any time without prior notice. Your continued use of the App constitutes acceptance of any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">2. Service Description</h2>
              <p>
                VendorCover is a marketplace platform that connects event service vendors (photographers, videographers, DJs, 
                musicians, caterers, planners, and other event professionals) with short-term job opportunities and coverage needs. 
                The App facilitates connections between users seeking help (Requesters) and users offering services (Vendors). 
                We do not guarantee any work, jobs, income, employment, or applicants. VendorCover acts solely as a platform 
                and is not a party to any agreements between users.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">3. Independent Contractor Relationship</h2>
              <p>
                All vendors on VendorCover are independent contractors. VendorCover does not employ any vendors and is not responsible 
                for any employment-related obligations, taxes, insurance, or benefits. Users are responsible for their own business 
                operations, insurance, licenses, permits, and compliance with local, state, and federal laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">4. Profile Verification & AI Risk Assessment</h2>
              <p className="mb-3">
                To ensure platform safety and quality, VendorCover implements profile verification and AI-powered risk assessment:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>All profiles undergo admin review and approval before accessing the platform</li>
                <li>Automated AI analysis may verify photos, portfolio links, social media profiles, and business information</li>
                <li>AI systems search public internet sources to assess profile legitimacy and detect potential fraud</li>
                <li>Profile updates may trigger re-assessment to maintain platform integrity</li>
                <li>VendorCover reserves the right to approve, reject, or suspend accounts based on verification results</li>
                <li>By creating a profile, you consent to these verification processes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">5. Limitation of Liability and Disclaimers</h2>
              <p className="font-semibold mb-2">IMPORTANT - READ CAREFULLY:</p>
              <p className="mb-3">
                VendorCover is provided "as is" without warranties of any kind. TO THE FULLEST EXTENT PERMITTED BY LAW, 
                WE ARE NOT RESPONSIBLE FOR:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Disputes, disagreements, or conflicts between users</li>
                <li>Damages, injuries, accidents, or losses arising from jobs, events, or services</li>
                <li>Payment disputes, non-payment, late payment, or financial issues between users</li>
                <li>The quality, safety, legality, timeliness, or reliability of services provided</li>
                <li>User conduct, actions, omissions, negligence, or misconduct</li>
                <li>No-shows, cancellations, or contract breaches by users</li>
                <li>Loss of income, business opportunities, missed jobs, or consequential damages</li>
                <li>Equipment damage, property damage, or personal injury</li>
                <li>Fraud, scams, misrepresentation, or identity theft by users</li>
                <li>Data breaches, unauthorized access, or loss of information</li>
                <li>Any problems, issues, claims, or liabilities arising from user interactions</li>
              </ul>
              <p className="font-bold">
                YOU ACKNOWLEDGE AND AGREE THAT YOU USE THIS APP ENTIRELY AT YOUR OWN RISK. ALL TRANSACTIONS, 
                AGREEMENTS, AND ARRANGEMENTS ARE SOLELY BETWEEN USERS. VENDORCOVER ASSUMES NO LIABILITY FOR ANY ASPECT OF 
                USER-TO-USER INTERACTIONS, SERVICES, OR EVENTS. YOU WAIVE ANY AND ALL CLAIMS AGAINST VENDORCOVER.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">6. User Responsibilities and Conduct</h2>
              <p className="mb-3">You agree to:</p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Provide accurate, current, and complete information including phone number, email, bio, and at least one portfolio/social link</li>
                <li>Upload a genuine profile photo for verification purposes</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Act professionally and respectfully toward all users</li>
                <li>Comply with all applicable laws, regulations, and industry standards</li>
                <li>Fulfill any commitments or agreements you make through the App</li>
                <li>Carry appropriate insurance and licenses for your services</li>
                <li>Communicate directly with other users regarding payment, terms, and expectations</li>
                <li>Report any safety concerns, fraud, or misconduct</li>
              </ul>
              <p className="mb-3">You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide false, misleading, fraudulent, or stolen information or photos</li>
                <li>Impersonate another person, business, or entity</li>
                <li>Engage in harassment, discrimination, threats, or abusive behavior</li>
                <li>Post inappropriate, offensive, defamatory, or illegal content</li>
                <li>Attempt to defraud, scam, or deceive other users</li>
                <li>Violate intellectual property rights or use copyrighted material without permission</li>
                <li>Use the App for any unlawful purpose or to facilitate illegal activities</li>
                <li>Interfere with, disrupt, or compromise the App's functionality or security</li>
                <li>Create multiple accounts or circumvent suspensions</li>
                <li>Scrape, harvest, or collect user data without authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">7. Account Approval, Suspension, and Termination</h2>
              <p className="mb-3">
                VendorCover reserves the absolute right to approve, reject, suspend, terminate, or permanently disable any user 
                account at any time, for any reason or no reason, with or without notice, and without liability. We may deny 
                access to users who:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Violate these Terms or platform policies</li>
                <li>Engage in inappropriate, fraudulent, or suspicious conduct</li>
                <li>Receive negative reports or low ratings from other users</li>
                <li>Provide incomplete, inaccurate, or unverifiable information</li>
                <li>Fail AI risk assessment or manual verification</li>
                <li>Are deemed high-risk by automated or manual review</li>
              </ul>
              <p>
                Users may appeal suspensions or rejections through the platform. Appeals are reviewed at VendorCover's sole 
                discretion. Denied appeals may result in permanent account disablement. Users may not create new accounts to 
                circumvent suspensions or bans.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">8. User Content and Portfolio</h2>
              <p className="mb-3">
                By uploading portfolios, images, documents, or other content to VendorCover, you:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Represent and warrant that you own or have full legal permission to use all content</li>
                <li>Grant VendorCover a non-exclusive, worldwide, royalty-free, perpetual license to display, reproduce, modify, 
                    and distribute your content within the App and for marketing purposes</li>
                <li>Acknowledge that your content, profile, and activity may be viewed by other users and administrators</li>
                <li>Agree that we may use, analyze, or remove any content at our discretion</li>
                <li>Consent to your content being used in AI training, analysis, and verification processes</li>
                <li>Accept that photos may be reverse-image searched and verified against public sources</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">9. Data Collection, Privacy, and Monitoring</h2>
              <p className="mb-3">
                By using VendorCover, you acknowledge and expressly consent that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>All activity, usage data, messages, applications, and interactions within the App are logged, tracked, monitored, and stored</li>
                <li>Administrators have full access to view, review, and analyze all user profiles, portfolios, applications, messages, 
                    job postings, agreements, documents, and all other user data for management, safety, fraud prevention, and operational purposes</li>
                <li>We collect and analyze usage data including device information, IP addresses, location data, browsing patterns, 
                    and behavioral analytics</li>
                <li>AI systems may analyze your profile, photos, links, and content to assess risk and verify authenticity</li>
                <li>Your information may be cross-referenced with public internet sources, social media, business directories, and 
                    fraud databases</li>
                <li>Data may be retained indefinitely for business, legal, security, or safety purposes</li>
                <li>We may use collected data to improve the App, prevent fraud, ensure user safety, and enforce these Terms</li>
                <li>Session data including login times, devices, and IP addresses are logged</li>
                <li>All administrative actions, decisions, and internal notes are recorded</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">10. Payment and Financial Transactions</h2>
              <p>
                VendorCover does NOT process, facilitate, guarantee, or involve itself in any financial transactions between users. 
                All payment arrangements, methods, amounts, timing, and disputes are solely between the Requester and Vendor. 
                VendorCover is not responsible for non-payment, late payment, payment disputes, chargebacks, or any financial issues. 
                Users handle all payments independently through methods of their choosing (Venmo, PayPal, cash, etc.).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">11. Jobs, Agreements, and Contracts</h2>
              <p className="mb-3">
                VendorCover provides tools for creating subcontract agreements, but:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>All agreements are between users only - VendorCover is not a party to any contract</li>
                <li>Users are responsible for negotiating terms, pricing, and conditions</li>
                <li>We do not enforce, mediate, or guarantee compliance with agreements</li>
                <li>Legal disputes must be resolved directly between parties</li>
                <li>Agreements generated through the App are for convenience only and may not be legally binding</li>
                <li>Consult legal counsel for enforceable contracts</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">12. No Guarantees or Warranties</h2>
              <p className="mb-2">
                VendorCover makes ABSOLUTELY NO guarantees, warranties, or representations regarding:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The availability, quantity, quality, or reliability of jobs, opportunities, or applicants</li>
                <li>Income, earnings, revenue, or business opportunities of any kind</li>
                <li>The accuracy, truthfulness, or completeness of user-provided information</li>
                <li>The outcome of any user interactions, jobs, events, or agreements</li>
                <li>Uninterrupted, error-free, secure, or reliable operation of the App</li>
                <li>The suitability, qualification, background, or reliability of any vendor</li>
                <li>The verification or accuracy of AI risk assessments</li>
                <li>The security of communications, data, or transactions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">13. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless VendorCover, its owners, operators, employees, contractors, 
                affiliates, and agents from any and all claims, demands, damages, losses, liabilities, costs, and expenses 
                (including reasonable legal fees) arising from or related to: (a) your use of the App; (b) your violation of 
                these Terms; (c) your violation of any rights of another party; (d) your interactions, agreements, or disputes 
                with other users; (e) services you provide or receive through the App; or (f) any content you submit or upload.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">14. User Reports, Reviews, and Ratings</h2>
              <p>
                Users may report misconduct, leave reviews, and rate other users. VendorCover may investigate reports and take 
                action including warnings, suspensions, or permanent bans. However, we are not obligated to investigate all reports, 
                take any specific action, or resolve disputes. Reviews and ratings are user opinions and do not reflect VendorCover's 
                views. We may remove reviews that violate these Terms but are not required to verify their accuracy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">15. Messaging and Communications</h2>
              <p>
                The App includes messaging features for users to communicate about jobs and services. By using these features, you 
                consent to VendorCover accessing, monitoring, and reviewing all communications for safety, fraud prevention, and 
                dispute resolution purposes. Messages are not private and may be reviewed by administrators. VendorCover is not 
                responsible for the content of user communications.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">16. Support and Customer Service</h2>
              <p>
                VendorCover provides support through in-app chat and ticketing systems. We strive to respond promptly but make no 
                guarantees regarding response times or issue resolution. Support is provided at our discretion and we reserve the 
                right to decline assistance in any matter.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">17. Termination Rights</h2>
              <p>
                We reserve the right to terminate, suspend, restrict, or permanently disable your access to VendorCover at any time, 
                for any reason or no reason, with or without cause, and with or without notice. Upon termination, your right to use 
                the App immediately ceases. We may delete your data, content, and account information. All provisions of these Terms 
                that should survive termination shall remain in effect. You may close your account at any time through the App.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">18. Modifications to Terms and Services</h2>
              <p>
                VendorCover may modify, update, change, discontinue, or terminate these Terms or any aspect of the App at any time 
                without prior notice. We may notify users of significant changes through the App, email, or in-app notifications. 
                Your continued use of the App after changes constitutes acceptance of the modified Terms. It is your responsibility 
                to review these Terms periodically.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">19. Intellectual Property</h2>
              <p>
                All VendorCover branding, logos, design, features, and functionality are owned by VendorCover and protected by 
                copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create 
                derivative works without express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">20. Arbitration and Class Action Waiver</h2>
              <p className="mb-3">
                Any dispute, controversy, or claim arising out of or relating to these Terms or the App shall be resolved by 
                binding arbitration in accordance with the rules of the American Arbitration Association. By using VendorCover:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You waive your right to a jury trial</li>
                <li>You waive your right to participate in class action lawsuits</li>
                <li>Disputes must be brought individually, not as part of any class or collective action</li>
                <li>Arbitration takes place in the location where VendorCover operates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">21. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the United States and the State where 
                VendorCover is registered, without regard to conflict of law provisions. Any legal action must be brought in courts 
                located in the jurisdiction where VendorCover operates, and you consent to exclusive jurisdiction and venue in such courts.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">22. Severability and Entire Agreement</h2>
              <p>
                If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or 
                eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect. 
                These Terms, together with the Privacy Policy and User Agreement, constitute the entire agreement between you and 
                VendorCover.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">23. Force Majeure</h2>
              <p>
                VendorCover is not liable for any failure to perform due to circumstances beyond our reasonable control, including 
                acts of God, natural disasters, terrorism, labor disputes, technical failures, or government actions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">24. Contact Information</h2>
              <p>
                For questions about these Terms, please contact us at{' '}
                <a href="mailto:team@twofoldvisuals.com" className="text-blue-600 hover:underline">
                  team@twofoldvisuals.com
                </a>
                {' '}or through the "Report Problem" feature in the App.
              </p>
            </section>

            <section className="border-t pt-6 mt-8">
              <p className="text-sm italic font-medium">
                BY CREATING AN ACCOUNT AND USING VENDORCOVER, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO 
                BE BOUND BY THESE TERMS OF SERVICE IN THEIR ENTIRETY. IF YOU DO NOT AGREE, DO NOT USE THE APP.
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}