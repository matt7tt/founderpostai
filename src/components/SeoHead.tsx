import Head from 'next/head';
import {
  absoluteUrl,
  HOME_DESCRIPTION,
  SITE_NAME,
  SOCIAL_IMAGE_PATH,
} from '../lib/site';

interface SeoHeadProps {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  preloadImage?: string;
  imageAlt?: string;
}

export default function SeoHead({
  title,
  description = HOME_DESCRIPTION,
  path = '/',
  noIndex = false,
  preloadImage,
  imageAlt = 'FounderPostAI AI SEO plugins for WordPress',
}: SeoHeadProps) {
  const canonicalUrl = absoluteUrl(path);
  const imageUrl = absoluteUrl(SOCIAL_IMAGE_PATH);
  const robots = noIndex
    ? 'noindex, nofollow, noarchive'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  return (
    <Head>
      <title>{title}</title>
      <meta key="description" name="description" content={description} />
      <meta key="robots" name="robots" content={robots} />
      <meta key="googlebot" name="googlebot" content={robots} />
      <meta key="bingbot" name="bingbot" content={robots} />
      <meta key="author" name="author" content={SITE_NAME} />
      <meta key="application-name" name="application-name" content={SITE_NAME} />
      <link key="canonical" rel="canonical" href={canonicalUrl} />

      <meta key="og:type" property="og:type" content="website" />
      <meta key="og:locale" property="og:locale" content="en_US" />
      <meta key="og:site_name" property="og:site_name" content={SITE_NAME} />
      <meta key="og:title" property="og:title" content={title} />
      <meta key="og:description" property="og:description" content={description} />
      <meta key="og:url" property="og:url" content={canonicalUrl} />
      <meta key="og:image" property="og:image" content={imageUrl} />
      <meta key="og:image:secure_url" property="og:image:secure_url" content={imageUrl} />
      <meta key="og:image:type" property="og:image:type" content="image/png" />
      <meta key="og:image:width" property="og:image:width" content="1200" />
      <meta key="og:image:height" property="og:image:height" content="630" />
      <meta key="og:image:alt" property="og:image:alt" content={imageAlt} />

      <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
      <meta key="twitter:title" name="twitter:title" content={title} />
      <meta key="twitter:description" name="twitter:description" content={description} />
      <meta key="twitter:image" name="twitter:image" content={imageUrl} />
      <meta key="twitter:image:alt" name="twitter:image:alt" content={imageAlt} />

      {preloadImage && (
        <link key="preload-image" rel="preload" as="image" href={preloadImage} />
      )}
    </Head>
  );
}
