import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {BehaviorSubject, Subject, Observable} from 'rxjs';

import {Changelog} from '../models/changelog';

@Injectable({
  providedIn: 'root'
})
export class ChangelogsService {
  private apiUrl = '/api/changelogs';

  private reloadSubject = new BehaviorSubject<void>(undefined);
  reload$ = this.reloadSubject.asObservable();

  constructor(private http: HttpClient) {}

  getChangelogs(): Observable<Changelog[]> {
    return this.http.get<Changelog[]>(this.apiUrl);
  }

  notifyReload() {
    this.reloadSubject.next();
  }
}