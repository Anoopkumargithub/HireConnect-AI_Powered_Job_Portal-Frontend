import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Job {
  jobId: string;
  recruiterId: string;
  title: string;
  category: number;
  type: number;
  location: string;
  isRemote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  description: string;
  requiredSkills: string[];
  experienceMinYears: number;
  status: number;
  postedAt?: string;
  viewCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class BookmarkService {
  private readonly STORAGE_KEY = 'hc_bookmarked_jobs';
  
  private bookmarksSubject = new BehaviorSubject<Job[]>(this.loadBookmarks());
  public bookmarks$ = this.bookmarksSubject.asObservable();

  constructor() {}

  private loadBookmarks(): Job[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load bookmarks', e);
    }
    return [];
  }

  private saveBookmarks(bookmarks: Job[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bookmarks));
      this.bookmarksSubject.next(bookmarks);
    } catch (e) {
      console.error('Failed to save bookmarks', e);
    }
  }

  getBookmarks(): Job[] {
    return this.bookmarksSubject.value;
  }

  isBookmarked(jobId: string): boolean {
    return this.getBookmarks().some(job => job.jobId === jobId);
  }

  toggleBookmark(job: Job): boolean {
    const bookmarks = this.getBookmarks();
    const index = bookmarks.findIndex(j => j.jobId === job.jobId);
    
    if (index >= 0) {
      // Remove
      bookmarks.splice(index, 1);
      this.saveBookmarks(bookmarks);
      return false; // Not bookmarked anymore
    } else {
      // Add
      bookmarks.push(job);
      this.saveBookmarks(bookmarks);
      return true; // Is now bookmarked
    }
  }
}
