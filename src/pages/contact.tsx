import Link from 'next/link';
import InformationPage from '../components/InformationPage';

export default function Contact() {
  return (
    <InformationPage
      path="/contact"
      title="Contact FounderPostAI | Plugin Support and Feedback"
      description="Get help with AI Suite installation, connections, SEO suggestions, billing, or a product question. Send bug reports and improvement ideas directly to FounderPostAI."
      eyebrow="Support & feedback"
      heading="Let’s get your question to the right place."
    >
      <section className="border border-[#1B1712]/15 bg-white p-6 md:p-8">
        <h2>Email FounderPostAI</h2>
        <p><a href="mailto:support@founderpostai.com" className="break-words text-xl font-bold">support@founderpostai.com</a></p>
        <p>Use this address for plugin support, billing questions, pre-installation questions, and general enquiries. A short subject such as “SEO installation” or “Billing question” helps explain what you need.</p>
        <p>Email links open your email app; you can also copy the address into your usual email service.</p>
      </section>
      <section>
        <h2>Report a plugin issue</h2>
        <p>If WordPress is accessible, open <strong>AI Suite → SEO</strong> and choose <strong>Send feedback</strong>. This opens Core’s feedback form with the SEO module selected. Review the data disclosure in that form before submitting.</p>
        <p>When emailing instead, include:</p>
        <ul className="mt-4 list-disc pl-5">
          <li>The affected module and its version, plus your WordPress and PHP versions.</li>
          <li>What you were trying to do, the steps to reproduce it, and what happened instead.</li>
          <li>The exact error text or a screenshot with private information removed.</li>
          <li>Whether this happened on a staging or live site, and which SEO plugin is active.</li>
        </ul>
        <p className="mt-5">Do not send passwords, API keys, connection codes, site secrets, or full payment-card details. Share only the content needed to explain the issue.</p>
      </section>
      <section>
        <h2>Billing and data questions</h2>
        {process.env.NEXT_PUBLIC_STRIPE_BILLING_PORTAL && <p><a href={process.env.NEXT_PUBLIC_STRIPE_BILLING_PORTAL}>Manage billing, download invoices, or cancel your subscription securely with Stripe</a>. Use the email address from checkout; Stripe sends a sign-in link.</p>}
        <p>For a purchase question, email from the address used at checkout and include the receipt reference if you have it. Do not send card details. The <Link href="/terms">terms</Link> cover subscriptions and refunds.</p>
        <p>For questions about personal data or a deletion request, use the same support address and describe the request. See the <Link href="/privacy">privacy policy</Link> for what the service collects and why.</p>
      </section>
      <section>
        <h2>Useful starting points</h2>
        <ul className="list-disc pl-5">
          <li><Link href="/ai-suite#installation">Install Core and the SEO module</Link></li>
          <li><Link href="/wordpress-internal-linking-plugin">Review an internal-linking example and troubleshooting notes</Link></li>
          <li><Link href="/resources">Browse SEO workflow and integration guides</Link></li>
        </ul>
      </section>
    </InformationPage>
  );
}
