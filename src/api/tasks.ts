import { Router, Request, Response } from "express";

import { HttpError } from "../helpers/errors";
import { db, taskTableDef } from "../helpers/db";
import { Task } from "../model/task";
import { deleteUploadedFile } from "../helpers/fileupload";
import { requireRole } from "../helpers/auth";

export const tasksRouter = Router();

// teams endpoints
tasksRouter.get('/', requireRole([0, 1]), async (req: Request, res: Response) => {
  let query = `
    SELECT
      id, name, team_id, person_id, start_date, end_date
    FROM tasks
  ` // base query

  const sqlParams: any[] = [];
  
    const q = req.query.q as string;
    const { total } = await db.connection!.get("SELECT COUNT(1) AS total FROM tasks");
    let filtered = total;
    if (q) { // filter query provided
      let concat = Object.entries(taskTableDef.columns)
        .filter(([_name, def]) => !('skipFiltering' in def && def.skipFiltering))
        .map(([name, def]) => {
          if (def.type === 'DATE') {
            // special handling of date by conversion from unix timestamp in ms to YYYY-MM-DD
            return `COALESCE(strftime('%Y-%m-%d', ${taskTableDef.name}.${name} / 1000, 'unixepoch'),'')`;
          }
          return `COALESCE(${taskTableDef.name}.${name},'')`; // coalesce is needed to protect against potential null-values
        }).join(" || ' ' || ");
      query += ' WHERE ' + concat + ' LIKE ?';
      sqlParams.push(`%${q.replace(/'/g, "''")}%`);
      const row  = await db.connection!.get(`SELECT COUNT(1) AS filtered FROM (${query}) f`, sqlParams);
      filtered = row.filtered;
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