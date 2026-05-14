import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiConfigService {
  private apiBaseUrl: string = '';
  private signalrBaseUrl: string = '';

  constructor() {
    this.loadConfig();
  }

  /**
   * Load API configuration from environment variables or use defaults
   */
  private loadConfig(): void {
    // Try to get from window.__env__ first (set by env.js)
    const env = (window as any).__env__;
    
    this.apiBaseUrl = env?.API_BASE_URL || this.getEnvVariable('API_BASE_URL') || this.getDefaultApiUrl();
    this.signalrBaseUrl = env?.SIGNALR_BASE_URL || this.getEnvVariable('SIGNALR_BASE_URL') || this.getDefaultSignalRUrl();
    
    console.log('API Configuration loaded:', {
      apiBaseUrl: this.apiBaseUrl,
      signalrBaseUrl: this.signalrBaseUrl
    });
  }

  /**
   * Get API base URL for HTTP requests
   */
  getApiUrl(): string {
    return this.apiBaseUrl;
  }

  /**
   * Get SignalR base URL for WebSocket connections
   */
  getSignalRUrl(): string {
    return this.signalrBaseUrl;
  }

  /**
   * Get complete endpoint URL
   */
  getEndpoint(path: string): string {
    const baseUrl = this.getApiUrl();
    // Remove trailing slash from baseUrl if present
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  }

  /**
   * Get default API URL based on current environment
   */
  private getDefaultApiUrl(): string {
    if (typeof window !== 'undefined') {
      const isDev = window.location.hostname === 'localhost';
      return isDev ? 'http://localhost:5000/api' : 'https://hireconnect-ai-powered-job-portal-oelc.onrender.com/api';
    }
    return 'http://localhost:5000/api';
  }

  /**
   * Get default SignalR URL based on current environment
   */
  private getDefaultSignalRUrl(): string {
    if (typeof window !== 'undefined') {
      const isDev = window.location.hostname === 'localhost';
      return isDev ? 'http://localhost:5000' : 'https://hireconnect-ai-powered-job-portal-oelc.onrender.com';
    }
    return 'http://localhost:5000';
  }

  /**
   * Try to get environment variable from window object
   */
  private getEnvVariable(name: string): string | undefined {
    if (typeof window !== 'undefined') {
      const env = (window as any).__env__;
      return env?.[name];
    }
    return undefined;
  }
}
