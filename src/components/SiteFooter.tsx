import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#1B1712]/15 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-[#1B1712]/70">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <Link href="/" className="shrink-0 text-lg font-bold text-[#1B1712]" style={{ fontFamily: 'Georgia, serif' }}>
            FounderPostAI
          </Link>
          <nav aria-label="Footer navigation" className="flex max-w-2xl flex-wrap gap-x-6 gap-y-4">
            {[
              ['/ai-suite', 'AI Suite'],
              ['/resources', 'Resources'],
              ['/#pricing', 'Pricing'],
              ['/about', 'About'],
              ['/contact', 'Contact'],
              ['/privacy', 'Privacy'],
              ['/terms', 'Terms'],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="hover:text-[#00749C] hover:underline">
                {label}
              </Link>
            ))}
            <a href="/llms.txt" className="hover:text-[#00749C] hover:underline">LLM reference</a>
          </nav>
        </div>
        <p className="mt-8 text-xs">© {new Date().getFullYear()} FounderPostAI · GPL-licensed plugin code</p>
      </div>
    </footer>
  );
}
