import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiConfigService } from '../../core/services/api-config.service';

interface Job {
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

const CATEGORY_LABELS: Record<number, string> = {
  1: 'Software Engineering', 2: 'Data Science', 3: 'DevOps',
  4: 'Product Management', 5: 'Design', 6: 'QA', 7: 'Sales',
  8: 'Marketing', 9: 'HR', 10: 'Finance', 99: 'Other'
};

const TYPE_LABELS: Record<number, string> = {
  1: 'Full-time', 2: 'Part-time', 3: 'Contract', 4: 'Internship'
};

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <!-- Navbar -->
      <nav class="navbar">
        <div class="logo">HireConnect <span>Candidate</span></div>
        <div class="nav-links">
          <a class="nav-link active">Find Jobs</a>
          <a class="nav-link" (click)="router.navigate(['/candidate/applications'])">My Applications</a>
        </div>
        <button class="logout-btn" (click)="logout()">Logout</button>
      </nav>

      <!-- Main Content -->
      <main class="content">
        <header class="page-header">
          <h1>Find Your Next Job</h1>
          <p>Discover opportunities matched to your skills.</p>
        </header>

        <!-- Search bar -->
        <div class="search-bar">
          <input type="text" [(ngModel)]="keyword" placeholder="Search by title, skill, or keyword..." (keyup.enter)="search()" />
          <input type="text" [(ngModel)]="location" placeholder="Location" (keyup.enter)="search()" />
          <select [(ngModel)]="category" (change)="search()">
            <option [value]="''">All Categories</option>
            <option *ngFor="let cat of categories" [value]="cat.value">{{ cat.label }}</option>
          </select>
          <button class="btn-primary" (click)="search()">Search</button>
        </div>

        <!-- Loading -->
        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
          <p>Searching for jobs...</p>
        </div>

        <!-- Empty state -->
        <div class="empty-state" *ngIf="!loading && jobs.length === 0">
          <div class="empty-icon">🔍</div>
          <h3>No jobs found</h3>
          <p>Try adjusting your search filters.</p>
        </div>

        <!-- Jobs list -->
        <div class="jobs-list" *ngIf="!loading && jobs.length > 0">
          <div class="result-count">{{ total }} job{{ total !== 1 ? 's' : '' }} found</div>

          <div class="job-card" *ngFor="let job of jobs">
            <div class="job-card-main">
              <div class="job-info">
                <div class="job-title">{{ job.title }}</div>
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
                <div class="job-views">👁 {{ job.viewCount }}</div>
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

          <!-- Pagination -->
          <div class="pagination" *ngIf="totalPages > 1">
            <button [disabled]="page === 1" (click)="changePage(page - 1)">← Prev</button>
            <span>Page {{ page }} of {{ totalPages }}</span>
            <button [disabled]="page === totalPages" (click)="changePage(page + 1)">Next →</button>
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
    .search-bar { display: flex; gap: 0.75rem; margin-bottom: 2rem; flex-wrap: wrap; }
    .search-bar input, .search-bar select { flex: 1; min-width: 160px; padding: 0.85rem 1rem; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 0.95rem; color: #1e293b; background: white; transition: all 0.2s; font-family: inherit; }
    .search-bar input:focus, .search-bar select:focus { outline: none; border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
    .btn-primary { background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 0.85rem 2rem; border-radius: 10px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(16,185,129,0.3); transition: all 0.2s; font-size: 0.95rem; white-space: nowrap; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16,185,129,0.4); }
    .loading-state { text-align: center; padding: 5rem; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #10b981; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-state p, .empty-state p { color: #64748b; }
    .empty-state { text-align: center; padding: 5rem; }
    .empty-icon { font-size: 4rem; margin-bottom: 1rem; }
    .empty-state h3 { color: #1e293b; margin: 0 0 0.5rem; }
    .jobs-list { display: flex; flex-direction: column; gap: 1rem; }
    .result-count { color: #64748b; font-size: 0.9rem; margin-bottom: 0.5rem; font-weight: 500; }
    .job-card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; transition: all 0.2s; }
    .job-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); border-color: #e2e8f0; }
    .job-card-main { display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem; margin-bottom: 1rem; }
    .job-info { flex: 1; }
    .job-title { font-size: 1.2rem; font-weight: 700; color: #0f172a; margin-bottom: 0.2rem; }
    .job-meta { font-size: 0.85rem; color: #10b981; font-weight: 600; margin-bottom: 0.25rem; }
    .job-location, .job-salary { font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem; }
    .job-skills { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.5rem; }
    .skill-tag { background: #ecfdf5; color: #059669; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
    .job-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; min-width: 130px; }
    .job-exp { background: #eff6ff; color: #3b82f6; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
    .job-views { font-size: 0.8rem; color: #94a3b8; }
    .btn-apply { background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 0.65rem 1.5rem; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; font-size: 0.9rem; }
    .btn-apply:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16,185,129,0.4); }
    .btn-apply.applied { background: #d1fae5; color: #059669; cursor: default; }
    .btn-apply:disabled { opacity: 0.7; cursor: not-allowed; }
    .job-desc { color: #64748b; font-size: 0.875rem; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 1rem; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 2rem; }
    .pagination button { background: white; border: 1.5px solid #e2e8f0; padding: 0.5rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 600; color: #374151; transition: all 0.2s; }
    .pagination button:hover:not(:disabled) { border-color: #10b981; color: #10b981; }
    .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
    .pagination span { color: #64748b; font-size: 0.9rem; }
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
export class JobsComponent implements OnInit {
  private http = inject(HttpClient);
  public router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private apiConfig = inject(ApiConfigService);

  jobs: Job[] = [];
  loading = true;
  keyword = '';
  location = '';
  category: number | '' = '';
  page = 1;
  pageSize = 10;
  total = 0;
  totalPages = 1;

  // Apply modal state
  showApplyModal = false;
  selectedJob: Job | null = null;
  coverLetter = '';
  resumeUrl = '';
  applying = false;
  applyError = '';
  applySuccess = '';
  appliedJobIds = new Set<string>();

  categories = Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: +v, label: l }));
  categoryLabel = (v: number) => CATEGORY_LABELS[v] ?? 'Other';
  typeLabel = (v: number) => TYPE_LABELS[v] ?? '';

  private getHeaders() {
    const token = localStorage.getItem('hc_jwt');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  ngOnInit() { this.search(); }

  search(resetPage = true) {
    if (resetPage) this.page = 1;
    this.loading = true;
    this.cdr.detectChanges();

    let url = `${this.apiConfig.getApiUrl()}/jobs?page=${this.page}&pageSize=${this.pageSize}`;
    if (this.keyword) url += `&keyword=${encodeURIComponent(this.keyword)}`;
    if (this.location) url += `&location=${encodeURIComponent(this.location)}`;
    if (this.category) url += `&category=${this.category}`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.jobs = res.items ?? res ?? [];
        this.total = res.total ?? this.jobs.length;
        this.totalPages = Math.ceil(this.total / this.pageSize);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  changePage(p: number) {
    this.page = p;
    this.search(false);
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
