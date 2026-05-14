import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiConfigService } from '../../core/services/api-config.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h2>Create your account</h2>
          <p>Join HireConnect to start hiring or applying today.</p>
        </div>

        <form (ngSubmit)="register()">
          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="form.email" name="email" required placeholder="Enter your email" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="form.password" name="password" required placeholder="Create a password" />
          </div>
          
          <div class="form-group">
            <label>Role</label>
            <div class="role-selector">
              <button type="button" 
                      *ngFor="let role of roles" 
                      [class.active]="form.role === role"
                      (click)="form.role = role">
                {{ role }}
              </button>
            </div>
          </div>
          
          <div class="error-message" *ngIf="errorMessage">{{ errorMessage }}</div>
          <div class="success-message" *ngIf="successMessage">{{ successMessage }}</div>
          
          <button type="submit" class="submit-btn">Register</button>
        </form>

        <div class="auth-footer">
          <span>Already have an account?</span>
          <a routerLink="/login">Login</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      font-family: 'Inter', sans-serif;
    }
    .auth-card {
      background: white;
      padding: 3rem;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
      width: 100%;
      max-width: 500px;
      transition: transform 0.3s ease;
    }
    .auth-card:hover {
      transform: translateY(-5px);
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }
    .auth-header h2 {
      color: #1a202c;
      font-size: 2rem;
      margin-bottom: 0.5rem;
      font-weight: 700;
    }
    .auth-header p {
      color: #718096;
      font-size: 1rem;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: #4a5568;
      font-weight: 500;
    }
    .form-group input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s ease;
      box-sizing: border-box;
    }
    .form-group input:focus {
      outline: none;
      border-color: #4299e1;
      box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
    }
    .role-selector {
      display: flex;
      gap: 1rem;
    }
    .role-selector button {
      flex: 1;
      padding: 0.75rem;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      color: #4a5568;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .role-selector button.active {
      border-color: #667eea;
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
    }
    .submit-btn {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 1rem;
    }
    .submit-btn:hover {
      background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    .error-message {
      color: #e53e3e;
      font-size: 0.9rem;
      margin-bottom: 1rem;
      text-align: center;
    }
    .success-message {
      color: #38a169;
      font-size: 0.9rem;
      margin-bottom: 1rem;
      text-align: center;
    }
    .auth-footer {
      margin-top: 2rem;
      text-align: center;
      color: #718096;
    }
    .auth-footer a {
      color: #4299e1;
      text-decoration: none;
      font-weight: 600;
      margin-left: 0.5rem;
      transition: color 0.3s ease;
    }
    .auth-footer a:hover {
      color: #2b6cb0;
    }
  `]
})
export class RegisterComponent {
  roles = ['Candidate', 'Recruiter'];
  form = { email: '', password: '', role: 'Candidate' };
  errorMessage = '';
  successMessage = '';

  private http = inject(HttpClient);
  private router = inject(Router);
  private apiConfig = inject(ApiConfigService);

  register() {
    if (!this.form.email || !this.form.password) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }
    
    this.errorMessage = '';
    this.successMessage = '';
    
    const registerUrl = this.apiConfig.getEndpoint('/auth/register');
    
    this.http.post(registerUrl, this.form).subscribe({
      next: () => {
        this.successMessage = 'Registration successful. Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || 'Registration failed. Please check your details or try a different email.';
      }
    });
  }
}
