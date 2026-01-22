import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LockService {
  constructor(private http: HttpClient) {}

  acquireLock(type: 'person' | 'task' | 'team', id: number): Observable<{ success: boolean; holder?: string }> {
    return this.http.post<{ success: boolean; holder?: string }>('/api/locks/acquire', { type, id });
  }

  releaseLock(type: 'person' | 'task' | 'team', id: number) {
      // We subscribe immediately because we don't usually wait for the result of a release
    this.http.post('/api/locks/release', { type, id }).subscribe();
  }
}