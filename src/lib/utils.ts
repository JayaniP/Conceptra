import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
}

/** Leitner spaced repetition: returns next review date based on score + review count */
export function nextReviewDate(score: number, reviewCount: number): Date {
  const now = new Date();
  // Leitner box intervals: 1d, 3d, 7d, 14d, 30d
  const intervals = [1, 3, 7, 14, 30];
  const box = score >= 2 ? Math.min(reviewCount, intervals.length - 1) : 0;
  const days = intervals[box];
  now.setDate(now.getDate() + days);
  return now;
}

/** Convert 0-100 confidence score to a label */
export function confidenceLabel(score: number): string {
  if (score >= 80) return 'Strong';
  if (score >= 50) return 'Developing';
  if (score >= 20) return 'Learning';
  return 'New';
}

/** Convert 0-100 confidence score to a Tailwind colour class */
export function confidenceColor(score: number): string {
  if (score >= 80) return 'text-teal-600 bg-teal-50';
  if (score >= 50) return 'text-amber-600 bg-amber-50';
  return 'text-rose-600 bg-rose-50';
}

/** Truncate text to maxLength chars with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

/** Generate a short URL slug for sharing */
export function generateSlug(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
