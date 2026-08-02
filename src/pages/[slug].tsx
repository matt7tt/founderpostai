import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next';
import SearchLandingPage from '../components/SearchLandingPage';
import { TOP_LEVEL_SEARCH_PAGES, type SearchPage } from '../lib/search-content';

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: TOP_LEVEL_SEARCH_PAGES.map((page) => ({
    params: { slug: page.slug },
  })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<{ page: SearchPage }> = async ({ params }) => {
  const page = TOP_LEVEL_SEARCH_PAGES.find((candidate) => candidate.slug === params?.slug);

  if (!page) {
    return { notFound: true };
  }

  return {
    props: { page },
  };
};

export default function TopLevelSearchPage({
  page,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return <SearchLandingPage page={page} />;
}
