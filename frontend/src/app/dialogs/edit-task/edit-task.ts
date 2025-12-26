import { Component, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { TaskFormComponent } from '../../components/task-form/task-form';
import { Task } from '../../models/task';
import { TasksService } from '../../services/tasks';

@Component({
  selector: 'edit-task',
  standalone: true,
  imports: [ MatDialogModule, MatButtonModule, TaskFormComponent ],
  templateUrl: './edit-task.html',
  styleUrls: ['./edit-task.scss']
})

export class EditTaskDialog {

    @ViewChild(TaskFormComponent) taskForm!: TaskFormComponent;
    formValid: boolean = false;

    constructor(
        private snackBar: MatSnackBar,
        private dialogRef: MatDialogRef<EditTaskDialog>,
        private tasksService: TasksService,
        @Inject(MAT_DIALOG_DATA) public data: { row: Task }
    ) {}

    onAdd(): void {
        if (this.taskForm.form.valid) {
            const newTask: Task = this.taskForm.form.value;
            this.tasksService.newTask(newTask).subscribe({
                next: task => {
                    this.tasksService.notifyReload(); // notify other components to reload the list
                    this.snackBar.open(`Task ${task.id} added`, 'Close', {
                        duration: 5000,
                        panelClass: ['snackbar-success']
                    });
                    this.dialogRef.close(task.id);
                },
                error: err => {
                    this.snackBar.open(err?.error?.message ?? err?.message ?? 'Unknown error', 'Close', {
                        duration: 5000,
                        panelClass: ['snackbar-error']
                    });
                    this.dialogRef.close(null);
                }
            });
        }
    }

    onModify(): void {
        if (this.taskForm.form.valid) {
            const updatedTask: Task = this.taskForm.form.value;
            updatedTask.id = this.data.row.id;
            this.tasksService.modifyTask(updatedTask).subscribe({
                next: task => {
                    this.tasksService.notifyReload(); // notify
                    this.snackBar.open(`Task ${task.id} modified`, 'Close', {
                        duration: 5000,
                        panelClass: ['snackbar-success']
                    });
                    this.dialogRef.close(task.id);
                },
                error: err => {
                    this.snackBar.open(err?.error?.message ?? err?.message ?? 'Unknown error', 'Close', {
                        duration: 5000,
                        panelClass: ['snackbar-error']
                    });
                    this.dialogRef.close();
                }
            });
        }
    }

    onDelete() {
        this.tasksService.deleteTask(this.data.row.id).subscribe({
            next: task => {
                this.tasksService.notifyReload(); // notify other components to reload the list
                this.snackBar.open(`Task ${task.id} deleted`, 'Close', {
                    duration: 5000,
                    panelClass: ['snackbar-success']
                });
                this.dialogRef.close(task.id);
            },
            error: err => {
                this.snackBar.open(err?.error?.message ?? err?.message ?? 'Unknown error', 'Close', {
                    duration: 5000,
                    panelClass: ['snackbar-error']
                });
                this.dialogRef.close();
            }
        });
    }

    onFormValidChange(valid: boolean) {
        this.formValid = valid;
    }
}