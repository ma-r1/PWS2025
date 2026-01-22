import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { User } from '../../models/user';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'active-users-table',
  templateUrl: './active-users-table.html',
  styleUrls: ['./active-users-table.scss'],
  imports: [CommonModule, MatTableModule, MatChipsModule, MatProgressSpinnerModule, MatButtonModule, MatIconModule],
  standalone: true
})
export class ActiveUsersTableComponent  {
  displayedColumns: string[] = ['id', 'username', 'roles', 'lastPong', 'actions'];
  @Input() users: User[] = [];
  @Output() kick = new EventEmitter<number>();

  constructor() {}

  ngOnInit(){}

  onKick(user: User) {
    if (user.id) {
      this.kick.emit(user.id);
    }
  }
}
