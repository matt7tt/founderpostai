// Editorial dates, not deployment timestamps. Change updatedAt only after a
// substantive page update; preserve publishedAt when refreshing existing content.
export interface ContentDates {
  publishedAt: string;
  updatedAt: string;
}

export const INFORMATION_PAGE_DATES: ContentDates = {
  publishedAt: '2026-09-04',
  updatedAt: '2026-09-04',
};

export const RESOURCES_DATES: ContentDates = {
  publishedAt: '2026-07-30',
  updatedAt: '2026-09-04',
};

export function formatContentDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}
