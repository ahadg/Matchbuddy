import type { ApiReportCategory } from '@/types/api';

export const reportCategoryOptions: Array<{ label: string; value: ApiReportCategory }> = [
  { label: 'Harassment', value: 'harassment' },
  { label: 'Spam', value: 'spam' },
  { label: 'Hate', value: 'hate' },
  { label: 'Sexual', value: 'sexual' },
  { label: 'Violence', value: 'violence' },
  { label: 'Scam', value: 'scam' },
  { label: 'Unsafe', value: 'unsafe' },
  { label: 'Other', value: 'other' },
];
