import { Pipe, PipeTransform } from '@angular/core';

/** "just now", "5 min ago", "3 hours ago", "yesterday", "12 Oct" */
@Pipe({ name: 'timeAgo' })
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    const minutes = Math.round((Date.now() - date.getTime()) / 60_000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    const days = Math.round(hours / 24);
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-IE', { day: 'numeric', month: 'short' });
  }
}
