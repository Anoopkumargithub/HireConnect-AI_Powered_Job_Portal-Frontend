import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell.component';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiConfigService } from '../../core/services/api-config.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface Job {
  jobId: string;
  title: string;
  viewCount: number;
}

interface StatusChange {
  from: number;
  to: number;
  changedBy: string;
  changedAt: string;
}

interface Application {
  applicationId: string;
  jobId: string;
  status: number;
  appliedAt: string;
  statusHistory?: StatusChange[];
}

interface JobMetrics {
  jobId: string;
  title: string;
  views: number;
  applications: number;
  viewToApplyRatio: number;
}

@Component({
  selector: 'app-recruiter-analytics',
  standalone: true,
  imports: [NotificationBellComponent, CommonModule],
  template: `
    <div class="dashboard-container">
      <nav class="navbar">
        <div class="logo">HireConnect <span>Recruiter</span></div>
        <div class="nav-links">
          <a class="nav-link" (click)="router.navigate(['/recruiter/my-jobs'])">My Jobs</a>
          <a class="nav-link" (click)="router.navigate(['/recruiter/applications'])">Applications</a>
          <a class="nav-link active">Analytics</a>
          <a class="nav-link" (click)="router.navigate(['/recruiter/profile'])">Company Profile</a>
          <a class="nav-link" (click)="router.navigate(['/recruiter/billing'])">Billing</a>
        </div>
        <div class="nav-actions" style="display: flex; align-items: center; gap: 1.5rem;">
          <app-notification-bell></app-notification-bell>
          <button class="logout-btn" (click)="logout()">Logout</button>
        </div>
      </nav>

      <main class="content">
        <header class="page-header">
          <h1>Analytics Dashboard</h1>
          <p>Track your hiring pipeline and job performance metrics.</p>
        </header>

        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
          <p>Analyzing data...</p>
        </div>

        <div *ngIf="!loading && jobs.length === 0" class="empty-state">
          <div class="empty-icon">📊</div>
          <h3>No Data Available</h3>
          <p>Post some jobs to start tracking analytics.</p>
        </div>

        <div *ngIf="!loading && jobs.length > 0">
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-title">Total Views</div>
              <div class="metric-value">{{ totalViews }}</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Total Applications</div>
              <div class="metric-value">{{ totalApplications }}</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Avg Time-to-Hire</div>
              <div class="metric-value">{{ avgTimeToHireDays | number:'1.0-1' }} <span class="unit">days</span></div>
            </div>
          </div>

          <div class="dashboard-grid">
            <!-- Pipeline Stats -->
            <div class="dashboard-panel">
              <h3>Pipeline Drop-off Rates</h3>
              <div class="pipeline-funnel">
                <div class="funnel-step">
                  <div class="step-label">Applied</div>
                  <div class="step-bar" style="width: 100%"></div>
                  <div class="step-value">{{ totalApplications }}</div>
                </div>
                <div class="funnel-step">
                  <div class="step-label">Shortlisted</div>
                  <div class="step-bar" [style.width]="totalApplications ? (pipelineStats.shortlisted / totalApplications * 100) + '%' : '0%'"></div>
                  <div class="step-value">{{ pipelineStats.shortlisted }} <span class="rate">({{ totalApplications ? (pipelineStats.shortlisted / totalApplications) : 0 | percent:'1.0-0' }})</span></div>
                </div>
                <div class="funnel-step">
                  <div class="step-label">Interviewed</div>
                  <div class="step-bar" [style.width]="pipelineStats.shortlisted ? (pipelineStats.interviewed / pipelineStats.shortlisted * 100) + '%' : '0%'"></div>
                  <div class="step-value">{{ pipelineStats.interviewed }} <span class="rate" *ngIf="pipelineStats.shortlisted">({{ (pipelineStats.interviewed / pipelineStats.shortlisted) | percent:'1.0-0' }} of Shortlisted)</span></div>
                </div>
                <div class="funnel-step">
                  <div class="step-label">Offered</div>
                  <div class="step-bar" [style.width]="pipelineStats.interviewed ? (pipelineStats.offered / pipelineStats.interviewed * 100) + '%' : '0%'"></div>
                  <div class="step-value">{{ pipelineStats.offered }} <span class="rate" *ngIf="pipelineStats.interviewed">({{ (pipelineStats.offered / pipelineStats.interviewed) | percent:'1.0-0' }} of Interviewed)</span></div>
                </div>
              </div>
            </div>

            <!-- Job Metrics Table -->
            <div class="dashboard-panel full-width">
              <h3>Job Metrics</h3>
              <div class="table-responsive">
                <table class="metrics-table">
                  <thead>
                    <tr>
                      <th>Job Title</th>
                      <th>Views</th>
                      <th>Applications</th>
                      <th>View-to-Apply Ratio</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let metric of jobMetrics">
                      <td class="font-medium">{{ metric.title }}</td>
                      <td>{{ metric.views }}</td>
                      <td>{{ metric.applications }}</td>
                      <td>
                        <div class="ratio-cell">
                          <span>{{ metric.viewToApplyRatio | percent:'1.1-2' }}</span>
                          <div class="ratio-bar-bg">
                            <div class="ratio-bar-fill" [style.width]="(metric.viewToApplyRatio * 100) + '%'"></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
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
    .logo span { color: #6366f1; }
    .nav-links { display: flex; gap: 1.5rem; margin-left: 2rem; flex: 1; }
    .nav-link { color: #64748b; text-decoration: none; font-weight: 600; cursor: pointer; padding: 0.5rem 0; border-bottom: 2px solid transparent; transition: all 0.2s; }
    .nav-link:hover { color: #6366f1; }
    .nav-link.active { color: #6366f1; border-bottom-color: #6366f1; }
    .logout-btn { background: transparent; border: 1px solid #e2e8f0; padding: 0.5rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 500; color: #64748b; transition: all 0.2s; }
    .logout-btn:hover { background: #f1f5f9; color: #1e293b; }
    
    .content { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { margin: 0 0 0.25rem 0; color: #0f172a; font-size: 1.8rem; }
    .page-header p { margin: 0; color: #64748b; }
    
    .loading-state, .empty-state { text-align: center; padding: 4rem; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-icon { font-size: 3.5rem; margin-bottom: 1rem; }
    .empty-state h3 { color: #1e293b; margin: 0 0 0.5rem; }
    .empty-state p { color: #64748b; margin: 0; }

    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
    .metric-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; border-left: 4px solid #6366f1; }
    .metric-title { font-size: 0.9rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
    .metric-value { font-size: 2.5rem; font-weight: 800; color: #0f172a; }
    .metric-value .unit { font-size: 1rem; color: #94a3b8; font-weight: 600; }

    .dashboard-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; }
    .dashboard-panel { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; }
    .dashboard-panel.full-width { grid-column: 1 / -1; }
    .dashboard-panel h3 { margin: 0 0 1.5rem; color: #0f172a; font-size: 1.2rem; }

    .pipeline-funnel { display: flex; flex-direction: column; gap: 1rem; }
    .funnel-step { display: grid; grid-template-columns: 120px 1fr 200px; align-items: center; gap: 1rem; }
    .step-label { font-weight: 600; color: #475569; }
    .step-bar { height: 12px; background: linear-gradient(90deg, #8b5cf6, #6366f1); border-radius: 6px; transition: width 0.5s ease-in-out; min-width: 4px; }
    .step-value { font-weight: 700; color: #0f172a; text-align: right; }
    .step-value .rate { font-size: 0.8rem; color: #64748b; font-weight: 500; }

    .table-responsive { overflow-x: auto; }
    .metrics-table { width: 100%; border-collapse: collapse; text-align: left; }
    .metrics-table th { padding: 1rem; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 600; font-size: 0.9rem; }
    .metrics-table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 0.95rem; }
    .font-medium { font-weight: 600; }
    .ratio-cell { display: flex; align-items: center; gap: 1rem; }
    .ratio-cell span { min-width: 50px; }
    .ratio-bar-bg { flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px; max-width: 150px; }
    .ratio-bar-fill { height: 100%; background: #10b981; border-radius: 3px; }
  `]
})
export class AnalyticsComponent implements OnInit {
  public router = inject(Router);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private apiConfig = inject(ApiConfigService);

