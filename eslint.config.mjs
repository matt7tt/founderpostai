import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  {
    rules: {
      // Loading remote data when authentication or the route changes is a valid effect.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    '.context/**',
    'generated-images/**',
    'next-env.d.ts',
    'public/downloads/**',
  ]),
]);
