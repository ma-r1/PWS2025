import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { Subscription } from 'rxjs';

import { Task } from '../../models/task';
import { Team } from '../../models/team';
import { TasksTableComponent } from '../../components/tasks-table/tasks-table';
import { EditTaskDialog } from '../../dialogs/edit-task/edit-task';
import { TasksService } from '../../services/tasks';
import { TeamsService } from '../../services/teams';
import { debounceTime } from 'rxjs';
import { User } from '../../models/user';
import { AuthService } from '../../services/auth';
import { GantChart } from '../../components/gant-chart/gant-chart';

@Component({
    selector: 'tasks-page',
    imports: [
        MatButtonModule, MatInputModule, MatSelectModule,MatIconModule, MatBadgeModule, 
        FormsModule, ReactiveFormsModule, 
        TasksTableComponent, GantChart
    ],
    templateUrl: './tasks.html',
    styleUrls: ['./tasks.scss'],
    standalone: true
})

export class TasksPage {
    filterControl = new FormControl('');
    user: User | null = null;
    order: number = 1;

    tasks: Task[] = [];
    teams: Team[] = [];

    private relodadSubscription: Subscription | null = null;
    
    constructor(private authService: AuthService, private tasksService: TasksService, private teamsService: TeamsService, private dialog: MatDialog) {
        this.authService.currentUser$.subscribe(user => { this.user = user });
        this.filterControl.valueChanges.
            pipe(debounceTime(200)).
            subscribe(value => {
                this.tasksService.notifyReload();
            });
    }

    ngOnInit() {
      this.teamsService.getTeams('', 0).subscribe(teams => {
        this.teams = teams;
      });

      this.tasksService.getTasks('', 0).subscribe(tasks => {
        this.tasks = tasks;
      });

      this.relodadSubscription = this.tasksService.reload$.subscribe(() => {
        this.tasksService.getTasks(this.filterControl.value || '', this.order).subscribe(tasks => {
          this.tasks = tasks;
        });
      });
    }

    ngOnDestroy() {
      this.relodadSubscription?.unsubscribe();
    }

    openDialog() {
        const dialogRef = this.dialog.open(EditTaskDialog, {
           width: '75%',
            data: { row: null }
        });
        dialogRef.afterClosed().subscribe(result => {
            if(!result) return;
            this.tasksService.notifyReload();
        });
    }


    isInRole(roles: number[]) {
           return this.authService.isInRole(this.user, roles);
    }
}