  loading = true;
  jobs: Job[] = [];
  jobMetrics: JobMetrics[] = [];

  totalViews = 0;
  totalApplications = 0;
  avgTimeToHireDays = 0;

  pipelineStats = {
    shortlisted: 0,
    interviewed: 0,
    offered: 0
  };

  private getHeaders() {
    const token = localStorage.getItem('hc_jwt');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  ngOnInit() {
    this.loadAnalyticsData();
  }

  loadAnalyticsData() {
    this.loading = true;
    
    this.http.get<any>(this.apiConfig.getEndpoint('/analytics/recruiter'), { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.jobs = res.jobMetrics ?? [];
        
        this.totalViews = res.totalViews ?? 0;
        this.totalApplications = res.totalApplications ?? 0;
        this.avgTimeToHireDays = res.avgTimeToHireDays ?? 0;
        
        if (res.pipelineStats) {
          this.pipelineStats = {
            shortlisted: res.pipelineStats.shortlisted ?? 0,
            interviewed: res.pipelineStats.interviewed ?? 0,
            offered: res.pipelineStats.offered ?? 0
          };
        }

        this.jobMetrics = res.jobMetrics ?? [];
        
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  logout() {
    localStorage.removeItem('hc_jwt');
    this.router.navigate(['/login']);
  }
}
