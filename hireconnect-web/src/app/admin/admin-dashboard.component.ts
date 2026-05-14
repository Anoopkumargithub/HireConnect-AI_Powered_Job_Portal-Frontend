import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <nav class="navbar">
        <div class="logo">HireConnect <span>Admin</span></div>
        <button class="logout-btn" (click)="logout()">Logout</button>
      </nav>
      
      <main class="content">
        <header class="page-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>System overview and management.</p>
          </div>
        </header>

        <div class="stats-grid">
          <div class="stat-card">
            <h3>Total Users</h3>
            <div class="number">1,245</div>
          </div>
          <div class="stat-card">
            <h3>Active Jobs</h3>
            <div class="number">342</div>
          </div>
          <div class="stat-card">
            <h3>Total Applications</h3>
            <div class="number">8,921</div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-container { min-height: 100vh; background-color: #f8fafc; font-family: 'Inter', sans-serif; }
    .navbar { background: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .logo { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
    .logo span { color: #eab308; }
    .logout-btn { background: transparent; border: 1px solid #cbd5e1; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
    .logout-btn:hover { background: #f1f5f9; }
    .content { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { margin: 0 0 0.5rem 0; color: #0f172a; }
    .page-header p { margin: 0; color: #64748b; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .stat-card { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; text-align: center; }
    .stat-card h3 { color: #64748b; font-size: 1rem; margin: 0 0 1rem 0; font-weight: 500; }
    .stat-card .number { font-size: 2.5rem; font-weight: 700; color: #0f172a; }
  `]
})
export class AdminDashboardComponent {
  constructor(private router: Router) {}
  
  logout() {
    localStorage.removeItem('hc_jwt');
    this.router.navigate(['/login']);
  }
}
