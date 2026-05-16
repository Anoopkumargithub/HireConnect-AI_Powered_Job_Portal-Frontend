import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiConfigService } from '../core/services/api-config.service';

interface User {
  userId: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Suspended';
  joinedAt: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="logo">HireConnect <span>Admin</span></div>
        <nav class="nav-menu">
          <a class="nav-item" (click)="router.navigate(['/admin'])">
            <span class="icon">📊</span> Overview
          </a>
          <a class="nav-item" (click)="router.navigate(['/admin/jobs'])">
            <span class="icon">💼</span> Manage Jobs
          </a>
          <a class="nav-item active">
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
            <h1>Manage Users</h1>
            <p>View and manage all registered platform users.</p>
          </div>
          <div class="admin-profile">
            <div class="avatar">A</div>
            <span>Super Admin</span>
          </div>
        </header>

        <div class="content-wrapper">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Role</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of users">
                  <td>
                    <strong>User ID: {{ user.userId | slice:0:8 }}</strong>
                    <div class="subtext">{{ user.email }}</div>
                  </td>
                  <td>
                    <span class="role-badge" [class.candidate]="user.role === 'Candidate'" [class.recruiter]="user.role === 'Recruiter'">
                      {{ user.role }}
                    </span>
                  </td>
                  <td>{{ user.createdAt | date:'mediumDate' }}</td>
                  <td>
                    <span class="status-badge active">
                      Active
                    </span>
                  </td>
                  <td>
                    <button class="btn-warning" (click)="toggleSuspend(user)">Suspend</button>
                  </td>
                </tr>
                <tr *ngIf="users.length === 0 && !loading">
                  <td colspan="5" class="text-center py-4">No users found.</td>
                </tr>
                <tr *ngIf="loading">
                  <td colspan="5" class="text-center py-4">Loading users...</td>
                </tr>
              </tbody>
            </table>
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

    /* Content */
    .content-wrapper { padding: 2.5rem; }
    .table-container { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { background: #f8fafc; padding: 1rem 1.5rem; text-align: left; font-size: 0.85rem; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.05em; }
    .data-table td { padding: 1.2rem 1.5rem; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 0.95rem; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table strong { color: #0f172a; font-weight: 600; }
    .subtext { font-size: 0.85rem; color: #64748b; margin-top: 0.2rem; }
    
    .role-badge { padding: 0.3rem 0.8rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; border: 1px solid transparent; }
    .role-badge.candidate { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
    .role-badge.recruiter { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }

    .status-badge { padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
    .status-badge.active { background: #dcfce7; color: #16a34a; }
    .status-badge.suspended { background: #fee2e2; color: #ef4444; }
    
    .btn-warning { background: white; color: #d97706; border: 1px solid #fcd34d; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; }
    .btn-warning:hover { background: #fffbeb; }
    .btn-success { background: white; color: #16a34a; border: 1px solid #86efac; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; }
    .btn-success:hover { background: #f0fdf4; }
    
    .text-center { text-align: center; }
    .py-4 { padding-top: 2rem !important; padding-bottom: 2rem !important; }
  `]
})
export class AdminUsersComponent implements OnInit {
  public router = inject(Router);
  private http = inject(HttpClient);
  private apiConfig = inject(ApiConfigService);
  private cdr = inject(ChangeDetectorRef);

  users: any[] = [];
  loading = true;

  ngOnInit() {
    this.loadUsers();
  }

  private getHeaders() {
    const token = localStorage.getItem('hc_jwt');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  loadUsers() {
    this.loading = true;
    this.http.get<any>(this.apiConfig.getEndpoint('/auth/users'), { headers: this.getHeaders() }).subscribe({
      next: (res: any) => {
        console.log('[AdminUsersComponent] Loaded users successfully:', res);
        this.users = Array.isArray(res) ? res : (res?.items || []);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[AdminUsersComponent] Failed to load users:', err);
        this.loading = false;
        this.cdr.detectChanges();
        alert('Failed to load users');
      }
    });
  }

  toggleSuspend(user: any) {
    // For now, toggle status locally as Suspend is not fully implemented in backend
    user.status = user.status === 'Active' ? 'Suspended' : 'Active';
  }

  logout() {
    localStorage.removeItem('hc_jwt');
    this.router.navigate(['/login']);
  }
}
