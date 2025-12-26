import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';

import { TasksTableComponent } from '../../components/tasks-table/tasks-table';
import { EditTaskDialog } from '../../dialogs/edit-task/edit-task';
import { TasksService } from '../../services/tasks';
import { debounceTime } from 'rxjs';
import { User } from '../../models/user';
import { AuthService } from '../../services/auth';

@Component({
    selector: 'tasks-page',
    imports: [
        MatButtonModule, MatInputModule, MatSelectModule,MatIconModule, MatBadgeModule, 
        FormsModule, ReactiveFormsModule, 
        TasksTableComponent
    ],
    templateUrl: './tasks.html',
    styleUrls: ['./tasks.scss'],
    standalone: true
})
export class TasksPage {
    filterControl = new FormControl('');
    user: User | null = null;
    order: number = 1;
    
    constructor(private authService: AuthService, private tasksService: TasksService, private dialog: MatDialog) {
        this.authService.currentUser$.subscribe(user => { this.user = user });
        this.filterControl.valueChanges.
            pipe(debounceTime(200)).
            subscribe(value => {
                this.tasksService.notifyReload();
            });
    }

    openDialog() {
        const dialogRef = this.dialog.open(EditTaskDialog, { // new person dialog
            width: '75%',
            minWidth: '800px',
            data: { row: null }
        });
        dialogRef.afterClosed().subscribe(result => {
            if(!result) return;
            this.filterControl.patchValue(result + ' '); // display only record just added
        });
    }

    isInRole(roles: number[]) {
           return this.authService.isInRole(this.user, roles);
    }    onCountsChange(counts: { total: number, filtered: number, order: number }) {
        this.order = counts.order;
    } //TODO filter not working :c
}