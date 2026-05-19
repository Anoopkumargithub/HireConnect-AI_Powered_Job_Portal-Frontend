import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiConfigService } from './api-config.service';
import { Observable, BehaviorSubject, interval, Subscription } from 'rxjs';
import { tap, switchMap, startWith } from 'rxjs/operators';

export interface AppNotification {
  notificationId: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedNotifications {
  items: AppNotification[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiConfig = inject(ApiConfigService);
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  
  private pollingSubscription?: Subscription;

  private getHeaders() {
    const token = localStorage.getItem('hc_jwt');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  getUnreadCount(): Observable<{ unread: number }> {
    return this.http.get<{ unread: number }>(this.apiConfig.getEndpoint('/notifications/unread-count'), {
      headers: this.getHeaders()
    }).pipe(
      tap(res => this.unreadCountSubject.next(res.unread || 0))
    );
  }

  getRecent(page: number = 1, pageSize: number = 10): Observable<PaginatedNotifications> {
    return this.http.get<PaginatedNotifications>(this.apiConfig.getEndpoint(`/notifications?page=${page}&pageSize=${pageSize}`), {
      headers: this.getHeaders()
    });
  }

  markAsRead(notificationId: string): Observable<any> {
    return this.http.patch(this.apiConfig.getEndpoint(`/notifications/${notificationId}/read`), {}, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => this.getUnreadCount().subscribe())
    );
  }

  startPolling(intervalMs: number = 30000) {
    if (this.pollingSubscription) {
      return;
    }
    
    this.pollingSubscription = interval(intervalMs).pipe(
      startWith(0),
      switchMap(() => this.getUnreadCount())
    ).subscribe();
  }

  stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
  }
}
