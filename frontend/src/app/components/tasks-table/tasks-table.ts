import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule, Sort } from '@angular/material/sort';

import { Task } from '../../models/task'
import { TaskService } from '../../services/tasks';
import { EditTaskDialog } from '../../dialogs/edit-task/edit-task';
import { User } from '../../models/user';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'tasks-table',
  templateUrl: './tasks-table.html',
  styleUrls: ['./tasks-table.scss'],
  imports: [CommonModule, MatSortModule, MatTableModule, MatChipsModule, MatProgressSpinnerModule],
  standalone: true
})
export class TasksTableComponent {
  displayedColumns: string[] = ['id', 'name', 'team_id', 'person_id', 'start_date', 'end_date'];
  tasks: Task[] = [];
  private sub?: Subscription;

  user: User | null = null;
  loading: boolean = false;
  timestamp = Date.now();
  order: number = 1;

  @Input() filter: string = '';
  
  constructor(private authService: AuthService,, private tasksService: TaskService, private dialog: MatDialog, private snackBar: MatSnackBar) {
    this.authService.currentUser$.subscribe(user => { this.user = user });
  }
  
  ngOnInit() {
    this.sub = this.tasksService.reload$.subscribe(() => this.loadData());
  }

  loadData() {
    this.loading = true;
    this.tasksService.getTasks(this.filter, this.order).subscribe({
      next: (data) => {
        this.loading = false;
        this.tasks = data;
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err?.error?.message ?? err?.message ?? 'Unknown error', 'Close', {
                        duration: 5000,
                        panelClass: ['snackbar-error']
                    });
      },
    });
  }

  openDialog(row: Task | null) {
    if (!this.isInRole([0])) return;
    const dialogRef = this.dialog.open(EditTaskDialog, {
      width: '75%',
      data: { row }
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result) {
        this.timestamp = Date.now();
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  isInRole(roles: number[]) {
    return this.authService.isInRole(this.user, roles);
  }

  onSortChange(sort: Sort) {
    const columnNo = parseInt(sort.active);
    if(columnNo) {
      switch(sort.direction) {
        case 'asc':
          this.order = columnNo;
          this.loadData();
          break;
        case 'desc':
          this.order = -columnNo;
          this.loadData();
          break;
      }
    }
  }
}
