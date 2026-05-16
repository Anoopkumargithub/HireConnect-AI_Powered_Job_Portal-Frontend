import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiConfigService } from '../core/services/api-config.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
          <a class="nav-item" (click)="router.navigate(['/admin/users'])">
            <span class="icon">👥</span> Manage Users
          </a>
          <a class="nav-item active">
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
            <h1>Account Settings</h1>
            <p>Update your admin profile and security credentials.</p>
          </div>
          <div class="admin-profile">
            <div class="avatar">A</div>
            <span>Super Admin</span>
          </div>
        </header>

        <div class="content-wrapper">
          <div class="settings-card">
            <h2>Change Password</h2>
            <p class="subtitle">Ensure your account is using a long, random password to stay secure.</p>
            
            <form (ngSubmit)="updatePassword()" #pwdForm="ngForm" class="form-container">
              
              <div *ngIf="successMessage" class="alert success">{{ successMessage }}</div>
              <div *ngIf="errorMessage" class="alert error">{{ errorMessage }}</div>

              <div class="form-group">
                <label>Current Password</label>
                <input type="password" [(ngModel)]="currentPassword" name="currentPassword" required class="form-control">
              </div>

              <div class="form-group">
                <label>New Password</label>
                <input type="password" [(ngModel)]="newPassword" name="newPassword" required minlength="6" class="form-control">
                <small>Must be at least 6 characters long.</small>
              </div>

              <button type="submit" [disabled]="!pwdForm.valid || loading" class="btn-primary">
                {{ loading ? 'Updating...' : 'Update Password' }}
              </button>
            </form>
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
    .settings-card { background: white; border-radius: 12px; padding: 2.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; max-width: 600px; }
    .settings-card h2 { margin: 0 0 0.5rem 0; color: #0f172a; }
    .subtitle { color: #64748b; margin-top: 0; margin-bottom: 2rem; font-size: 0.95rem; }

    .form-container { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group label { font-weight: 600; font-size: 0.9rem; color: #334155; }
    .form-control { padding: 0.75rem 1rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s; font-family: 'Inter', sans-serif; }
    .form-control:focus { outline: none; border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1); }
    .form-group small { color: #94a3b8; font-size: 0.8rem; }

    .btn-primary { background: #8b5cf6; color: white; border: none; padding: 0.8rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; font-size: 1rem; margin-top: 0.5rem; }
    .btn-primary:hover:not(:disabled) { background: #7c3aed; }
    .btn-primary:disabled { background: #cbd5e1; cursor: not-allowed; }

    .alert { padding: 1rem; border-radius: 8px; font-weight: 500; font-size: 0.95rem; }
    .alert.success { background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0; }
    .alert.error { background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; }
  `]
})
export class AdminProfileComponent {
  public router = inject(Router);
  private http = inject(HttpClient);
  private apiConfig = inject(ApiConfigService);

  currentPassword = '';
  newPassword = '';
  
  loading = false;
  successMessage = '';
  errorMessage = '';

  private getHeaders() {
    const token = localStorage.getItem('hc_jwt');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  updatePassword() {
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const payload = {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    };

    this.http.put(this.apiConfig.getEndpoint('/auth/password'), payload, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.successMessage = 'Your password has been successfully updated.';
        this.currentPassword = '';
        this.newPassword = '';
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 400) {
          this.errorMessage = 'Invalid current password.';
        } else {
          this.errorMessage = 'An error occurred while updating the password.';
        }
      }
    });
  }

  logout() {
    localStorage.removeItem('hc_jwt');
    this.router.navigate(['/login']);
  }
}
