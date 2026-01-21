import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { Subscription } from 'rxjs';

import { Changelog } from '../../models/changelog';
import { ChangelogsTableComponent } from '../../components/changelogs-table/changelogs-table';
import { ChangelogsService } from '../../services/changelogs';
import { User } from '../../models/user';
import { AuthService } from '../../services/auth';

@Component({
    selector: 'changelogs-page',
    imports: [
        MatButtonModule, MatInputModule, MatSelectModule,MatIconModule, MatBadgeModule, 
        FormsModule, ReactiveFormsModule, 
        ChangelogsTableComponent
    ],
    templateUrl: './changelogs.html',
    styleUrls: ['./changelogs.scss'],
    standalone: true
})

export class ChangelogsPage {
    user: User | null = null;

    changelogs: Changelog[] = [];

    private relodadSubscription: Subscription | null = null;
    
    constructor(private authService: AuthService, private changelogsService: ChangelogsService) {
        this.authService.currentUser$.subscribe(user => { this.user = user });
    }

    ngOnInit() {
      this.changelogsService.getChangelogs().subscribe(changelogs => {
        this.changelogs = changelogs;
      });
    }

    ngOnDestroy() {
      this.relodadSubscription?.unsubscribe();
    }

    isInRole(roles: number[]) {
           return this.authService.isInRole(this.user, roles);
    }
}