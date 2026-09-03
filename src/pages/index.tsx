import HomeStructuredData from '../components/HomeStructuredData';
import SeoHead from '../components/SeoHead';
import Editorial from '../designs/Editorial';
import { HOME_DESCRIPTION, HOME_TITLE } from '../lib/site';

export default function Home() {
  return (
    <>
      <SeoHead
        title={HOME_TITLE}
        description={HOME_DESCRIPTION}
        path="/"
      />
      <HomeStructuredData />
      <Editorial />
    </>
  );
}
