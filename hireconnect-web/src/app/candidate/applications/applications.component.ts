import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiConfigService } from '../../core/services/api-config.service';

interface Application {
  applicationId: string;
  jobId: string;
  candidateId: string;
  appliedAt: string;
  status: number;
  coverLetter?: string;
  resumeUrl?: string;
  aiMatchScore?: number;
  // Let's assume we fetch job details separately or the backend provides it.
  // The backend currently only returns JobId. We will need to fetch job details if we want to show title.
  jobTitle?: string;
  companyName?: string;
}

const APP_STATUS_LABELS: Record<number, string> = {
  1: 'Applied', 2: 'Shortlisted', 3: 'Interview Scheduled', 4: 'Offered', 5: 'Rejected', 6: 'Withdrawn'
};

const APP_STATUS_COLORS: Record<number, string> = {
  1: '#3b82f6', 2: '#f59e0b', 3: '#8b5cf6', 4: '#10b981', 5: '#ef4444', 6: '#64748b'
};

@Component({
  selector: 'app-candidate-applications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <!-- Navbar -->
      <nav class="navbar">
        <div class="logo">HireConnect <span>Candidate</span></div>
        <div class="nav-links">
          <a class="nav-link" (click)="router.navigate(['/candidate/jobs'])">Find Jobs</a>
          <a class="nav-link active">My Applications</a>
          <a class="nav-link" (click)="router.navigate(['/candidate/profile'])">My Profile</a>
        </div>
        <button class="logout-btn" (click)="logout()">Logout</button>
      </nav>

      <!-- Main Content -->
      <main class="content">
        <header class="page-header">
          <h1>My Applications</h1>
          <p>Track the status of your job applications in real-time.</p>
        </header>

        <!-- Loading -->
        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
          <p>Loading your applications...</p>
        </div>

        <!-- Empty state -->
        <div class="empty-state" *ngIf="!loading && applications.length === 0">
          <div class="empty-icon">📝</div>
          <h3>No applications yet</h3>
          <p>You haven't applied to any jobs yet. Start exploring!</p>
          <button class="btn-primary" (click)="router.navigate(['/candidate/jobs'])">Find Jobs</button>
        </div>

        <!-- Applications List -->
        <div class="applications-grid" *ngIf="!loading && applications.length > 0">
          <div class="app-card" *ngFor="let app of applications">
            <div class="app-card-header">
              <div>
                <div class="job-title">{{ app.jobTitle || 'Job ID: ' + app.jobId }}</div>
                <div class="app-date">Applied on {{ app.appliedAt | date:'mediumDate' }}</div>
              </div>
              <span class="status-badge" [style.background]="statusColor(app.status) + '20'" [style.color]="statusColor(app.status)">
                {{ statusLabel(app.status) }}
              </span>
            </div>

            <!-- Progress Tracker -->
            <div class="progress-tracker">
              <div class="tracker-step" [class.active]="app.status >= 1" [class.current]="app.status === 1">
                <div class="step-circle">1</div>
                <div class="step-label">Applied</div>
              </div>
              <div class="tracker-line" [class.active]="app.status >= 2"></div>
              <div class="tracker-step" [class.active]="app.status >= 2 && app.status !== 5 && app.status !== 6" [class.current]="app.status === 2">
                <div class="step-circle">2</div>
                <div class="step-label">Shortlisted</div>
              </div>
              <div class="tracker-line" [class.active]="app.status >= 3 && app.status !== 5 && app.status !== 6"></div>
              <div class="tracker-step" [class.active]="app.status >= 3 && app.status !== 5 && app.status !== 6" [class.current]="app.status === 3">
                <div class="step-circle">3</div>
                <div class="step-label">Interview</div>
              </div>
              <div class="tracker-line" [class.active]="app.status >= 4 && app.status !== 5 && app.status !== 6"></div>
              <div class="tracker-step" [class.active]="app.status === 4" [class.current]="app.status === 4">
                <div class="step-circle">4</div>
                <div class="step-label">Offered</div>
              </div>
            </div>

            <div class="app-actions">
              <button class="btn-outline btn-sm btn-danger" *ngIf="app.status === 1" (click)="withdraw(app.applicationId)">Withdraw Application</button>
            </div>
          </div>
        </div>
      </main>
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
    .logout-btn:hover { background: #f1f5f9; color: #1e293b; }
    .content { max-width: 900px; margin: 0 auto; padding: 2rem; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { margin: 0 0 0.25rem 0; color: #0f172a; font-size: 1.8rem; }
    .page-header p { margin: 0; color: #64748b; }
    .loading-state, .empty-state { text-align: center; padding: 4rem; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #10b981; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-icon { font-size: 3.5rem; margin-bottom: 1rem; }
    .empty-state h3 { color: #1e293b; margin: 0 0 0.5rem; }
    .empty-state p { color: #64748b; margin: 0 0 1.5rem 0; }
    .btn-primary { background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 0.75rem 2rem; border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 0.95rem; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16,185,129,0.4); }
    .applications-grid { display: flex; flex-direction: column; gap: 1.5rem; }
    .app-card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; transition: all 0.2s; }
    .app-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
    .app-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .job-title { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.2rem; }
    .app-date { font-size: 0.85rem; color: #64748b; }
    .status-badge { font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.85rem; border-radius: 20px; white-space: nowrap; }
    
    .progress-tracker { display: flex; align-items: center; justify-content: space-between; margin: 2rem 0; padding: 0 1rem; }
    .tracker-step { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; position: relative; z-index: 2; width: 60px; }
    .step-circle { width: 32px; height: 32px; border-radius: 50%; background: #f1f5f9; border: 2px solid #cbd5e1; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #94a3b8; transition: all 0.3s; font-size: 0.85rem; }
    .step-label { font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-align: center; position: absolute; top: 40px; width: 100px; }
    .tracker-line { flex: 1; height: 3px; background: #e2e8f0; position: relative; z-index: 1; margin: 0 -15px; transform: translateY(-12px); transition: all 0.3s; }
    
    .tracker-step.active .step-circle { background: #10b981; border-color: #10b981; color: white; }
    .tracker-step.active .step-label { color: #1e293b; }
    .tracker-step.current .step-circle { box-shadow: 0 0 0 4px rgba(16,185,129,0.2); }
    .tracker-line.active { background: #10b981; }

    .app-actions { display: flex; justify-content: flex-end; margin-top: 2rem; border-top: 1px solid #f1f5f9; padding-top: 1rem; }
    .btn-outline { display: inline-block; background: white; border: 1.5px solid #e2e8f0; color: #475569; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; }
    .btn-danger { color: #ef4444; border-color: #fecaca; }
    .btn-danger:hover { background: #fef2f2; border-color: #ef4444; }
  `]
})
export class CandidateApplicationsComponent implements OnInit {
  private http = inject(HttpClient);
  public router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private apiConfig = inject(ApiConfigService);

  applications: Application[] = [];
  loading = true;

  statusLabel = (v: number) => APP_STATUS_LABELS[v] ?? 'Unknown';
  statusColor = (v: number) => APP_STATUS_COLORS[v] ?? '#64748b';

  private getHeaders() {
    const token = localStorage.getItem('hc_jwt');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  ngOnInit() {
    this.loadApplications();
  }

  loadApplications() {
    this.loading = true;
    this.cdr.detectChanges();

    this.http.get<any>(this.apiConfig.getEndpoint('/applications/mine?pageSize=100'), { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.applications = res.items ?? res ?? [];
        this.fetchJobTitles();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchJobTitles() {
    if (this.applications.length === 0) {
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    const jobIds = [...new Set(this.applications.map(a => a.jobId))];
    let completed = 0;

    const checkComplete = () => {
      completed++;
      if (completed === jobIds.length) {
        this.loading = false;
        this.cdr.detectChanges();
      }
    };

    jobIds.forEach(id => {
      this.http.get<any>(this.apiConfig.getEndpoint(`/jobs/${id}`)).subscribe({
        next: (job) => {
          this.applications.filter(a => a.jobId === id).forEach(a => {
            a.jobTitle = job.title;
          });
          checkComplete();
        },
        error: () => {
          // Job might be deleted (404)
          this.applications.filter(a => a.jobId === id).forEach(a => {
            a.jobTitle = 'Job No Longer Available';
          });
          checkComplete();
        }
      });
    });
  }

  withdraw(appId: string) {
    if (!confirm('Are you sure you want to withdraw this application?')) return;
    
    this.http.delete(this.apiConfig.getEndpoint(`/applications/${appId}`), { headers: this.getHeaders() }).subscribe({
      next: () => {
        const app = this.applications.find(a => a.applicationId === appId);
        if (app) app.status = 6; // Withdrawn
        this.cdr.detectChanges();
      },
      error: () => alert('Failed to withdraw application.')
    });
  }

  logout() {
    localStorage.removeItem('hc_jwt');
    this.router.navigate(['/login']);
  }
}
