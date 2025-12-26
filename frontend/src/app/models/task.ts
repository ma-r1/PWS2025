export interface Task {
    id: number;
    name: string;
    team_id: number;
    team_name: string;
    team_color: string;
    person_id: number;
    person_fullname: string;
    start_date: Date;
    end_date?: Date;
}
