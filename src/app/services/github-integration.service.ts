import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GithubIntegrationService {
  private API_BASE = 'http://localhost:3000/api/github';

  constructor(private http: HttpClient) { }

  getStatus(): Observable<{ connected: boolean, username?: string, lastSynced?: string }> {
    return this.http.get<{ connected: boolean, username?: string, lastSynced?: string }>(
      `${this.API_BASE}/status`, 
      { withCredentials: true }
    );
  }

  removeIntegration(): Observable<any> {
    return this.http.post(`${this.API_BASE}/remove`, {}, { withCredentials: true });
  }

  getData(entity: string, page: number = 1, pageSize: number = 50, search?: string): Observable<any> {
    let url = `${this.API_BASE}/${entity}?page=${page}&pageSize=${pageSize}`;
    if (search && search.trim().length > 0) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    return this.http.get<any>(url, { withCredentials: true });
  }

  // Poll sync status
  getSyncStatus(): Observable<any> {
    return this.http.get<any>(`${this.API_BASE}/sync-status`, { withCredentials: true });
  }
}
