import { Router, Request, Response } from "express";

import { HttpError } from "../helpers/errors";
import { db, taskTableDef } from "../helpers/db";
import { Task } from "../model/task";
import { requireRole } from "../helpers/auth";

export const tasksRouter = Router();

async function checkMembership(personId: number, teamId: number): Promise<void> {
  const membership = await db.connection!.get(
    'SELECT 1 FROM memberships WHERE person_id = ? AND team_id = ?',
    personId, 
    teamId
  );

  if (!membership) {
    throw new HttpError(400, `Person ${personId} is not a member of Team ${teamId}`);
  }
}

async function checkTeamExists(teamId: number): Promise<void> {
  const team = await db.connection!.get(
    'SELECT 1 FROM teams WHERE id = ?',
    teamId
  );

  if (!team) {
    throw new HttpError(400, `Team with ID ${teamId} does not exist`);
  }
}

// teams endpoints
tasksRouter.get('/', requireRole([0, 1]), async (req: Request, res: Response) => {
  let query = `
    SELECT
    tasks.id, tasks.name, team_id, teams.color as team_color, teams.name as team_name, person_id, persons.firstname || ' ' || persons.lastname AS person_name, start_date, end_date
    FROM tasks
    LEFT JOIN teams ON tasks.team_id = teams.id
    LEFT JOIN persons ON tasks.person_id = persons.id
  ` // base query

  const sqlParams: any[] = [];
  
  const rawTeamId = req.query.team_id ? parseInt(req.query.team_id as string) : NaN;
  const teamId = !isNaN(rawTeamId) ? rawTeamId : null;
    
    if (teamId !== null) { 
        query += ' WHERE team_id = ?';
        sqlParams.push(teamId);
    }
    const order = parseInt(req.query.order as string, 10);
    if (order > 0 && order <= Object.keys(taskTableDef.columns).length) { // order column provided; order cannot be parameterized
      query += ` ORDER BY ${order} ASC`; // we have to build this part of query directly
    } else if (order < 0 && -order <= Object.keys(taskTableDef.columns).length) {
      query += ` ORDER BY ${-order} DESC`;
    }
    const limit = parseInt(req.query.limit as string, 10);
    if (!isNaN(limit) && limit > 0) { // limit provided
      query += ' LIMIT ?';
      sqlParams.push(limit);
    }
    const offset = parseInt(req.query.offset as string, 0);
    if (!isNaN(limit) && limit > 0 && !isNaN(offset)) { // offset provided
      query += ' OFFSET ?';
      sqlParams.push(offset);
    }
    const tasks = await db!.connection!.all(query, sqlParams);
    res.json(tasks);
  });
  
  
// POST: Create new task
  tasksRouter.post('/', requireRole([0]), async (req: Request, res: Response) => {
    const { name, team_id, person_id, start_date, end_date } = req.body; 
    
    await checkTeamExists(parseInt(team_id, 10));
    await checkMembership(parseInt(person_id, 10), parseInt(team_id, 10));

    try {
      const teamIdNum = parseInt(team_id, 10);
      const personIdNum = parseInt(person_id, 10);

      const startDateObj = new Date(start_date);
      const endDateObj = (end_date && end_date !== 'null') ? new Date(end_date) : undefined;

      const newTask = new Task(name, teamIdNum, personIdNum, startDateObj, endDateObj);
      
      const startDateTimestamp = startDateObj.getTime();
      const endDateTimestamp = endDateObj ? endDateObj.getTime() : null;

      const addedTask = await db!.connection!.get('INSERT INTO tasks (name, team_id, person_id, start_date, end_date) VALUES (?, ?, ?, ?, ?) RETURNING *',
        newTask.name, newTask.team_id, newTask.person_id, startDateTimestamp, endDateTimestamp
      );
      res.json(addedTask);
    } catch (error: Error | any) {
      throw new HttpError(400, 'Cannot add task: ' + error.message); 
    }
  });
  
  tasksRouter.put('/', requireRole([0]), async (req: Request, res: Response) => {
    const { id, name, team_id, person_id, start_date, end_date } = req.body;
    if (typeof id !== 'number' || id <= 0) {
      throw new HttpError(400, 'ID was not provided correctly');
    }

    await checkTeamExists(parseInt(team_id, 10));
    await checkMembership(parseInt(person_id, 10), parseInt(team_id, 10));
    
    try {
      const teamIdNum = parseInt(team_id, 10);
      const personIdNum = parseInt(person_id, 10);

      const startDateObj = new Date(start_date);
      const endDateObj = (end_date && end_date !== 'null') ? new Date(end_date) : undefined;

      const taskToUpdate = new Task(name, teamIdNum, personIdNum, startDateObj, endDateObj);
      taskToUpdate.id = id; 
      
      const startDateTimestamp = startDateObj.getTime();
      const endDateTimestamp = endDateObj ? endDateObj.getTime() : null;

      const updatedTask = await db.connection?.get('UPDATE tasks SET name = ?, team_id = ?, person_id = ?, start_date = ?, end_date = ? WHERE id = ? RETURNING *',
        taskToUpdate.name, taskToUpdate.team_id, taskToUpdate.person_id, startDateTimestamp, endDateTimestamp, taskToUpdate.id
      );
      if (updatedTask) {
        res.json(updatedTask); 
      } else {
        throw new HttpError(404, 'Task to update not found');
      }
    } catch (error: Error | any) {
      throw new HttpError(400, 'Cannot update task: ' + error.message);  
    }
  });
  
  tasksRouter.delete('/', requireRole([0]), async (req: Request, res: Response) => {
    const id = parseInt(req.query.id as string, 10);
    if (isNaN(id) || id <= 0) {
      throw new HttpError(404, 'ID was not provided correctly');
    }
    const deletedTask = await db!.connection!.get('DELETE FROM tasks WHERE id = ? RETURNING *', id);
    if (deletedTask) {
      res.json(deletedTask); // return the deleted task
    } else {
      throw new HttpError(404, 'Team to delete not found');
    }
  });