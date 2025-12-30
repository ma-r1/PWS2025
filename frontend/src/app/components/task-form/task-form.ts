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
import { ColorsService } from '../../services/colors';
import { PersonsService } from '../../services/persons';
import { TeamsService } from '../../services/teams';
import { Person } from '../../models/person';
import { Team } from '../../models/team';


function dateInRange(min: Date | string, max: Date | string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    
    const current = new Date(control.value);
    const group = control.parent;

    const resolveDate = (param: Date | string) => {
      if (param instanceof Date) return param;
      if (typeof param === 'string' && group) {
        const val = group.get(param)?.value;
        return val ? new Date(val) : null;
      }
      return null;
    };

    const minDate = resolveDate(min);
    const maxDate = resolveDate(max);

    if (minDate && current < minDate) return { dateInRange: true, reason: 'too_early' };
    if (maxDate && current > maxDate) return { dateInRange: true, reason: 'too_late' };

    return null;
  };
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
  
  getContrastColor: (color: string) => string;
  form: FormGroup;
  minLimit = new Date('1900-01-01');
  today = new Date();
  teams: Team[] = [];
  persons: Person[] = [];
  teamsMap: Record<number, Team> = {};
  personsMap: Record<number, Person> = {};
  isEditModeLoading = false;

  constructor(private fb: FormBuilder, private ps: PersonsService, private ts: TeamsService, private cs: ColorsService) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      team_id: [null, Validators.required],
      person_id: [{ value: null, disabled: true }, Validators.required],
      start_date: [null, [ Validators.required, dateInRange(this.minLimit, this.today)]],
      end_date: [null, [Validators.required, dateInRange('start_date', this.today) 
      ]]
    });

    this.form.statusChanges.subscribe(() => {
      this.validChange.emit(this.form.valid);
    });

    this.getContrastColor = this.cs.getContrastColor;
  }

  ngOnInit() {
    this.ts.getTeams("", 3).subscribe(teams => {
      this.teams = teams;
      this.teamsMap = Object.fromEntries(this.teams.map(t => [t.id, t]));
    });

    this.form.get('start_date')?.valueChanges.subscribe(() => {
      this.form.get('end_date')?.updateValueAndValidity();
    });

    this.form.get('team_id')?.valueChanges.subscribe((teamId) => {
      if (teamId) {
        this.form.get('person_id')?.enable();
        if (this.form.get('person_id')?.value && !this.isEditModeLoading) {
             this.form.get('person_id')?.setValue(null);
        }

        this.loadPersons(teamId);
      } else {
        this.form.get('person_id')?.disable();
        this.form.get('person_id')?.setValue(null);
        this.persons = [];
      }
    });
  }

  loadPersons(teamId: number) {
    this.ps.getPersons("", 1000, 0, 0, teamId).subscribe(data => {
      this.persons = data.persons; 
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['row'] && this.row) {
      this.isEditModeLoading = true;
      if (this.row.team_id) {
          this.loadPersons(this.row.team_id);
          this.form.get('person_id')?.enable();
      }

      this.form.patchValue({
          ...this.row,
          start_date: this.row.start_date ? new Date(this.row.start_date) : null,
          end_date: this.row.end_date ? new Date(this.row.end_date) : null
      });

      this.isEditModeLoading = false;
      this.validChange.emit(this.form.valid);
    }
  }

  ngAfterViewInit() {
    this.form.markAllAsTouched();
  }
}