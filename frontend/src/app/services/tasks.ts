import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { Task } from '../models/task';

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private apiUrl = '/api/tasks';

  // Subject to notify components to reload the tasks list
  private reloadSubject = new BehaviorSubject<void>(undefined);
  // Observable that components can subscribe to
  reload$ = this.reloadSubject.asObservable();

  constructor(private http: HttpClient) {}

  getTasks(filter: string = '', order: number = 0): Observable<Task[]> {
      const params = new HttpParams().set('q', filter).set('order', order);
      return this.http.get<Task[]>(this.apiUrl, { params });
  }

  newTask(task: Task): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  modifyTask(task: Task): Observable<Task> {
    return this.http.put<Task>(this.apiUrl, task);
  }

  deleteTask(id: number): Observable<Task> {
    const params = new HttpParams().set('id', id); // pass id as query parameter
    return this.http.delete<Task>(this.apiUrl, { params });
  }

  // Method to notify subscribers to reload the tasks list
  notifyReload() {
    this.reloadSubject.next();
  }
}
