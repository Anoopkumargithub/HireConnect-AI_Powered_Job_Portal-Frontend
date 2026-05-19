import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell.component';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiConfigService } from '../../core/services/api-config.service';

interface Interview {
  interviewId: string;
  applicationId: string;
  jobId: string;
  candidateId: string;
  recruiterId: string;
  scheduledAt: string;
  durationMinutes: number;
  mode: number;
  meetLink?: string;
  location?: string;
  status: number;
  recruiterNotes?: string;
  candidateNotes?: string;
  createdAt: string;
  
  // UI extended fields
  jobTitle?: string;
}

const INTERVIEW_STATUS_LABELS: Record<number, string> = {
  1: 'Scheduled',
  2: 'Confirmed',
  3: 'Completed',
  4: 'Cancelled',
  5: 'Rescheduled'
};

const INTERVIEW_STATUS_COLORS: Record<number, string> = {
  1: '#f59e0b', // Scheduled - amber
  2: '#10b981', // Confirmed - emerald
  3: '#3b82f6', // Completed - blue
  4: '#ef4444', // Cancelled - red
  5: '#8b5cf6'  // Rescheduled - purple
};

const INTERVIEW_MODE_LABELS: Record<number, string> = {
  1: 'Virtual / Video',
  2: 'In-Person',
  3: 'Phone'
};

@Component({
  selector: 'app-candidate-interviews',
  standalone: true,
  imports: [NotificationBellComponent, CommonModule],
  template: `
    <div class="dashboard-container">
      <nav class="navbar">
        <div class="logo">HireConnect <span>Candidate</span></div>
        <div class="nav-links">
          <a class="nav-link" (click)="router.navigate(['/candidate/jobs'])">Find Jobs</a>
                    <a class="nav-link" (click)="router.navigate(['/candidate/saved-jobs'])">Saved Jobs</a>
          <a class="nav-link" (click)="router.navigate(['/candidate/applications'])">My Applications</a>
          <a class="nav-link active">Interviews</a>
          <a class="nav-link" (click)="router.navigate(['/candidate/profile'])">My Profile</a>
        </div>
        <div class="nav-actions" style="display: flex; align-items: center; gap: 1.5rem;">
          <app-notification-bell></app-notification-bell>
          <button class="logout-btn" (click)="logout()">Logout</button>
        </div>
      </nav>

      <main class="content">
        <header class="page-header">
          <h1>My Interviews</h1>
          <p>Manage your upcoming and past interview schedules.</p>
        </header>

        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
          <p>Loading interviews...</p>
        </div>

        <div class="empty-state" *ngIf="!loading && interviews.length === 0">
          <div class="empty-icon">📅</div>
          <h3>No interviews yet</h3>
          <p>You don't have any interviews scheduled at the moment.</p>
          <button class="btn-primary mt-3" (click)="router.navigate(['/candidate/jobs'])">Find Jobs</button>
        </div>

        <div class="interviews-grid" *ngIf="!loading && interviews.length > 0">
          <div class="interview-card" *ngFor="let iv of interviews">
            <div class="card-header">
              <div>
                <h2>{{ iv.jobTitle || 'Loading Job Details...' }}</h2>
                <div class="mode-badge">{{ modeLabel(iv.mode) }}</div>
              </div>
              <span class="status-badge" [style.background]="statusColor(iv.status) + '20'" [style.color]="statusColor(iv.status)">
                {{ statusLabel(iv.status) }}
              </span>
            </div>

            <div class="interview-details">
              <div class="detail-row">
                <span class="icon">🕒</span>
                <div>
                  <strong>{{ iv.scheduledAt | date:'fullDate' }}</strong>
                  <div>{{ iv.scheduledAt | date:'shortTime' }} ({{ iv.durationMinutes }} mins)</div>
                </div>
              </div>

              <div class="detail-row" *ngIf="iv.mode === 1 && iv.meetLink">
                <span class="icon">🔗</span>
                <div>
                  <strong>Meeting Link</strong>
                  <div><a [href]="iv.meetLink" target="_blank" class="meet-link">{{ iv.meetLink }}</a></div>
                </div>
              </div>

              <div class="detail-row" *ngIf="iv.mode === 2 && iv.location">
                <span class="icon">📍</span>
                <div>
                  <strong>Location</strong>
                  <div>{{ iv.location }}</div>
                </div>
              </div>

              <div class="detail-row" *ngIf="iv.mode === 3 && iv.location">
                <span class="icon">📞</span>
                <div>
                  <strong>Phone / Contact</strong>
                  <div>{{ iv.location }}</div>
                </div>
              </div>
            </div>

            <div class="notes-section" *ngIf="iv.recruiterNotes">
              <strong>Notes from Recruiter:</strong>
              <p>{{ iv.recruiterNotes }}</p>
            </div>

            <div class="card-actions">
              <button class="btn-success" *ngIf="iv.status === 1" (click)="confirmInterview(iv.interviewId)" [disabled]="actionLoading === iv.interviewId">
                {{ actionLoading === iv.interviewId ? 'Confirming...' : 'Confirm Attendance' }}
              </button>
              
              <div class="action-message" *ngIf="iv.status === 2">
                ✅ You have confirmed your attendance.
              </div>
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
    .empty-state p { color: #64748b; margin: 0; }
    .mt-3 { margin-top: 1rem; }
    
    .interviews-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
    .interview-card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; transition: all 0.2s; }
    .interview-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
    
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #f1f5f9; }
    .card-header h2 { margin: 0 0 0.5rem 0; color: #0f172a; font-size: 1.3rem; }
    .mode-badge { display: inline-block; background: #f1f5f9; color: #475569; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
    .status-badge { font-size: 0.8rem; font-weight: 700; padding: 0.4rem 1rem; border-radius: 20px; white-space: nowrap; }
    
    .interview-details { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
    .detail-row { display: flex; gap: 1rem; align-items: flex-start; }
    .detail-row .icon { font-size: 1.25rem; }
    .detail-row strong { color: #1e293b; display: block; margin-bottom: 0.2rem; font-size: 0.95rem; }
    .detail-row div { color: #64748b; font-size: 0.9rem; }
    .meet-link { color: #10b981; text-decoration: none; word-break: break-all; }
    .meet-link:hover { text-decoration: underline; }
    
    .notes-section { background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 3px solid #10b981; }
    .notes-section strong { display: block; margin-bottom: 0.5rem; color: #334155; font-size: 0.9rem; }
    .notes-section p { margin: 0; color: #475569; font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap; }
    
    .card-actions { display: flex; justify-content: flex-end; align-items: center; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
    .btn-primary { background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
    .btn-success { background: #10b981; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.9rem; }
    .btn-success:hover:not(:disabled) { background: #059669; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(16,185,129,0.3); }
    .btn-success:disabled { opacity: 0.7; cursor: not-allowed; }
    .action-message { color: #059669; font-weight: 600; font-size: 0.95rem; }
  `]
})
export class CandidateInterviewsComponent implements OnInit {
  private http = inject(HttpClient);
  public router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private apiConfig = inject(ApiConfigService);

