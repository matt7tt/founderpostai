import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next';
import SearchLandingPage from '../../components/SearchLandingPage';
import { GUIDE_SEARCH_PAGES, type SearchPage } from '../../lib/search-content';

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: GUIDE_SEARCH_PAGES.map((page) => ({
    params: { slug: page.slug },
  })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<{ page: SearchPage }> = async ({ params }) => {
  const page = GUIDE_SEARCH_PAGES.find((candidate) => candidate.slug === params?.slug);

  if (!page) {
    return { notFound: true };
  }

  return {
    props: { page },
  };
};

export default function GuideSearchPage({
  page,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return <SearchLandingPage page={page} />;
}
