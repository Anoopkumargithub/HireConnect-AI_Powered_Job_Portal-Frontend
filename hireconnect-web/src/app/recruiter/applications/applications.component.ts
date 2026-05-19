import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell.component';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiConfigService } from '../../core/services/api-config.service';

interface Job {
  jobId: string;
  title: string;
}

interface Application {
  applicationId: string;
  jobId: string;
  candidateId: string;
  appliedAt: string;
  status: number;
  coverLetter?: string;
  resumeUrl?: string;
  aiMatchScore?: number;
  oneLineSummary?: string;
  interviewMarks?: number;
}

const APP_STATUS_LABELS: Record<number, string> = {
  1: 'Applied', 2: 'Shortlisted', 3: 'Interview Scheduled', 4: 'Offered', 5: 'Rejected', 6: 'Withdrawn'
};

const APP_STATUS_COLORS: Record<number, string> = {
  1: '#3b82f6', 2: '#f59e0b', 3: '#8b5cf6', 4: '#10b981', 5: '#ef4444', 6: '#64748b'
};

@Component({
  selector: 'app-recruiter-applications',
  standalone: true,
  imports: [NotificationBellComponent, CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <!-- Navbar -->
      <nav class="navbar">
        <div class="logo">HireConnect <span>Recruiter</span></div>
        <div class="nav-links">
          <a class="nav-link" (click)="router.navigate(['/recruiter/my-jobs'])">My Jobs</a>
          <a class="nav-link active">Applications</a>
          <a class="nav-link" (click)="router.navigate(['/recruiter/analytics'])">Analytics</a>
          <a class="nav-link" (click)="router.navigate(['/recruiter/profile'])">Company Profile</a>
          <a class="nav-link" (click)="router.navigate(['/recruiter/billing'])">Billing</a>
        </div>
        <div class="nav-actions" style="display: flex; align-items: center; gap: 1.5rem;">
          <app-notification-bell></app-notification-bell>
          <button class="logout-btn" (click)="logout()">Logout</button>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="content">
        <header class="page-header">
          <h1>Application Tracking</h1>
          <p>Review and manage candidate applications across your job postings.</p>
        </header>

        <!-- Job Selector -->
        <div class="filter-section" style="display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; flex-wrap: wrap;">
          <div class="form-group" style="flex: 1; margin-bottom: 0; min-width: 250px;">
            <label>Select Job to View Applications</label>
            <select [(ngModel)]="selectedJobId" (change)="loadApplications()">
              <option value="">-- Choose a Job --</option>
              <option *ngFor="let job of jobs" [value]="job.jobId">{{ job.title }}</option>
            </select>
          </div>
          <div class="action-group" style="display: flex; gap: 0.5rem;">
            <button class="btn-outline" *ngIf="selectedJobId && applications.length > 0" (click)="toggleSortByMarks()">
              {{ sortByMarks ? 'Unsort' : 'Sort by Marks' }}
            </button>
            <button class="btn-ai" *ngIf="selectedJobId && applications.length > 0" (click)="generateAiInsights()" [disabled]="generatingAi">
              <span class="ai-icon">✨</span> {{ generatingAi ? 'Analyzing Profiles...' : 'Generate AI Insights' }}
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
          <p>Loading...</p>
        </div>

        <!-- Empty state -->
        <div class="empty-state" *ngIf="!loading && selectedJobId && applications.length === 0">
          <div class="empty-icon">📁</div>
          <h3>No applications yet</h3>
          <p>Candidates haven't applied to this job yet.</p>
        </div>

        <div class="empty-state" *ngIf="!loading && !selectedJobId">
          <div class="empty-icon">👈</div>
          <h3>Select a job</h3>
          <p>Please select a job from the dropdown to view its applications.</p>
        </div>

        <!-- Applications List -->
        <div class="applications-grid" *ngIf="!loading && applications.length > 0">
          <div class="app-card" *ngFor="let app of applications">
            <div class="app-card-header">
              <div>
                <div class="candidate-name">Candidate {{ app.candidateId | slice:0:8 }}...</div>
                <div class="app-date">Applied on {{ app.appliedAt | date:'mediumDate' }}</div>
              </div>
              <span class="status-badge" [style.background]="statusColor(app.status) + '20'" [style.color]="statusColor(app.status)">
                {{ statusLabel(app.status) }}
              </span>
            </div>

            <div class="ai-score" *ngIf="app.aiMatchScore !== undefined && app.aiMatchScore !== null">
              <div class="score-header">
                <span>AI Match Score</span>
                <span class="score-val">{{ app.aiMatchScore }}%</span>
              </div>
              <div class="score-bar">
                <div class="score-fill" [style.width]="app.aiMatchScore + '%'"></div>
              </div>
              <div class="ai-summary" *ngIf="app.oneLineSummary">
                <strong>💡 AI Insight:</strong> {{ app.oneLineSummary }}
              </div>
            </div>

            <div class="app-details" *ngIf="app.coverLetter">
              <strong>Cover Letter:</strong>
              <p>{{ (app.coverLetter | slice:0:150) }}{{ app.coverLetter.length > 150 ? '...' : '' }}</p>
            </div>

            <div class="marks-section" *ngIf="app.status >= 3">
              <div class="score-header">
                <span>Interview Marks (0-100)</span>
              </div>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <input type="number" [(ngModel)]="app.interviewMarks" placeholder="Score" min="0" max="100" class="marks-input" />
                <button class="btn-sm btn-outline" (click)="saveMarks(app)">Save</button>
              </div>
            </div>

            <div class="app-actions">
              <a *ngIf="app.resumeUrl" [href]="app.resumeUrl" target="_blank" class="btn-outline btn-sm">📄 View Resume</a>
              
              <div class="action-buttons">
                <button class="btn-sm btn-success" *ngIf="app.status === 1" (click)="updateStatus(app.applicationId, 2)">Shortlist</button>
                <button class="btn-sm btn-primary-alt" *ngIf="app.status === 2" (click)="openScheduleModal(app)">Schedule Interview</button>
                <button class="btn-sm btn-success" *ngIf="app.status === 3" (click)="updateStatus(app.applicationId, 4)">Offer Job</button>
                <button class="btn-sm btn-danger" *ngIf="app.status === 1 || app.status === 2 || app.status === 3" (click)="updateStatus(app.applicationId, 5)">Reject</button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Schedule Interview Modal -->
      <div class="modal-overlay" *ngIf="showScheduleModal" (click)="closeScheduleModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Schedule Interview</h2>
            <button class="close-btn" (click)="closeScheduleModal()">✕</button>
          </div>

          <div class="modal-body">
            <div class="error-message" *ngIf="scheduleError">{{ scheduleError }}</div>
            <div class="success-message" *ngIf="scheduleSuccess">{{ scheduleSuccess }}</div>

            <div class="form-row">
              <div class="form-group">
                <label>Date & Time *</label>
                <input type="datetime-local" [(ngModel)]="interviewForm.scheduledAt" />
              </div>
              <div class="form-group">
                <label>Duration (minutes) *</label>
                <input type="number" [(ngModel)]="interviewForm.durationMinutes" min="15" max="480" />
              </div>
            </div>

            <div class="form-group">
              <label>Interview Mode *</label>
              <select [(ngModel)]="interviewForm.mode">
                <option value="1">Virtual / Video</option>
                <option value="2">In-Person</option>
                <option value="3">Phone</option>
              </select>
            </div>

            <div class="form-group" *ngIf="interviewForm.mode == '1'">
              <label>Meeting Link</label>
              <input type="url" [(ngModel)]="interviewForm.meetLink" placeholder="https://meet.google.com/... " />
            </div>

            <div class="form-group" *ngIf="interviewForm.mode == '2'">
              <label>Location</label>
              <input type="text" [(ngModel)]="interviewForm.location" placeholder="Office address or meeting room" />
            </div>

            <div class="form-group">
              <label>Recruiter Notes (Optional)</label>
              <textarea [(ngModel)]="interviewForm.recruiterNotes" rows="3" placeholder="Notes or instructions for the candidate..."></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-outline" (click)="closeScheduleModal()">Cancel</button>
            <button class="btn-primary" (click)="submitSchedule()" [disabled]="scheduling">
              {{ scheduling ? 'Scheduling...' : 'Confirm Schedule' }}
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
    .content { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { margin: 0 0 0.25rem 0; color: #0f172a; font-size: 1.8rem; }
    .page-header p { margin: 0; color: #64748b; }
    .filter-section { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 2rem; border: 1px solid #e2e8f0; }
    .form-group label { display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 600; font-size: 0.9rem; }
    .form-group select, .form-group input, .form-group textarea { width: 100%; padding: 0.75rem 1rem; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 0.95rem; color: #1e293b; background: #fafafa; outline: none; transition: border-color 0.2s; font-family: inherit; }
    .form-group select:focus, .form-group input:focus, .form-group textarea:focus { border-color: #6366f1; background: white; }
    .loading-state, .empty-state { text-align: center; padding: 4rem; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-icon { font-size: 3.5rem; margin-bottom: 1rem; }
    .empty-state h3 { color: #1e293b; margin: 0 0 0.5rem; }
    .empty-state p { color: #64748b; margin: 0; }
    .applications-grid { display: flex; flex-direction: column; gap: 1rem; }
    .app-card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; transition: all 0.2s; }
    .app-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
    .app-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
    .candidate-name { font-size: 1.1rem; font-weight: 700; color: #0f172a; }
    .app-date { font-size: 0.85rem; color: #64748b; margin-top: 0.25rem; }
    .status-badge { font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.8rem; border-radius: 20px; white-space: nowrap; }
    .ai-score { margin-bottom: 1.25rem; }
    .score-header { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 0.4rem; }
    .score-val { color: #6366f1; }
    .score-bar { height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
    .score-fill { height: 100%; background: linear-gradient(90deg, #8b5cf6, #6366f1); border-radius: 3px; }
    .app-details { background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1.25rem; font-size: 0.9rem; color: #334155; }
    .app-details strong { display: block; margin-bottom: 0.25rem; color: #0f172a; }
    .app-details p { margin: 0; line-height: 1.5; }
    .app-actions { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 1.25rem; }
    .btn-outline { display: inline-block; background: white; border: 1.5px solid #e2e8f0; color: #475569; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; text-decoration: none; transition: all 0.2s; font-size: 0.85rem; cursor: pointer; }
    .btn-outline:hover { border-color: #6366f1; color: #6366f1; }
    .action-buttons { display: flex; gap: 0.5rem; }
    .btn-sm { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; }
    .btn-success { background: #d1fae5; color: #059669; }
    .btn-success:hover { background: #10b981; color: white; }
    .btn-primary-alt { background: #e0e7ff; color: #4f46e5; }
    .btn-primary-alt:hover { background: #4f46e5; color: white; }
    .btn-danger { background: #fee2e2; color: #ef4444; }
    .btn-danger:hover { background: #ef4444; color: white; }
    .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
    
    .btn-ai { background: linear-gradient(135deg, #a855f7, #6366f1); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3); }
    .btn-ai:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(168, 85, 247, 0.4); }
    .btn-ai:disabled { opacity: 0.7; cursor: wait; }
    .ai-summary { margin-top: 1rem; font-size: 0.9rem; color: #4b5563; background: #f3e8ff; padding: 0.75rem; border-radius: 8px; border-left: 3px solid #a855f7; line-height: 1.5; }
    .ai-summary strong { color: #7e22ce; display: block; margin-bottom: 0.25rem; }
    .marks-section { background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1.25rem; border-left: 3px solid #10b981; }
    .marks-input { padding: 0.5rem; border: 1.5px solid #e2e8f0; border-radius: 6px; font-size: 0.9rem; outline: none; width: 100px; }
    .marks-input:focus { border-color: #10b981; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: white; border-radius: 20px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: white; z-index: 1; border-radius: 20px 20px 0 0; }
    .modal-header h2 { margin: 0; color: #0f172a; font-size: 1.4rem; }
    .close-btn { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .close-btn:hover { background: #e2e8f0; }
    .modal-body { padding: 2rem; }
    .modal-footer { padding: 1.5rem 2rem; border-top: 1px solid #f1f5f9; display: flex; gap: 1rem; justify-content: flex-end; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1.2rem; }
    .error-message { background: #fee2e2; color: #ef4444; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.875rem; }
    .success-message { background: #d1fae5; color: #059669; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.875rem; font-weight: 600; }
  `]
})
export class RecruiterApplicationsComponent implements OnInit {
  private http = inject(HttpClient);
  public router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private apiConfig = inject(ApiConfigService);

  jobs: Job[] = [];
  selectedJobId = '';
  applications: Application[] = [];
  loading = false;
  generatingAi = false;
  sortByMarks = false;

  // Interview Schedule State
  showScheduleModal = false;
  scheduling = false;
  scheduleError = '';
  scheduleSuccess = '';
  targetApplication: Application | null = null;

  interviewForm = {
    scheduledAt: '',
    durationMinutes: 45,
    mode: '1',
    meetLink: '',
    location: '',
    recruiterNotes: ''
  };

  statusLabel = (v: number) => APP_STATUS_LABELS[v] ?? 'Unknown';
  statusColor = (v: number) => APP_STATUS_COLORS[v] ?? '#64748b';

  private getHeaders() {
    const token = localStorage.getItem('hc_jwt');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  ngOnInit() {
    this.loadJobs();
  }

  loadJobs() {
    this.http.get<any>(this.apiConfig.getEndpoint('/jobs/mine'), { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.jobs = res.items ?? res ?? [];
        this.cdr.detectChanges();
      }
    });
  }

  loadApplications() {
    if (!this.selectedJobId) {
      this.applications = [];
      return;
    }
    
    this.loading = true;
    this.cdr.detectChanges();

    this.http.get<any>(this.apiConfig.getEndpoint(`/applications/job/${this.selectedJobId}`), { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.applications = res.items ?? res ?? [];
        this.loading = false;
        this.sortApplications();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  generateAiInsights() {
    if (!this.selectedJobId) return;
    this.generatingAi = true;
    this.cdr.detectChanges();

    this.http.get<any[]>(this.apiConfig.getEndpoint(`/ai/jobs/${this.selectedJobId}/ranked-candidates`), { headers: this.getHeaders() }).subscribe({
      next: (rankedCandidates) => {
        // Merge AI insights back into applications list
        rankedCandidates.forEach(rc => {
          const app = this.applications.find(a => a.applicationId === rc.applicationId);
          if (app) {
            app.aiMatchScore = rc.aiMatchScore;
            app.oneLineSummary = rc.oneLineSummary;
          }
        });
        
        // Sort applications by aiMatchScore descending
        this.applications.sort((a, b) => (b.aiMatchScore || 0) - (a.aiMatchScore || 0));

        this.generatingAi = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to generate AI insights', err);
        alert('Failed to generate AI insights. Check API keys and backend logs.');
        this.generatingAi = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleSortByMarks() {
    this.sortByMarks = !this.sortByMarks;
    this.sortApplications();
  }

  sortApplications() {
    if (this.sortByMarks) {
      this.applications.sort((a, b) => (b.interviewMarks || 0) - (a.interviewMarks || 0));
    } else {
      // Sort by AI Match Score by default
      this.applications.sort((a, b) => (b.aiMatchScore || 0) - (a.aiMatchScore || 0));
    }
    this.cdr.detectChanges();
  }

  saveMarks(app: Application) {
    if (app.interviewMarks === undefined || app.interviewMarks === null) return;
    this.http.patch(this.apiConfig.getEndpoint(`/applications/${app.applicationId}/marks`), { marks: app.interviewMarks }, { headers: this.getHeaders() }).subscribe({
      next: () => {
        alert('Marks saved successfully!');
        this.sortApplications();
      },
      error: () => {
        alert('Failed to save marks.');
      }
    });
  }

  updateStatus(appId: string, newStatus: number) {
    this.http.patch(this.apiConfig.getEndpoint(`/applications/${appId}/status`), { newStatus }, { headers: this.getHeaders() }).subscribe({
      next: () => {
        const app = this.applications.find(a => a.applicationId === appId);
        if (app) app.status = newStatus;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Failed to update status.');
      }
    });
  }

  openScheduleModal(app: Application) {
    this.targetApplication = app;
    this.scheduleError = '';
    this.scheduleSuccess = '';
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    // Format for datetime-local: YYYY-MM-DDThh:mm
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
    
    this.interviewForm = {
      scheduledAt: `${year}-${month}-${day}T${hours}:${minutes}`,
      durationMinutes: 45,
      mode: '1',
      meetLink: '',
      location: '',
      recruiterNotes: ''
    };
    
    this.showScheduleModal = true;
  }

  closeScheduleModal() {
    this.showScheduleModal = false;
    this.targetApplication = null;
  }

  submitSchedule() {
    if (!this.interviewForm.scheduledAt) {
      this.scheduleError = 'Please select a valid date and time.';
      return;
    }

    this.scheduling = true;
    this.scheduleError = '';
    this.scheduleSuccess = '';

    const payload = {
      applicationId: this.targetApplication!.applicationId,
      jobId: this.targetApplication!.jobId,
      candidateId: this.targetApplication!.candidateId,
      scheduledAt: new Date(this.interviewForm.scheduledAt).toISOString(),
      durationMinutes: this.interviewForm.durationMinutes,
      mode: parseInt(this.interviewForm.mode, 10),
      meetLink: this.interviewForm.meetLink || null,
      location: this.interviewForm.location || null,
      recruiterNotes: this.interviewForm.recruiterNotes || null,
      candidateEmail: 'candidate@example.com' // Placeholder as per API requirement
    };

    this.http.post(this.apiConfig.getEndpoint('/interviews'), payload, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.scheduleSuccess = 'Interview scheduled successfully!';
        this.targetApplication!.status = 3; // Interview Scheduled
        
        // Also update application status backend
        this.http.patch(this.apiConfig.getEndpoint(`/applications/${this.targetApplication!.applicationId}/status`), { newStatus: 3 }, { headers: this.getHeaders() }).subscribe();

        setTimeout(() => {
          this.closeScheduleModal();
          this.scheduling = false;
          this.cdr.detectChanges();
        }, 1500);
      },
      error: (err) => {
        this.scheduleError = err.error?.detail || 'Failed to schedule interview. Please try again.';
        this.scheduling = false;
        this.cdr.detectChanges();
      }
    });
  }

  logout() {
    localStorage.removeItem('hc_jwt');
    this.router.navigate(['/login']);
  }
}
