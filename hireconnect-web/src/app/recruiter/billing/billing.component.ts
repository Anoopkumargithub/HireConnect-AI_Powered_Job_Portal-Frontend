import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell.component';

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isCurrent: boolean;
  popular?: boolean;
}

interface Invoice {
  id: string;
  date: string;
  amount: string;
  plan: string;
  status: 'Paid' | 'Pending' | 'Failed';
}

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, NotificationBellComponent],
  template: `
    <div class="dashboard-container">
      <!-- Navbar -->
      <nav class="navbar">
        <div class="logo">HireConnect <span>Recruiter</span></div>
        <div class="nav-links">
          <a class="nav-link" (click)="router.navigate(['/recruiter/my-jobs'])">My Jobs</a>
          <a class="nav-link" (click)="router.navigate(['/recruiter/applications'])">Applications</a>
          <a class="nav-link" (click)="router.navigate(['/recruiter/analytics'])">Analytics</a>
          <a class="nav-link" (click)="router.navigate(['/recruiter/profile'])">Company Profile</a>
          <a class="nav-link active">Billing</a>
        </div>
        <div class="nav-actions" style="display: flex; align-items: center; gap: 1.5rem;">
          <app-notification-bell></app-notification-bell>
          <button class="logout-btn" (click)="logout()">Logout</button>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="content">
        <header class="page-header">
          <div class="header-text">
            <h1>Subscription & Billing</h1>
            <p>Manage your organization's plan, billing details, and view past invoices.</p>
          </div>
          <div class="current-plan-badge">
            <span class="badge-label">Current Plan</span>
            <span class="badge-value">Professional</span>
          </div>
        </header>

        <!-- Tabs -->
        <div class="tabs">
          <button class="tab" [class.active]="activeTab === 'plan'" (click)="activeTab = 'plan'">Manage Plan</button>
          <button class="tab" [class.active]="activeTab === 'invoices'" (click)="activeTab = 'invoices'">Invoices</button>
        </div>

        <!-- Plan Management Section -->
        <div class="tab-content" *ngIf="activeTab === 'plan'">
          <div class="billing-cycle-toggle">
            <span [class.active]="billingCycle === 'monthly'">Monthly</span>
            <div class="toggle-switch" (click)="toggleBillingCycle()">
              <div class="toggle-knob" [class.annual]="billingCycle === 'annual'"></div>
            </div>
            <span [class.active]="billingCycle === 'annual'">Annually <span class="discount-tag">Save 20%</span></span>
          </div>

          <div class="pricing-grid">
            <div class="pricing-card" *ngFor="let plan of plans" [class.current]="plan.isCurrent" [class.popular]="plan.popular">
              <div class="popular-badge" *ngIf="plan.popular">Most Popular</div>
              <div class="plan-header">
                <h3>{{ plan.name }}</h3>
                <p class="plan-desc">{{ plan.description }}</p>
                <div class="plan-price">
                  <span class="currency">$</span>
                  <span class="amount">{{ getPrice(plan) }}</span>
                  <span class="period">/{{ billingCycle === 'monthly' ? 'mo' : 'yr' }}</span>
                </div>
              </div>
              <div class="plan-features">
                <ul>
                  <li *ngFor="let feature of plan.features">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="check-icon"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    {{ feature }}
                  </li>
                </ul>
              </div>
              <div class="plan-footer">
                <button class="plan-btn" [class.current-btn]="plan.isCurrent" [disabled]="plan.isCurrent" (click)="selectPlan(plan)">
                  {{ plan.isCurrent ? 'Current Plan' : 'Upgrade' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Invoices Section -->
        <div class="tab-content" *ngIf="activeTab === 'invoices'">
          <div class="invoices-card">
            <div class="invoices-header">
              <h2>Billing History</h2>
              <button class="btn-outline-sm">Download All</button>
            </div>
            
            <div class="table-responsive">
              <table class="invoices-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Date</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let inv of invoices">
                    <td class="inv-id">#{{ inv.id }}</td>
                    <td>{{ inv.date }}</td>
                    <td>{{ inv.plan }}</td>
                    <td class="inv-amount">{{ inv.amount }}</td>
                    <td>
                      <span class="status-badge" [class]="inv.status.toLowerCase()">{{ inv.status }}</span>
                    </td>
                    <td class="inv-action">
                      <button class="icon-btn" title="Download PDF">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="invoices.length === 0">
                    <td colspan="6" class="text-center py-4 text-muted">No invoices found.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <!-- Upgrade Confirmation Modal -->
      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Confirm Upgrade</h2>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <p>You are about to upgrade your organization to the <strong>{{ selectedPlan?.name }}</strong> plan at <strong>\${{ getPrice(selectedPlan!) }}/{{ billingCycle === 'monthly' ? 'mo' : 'yr' }}</strong>.</p>
            <p class="text-muted text-sm mt-2">Your payment method ending in •••• 4242 will be charged immediately. Prorated credits from your current plan will be applied automatically.</p>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModal()">Cancel</button>
            <button class="btn-submit" (click)="confirmUpgrade()" [disabled]="processing">
              {{ processing ? 'Processing...' : 'Confirm Payment' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .dashboard-container { min-height: 100vh; background: #f8fafc; font-family: 'Inter', sans-serif; }
    
    /* Navbar Styles */
    .navbar { background: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.08); position: sticky; top: 0; z-index: 100; }
    .logo { font-size: 1.4rem; font-weight: 700; color: #1e293b; }
    .logo span { color: #6366f1; }
    .nav-links { display: flex; gap: 1.5rem; margin-left: 2rem; flex: 1; }
    .nav-link { color: #64748b; text-decoration: none; font-weight: 600; cursor: pointer; padding: 0.5rem 0; border-bottom: 2px solid transparent; transition: all 0.2s; }
    .nav-link:hover { color: #6366f1; }
    .nav-link.active { color: #6366f1; border-bottom-color: #6366f1; }
    .logout-btn { background: transparent; border: 1px solid #e2e8f0; padding: 0.5rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 500; color: #64748b; transition: all 0.2s; }
    .logout-btn:hover { background: #f1f5f9; }

    /* Layout & Header */
    .content { max-width: 1200px; margin: 0 auto; padding: 2.5rem 2rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
    .header-text h1 { margin: 0 0 0.5rem 0; color: #0f172a; font-size: 2rem; font-weight: 800; letter-spacing: -0.02em; }
    .header-text p { margin: 0; color: #64748b; font-size: 1.05rem; }
    .current-plan-badge { background: white; border: 1px solid #e2e8f0; padding: 0.75rem 1.25rem; border-radius: 12px; display: flex; flex-direction: column; align-items: flex-end; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .badge-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.25rem; }
    .badge-value { font-size: 1.1rem; color: #6366f1; font-weight: 800; }

    /* Tabs */
    .tabs { display: flex; gap: 1rem; border-bottom: 1px solid #e2e8f0; margin-bottom: 2.5rem; }
    .tab { background: none; border: none; padding: 0.75rem 0.5rem; font-size: 1.05rem; font-weight: 600; color: #64748b; cursor: pointer; position: relative; transition: color 0.2s; }
    .tab:hover { color: #1e293b; }
    .tab.active { color: #6366f1; }
    .tab.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 3px; background: #6366f1; border-radius: 3px 3px 0 0; }
    .tab-content { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

    /* Billing Toggle */
    .billing-cycle-toggle { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-bottom: 3rem; }
    .billing-cycle-toggle span { font-weight: 600; color: #64748b; transition: color 0.2s; }
    .billing-cycle-toggle span.active { color: #0f172a; }
    .toggle-switch { width: 60px; height: 32px; background: #cbd5e1; border-radius: 16px; position: relative; cursor: pointer; transition: background 0.3s; }
    .billing-cycle-toggle:hover .toggle-switch { background: #94a3b8; }
    .toggle-knob { width: 24px; height: 24px; background: white; border-radius: 50%; position: absolute; top: 4px; left: 4px; transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .toggle-knob.annual { transform: translateX(28px); }
    .discount-tag { background: #dcfce7; color: #166534; font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 12px; margin-left: 0.5rem; font-weight: 700; }

    /* Pricing Grid */
    .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
    .pricing-card { background: white; border: 1px solid #e2e8f0; border-radius: 24px; padding: 2.5rem 2rem; display: flex; flex-direction: column; position: relative; transition: all 0.3s ease; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .pricing-card:hover { transform: translateY(-8px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); border-color: #cbd5e1; }
    .pricing-card.popular { border: 2px solid #6366f1; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.15); transform: scale(1.02); z-index: 10; }
    .pricing-card.popular:hover { transform: scale(1.02) translateY(-8px); box-shadow: 0 25px 30px -5px rgba(99, 102, 241, 0.25); }
    .popular-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 0.3rem 1rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.3); }
    
    .plan-header { margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid #f1f5f9; }
    .plan-header h3 { margin: 0 0 0.5rem 0; font-size: 1.5rem; color: #0f172a; }
    .plan-desc { color: #64748b; font-size: 0.95rem; margin: 0 0 1.5rem 0; line-height: 1.5; min-height: 2.85rem; }
    .plan-price { display: flex; align-items: baseline; }
    .plan-price .currency { font-size: 1.5rem; font-weight: 600; color: #0f172a; margin-right: 0.1rem; }
    .plan-price .amount { font-size: 3rem; font-weight: 800; color: #0f172a; letter-spacing: -0.03em; }
    .plan-price .period { font-size: 1rem; color: #64748b; margin-left: 0.2rem; }

    .plan-features { flex: 1; margin-bottom: 2.5rem; }
    .plan-features ul { list-style: none; padding: 0; margin: 0; }
    .plan-features li { display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 1rem; color: #334155; font-size: 0.95rem; line-height: 1.4; }
    .check-icon { color: #10b981; flex-shrink: 0; margin-top: 0.1rem; }

    .plan-footer { margin-top: auto; }
    .plan-btn { width: 100%; padding: 1rem; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: all 0.2s; border: none; }
    .pricing-card:not(.popular) .plan-btn { background: #f1f5f9; color: #475569; }
    .pricing-card:not(.popular) .plan-btn:hover { background: #e2e8f0; color: #1e293b; }
    .pricing-card.popular .plan-btn { background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
    .pricing-card.popular .plan-btn:hover { box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4); transform: translateY(-2px); }
    .plan-btn.current-btn { background: white !important; border: 2px solid #e2e8f0 !important; color: #64748b !important; cursor: default; box-shadow: none !important; transform: none !important; }

    /* Invoices Table */
    .invoices-card { background: white; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; overflow: hidden; }
    .invoices-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9; }
    .invoices-header h2 { margin: 0; font-size: 1.25rem; color: #0f172a; }
    .btn-outline-sm { background: white; border: 1px solid #e2e8f0; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; }
    .btn-outline-sm:hover { border-color: #cbd5e1; background: #f8fafc; }
    
    .table-responsive { width: 100%; overflow-x: auto; }
    .invoices-table { width: 100%; border-collapse: collapse; text-align: left; }
    .invoices-table th { padding: 1rem 2rem; background: #f8fafc; color: #64748b; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; }
    .invoices-table td { padding: 1.25rem 2rem; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 0.95rem; vertical-align: middle; }
    .invoices-table tr:last-child td { border-bottom: none; }
    .invoices-table tr:hover td { background: #f8fafc; }
    .inv-id { font-family: monospace; font-weight: 600; color: #64748b !important; }
    .inv-amount { font-weight: 600; color: #0f172a !important; }
    .inv-action { text-align: right; }
    .icon-btn { background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 0.5rem; border-radius: 8px; transition: all 0.2s; }
    .icon-btn:hover { background: #f1f5f9; color: #6366f1; }
    
    .status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
    .status-badge.paid { background: #dcfce7; color: #166534; }
    .status-badge.pending { background: #fef3c7; color: #b45309; }
    .status-badge.failed { background: #fee2e2; color: #b91c1c; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: white; border-radius: 20px; width: 100%; max-width: 500px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); animation: modalSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes modalSlide { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .modal-header { padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { margin: 0; font-size: 1.25rem; color: #0f172a; }
    .close-btn { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; transition: background 0.2s; }
    .close-btn:hover { background: #e2e8f0; }
    .modal-body { padding: 2rem; color: #334155; line-height: 1.6; }
    .text-muted { color: #64748b; }
    .text-sm { font-size: 0.85rem; }
    .mt-2 { margin-top: 0.5rem; }
    .modal-footer { padding: 1.5rem 2rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 1rem; background: #fafafa; border-radius: 0 0 20px 20px; }
    .btn-outline { background: white; border: 1px solid #e2e8f0; padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.2s; }
    .btn-outline:hover { border-color: #cbd5e1; background: #f8fafc; }
    .btn-submit { background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.25); }
    .btn-submit:hover:not(:disabled) { box-shadow: 0 6px 12px rgba(99, 102, 241, 0.3); transform: translateY(-1px); }
    .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
  `]
})
export class BillingComponent implements OnInit {
  public router = inject(Router);

