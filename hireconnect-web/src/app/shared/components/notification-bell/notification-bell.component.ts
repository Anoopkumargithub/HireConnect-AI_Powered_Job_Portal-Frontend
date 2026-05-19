import { Component, OnInit, OnDestroy, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';


@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container" (click)="$event.stopPropagation()">
      <button class="bell-btn" (click)="toggleDropdown()" [class.active]="isOpen">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="bell-icon">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <span class="badge" *ngIf="(unreadCount$ | async) as count" [class.shake]="count > 0">{{ count > 99 ? '99+' : count }}</span>
      </button>

      <div class="dropdown-menu" *ngIf="isOpen">
        <div class="dropdown-header">
          <h3>Notifications</h3>
          <span class="unread-text" *ngIf="(unreadCount$ | async) as count">{{count}} Unread</span>
        </div>
        
        <div class="dropdown-body">
          <div class="loading-spinner" *ngIf="loading">
            <div class="spinner"></div>
          </div>
          
          <div class="empty-state" *ngIf="!loading && notifications.length === 0">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              <line x1="2" y1="2" x2="22" y2="22"></line>
            </svg>
            <p>You have no new notifications.</p>
          </div>

          <div class="notification-list" *ngIf="!loading && notifications.length > 0">
            <div class="notification-item" *ngFor="let note of notifications" [class.unread]="!note.isRead">
              <div class="note-icon">
                <svg *ngIf="note.title.includes('Interview')" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <svg *ngIf="!note.title.includes('Interview')" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div class="note-content">
                <div class="note-title">{{ note.title }}</div>
                <div class="note-desc">{{ note.message }}</div>
                <div class="note-time">{{ note.createdAt | date:'short' }}</div>
              </div>
              <div class="note-action" *ngIf="!note.isRead">
                <button class="mark-read-btn" (click)="markAsRead(note, $event)" title="Mark as read">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-container { position: relative; font-family: 'Inter', sans-serif; }
    
    .bell-btn { background: transparent; border: 1px solid transparent; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; position: relative; transition: all 0.2s; }
    .bell-btn:hover { background: #f1f5f9; color: #1e293b; }
    .bell-btn.active { background: #eff6ff; color: #3b82f6; border-color: #bfdbfe; }
    
    .badge { position: absolute; top: 0; right: 0; background: #ef4444; color: white; font-size: 0.7rem; font-weight: 700; min-width: 18px; height: 18px; border-radius: 9px; display: flex; align-items: center; justify-content: center; padding: 0 4px; border: 2px solid white; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3); }
    
    .dropdown-menu { position: absolute; top: calc(100% + 10px); right: -10px; width: 360px; background: white; border-radius: 16px; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05); z-index: 1000; overflow: hidden; transform-origin: top right; animation: dropdownSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
    
    .dropdown-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #fafafa; }
    .dropdown-header h3 { margin: 0; font-size: 1.1rem; color: #0f172a; font-weight: 700; }
    .unread-text { font-size: 0.8rem; background: #dbeafe; color: #2563eb; padding: 0.2rem 0.6rem; border-radius: 12px; font-weight: 600; }
    
    .dropdown-body { max-height: 400px; overflow-y: auto; background: white; }
    .dropdown-body::-webkit-scrollbar { width: 6px; }
    .dropdown-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
    
    .loading-spinner { padding: 3rem; display: flex; justify-content: center; }
    .spinner { width: 30px; height: 30px; border: 3px solid #f1f5f9; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; }
    
    .empty-state { padding: 3rem 2rem; text-align: center; color: #94a3b8; }
    .empty-state svg { margin-bottom: 1rem; opacity: 0.7; }
    .empty-state p { margin: 0; font-size: 0.95rem; }
    
    .notification-item { display: flex; padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; gap: 1rem; transition: background 0.2s; position: relative; }
    .notification-item:hover { background: #f8fafc; }
    .notification-item.unread { background: #f0fdf4; }
    .notification-item.unread:hover { background: #dcfce7; }
    .notification-item:last-child { border-bottom: none; }
    
    .note-icon { display: flex; align-items: flex-start; padding-top: 0.2rem; }
    .note-icon svg { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.05)); }
    
    .note-content { flex: 1; min-width: 0; }
    .note-title { font-weight: 600; color: #1e293b; font-size: 0.95rem; margin-bottom: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .note-desc { font-size: 0.85rem; color: #64748b; line-height: 1.4; margin-bottom: 0.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .note-time { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }
    
    .note-action { display: flex; align-items: center; }
    .mark-read-btn { background: white; border: 1px solid #e2e8f0; color: #64748b; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; opacity: 0; transform: scale(0.9); box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    .notification-item:hover .mark-read-btn { opacity: 1; transform: scale(1); }
    .mark-read-btn:hover { background: #10b981; color: white; border-color: #10b981; }
    
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes dropdownSlide {
      from { opacity: 0; transform: scale(0.95) translateY(-10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private elementRef = inject(ElementRef);
  
  unreadCount$ = this.notificationService.unreadCount$;
  isOpen = false;
  loading = false;
  notifications: AppNotification[] = [];

  ngOnInit() {
    this.notificationService.startPolling(20000); // 20s polling
  }

  ngOnDestroy() {
    this.notificationService.stopPolling();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.loadNotifications();
    }
  }

  loadNotifications() {
    this.loading = true;
    this.notificationService.getRecent(1, 10).subscribe({
      next: (res) => {
        this.notifications = res.items || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  markAsRead(note: AppNotification, event: Event) {
    event.stopPropagation();
    this.notificationService.markAsRead(note.notificationId).subscribe({
      next: () => {
        note.isRead = true;
      }
    });
  }
}