  interviews: Interview[] = [];
  loading = true;
  actionLoading: string | null = null;

  statusLabel = (v: number) => INTERVIEW_STATUS_LABELS[v] ?? 'Unknown';
  statusColor = (v: number) => INTERVIEW_STATUS_COLORS[v] ?? '#64748b';
  modeLabel = (v: number) => INTERVIEW_MODE_LABELS[v] ?? 'Virtual / Video';

  private getHeaders() {
    const token = localStorage.getItem('hc_jwt');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  ngOnInit() {
    this.loadInterviews();
  }

  loadInterviews() {
    this.loading = true;
    this.http.get<Interview[]>(this.apiConfig.getEndpoint('/interviews/mine'), { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.interviews = res || [];
        this.fetchJobTitles();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchJobTitles() {
    const jobIds = [...new Set(this.interviews.map(i => i.jobId))];
    
    jobIds.forEach(id => {
      this.http.get<any>(this.apiConfig.getEndpoint(`/jobs/${id}`), { headers: this.getHeaders() }).subscribe({
        next: (job) => {
          this.interviews.forEach(iv => {
            if (iv.jobId === id) {
              iv.jobTitle = job.title;
            }
          });
          this.cdr.detectChanges();
        },
        error: () => {
          this.interviews.forEach(iv => {
            if (iv.jobId === id) {
              iv.jobTitle = 'Job No Longer Available';
            }
          });
          this.cdr.detectChanges();
        }
      });
    });
  }

  confirmInterview(interviewId: string) {
    this.actionLoading = interviewId;
    this.http.patch(this.apiConfig.getEndpoint(`/interviews/${interviewId}/confirm`), {}, { headers: this.getHeaders() }).subscribe({
      next: () => {
        const iv = this.interviews.find(i => i.interviewId === interviewId);
        if (iv) {
          iv.status = 2; // Confirmed
        }
        this.actionLoading = null;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Failed to confirm interview.');
        this.actionLoading = null;
        this.cdr.detectChanges();
      }
    });
  }

  logout() {
    localStorage.removeItem('hc_jwt');
    this.router.navigate(['/login']);
  }
}
