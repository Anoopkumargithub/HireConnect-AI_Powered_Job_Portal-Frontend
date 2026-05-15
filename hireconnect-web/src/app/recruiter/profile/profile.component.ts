import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiConfigService } from '../../core/services/api-config.service';

interface Address {
  houseNo?: string;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface RecruiterProfile {
  profileId?: string;
  userId?: string;
  fullName: string;
  email: string;
  companyName?: string;
  companySize?: string;
  industry?: string;
  website?: string;
  logoUrl?: string;
  address?: Address;
}

@Component({
  selector: 'app-recruiter-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <nav class="navbar">
        <div class="logo">HireConnect <span>Recruiter</span></div>
        <div class="nav-links">
          <a class="nav-link" (click)="router.navigate(['/recruiter/my-jobs'])">My Jobs</a>
          <a class="nav-link" (click)="router.navigate(['/recruiter/applications'])">Applications</a>
          <a class="nav-link active">Company Profile</a>
        </div>
        <button class="logout-btn" (click)="logout()">Logout</button>
      </nav>

      <main class="content">
        <header class="page-header">
          <h1>Company Profile</h1>
          <p>Manage your recruiter identity and company details.</p>
        </header>

        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
          <p>Loading profile...</p>
        </div>

        <div class="profile-card" *ngIf="!loading">
          <div class="message success" *ngIf="successMessage">{{ successMessage }}</div>
          <div class="message error" *ngIf="errorMessage">{{ errorMessage }}</div>

          <div class="profile-header">
            <div class="company-logo" *ngIf="profile.logoUrl">
              <img [src]="profile.logoUrl" alt="Company Logo" />
            </div>
            <div class="company-logo placeholder" *ngIf="!profile.logoUrl">
              {{ getInitials() }}
            </div>
            <div class="header-info">
              <h2>{{ profile.companyName || 'Set Company Name' }}</h2>
              <p>{{ profile.fullName }} · {{ profile.email }}</p>
            </div>
          </div>

          <h3 class="section-title">Personal Details</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" [(ngModel)]="profile.fullName" placeholder="Jane Doe" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" [(ngModel)]="profile.email" disabled class="disabled-input" />
            </div>
          </div>

          <h3 class="section-title">Company Details</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Company Name</label>
              <input type="text" [(ngModel)]="profile.companyName" placeholder="Acme Corp" />
            </div>
            <div class="form-group">
              <label>Company Size</label>
              <select [(ngModel)]="profile.companySize">
                <option value="">Select Size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </div>
            <div class="form-group">
              <label>Industry</label>
              <input type="text" [(ngModel)]="profile.industry" placeholder="Technology, Finance, etc." />
            </div>
            <div class="form-group">
              <label>Website URL</label>
              <input type="url" [(ngModel)]="profile.website" placeholder="https://acmecorp.com" />
            </div>
            <div class="form-group">
              <label>Logo URL</label>
              <input type="url" [(ngModel)]="profile.logoUrl" placeholder="https://acmecorp.com/logo.png" />
            </div>
          </div>

          <h3 class="section-title">Headquarters Address</h3>
          <div class="form-grid" *ngIf="profile.address">
            <div class="form-group">
              <label>House / Building No.</label>
              <input type="text" [(ngModel)]="profile.address.houseNo" placeholder="Suite 100" />
            </div>
            <div class="form-group">
              <label>Street</label>
              <input type="text" [(ngModel)]="profile.address.street" placeholder="Main Street" />
            </div>
            <div class="form-group">
              <label>City</label>
              <input type="text" [(ngModel)]="profile.address.city" placeholder="San Francisco" />
            </div>
            <div class="form-group">
              <label>State</label>
              <input type="text" [(ngModel)]="profile.address.state" placeholder="CA" />
            </div>
            <div class="form-group">
              <label>Pincode / Zip</label>
              <input type="text" [(ngModel)]="profile.address.pincode" placeholder="94105" />
            </div>
          </div>

          <div class="form-actions">
            <button class="btn-primary btn-large" (click)="saveProfile()" [disabled]="saving">
              {{ saving ? 'Saving...' : 'Save Company Profile' }}
            </button>
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
    
    .content { max-width: 900px; margin: 0 auto; padding: 2rem; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { margin: 0 0 0.25rem 0; color: #0f172a; font-size: 1.8rem; }
    .page-header p { margin: 0; color: #64748b; }
    
    .loading-state { text-align: center; padding: 4rem; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .profile-card { background: white; border-radius: 16px; padding: 2.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; }
    .profile-header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid #f1f5f9; }
    .company-logo { width: 80px; height: 80px; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .company-logo img { width: 100%; height: 100%; object-fit: cover; }
    .company-logo.placeholder { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; font-size: 2rem; font-weight: 700; box-shadow: none; }
    .header-info h2 { margin: 0 0 0.25rem 0; color: #0f172a; font-size: 1.5rem; }
    .header-info p { margin: 0; color: #64748b; }
    
    .section-title { font-size: 1.1rem; color: #1e293b; margin: 2rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #f1f5f9; }
    
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 600; font-size: 0.875rem; }
    .form-group input, .form-group select { width: 100%; padding: 0.75rem 1rem; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 0.95rem; color: #1e293b; background: #fafafa; transition: all 0.2s; font-family: inherit; }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: #6366f1; background: white; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
    .disabled-input { background: #f1f5f9 !important; color: #94a3b8 !important; cursor: not-allowed; }
    
    .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(99,102,241,0.3); }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
    .btn-large { padding: 0.85rem 2rem; font-size: 1rem; width: 100%; margin-top: 2.5rem; }
    
    .message { padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.9rem; font-weight: 500; }
    .success { background: #d1fae5; color: #059669; border: 1px solid #a7f3d0; }
    .error { background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; }
  `]
})
export class RecruiterProfileComponent implements OnInit {
  public router = inject(Router);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private apiConfig = inject(ApiConfigService);

  loading = true;
  saving = false;
  successMessage = '';
  errorMessage = '';

  profile: RecruiterProfile = {
    fullName: '',
    email: '',
    address: {}
  };

  private getHeaders() {
    const token = localStorage.getItem('hc_jwt');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  ngOnInit() {
    this.extractEmailFromJwt();
    this.loadProfile();
  }

  extractEmailFromJwt() {
    try {
      const token = localStorage.getItem('hc_jwt');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const emailClaim = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || payload.email;
        if (emailClaim) {
          this.profile.email = emailClaim;
        }
      }
    } catch (e) {
      console.error('Failed to parse JWT', e);
    }
  }

  loadProfile() {
    this.loading = true;
    this.http.get<RecruiterProfile>(this.apiConfig.getEndpoint('/profiles/me'), { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        if (res) {
          this.profile = { ...this.profile, ...res };
          if (!this.profile.address) this.profile.address = {};
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getInitials() {
    if (this.profile.companyName) {
      return this.profile.companyName.substring(0, 1).toUpperCase();
    }
    if (this.profile.fullName) {
      return this.profile.fullName.substring(0, 1).toUpperCase();
    }
    return 'R';
  }

  saveProfile() {
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.http.put<RecruiterProfile>(this.apiConfig.getEndpoint('/profiles/recruiter'), this.profile, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.profile = res;
        if (!this.profile.address) this.profile.address = {};
        this.saving = false;
        this.successMessage = 'Company Profile updated successfully!';
        this.cdr.detectChanges();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err.error?.detail || 'Failed to update profile.';
        this.cdr.detectChanges();
      }
    });
  }

  logout() {
    localStorage.removeItem('hc_jwt');
    this.router.navigate(['/login']);
  }
}
