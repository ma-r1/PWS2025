import { HttpError } from "../helpers/errors";

// schema for a team
export class ChangeLog {
  id: number;
  table_name: string;
  operation_type: string
  record_id: number;
  timestamp: Date;
  diff?: string | null;
  changed_by?: string | null;

  constructor(table_name: string, operation_type: string, record_id: number, timestamp: Date, diff?: string | null, changed_by?: string | null) {

    if (!table_name || typeof table_name !== 'string' || table_name.trim().length === 0)
      throw new HttpError(400, 'Table name was not provided correctly');
    if (!operation_type || typeof operation_type !== 'string' || operation_type.trim().length === 0)
      throw new HttpError(400, 'Operation type was not provided correctly');
    if (!record_id || typeof record_id !== 'number' || isNaN(record_id) || record_id <= 0)
      throw new HttpError(400, 'Record ID was not provided correctly');
    if (!timestamp || !(timestamp instanceof Date) || isNaN(timestamp.getTime()) || timestamp > new Date())
      throw new HttpError(400, 'Timestamp was not provided correctly');

    if (diff && (typeof diff !== 'string'))
      throw new HttpError(400, 'Diff was not provided correctly');
    if (changed_by && (typeof changed_by !== 'string' || changed_by.trim().length === 0))
      throw new HttpError(400, 'Changed by was not provided correctly');

    this.id = 0; // will be set by the database AUTOINCREMENT
    this.table_name = table_name.trim();
    this.operation_type = operation_type.trim();
    this.record_id = record_id;
    this.timestamp = timestamp;
    this.diff = diff;
    this.changed_by = changed_by;
  }
}
