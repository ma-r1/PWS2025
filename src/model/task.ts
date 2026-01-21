import { HttpError } from "../helpers/errors";

// schema for a task
export class Task {
  id: number;
  name: string;
  team_id: number;
  person_id: number;
  start_date: Date;
  end_date?: Date;

  constructor(name: string, team_id: number, person_id: number, start_date: Date, end_date?: Date) {
    if (!name || typeof name !== 'string' || name.trim().length === 0)
      throw new HttpError(400, 'Name was not provided correctly');
    if( !start_date || !(start_date instanceof Date) || isNaN(start_date.getTime()) || start_date > new Date())
      throw new HttpError(400, 'Start date was not provided correctly');
    if (end_date && (!(end_date instanceof Date) || isNaN(end_date.getTime()) || (end_date < start_date) || end_date > new Date())) 
      throw new HttpError(400, 'End date was not provided correctly'); 

    if (typeof team_id !== 'number' || team_id <= 0) //TODO: check if team exists
      throw new HttpError(400, 'Team ID was not provided correctly');

    if (typeof person_id !== 'number' || person_id <= 0) //TODO: check if person exists in team
      throw new HttpError(400, 'Person ID was not provided correctly');

    this.id = 0; // will be set by the database AUTOINCREMENT
    this.name = name.trim();
    this.team_id = team_id;
    this.person_id = person_id;
    this.start_date = start_date;
    this.end_date = end_date;
  }


}
