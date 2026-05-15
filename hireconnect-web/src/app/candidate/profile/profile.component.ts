import { Component, OnInit, inject, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiConfigService } from '../../core/services/api-config.service';

interface CandidateProfile {
  profileId?: string;
  userId?: string;
  fullName: string;
  email: string;
  mobile?: string;
  dob?: string;
  bio?: string;
  skills: string[];
  experienceYears: number;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  avatarUrl?: string;
}

@Component({
  selector: 'app-candidate-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <nav class="navbar">
        <div class="logo">HireConnect <span>Candidate</span></div>
        <div class="nav-links">
          <a class="nav-link" (click)="router.navigate(['/candidate/jobs'])">Find Jobs</a>
          <a class="nav-link" (click)="router.navigate(['/candidate/applications'])">My Applications</a>
          <a class="nav-link active">My Profile</a>
        </div>
        <button class="logout-btn" (click)="logout()">Logout</button>
      </nav>

      <main class="content">
        <header class="page-header">
          <h1>My Profile</h1>
          <p>Keep your profile updated to get better job recommendations.</p>
        </header>

        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
          <p>Loading profile...</p>
        </div>

        <div class="profile-card" *ngIf="!loading">
          <div class="message success" *ngIf="successMessage">{{ successMessage }}</div>
          <div class="message error" *ngIf="errorMessage">{{ errorMessage }}</div>

          <div class="profile-header">
            <div class="avatar-section">
              <div class="avatar-placeholder">{{ getInitials() }}</div>
            </div>
            <div class="header-info">
              <h2>{{ profile.fullName || 'Complete Your Profile' }}</h2>
              <p>{{ profile.email }}</p>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" [(ngModel)]="profile.fullName" placeholder="John Doe" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" [(ngModel)]="profile.email" disabled class="disabled-input" />
            </div>
            <div class="form-group">
              <label>Mobile Number</label>
              <input type="tel" [(ngModel)]="profile.mobile" placeholder="+1 234 567 8900" />
            </div>
            <div class="form-group">
              <label>Date of Birth</label>
              <input type="date" [(ngModel)]="profile.dob" />
            </div>
          </div>

          <div class="form-section">
            <div class="form-group">
              <label>Professional Bio</label>
              <textarea [(ngModel)]="profile.bio" rows="4" placeholder="Tell recruiters about yourself..."></textarea>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Years of Experience</label>
              <input type="number" [(ngModel)]="profile.experienceYears" min="0" placeholder="e.g. 3" />
            </div>
            <div class="form-group">
              <label>LinkedIn URL</label>
              <input type="url" [(ngModel)]="profile.linkedinUrl" placeholder="https://linkedin.com/in/username" />
            </div>
            <div class="form-group">
              <label>GitHub URL</label>
              <input type="url" [(ngModel)]="profile.githubUrl" placeholder="https://github.com/username" />
            </div>
            <div class="form-group">
              <label>Portfolio URL</label>
              <input type="url" [(ngModel)]="profile.portfolioUrl" placeholder="https://yourwebsite.com" />
            </div>
          </div>

          <div class="form-section">
            <div class="form-group">
              <label>Skills (comma separated)</label>
              <input type="text" [(ngModel)]="skillsInput" placeholder="e.g. Java, Angular, SQL" />
            </div>
          </div>

          <div class="form-section resume-section">
            <h3>Resume</h3>
            <p class="resume-desc">Upload your latest resume in PDF format. AI will automatically parse it to enhance your profile.</p>
            
            <div class="resume-actions">
              <a *ngIf="profile.resumeUrl" [href]="profile.resumeUrl" target="_blank" class="btn-outline btn-sm">📄 View Current Resume</a>
              
              <div class="upload-wrapper">
                <input type="file" #fileInput (change)="onFileSelected($event)" accept=".pdf,.doc,.docx" style="display: none;" />
                <button class="btn-outline btn-sm" (click)="fileInput.click()">
                  {{ selectedFile ? selectedFile.name : 'Choose New Resume' }}
                </button>
                <button class="btn-primary btn-sm ml-2" *ngIf="selectedFile" (click)="uploadResume()" [disabled]="uploading">
                  {{ uploading ? 'Uploading...' : 'Upload' }}
                </button>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn-primary btn-large" (click)="saveProfile()" [disabled]="saving">
              {{ saving ? 'Saving...' : 'Save Profile' }}
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
    .loading-state { text-align: center; padding: 4rem; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #10b981; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .profile-card { background: white; border-radius: 16px; padding: 2.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; }
    .profile-header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #f1f5f9; }
    .avatar-placeholder { width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; }
    .header-info h2 { margin: 0 0 0.25rem 0; color: #0f172a; font-size: 1.5rem; }
    .header-info p { margin: 0; color: #64748b; }
    
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .form-section { margin-bottom: 1.5rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 600; font-size: 0.875rem; }
    .form-group input, .form-group textarea { width: 100%; padding: 0.75rem 1rem; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 0.95rem; color: #1e293b; background: #fafafa; transition: all 0.2s; font-family: inherit; }
    .form-group input:focus, .form-group textarea:focus { outline: none; border-color: #10b981; background: white; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
    .disabled-input { background: #f1f5f9 !important; color: #94a3b8 !important; cursor: not-allowed; }
    .form-group textarea { resize: vertical; }
    
    .resume-section { background: #f8fafc; padding: 1.5rem; border-radius: 12px; border: 1px dashed #cbd5e1; }
    .resume-section h3 { margin: 0 0 0.5rem 0; color: #0f172a; font-size: 1.1rem; }
    .resume-desc { margin: 0 0 1rem 0; color: #64748b; font-size: 0.9rem; }
    .resume-actions { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
    .upload-wrapper { display: flex; align-items: center; gap: 0.5rem; }
    
    .btn-outline { display: inline-block; background: white; border: 1.5px solid #e2e8f0; color: #475569; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; text-decoration: none; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; }
    .btn-outline:hover { border-color: #10b981; color: #10b981; }
    .btn-primary { background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16,185,129,0.3); }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
    .btn-sm { padding: 0.5rem 1rem; font-size: 0.85rem; }
    .btn-large { padding: 0.85rem 2rem; font-size: 1rem; width: 100%; margin-top: 1rem; }
    
    .message { padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.9rem; font-weight: 500; }
    .success { background: #d1fae5; color: #059669; border: 1px solid #a7f3d0; }
    .error { background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; }
  `]
})
export class CandidateProfileComponent implements OnInit {
  public router = inject(Router);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private apiConfig = inject(ApiConfigService);

  loading = true;
  saving = false;
  uploading = false;
  successMessage = '';
  errorMessage = '';

  profile: CandidateProfile = {
    fullName: '',
    email: '',
    skills: [],
    experienceYears: 0
  };
  skillsInput = '';
  selectedFile: File | null = null;

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
    this.http.get<CandidateProfile>(this.apiConfig.getEndpoint('/profiles/me'), { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        if (res) {
          this.profile = { ...this.profile, ...res };
        }
        if (this.profile.dob && this.profile.dob.includes('T')) {
          this.profile.dob = this.profile.dob.split('T')[0];
        }
        this.skillsInput = (this.profile.skills || []).join(', ');
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
    if (!this.profile.fullName) return 'C';
    const parts = this.profile.fullName.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }

  saveProfile() {
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    const payload = {
      ...this.profile,
      skills: this.skillsInput ? this.skillsInput.split(',').map(s => s.trim()).filter(Boolean) : []
    };

    this.http.put<CandidateProfile>(this.apiConfig.getEndpoint('/profiles/candidate'), payload, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.profile = res;
        this.skillsInput = (this.profile.skills || []).join(', ');
        this.saving = false;
        this.successMessage = 'Profile updated successfully!';
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

  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  uploadResume() {
    if (!this.selectedFile) return;

    this.uploading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post<any>(this.apiConfig.getEndpoint('/profiles/resume/upload'), formData, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.profile.resumeUrl = res.resumeUrl;
        this.selectedFile = null;
        this.uploading = false;
        this.successMessage = 'Resume uploaded successfully!';
        this.cdr.detectChanges();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.uploading = false;
        this.errorMessage = 'Failed to upload resume.';
        this.cdr.detectChanges();
      }
    });
  }

  logout() {
    localStorage.removeItem('hc_jwt');
    this.router.navigate(['/login']);
  }
}
