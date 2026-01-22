import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { Subscription } from 'rxjs';

import { User } from '../../models/user';
import { AuthService } from '../../services/auth';
import { AdminService } from '../../services/admin';
import { WebsocketService } from '../../services/websocket';
import { ActiveUsersTableComponent } from '../../components/active-users-table/active-users-table';

@Component({
    selector: 'active-users-page',
    imports: [
        MatButtonModule, MatInputModule, MatSelectModule,MatIconModule, MatBadgeModule, 
        FormsModule, ReactiveFormsModule, 
        ActiveUsersTableComponent
    ],
    templateUrl: './active-users.html',
    styleUrls: ['./active-users.scss'],
    standalone: true
})

export class ActiveUsersPage {
    user: User | null = null;
    users: User[] = [];
    private wsSub: Subscription | null = null;

    private relodadSubscription: Subscription | null = null;
    
    constructor(private authService: AuthService, private adminService: AdminService, private websocketService: WebsocketService) {
        this.authService.currentUser$.subscribe(user => { this.user = user });
    }

    ngOnInit() {
      this.loadData();

      this.wsSub = this.websocketService.messages$.subscribe(msg => {
        if (msg.type === 'REFRESH_ACTIVE_USERS') {
          this.loadData();
        }
      });
    }

    ngOnDestroy() {
      this.wsSub?.unsubscribe();
    }

    isInRole(roles: number[]) {
           return this.authService.isInRole(this.user, roles);
    }

    loadData() {
      this.adminService.getActiveUsers().subscribe(users => {
        this.users = users;
      });
    }

    kickUser(userId: number) {
      this.adminService.kickUser(userId).subscribe({
        next: () => {
        },
        error: (err) => console.error('Failed to kick user', err)
      });
    }
}