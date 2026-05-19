import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiConfigService } from '../../core/services/api-config.service';
import { BookmarkService, Job } from '../../core/services/bookmark.service';
import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell.component';
import { Subscription } from 'rxjs';

const CATEGORY_LABELS: Record<number, string> = {
  1: 'Software Engineering', 2: 'Data Science', 3: 'DevOps',
  4: 'Product Management', 5: 'Design', 6: 'QA', 7: 'Sales',
  8: 'Marketing', 9: 'HR', 10: 'Finance', 99: 'Other'
};

const TYPE_LABELS: Record<number, string> = {
  1: 'Full-time', 2: 'Part-time', 3: 'Contract', 4: 'Internship'
};

@Component({
  selector: 'app-saved-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationBellComponent],
  template: `
    <div class="dashboard-container">
      <!-- Navbar -->
      <nav class="navbar">
        <div class="logo">HireConnect <span>Candidate</span></div>
        <div class="nav-links">
          <a class="nav-link" (click)="router.navigate(['/candidate/jobs'])">Find Jobs</a>
          <a class="nav-link active">Saved Jobs</a>
          <a class="nav-link" (click)="router.navigate(['/candidate/applications'])">My Applications</a>
          <a class="nav-link" (click)="router.navigate(['/candidate/interviews'])">Interviews</a>
          <a class="nav-link" (click)="router.navigate(['/candidate/profile'])">My Profile</a>
        </div>
        <div class="nav-actions" style="display: flex; align-items: center; gap: 1.5rem;">
          <app-notification-bell></app-notification-bell>
          <button class="logout-btn" (click)="logout()">Logout</button>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="content">
        <header class="page-header">
          <h1>Saved Jobs</h1>
          <p>Review the opportunities you've bookmarked.</p>
        </header>

        <!-- Empty state -->
        <div class="empty-state" *ngIf="jobs.length === 0">
          <div class="empty-icon">🔖</div>
          <h3>No saved jobs</h3>
          <p>You haven't bookmarked any jobs yet. Browse available jobs and save the ones you like.</p>
          <button class="btn-primary mt-4" (click)="router.navigate(['/candidate/jobs'])">Browse Jobs</button>
        </div>

        <!-- Jobs list -->
        <div class="jobs-list" *ngIf="jobs.length > 0">
          <div class="result-count">{{ jobs.length }} saved job{{ jobs.length !== 1 ? 's' : '' }}</div>

          <div class="job-card" *ngFor="let job of jobs">
            <div class="job-card-main">
              <div class="job-info">
                <div class="job-title-row">
                  <div class="job-title">{{ job.title }}</div>
                  <button class="bookmark-btn active" (click)="toggleBookmark(job)" title="Remove from saved jobs">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                  </button>
                </div>
                <div class="job-meta">{{ categoryLabel(job.category) }} · {{ typeLabel(job.type) }}</div>
                <div class="job-location">📍 {{ job.location }}{{ job.isRemote ? ' · 🌐 Remote' : '' }}</div>
                <div class="job-salary" *ngIf="job.salaryMin || job.salaryMax">
                  💰 {{ job.currency || 'USD' }} {{ job.salaryMin | number }} – {{ job.salaryMax | number }}
                </div>
                <div class="job-skills" *ngIf="job.requiredSkills.length">
                  <span class="skill-tag" *ngFor="let skill of job.requiredSkills.slice(0, 5)">{{ skill }}</span>
                </div>
              </div>
              <div class="job-right">
                <div class="job-exp">{{ job.experienceMinYears }}+ yrs</div>
                <button class="btn-apply"
                  [class.applied]="appliedJobIds.has(job.jobId)"
                  [disabled]="appliedJobIds.has(job.jobId)"
                  (click)="openApplyModal(job)">
                  {{ appliedJobIds.has(job.jobId) ? '✓ Applied' : 'Apply Now' }}
                </button>
              </div>
            </div>
            <div class="job-desc">{{ (job.description || '') | slice:0:200 }}{{ (job.description || '').length > 200 ? '...' : '' }}</div>
          </div>
        </div>
      </main>

      <!-- Apply Modal -->
      <div class="modal-overlay" *ngIf="showApplyModal" (click)="closeApplyModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>Apply for Position</h2>
              <p class="modal-subtitle" *ngIf="selectedJob">{{ selectedJob.title }} · {{ selectedJob.location }}</p>
            </div>
            <button class="close-btn" (click)="closeApplyModal()">✕</button>
          </div>

          <div class="modal-body">
            <div class="error-message" *ngIf="applyError">{{ applyError }}</div>
            <div class="success-message" *ngIf="applySuccess">{{ applySuccess }}</div>

            <div class="form-group">
              <label>Cover Letter <span class="optional">(optional, max 3000 chars)</span></label>
              <textarea [(ngModel)]="coverLetter" rows="6"
                placeholder="Tell the recruiter why you're a great fit for this role..."
                maxlength="3000"></textarea>
              <div class="char-count">{{ coverLetter.length }} / 3000</div>
            </div>

            <div class="form-group">
              <label>Resume URL <span class="optional">(optional)</span></label>
              <input type="url" [(ngModel)]="resumeUrl"
                placeholder="https://drive.google.com/your-resume" />
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-outline" (click)="closeApplyModal()">Cancel</button>
            <button class="btn-submit" (click)="submitApplication()" [disabled]="applying">
              {{ applying ? 'Submitting...' : 'Submit Application' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .dashboard-container { min-height: 100vh; background: #f8fafc; font-family: 'Inter', sans-serif; }
    .navbar { background: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.08); position: sticky; top: 0; z-index: 100; }
    .logo { font-size: 1.4rem; font-weight: 700; color: #1e293b; }
    .logo span { color: #10b981; }
    .nav-links { display: flex; gap: 1.5rem; margin-left: 2rem; flex: 1; }
    .nav-link { color: #64748b; text-decoration: none; font-weight: 600; cursor: pointer; padding: 0.5rem 0; border-bottom: 2px solid transparent; transition: all 0.2s; }
    .nav-link:hover { color: #10b981; }
    .nav-link.active { color: #10b981; border-bottom-color: #10b981; }
    .logout-btn { background: transparent; border: 1px solid #e2e8f0; padding: 0.5rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 500; color: #64748b; transition: all 0.2s; }
    .logout-btn:hover { background: #f1f5f9; }
    .content { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .page-header { margin-bottom: 1.5rem; }
    .page-header h1 { margin: 0 0 0.25rem 0; color: #0f172a; font-size: 1.8rem; }
    .page-header p { margin: 0; color: #64748b; }
    
    .btn-primary { background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 0.85rem 2rem; border-radius: 10px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(16,185,129,0.3); transition: all 0.2s; font-size: 0.95rem; white-space: nowrap; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16,185,129,0.4); }
    .mt-4 { margin-top: 1rem; }
    
    .empty-state { text-align: center; padding: 5rem; }
    .empty-state p { color: #64748b; }
    .empty-icon { font-size: 4rem; margin-bottom: 1rem; }
    .empty-state h3 { color: #1e293b; margin: 0 0 0.5rem; }
    
    .jobs-list { display: flex; flex-direction: column; gap: 1rem; }
    .result-count { color: #64748b; font-size: 0.9rem; margin-bottom: 0.5rem; font-weight: 500; }
    .job-card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; transition: all 0.2s; }
    .job-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); border-color: #e2e8f0; }
    .job-card-main { display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem; margin-bottom: 1rem; }
    .job-info { flex: 1; }
    
    .job-title-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.2rem; }
    .job-title { font-size: 1.2rem; font-weight: 700; color: #0f172a; }
    .bookmark-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #cbd5e1; transition: all 0.2s; padding: 0.25rem; border-radius: 50%; }
    .bookmark-btn:hover { color: #94a3b8; background: #f1f5f9; }
    .bookmark-btn.active { color: #f59e0b; }
    .bookmark-btn.active:hover { color: #d97706; }
    
    .job-meta { font-size: 0.85rem; color: #10b981; font-weight: 600; margin-bottom: 0.25rem; }
    .job-location, .job-salary { font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem; }
    .job-skills { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.5rem; }
    .skill-tag { background: #ecfdf5; color: #059669; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
    .job-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; min-width: 130px; }
    .job-exp { background: #eff6ff; color: #3b82f6; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
    .btn-apply { background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 0.65rem 1.5rem; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; font-size: 0.9rem; }
    .btn-apply:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16,185,129,0.4); }
    .btn-apply.applied { background: #d1fae5; color: #059669; cursor: default; }
    .btn-apply:disabled { opacity: 0.7; cursor: not-allowed; }
    .job-desc { color: #64748b; font-size: 0.875rem; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 1rem; }
    
    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: white; border-radius: 20px; width: 100%; max-width: 580px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: white; z-index: 1; border-radius: 20px 20px 0 0; }
    .modal-header h2 { margin: 0 0 0.2rem 0; color: #0f172a; font-size: 1.3rem; }
    .modal-subtitle { margin: 0; color: #64748b; font-size: 0.9rem; }
    .close-btn { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
    .close-btn:hover { background: #e2e8f0; }
    .modal-body { padding: 2rem; }
    .modal-footer { padding: 1.5rem 2rem; border-top: 1px solid #f1f5f9; display: flex; gap: 1rem; justify-content: flex-end; }
    .form-group { margin-bottom: 1.5rem; }
    .form-group label { display: block; margin-bottom: 0.4rem; color: #374151; font-weight: 600; font-size: 0.875rem; }
    .optional { color: #94a3b8; font-weight: 400; }
    .form-group input, .form-group textarea { width: 100%; padding: 0.75rem 1rem; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 0.95rem; color: #1e293b; background: #fafafa; transition: all 0.2s; font-family: inherit; }
    .form-group input:focus, .form-group textarea:focus { outline: none; border-color: #10b981; background: white; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
    .form-group textarea { resize: vertical; }
    .char-count { text-align: right; font-size: 0.8rem; color: #94a3b8; margin-top: 0.25rem; }
    .btn-outline { background: white; border: 1.5px solid #e2e8f0; color: #475569; padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-outline:hover { border-color: #10b981; color: #10b981; }
    .btn-submit { background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 0.75rem 2rem; border-radius: 10px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(16,185,129,0.3); transition: all 0.2s; }
    .btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(16,185,129,0.4); }
    .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
    .error-message { background: #fee2e2; color: #ef4444; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.875rem; }
    .success-message { background: #d1fae5; color: #059669; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.875rem; font-weight: 600; }
  `]
})
export class SavedJobsComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  public router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private apiConfig = inject(ApiConfigService);
  private bookmarkService = inject(BookmarkService);

  jobs: Job[] = [];
  private subscription?: Subscription;

  // Apply modal state
  showApplyModal = false;
  selectedJob: Job | null = null;
  coverLetter = '';
  resumeUrl = '';
  applying = false;
  applyError = '';
  applySuccess = '';
  appliedJobIds = new Set<string>();

  categoryLabel = (v: number) => CATEGORY_LABELS[v] ?? 'Other';
  typeLabel = (v: number) => TYPE_LABELS[v] ?? '';

  private getHeaders() {
    const token = localStorage.getItem('hc_jwt');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  ngOnInit() {
    this.subscription = this.bookmarkService.bookmarks$.subscribe(bookmarks => {
      this.jobs = bookmarks;
      this.cdr.detectChanges();
    });
    
    // Optionally fetch applied jobs to disable Apply button for those
    this.http.get<any>(this.apiConfig.getEndpoint('/applications'), { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        const apps = res.items || [];
        apps.forEach((app: any) => this.appliedJobIds.add(app.jobId));
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  toggleBookmark(job: Job) {
    this.bookmarkService.toggleBookmark(job);
  }

  openApplyModal(job: Job) {
    this.selectedJob = job;
    this.coverLetter = '';
    this.resumeUrl = '';
    this.applyError = '';
    this.applySuccess = '';
    this.showApplyModal = true;
    this.cdr.detectChanges();
  }

  closeApplyModal() {
    this.showApplyModal = false;
    this.selectedJob = null;
    this.cdr.detectChanges();
  }

  submitApplication() {
    if (!this.selectedJob) return;

    this.applying = true;
    this.applyError = '';
    this.applySuccess = '';
    this.cdr.detectChanges();

    const payload = {
      jobId: this.selectedJob.jobId,
      recruiterId: this.selectedJob.recruiterId,
      coverLetter: this.coverLetter || null,
      resumeUrl: this.resumeUrl || null
    };

    this.http.post<any>(this.apiConfig.getEndpoint('/applications'), payload, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.appliedJobIds.add(this.selectedJob!.jobId);
        this.applySuccess = '🎉 Application submitted successfully!';
        this.applying = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.closeApplyModal();
        }, 1800);
      },
      error: (err) => {
        const status = err.status;
        if (status === 409) {
          this.applyError = 'You have already applied for this job.';
          this.appliedJobIds.add(this.selectedJob!.jobId);
        } else {
          this.applyError = err.error?.detail || 'Failed to submit application. Please try again.';
        }
        this.applying = false;
        this.cdr.detectChanges();
      }
    });
  }

  logout() {
    localStorage.removeItem('hc_jwt');
    this.router.navigate(['/login']);
  }
}
