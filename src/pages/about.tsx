import Link from 'next/link';
import InformationPage from '../components/InformationPage';
import { WORDPRESS_ORG_CORE_URL } from '../lib/site';

export default function About() {
  return (
    <InformationPage
      path="/about"
      title="About FounderPostAI | Review-first WordPress AI SEO"
      description="FounderPostAI builds AI-assisted WordPress tools for editors who want help improving existing content while keeping control of what gets published."
      eyebrow="About FounderPostAI"
      heading="Useful suggestions. The final word stays with you."
    >
      <section>
        <h2>What we are building</h2>
        <p>
          AI Suite focuses on three practical jobs: writing search titles, improving meta
          descriptions, and adding relevant internal links to published WordPress content.
          Suggestions start from the page you already have and the brand context you supply.
          The manual workflow puts them in a review queue before they can change your site.
        </p>
        <p>
          Our design priority is inspectable, recoverable changes: validated destinations,
          protected content regions, checks for newer edits, and WordPress revisions before
          content writes. AI can still suggest something unhelpful. Editorial judgment matters,
          and we do not promise rankings or traffic from installing a plugin.
        </p>
      </section>
      <section className="border border-[#1B1712]/15 bg-white p-6 md:p-8">
        <h2>How the pieces fit together</h2>
        <ul className="list-disc pl-5">
          <li><strong>AI Suite Core</strong> provides the service connection, shared brand context, and job queue. It is free on <a href={WORDPRESS_ORG_CORE_URL}>WordPress.org</a>.</li>
          <li><strong>AI Suite SEO</strong> is a free, separately installed module for manual analysis, reviewable metadata and links, and repeatable ten-post batches.</li>
          <li><strong>AI Suite SEO Pro</strong> is a separately distributed add-on containing unattended whole-site runs, scheduling, and optional conservative auto-apply.</li>
        </ul>
        <p className="mt-5">Plugin code is GPL-licensed. AI processing is a separate external service, using a managed allowance or your configured provider billing. See the <Link href="/ai-suite">product facts and installation steps</Link> and <Link href="/#pricing">current plans</Link> before choosing a setup.</p>
      </section>
      <section>
        <h2>Keep your existing SEO workflow</h2>
        <p>
          AI Suite can work with Yoast SEO, Rank Math, All in One SEO, or SEOPress. Approved
          titles and descriptions are saved into the active supported plugin’s native fields;
          that plugin keeps responsibility for frontend metadata. Applied internal links are
          ordinary WordPress content, so they remain if AI Suite is deactivated.
        </p>
        <p>Start with the <Link href="/wordpress-internal-linking-plugin">worked internal-linking example</Link> or explore the <Link href="/resources">implementation guides</Link>.</p>
      </section>
      <section>
        <h2>Product information you can check</h2>
        <p>
          FounderPostAI publishes its own product guides. They explain our implementation and
          its limits; they are not independent reviews. Publication and update dates are shown
          on each guide, and comparisons link to the other product’s official information.
        </p>
        <p>For the Core plugin’s public release history and publisher profile, visit the <a href={WORDPRESS_ORG_CORE_URL}>official WordPress.org listing</a> and <a href="https://profiles.wordpress.org/founderpostai/">FounderPostAI profile</a>. Our <Link href="/privacy">privacy policy</Link> describes service processing and data handling.</p>
        <p>Have a question, found an error, or want to suggest an improvement? <Link href="/contact">Contact FounderPostAI</Link>.</p>
      </section>
    </InformationPage>
  );
}
