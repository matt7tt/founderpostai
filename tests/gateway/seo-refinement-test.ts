import assert from 'node:assert/strict';
import { buildPrompt, parseSuggestions } from '../../src/pages/api/gateway/v1/jobs/index';

const payload = {
  title: 'A practical SEO guide',
  content: 'Use practical internal links in this guide.',
  excerpt: '',
  current_meta: { title: '', description: '' },
  link_targets: [{ id: 7, title: 'Internal links' }],
  review_request: { focus: 'title', instruction: 'Make it calmer and more specific.' },
};

const prompt = buildPrompt(payload, { tone: 'clear' });
assert.match(prompt, /Review focus: title/);
assert.match(prompt, /Make it calmer and more specific/);

const titleOnly = parseSuggestions(
  JSON.stringify({
    suggestions: [
      { field: 'title', value: 'A calmer practical SEO guide', rationale: 'Clear value.' },
      { field: 'description', value: 'Should be filtered.', rationale: 'Not requested.' },
    ],
  }),
  payload
);
assert.equal(titleOnly.length, 1);
assert.equal(titleOnly[0].field, 'title');

const linkOnly = parseSuggestions(
  JSON.stringify({
    suggestions: [
      {
        field: 'internal_links',
        value: [{ target_id: 7, anchor: 'internal links' }],
        rationale: 'Adds a useful path.',
      },
    ],
  }),
  { ...payload, review_request: { focus: 'internal_links', instruction: '' } }
);
assert.equal(linkOnly[0].value[0].target_id, 7);

console.log('PASS: refinement prompts honor field focus and preserve closed-link validation');