  activeTab: 'plan' | 'invoices' = 'plan';
  billingCycle: 'monthly' | 'annual' = 'monthly';
  
  showModal = false;
  selectedPlan: Plan | null = null;
  processing = false;

  plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: '0',
      period: 'monthly',
      description: 'Perfect for small teams getting started with hiring.',
      features: [
        'Up to 3 active job postings',
        'Basic applicant tracking',
        'Standard email support',
        'Community access'
      ],
      isCurrent: false
    },
    {
      id: 'pro',
      name: 'Professional',
      price: '49',
      period: 'monthly',
      description: 'Advanced tools for growing businesses and agencies.',
      features: [
        'Unlimited job postings',
        'Advanced resume parsing',
        'Automated interview scheduling',
        'Priority email & chat support',
        'Custom team roles'
      ],
      isCurrent: true,
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '199',
      period: 'monthly',
      description: 'Full-suite recruitment solution for large organizations.',
      features: [
        'Everything in Professional',
        'AI-driven applicant ranking',
        'Custom API integrations',
        'Dedicated account manager',
        'Advanced compliance tools',
        'White-labeled candidate portal'
      ],
      isCurrent: false
    }
  ];

  invoices: Invoice[] = [
    { id: 'INV-2026-004', date: 'May 01, 2026', plan: 'Professional Monthly', amount: '$49.00', status: 'Paid' },
    { id: 'INV-2026-003', date: 'Apr 01, 2026', plan: 'Professional Monthly', amount: '$49.00', status: 'Paid' },
    { id: 'INV-2026-002', date: 'Mar 01, 2026', plan: 'Professional Monthly', amount: '$49.00', status: 'Paid' },
    { id: 'INV-2026-001', date: 'Feb 01, 2026', plan: 'Free', amount: '$0.00', status: 'Paid' }
  ];

  ngOnInit() {}

  toggleBillingCycle() {
    this.billingCycle = this.billingCycle === 'monthly' ? 'annual' : 'monthly';
  }

  getPrice(plan: Plan): string {
    if (plan.price === '0') return '0';
    if (this.billingCycle === 'annual') {
      // Apply 20% discount for annual
      const monthlyPrice = parseInt(plan.price);
      return Math.round(monthlyPrice * 0.8 * 12).toString();
    }
    return plan.price;
  }

  selectPlan(plan: Plan) {
    if (plan.isCurrent) return;
    this.selectedPlan = plan;
    this.showModal = true;
  }

  closeModal() {
    if (this.processing) return;
    this.showModal = false;
    this.selectedPlan = null;
  }

  confirmUpgrade() {
    this.processing = true;
    // Simulate API call
    setTimeout(() => {
      this.plans.forEach(p => p.isCurrent = false);
      if (this.selectedPlan) {
        this.selectedPlan.isCurrent = true;
      }
      this.processing = false;
      this.closeModal();
      
      // Add mock invoice
      this.invoices.unshift({
        id: 'INV-2026-005',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        plan: `${this.selectedPlan?.name} ${this.billingCycle === 'monthly' ? 'Monthly' : 'Annual'}`,
        amount: `$${this.getPrice(this.selectedPlan!)}.00`,
        status: 'Paid'
      });
      
    }, 1500);
  }

  logout() {
    localStorage.removeItem('hc_jwt');
    this.router.navigate(['/login']);
  }
}
