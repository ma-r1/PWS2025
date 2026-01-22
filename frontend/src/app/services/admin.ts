import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { User } from "../models/user";

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  getActiveUsers() {
    return this.http.get<User[]>('/api/admin/active-users');  
  }

  kickUser(userId: number) {
    return this.http.post<{ success: boolean; kicked: boolean }>('/api/admin/kick-user', { userId });
  }
}