import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Changelog } from '../../models/changelog';

@Component({
  selector: 'changelogs-table',
  templateUrl: './changelogs-table.html',
  styleUrls: ['./changelogs-table.scss'],
  imports: [CommonModule, MatTableModule, MatChipsModule, MatProgressSpinnerModule],
  standalone: true
})
export class ChangelogsTableComponent  {
  displayedColumns: string[] = ['id', 'table_name', 'operation_type', 'record_id', 'timestamp', 'before', 'after', 'changed_by'];
  @Input() changelogs: Changelog[] = [];

  constructor() {}

  ngOnInit(){}

}
