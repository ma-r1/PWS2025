import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Component, ElementRef, Input, ViewChild, OnDestroy, Output, EventEmitter } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';

import { Task } from '../../models/task';
import { TasksService } from '../../services/tasks';
import { EditTaskDialog } from '../../dialogs/edit-task/edit-task';
import { User } from '../../models/user';
import { AuthService } from '../../services/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ColorsService } from '../../services/colors';

@Component({
  selector: 'tasks-table',
  templateUrl: './tasks-table.html',
  styleUrls: ['./tasks-table.scss'],
  imports: [CommonModule, MatTableModule, MatSortModule, MatChipsModule, MatProgressSpinnerModule],
  standalone: true
})
export class TasksTableComponent  {
  displayedColumns: string[] = ['id', 'name', 'team', 'person', 'start_date', 'end_date'];
  tasks: Task[] = [];
  private sub?: Subscription;

  private _filter: string = '';
  @Input()
  set filter(value: string) {
    if (value !== this._filter) {
      this._filter = value;
    }
  } // set private component _filter if parent component changes value of filter
  
  @ViewChild('tableContainer') tableContainer!: ElementRef<HTMLDivElement>;
  getContrastColor: (color: string) => string;
  user: User | null = null;
  loading: boolean = false;
  order: number = 1;
  timestamp = Date.now();


  constructor(
    private authService: AuthService,
    private tasksService: TasksService,
        private colorsService: ColorsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.authService.currentUser$.subscribe(user => { this.user = user; });
    this.getContrastColor = this.colorsService.getContrastColor;
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
