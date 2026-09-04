import Link from 'next/link';

const before = '<p>Before publishing, review your meta descriptions and check every destination.</p>';
const after = '<p>Before publishing, review your <a href="https://example.com/meta-descriptions/">meta descriptions</a> and check every destination.</p>';

export default function InternalLinkingExample() {
  return (
    <section id="worked-example" aria-labelledby="example-heading" className="border-b border-[#1B1712]/15">
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-[#00749C]">A link, not a rewrite</p>
        <h2 id="example-heading" className="text-3xl font-bold tracking-tight md:text-4xl" style={{ fontFamily: 'Georgia, serif' }}>One paragraph. One useful next step.</h2>
        <p className="mt-5 max-w-3xl leading-relaxed text-[#1B1712]/75">
          Imagine a published WordPress SEO checklist and a separate, published guide to meta
          descriptions on the same site. The checklist already contains the phrase “meta
          descriptions”. A reviewer can approve a link to the guide without asking the model
          to rewrite the paragraph or invent a destination.
        </p>
        <figure className="mt-8">
          <div className="grid border border-[#1B1712]/20 bg-white md:grid-cols-2">
            <div className="min-w-0 border-b border-[#1B1712]/20 p-6 md:border-b-0 md:border-r">
              <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-[#1B1712]/60">01 / Before approval</h3>
              <p className="font-serif text-xl leading-relaxed">Before publishing, review your meta descriptions and check every destination.</p>
              <p className="mt-6 text-sm text-[#1B1712]/65">The anchor is already part of the sentence. No new copy is needed.</p>
            </div>
            <div className="min-w-0 bg-[#00749C]/5 p-6">
              <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-[#00749C]">02 / After approval</h3>
              <p className="font-serif text-xl leading-relaxed">Before publishing, review your <span className="text-[#00749C] underline decoration-2 underline-offset-4">meta descriptions</span> and check every destination.</p>
              <p className="mt-6 text-sm text-[#1B1712]/65">Only the existing phrase becomes a link to the approved, published guide.</p>
            </div>
          </div>
          <figcaption className="mt-3 text-sm text-[#1B1712]/60">Illustrative content, not a WordPress screenshot or a live analysis. The underlined phrase shows the proposed link; example.com is a placeholder for your site.</figcaption>
        </figure>
        <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-3">
          <div><dt className="font-bold">Source</dt><dd className="mt-1 text-[#1B1712]/70">Published SEO checklist</dd></div>
          <div><dt className="font-bold">Destination</dt><dd className="mt-1 text-[#1B1712]/70">Published meta description guide, selected from WordPress candidates</dd></div>
          <div><dt className="font-bold">Editorial reason</dt><dd className="mt-1 text-[#1B1712]/70">The reader can learn how to carry out the step the checklist mentions</dd></div>
        </dl>
        <details className="mt-8 border border-[#1B1712]/20 bg-white p-5">
          <summary className="cursor-pointer font-bold">Inspect the before-and-after HTML</summary>
          <p className="mb-2 mt-5 text-sm font-bold">Before</p>
          <pre className="whitespace-pre-wrap break-words bg-[#F7F4EE] p-4 text-xs leading-relaxed"><code>{before}</code></pre>
          <p className="mb-2 mt-5 text-sm font-bold">After</p>
          <pre className="whitespace-pre-wrap break-words bg-[#F7F4EE] p-4 text-xs leading-relaxed"><code>{after}</code></pre>
          <p className="mt-4 text-sm text-[#1B1712]/70">This is a normal HTML anchor saved in the post, not a shortcode that depends on the plugin staying active.</p>
        </details>
        <h3 className="mb-5 mt-10 font-serif text-2xl font-bold">When the same suggestion should not be applied</h3>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ['Only in a heading', 'If the phrase appears only in an H2, the inserter leaves it alone. Heading text is protected; the anchor must have an eligible occurrence in ordinary content.'],
            ['Already linked or split by markup', 'An existing link is not replaced or nested. A phrase split across separate HTML text nodes is not forced together to create a match.'],
            ['The page changed after analysis', 'Newer source edits make the suggestion stale. A destination that became a draft also fails revalidation. Review fresh results instead of overwriting the live state.'],
          ].map(([title, body]) => (
            <div key={title} className="border-t-2 border-[#00749C] pt-4">
              <h4 className="font-bold">{title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-[#1B1712]/75">{body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm leading-relaxed text-[#1B1712]/75">
          For a broader review checklist, read the <Link href="/guides/safe-ai-internal-linking-wordpress" className="text-[#00749C] underline underline-offset-4">safe internal-linking guide</Link>.
          {' '}If link auditing is your main job, compare <Link href="/compare/founderpostai-vs-link-whisper" className="text-[#00749C] underline underline-offset-4">FounderPostAI and Link Whisper</Link> before choosing a workflow.
        </p>
      </div>
    </section>
  );
}
