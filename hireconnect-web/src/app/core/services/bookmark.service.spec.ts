import { TestBed } from '@angular/core/testing';
import { BookmarkService, Job } from './bookmark.service';
import { describe, beforeEach, it, expect } from 'vitest';

describe('BookmarkService', () => {
  let service: BookmarkService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(BookmarkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with no bookmarks if localStorage is empty', () => {
    expect(service.getBookmarks().length).toBe(0);
  });

  it('should save a job to bookmarks', () => {
    const job: Job = {
      jobId: '123',
      recruiterId: 'rec1',
      title: 'Software Engineer',
      category: 1,
      type: 1,
      location: 'Remote',
      isRemote: true,
      description: 'Test',
      requiredSkills: ['Angular'],
      experienceMinYears: 2,
      status: 1,
      viewCount: 0
    };

    const isBookmarked = service.toggleBookmark(job);
    
    expect(isBookmarked).toBe(true);
    expect(service.getBookmarks().length).toBe(1);
    expect(service.getBookmarks()[0].jobId).toBe('123');
    
    // Verify it was saved to localStorage
    const stored = localStorage.getItem('hc_bookmarked_jobs');
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)[0].jobId).toBe('123');
  });

  it('should remove a job from bookmarks if toggled twice', () => {
    const job: Job = {
      jobId: '123',
      recruiterId: 'rec1',
      title: 'Software Engineer',
      category: 1,
      type: 1,
      location: 'Remote',
      isRemote: true,
      description: 'Test',
      requiredSkills: ['Angular'],
      experienceMinYears: 2,
      status: 1,
      viewCount: 0
    };

    service.toggleBookmark(job); // Add
    const isBookmarked = service.toggleBookmark(job); // Remove
    
    expect(isBookmarked).toBe(false);
    expect(service.getBookmarks().length).toBe(0);
    
    // Verify it was removed from localStorage
    const stored = localStorage.getItem('hc_bookmarked_jobs');
    expect(JSON.parse(stored!).length).toBe(0);
  });

  it('should correctly check if a job is bookmarked', () => {
    const job: Job = {
      jobId: '999',
      recruiterId: 'rec1',
      title: 'Tester',
      category: 1,
      type: 1,
      location: 'Remote',
      isRemote: true,
      description: 'Test',
      requiredSkills: [],
      experienceMinYears: 1,
      status: 1,
      viewCount: 0
    };

    expect(service.isBookmarked('999')).toBe(false);
    service.toggleBookmark(job);
    expect(service.isBookmarked('999')).toBe(true);
  });
});
