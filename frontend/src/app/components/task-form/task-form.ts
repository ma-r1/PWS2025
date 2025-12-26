import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';

import { Task } from '../../models/task'

function dateInRange(lower: Date, upper: Date): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const valueDate = new Date(control.value);
    if (isNaN(valueDate.getTime())) {
      return { invalidDate: true };
    }
    if (valueDate < lower || valueDate > upper) return { dateOutOfRange: { lower, upper } };
    return null;
  }
}

@Component({
  selector: 'task-form',
  templateUrl: './task-form.html',
  styleUrls: ['./task-form.scss'],
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDatepickerModule, MatSelectModule],
  standalone: true,
})

export class TaskFormComponent {
  @Input() row!: Task | null;
  @Output() validChange = new EventEmitter<boolean>();
  
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
        name: ['', Validators.required],
        team_id: [null, Validators.required],
        person_id: [null, Validators.required],
        start_date: [null, [Validators.required , dateInRange(new Date('2000-01-01'), new Date('2100-12-31'))]],
        end_date: [null, dateInRange(new Date('2000-01-01'), new Date('2100-12-31'))]
    });

    this.form.statusChanges.subscribe(() => {
      this.validChange.emit(this.form.valid);
    });

  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['row'] && this.row) {
      // It is safer to convert the string dates to Date objects BEFORE patching the whole object
      // or patch the specific date fields afterward (which you are doing, but let's ensure it's clean)
      
      this.form.patchValue({
          ...this.row, // patch scalar values (name, ids)
          start_date: this.row.start_date ? new Date(this.row.start_date) : null,
          end_date: this.row.end_date ? new Date(this.row.end_date) : null
      });

      this.validChange.emit(this.form.valid);
    }
  }

  ngAfterViewInit() {
    this.form.markAllAsTouched();
  }
}