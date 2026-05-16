import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiConfigService } from '../../core/services/api-config.service';

interface Job {
  jobId: string;
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

const STATUS_LABELS: Record<number, string> = {
  1: 'Draft', 2: 'Active', 3: 'Paused', 4: 'Closed'
};

const STATUS_COLORS: Record<number, string> = {
  1: '#f59e0b', 2: '#10b981', 3: '#6366f1', 4: '#ef4444'
};

@Component({
  selector: 'app-my-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <!-- Navbar -->
      <nav class="navbar">
        <div class="logo">HireConnect <span>Recruiter</span></div>
        <div class="nav-links">
          <a class="nav-link active">My Jobs</a>
          <a class="nav-link" (click)="router.navigate(['/recruiter/applications'])">Applications</a>
          <a class="nav-link" (click)="router.navigate(['/recruiter/analytics'])">Analytics</a>
          <a class="nav-link" (click)="router.navigate(['/recruiter/profile'])">Company Profile</a>
        </div>
        <button class="logout-btn" (click)="logout()">Logout</button>
      </nav>

      <!-- Main Content -->
      <main class="content">
        <header class="page-header">
          <div>
            <h1>My Jobs</h1>
            <p>Manage your job postings and track applications.</p>
          </div>
          <button class="btn-primary" (click)="openModal()">+ Post New Job</button>
        </header>

        <!-- Loading -->
        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
          <p>Loading your jobs...</p>
        </div>

        <!-- Empty state -->
        <div class="empty-state" *ngIf="!loading && jobs.length === 0">
          <div class="empty-icon">📋</div>
          <h3>No jobs posted yet</h3>
          <p>Click "Post New Job" to get started.</p>
        </div>

        <!-- Jobs Grid -->
        <div class="jobs-grid" *ngIf="!loading && jobs.length > 0">
          <div class="job-card" *ngFor="let job of jobs">
            <div class="job-card-header">
              <div>
                <div class="job-title">{{ job.title }}</div>
                <div class="job-meta">{{ categoryLabel(job.category) }} · {{ typeLabel(job.type) }}</div>
                <div class="job-location">📍 {{ job.location }}{{ job.isRemote ? ' · Remote' : '' }}</div>
              </div>
              <span class="status-badge" [style.background]="statusColor(job.status) + '20'" [style.color]="statusColor(job.status)">
                {{ statusLabel(job.status) }}
              </span>
            </div>
            <div class="job-card-footer">
              <div class="job-salary" *ngIf="job.salaryMin || job.salaryMax">
                💰 {{ job.currency || 'USD' }} {{ job.salaryMin | number }} – {{ job.salaryMax | number }}
              </div>
              <div class="job-views">👁 {{ job.viewCount }} views</div>
            </div>
            <div class="job-skills" *ngIf="job.requiredSkills.length">
              <span class="skill-tag" *ngFor="let skill of job.requiredSkills.slice(0, 4)">{{ skill }}</span>
            </div>
            <div class="job-actions">
              <button class="btn-sm btn-danger" (click)="deleteJob(job.jobId)">Delete</button>
            </div>
          </div>
        </div>
      </main>

      <!-- Post Job Modal -->
      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Post a New Job</h2>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>

          <div class="modal-body">
            <div class="error-message" *ngIf="formError">{{ formError }}</div>

            <div class="form-row">
              <div class="form-group">
                <label>Job Title *</label>
                <input type="text" [(ngModel)]="form.title" placeholder="e.g. Senior Software Engineer" />
              </div>
              <div class="form-group">
                <label>Location *</label>
                <input type="text" [(ngModel)]="form.location" placeholder="e.g. Bangalore, India" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Category *</label>
                <select [(ngModel)]="form.category">
                  <option *ngFor="let cat of categories" [value]="cat.value">{{ cat.label }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Job Type *</label>
                <select [(ngModel)]="form.type">
                  <option *ngFor="let t of types" [value]="t.value">{{ t.label }}</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Min Salary</label>
                <input type="number" [(ngModel)]="form.salaryMin" placeholder="e.g. 60000" />
              </div>
              <div class="form-group">
                <label>Max Salary</label>
                <input type="number" [(ngModel)]="form.salaryMax" placeholder="e.g. 100000" />
              </div>
              <div class="form-group">
                <label>Currency</label>
                <input type="text" [(ngModel)]="form.currency" placeholder="USD" maxlength="3" style="text-transform:uppercase" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Min. Experience (years)</label>
                <input type="number" [(ngModel)]="form.experienceMinYears" min="0" max="50" placeholder="0" />
              </div>
              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="form.isRemote" />
                  Remote Position
                </label>
              </div>
            </div>

            <div class="form-group">
              <label>Required Skills (comma-separated)</label>
              <input type="text" [(ngModel)]="skillsInput" placeholder="e.g. Angular, TypeScript, Node.js" />
            </div>

            <div class="form-group">
              <label>Job Description *</label>
              <textarea [(ngModel)]="form.description" rows="5" placeholder="Describe the role, responsibilities, and requirements..."></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModal()">Cancel</button>
            <button class="btn-primary" (click)="postJob()" [disabled]="posting">
              {{ posting ? 'Posting...' : 'Post Job' }}
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
    .logo span { color: #6366f1; }
    .nav-links { display: flex; gap: 1.5rem; margin-left: 2rem; flex: 1; }
    .nav-link { color: #64748b; text-decoration: none; font-weight: 600; cursor: pointer; padding: 0.5rem 0; border-bottom: 2px solid transparent; transition: all 0.2s; }
    .nav-link:hover { color: #6366f1; }
    .nav-link.active { color: #6366f1; border-bottom-color: #6366f1; }
    .logout-btn { background: transparent; border: 1px solid #e2e8f0; padding: 0.5rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 500; color: #64748b; transition: all 0.2s; }
    .logout-btn:hover { background: #f1f5f9; color: #1e293b; }
    .content { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; }
    .page-header h1 { margin: 0 0 0.25rem 0; color: #0f172a; font-size: 1.8rem; }
    .page-header p { margin: 0; color: #64748b; }
    .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(99,102,241,0.3); transition: all 0.2s; font-size: 0.95rem; }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(99,102,241,0.4); }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
    .btn-outline { background: white; border: 1.5px solid #e2e8f0; color: #475569; padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-outline:hover { border-color: #6366f1; color: #6366f1; }
    .btn-sm { padding: 0.35rem 0.85rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; }
    .btn-danger { background: #fee2e2; color: #ef4444; }
    .btn-danger:hover { background: #ef4444; color: white; }
    .loading-state { text-align: center; padding: 5rem; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-state p, .empty-state p { color: #64748b; }
    .empty-state { text-align: center; padding: 5rem; }
    .empty-icon { font-size: 4rem; margin-bottom: 1rem; }
    .empty-state h3 { color: #1e293b; margin: 0 0 0.5rem; }
    .jobs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem; }
    .job-card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #f1f5f9; transition: all 0.2s; }
    .job-card:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
    .job-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; gap: 1rem; }
    .job-title { font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-bottom: 0.2rem; }
    .job-meta { font-size: 0.85rem; color: #6366f1; font-weight: 600; margin-bottom: 0.2rem; }
    .job-location { font-size: 0.85rem; color: #64748b; }
    .status-badge { font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.8rem; border-radius: 20px; white-space: nowrap; }
    .job-card-footer { display: flex; justify-content: space-between; font-size: 0.85rem; color: #64748b; margin-bottom: 1rem; padding: 0.75rem 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; }
    .job-skills { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem; }
    .skill-tag { background: #eff6ff; color: #3b82f6; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
    .job-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: white; border-radius: 20px; width: 100%; max-width: 700px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: white; z-index: 1; border-radius: 20px 20px 0 0; }
    .modal-header h2 { margin: 0; color: #0f172a; font-size: 1.4rem; }
    .close-btn { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .close-btn:hover { background: #e2e8f0; }
    .modal-body { padding: 2rem; }
    .modal-footer { padding: 1.5rem 2rem; border-top: 1px solid #f1f5f9; display: flex; gap: 1rem; justify-content: flex-end; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-row:has(.form-group:nth-child(3)) { grid-template-columns: 1fr 1fr 1fr; }
    .form-group { margin-bottom: 1.2rem; }
    .form-group label { display: block; margin-bottom: 0.4rem; color: #374151; font-weight: 600; font-size: 0.875rem; }
    .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.7rem 1rem; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 0.95rem; color: #1e293b; background: #fafafa; transition: all 0.2s; font-family: inherit; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #6366f1; background: white; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
    .form-group textarea { resize: vertical; }
    .checkbox-group { display: flex; align-items: center; }
    .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: 600; font-size: 0.9rem; color: #374151; margin-top: 1.5rem; }
    .checkbox-label input[type=checkbox] { width: 18px; height: 18px; accent-color: #6366f1; }
    .error-message { background: #fee2e2; color: #ef4444; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.875rem; }
  `]
})
export class MyJobsComponent implements OnInit {
  private http = inject(HttpClient);
  public router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private apiConfig = inject(ApiConfigService);

  jobs: Job[] = [];
  loading = true;
  showModal = false;
  posting = false;
  formError = '';
  skillsInput = '';

  form = {
    title: '', category: 1, type: 1, location: '',
    isRemote: false, salaryMin: null as number | null, salaryMax: null as number | null,
    currency: 'USD', description: '', requiredSkills: [] as string[], experienceMinYears: 0
  };

  categories = Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: +v, label: l }));
  types = Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: +v, label: l }));

  categoryLabel = (v: number) => CATEGORY_LABELS[v] ?? 'Other';
  typeLabel = (v: number) => TYPE_LABELS[v] ?? '';
  statusLabel = (v: number) => STATUS_LABELS[v] ?? '';
  statusColor = (v: number) => STATUS_COLORS[v] ?? '#64748b';

  private getHeaders() {
    const token = localStorage.getItem('hc_jwt');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  ngOnInit() {
    this.loadJobs();
  }

  loadJobs() {
    this.loading = true;
    this.cdr.detectChanges();
    this.http.get<any>(this.apiConfig.getEndpoint('/jobs/mine'), { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.jobs = res.items ?? res ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openModal() {
    this.form = { title: '', category: 1, type: 1, location: '', isRemote: false, salaryMin: null, salaryMax: null, currency: 'USD', description: '', requiredSkills: [], experienceMinYears: 0 };
    this.skillsInput = '';
    this.formError = '';
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  postJob() {
    if (!this.form.title || !this.form.location || !this.form.description) {
      this.formError = 'Please fill in all required fields (Title, Location, Description).';
      this.cdr.detectChanges();
      return;
    }
    this.formError = '';
    this.posting = true;
    this.cdr.detectChanges();

    const payload = {
      ...this.form,
      requiredSkills: this.skillsInput ? this.skillsInput.split(',').map(s => s.trim()).filter(Boolean) : [],
      category: +this.form.category,
      type: +this.form.type,
      experienceMinYears: +this.form.experienceMinYears
    };

    this.http.post<Job>(this.apiConfig.getEndpoint('/jobs'), payload, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.posting = false;
        this.showModal = false;
        this.cdr.detectChanges();
        this.loadJobs();
      },
      error: (err) => {
        this.formError = err.error?.detail || 'Failed to post job. Please try again.';
        this.posting = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteJob(id: string) {
    if (!confirm('Are you sure you want to delete this job?')) return;
    this.http.delete(this.apiConfig.getEndpoint(`/jobs/${id}`), { headers: this.getHeaders() }).subscribe({
      next: () => this.loadJobs(),
      error: () => {
        alert('Failed to delete job.');
        this.cdr.detectChanges();
      }
    });
  }

  logout() {
    localStorage.removeItem('hc_jwt');
    this.router.navigate(['/login']);
  }
}
