import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiConfigService } from '../core/services/api-config.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="logo">HireConnect <span>Admin</span></div>
        <nav class="nav-menu">
          <a class="nav-item active">
            <span class="icon">📊</span> Overview
          </a>
          <a class="nav-item" (click)="router.navigate(['/admin/jobs'])">
            <span class="icon">💼</span> Manage Jobs
          </a>
          <a class="nav-item" (click)="router.navigate(['/admin/users'])">
            <span class="icon">👥</span> Manage Users
          </a>
          <a class="nav-item" (click)="router.navigate(['/admin/profile'])">
            <span class="icon">⚙️</span> Settings & Profile
          </a>
        </nav>
        <div class="sidebar-footer">
          <button class="logout-btn" (click)="logout()">
            <span class="icon">🚪</span> Logout
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <header class="topbar">
          <div class="page-title">
            <h1>Platform Overview</h1>
            <p>High-level metrics and system health.</p>
          </div>
          <div class="admin-profile">
            <div class="avatar">A</div>
            <span>Super Admin</span>
          </div>
        </header>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon users">👥</div>
            <div class="stat-details">
              <h3>Total Users</h3>
              <div class="number">{{ loading ? '...' : totalUsers }}</div>
              <div class="trend positive">↑ 12% this week</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon jobs">💼</div>
            <div class="stat-details">
              <h3>Active Jobs</h3>
              <div class="number">{{ loading ? '...' : totalJobs }}</div>
              <div class="trend positive">↑ 5% this week</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon applications">📄</div>
            <div class="stat-details">
              <h3>Total Applications</h3>
              <div class="number">{{ loading ? '...' : totalApplications }}</div>
              <div class="trend positive">↑ 24% this week</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon conversion">📈</div>
            <div class="stat-details">
              <h3>Avg Apps per Job</h3>
              <div class="number">{{ loading ? '...' : avgAppsPerJob | number:'1.1-1' }}</div>
              <div class="trend positive">↑ 1.1% this week</div>
            </div>
          </div>
        </div>

        <div class="recent-activity">
          <h2>Recent Platform Activity</h2>
          <div class="activity-list">
            <div class="activity-item">
              <div class="activity-icon info">ℹ️</div>
              <div class="activity-content">
                <strong>New Recruiter Registration</strong>
                <p>TechCorp Inc. joined the platform.</p>
                <span class="time">10 minutes ago</span>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-icon success">✅</div>
              <div class="activity-content">
                <strong>Job Filled</strong>
                <p>Senior Frontend Developer at InnovateTech was closed.</p>
                <span class="time">1 hour ago</span>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-icon warning">⚠️</div>
              <div class="activity-content">
                <strong>Reported Content</strong>
                <p>A job posting by "Unknown LLC" was flagged by 3 users.</p>
                <span class="time">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .admin-layout { display: flex; min-height: 100vh; background-color: #f8fafc; font-family: 'Inter', sans-serif; }
    
    /* Sidebar */
    .sidebar { width: 260px; background: white; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; }
    .logo { padding: 1.5rem; font-size: 1.5rem; font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0; }
    .logo span { color: #8b5cf6; }
    .nav-menu { flex: 1; padding: 1.5rem 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .nav-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.8rem 1rem; color: #64748b; text-decoration: none; border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
    .nav-item:hover { background: #f1f5f9; color: #0f172a; }
    .nav-item.active { background: #8b5cf615; color: #8b5cf6; }
    .sidebar-footer { padding: 1.5rem; border-top: 1px solid #e2e8f0; }
    .logout-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: white; border: 1px solid #e2e8f0; padding: 0.75rem; border-radius: 8px; color: #ef4444; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .logout-btn:hover { background: #fef2f2; border-color: #fecaca; }

    /* Main Content */
    .main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
    .topbar { background: white; padding: 1.5rem 2.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; }
    .page-title h1 { margin: 0 0 0.25rem 0; font-size: 1.5rem; color: #0f172a; }
    .page-title p { margin: 0; color: #64748b; font-size: 0.9rem; }
    .admin-profile { display: flex; align-items: center; gap: 0.75rem; font-weight: 500; color: #0f172a; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: #8b5cf6; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; }

    /* Stats Grid */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; padding: 2.5rem; }
    .stat-card { background: white; border-radius: 12px; padding: 1.5rem; display: flex; gap: 1.5rem; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .stat-icon { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .stat-icon.users { background: #dbeafe; color: #2563eb; }
    .stat-icon.jobs { background: #fce7f3; color: #db2777; }
    .stat-icon.applications { background: #f3e8ff; color: #9333ea; }
    .stat-icon.conversion { background: #dcfce7; color: #16a34a; }
    .stat-details h3 { margin: 0 0 0.25rem 0; font-size: 0.9rem; color: #64748b; font-weight: 500; }
    .stat-details .number { font-size: 1.8rem; font-weight: 700; color: #0f172a; margin-bottom: 0.25rem; }
    .trend { font-size: 0.8rem; font-weight: 600; }
    .trend.positive { color: #10b981; }
    .trend.negative { color: #ef4444; }

    /* Activity List */
    .recent-activity { margin: 0 2.5rem 2.5rem; background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .recent-activity h2 { margin: 0 0 1.5rem 0; font-size: 1.1rem; color: #0f172a; }
    .activity-list { display: flex; flex-direction: column; gap: 1rem; }
    .activity-item { display: flex; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #f1f5f9; }
    .activity-item:last-child { border-bottom: none; padding-bottom: 0; }
    .activity-icon { font-size: 1.25rem; }
    .activity-content strong { display: block; color: #0f172a; margin-bottom: 0.2rem; }
    .activity-content p { margin: 0 0 0.3rem 0; color: #475569; font-size: 0.95rem; }
    .activity-content .time { font-size: 0.8rem; color: #94a3b8; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  public router = inject(Router);
  private http = inject(HttpClient);
  private apiConfig = inject(ApiConfigService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  totalUsers = 0;
  totalJobs = 0;
  totalApplications = 0;
  avgAppsPerJob = 0;

  ngOnInit() {
    this.fetchStats();
  }

  private getHeaders() {
    const token = localStorage.getItem('hc_jwt');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  fetchStats() {
    this.loading = true;
    const usersReq = this.http.get<any>(this.apiConfig.getEndpoint('/auth/users'), { headers: this.getHeaders() });
    const jobsReq = this.http.get<any>(this.apiConfig.getEndpoint('/jobs?pageSize=1'));
    const appsReq = this.http.get<any>(this.apiConfig.getEndpoint('/applications/all?pageSize=1'), { headers: this.getHeaders() });

    forkJoin([usersReq, jobsReq, appsReq]).subscribe({
      next: ([usersRes, jobsRes, appsRes]) => {
        console.log('[AdminDashboardComponent] Loaded stats:', { usersRes, jobsRes, appsRes });
        
        // Safely extract counts
        const usersArray = Array.isArray(usersRes) ? usersRes : (usersRes?.items || []);
        
        this.totalUsers = usersArray.length || 0;
        this.totalJobs = jobsRes?.total || 0;
        this.totalApplications = appsRes?.total || 0;
        this.avgAppsPerJob = this.totalJobs > 0 ? (this.totalApplications / this.totalJobs) : 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[AdminDashboardComponent] Failed to load dashboard metrics', err);
        this.loading = false;
        this.cdr.detectChanges();
        alert('Failed to load dashboard statistics.');
      }
    });
  }

  logout() {
    localStorage.removeItem('hc_jwt');
    this.router.navigate(['/login']);
  }
}
