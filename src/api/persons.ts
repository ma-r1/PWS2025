import { Router, Request, Response } from "express";

import { HttpError } from "../helpers/errors";
import { db, personTableDef, logChange } from "../helpers/db";
import { Person } from "../model/person";
import { requireRole } from "../helpers/auth";
import { de } from "@faker-js/faker/.";

export const personsRouter = Router();

async function checkLeadership(personId: number): Promise<number[] | null> {
  const rows = await db.connection!.all<{team_id:number}[]>(
    'SELECT DISTINCT team_id FROM tasks WHERE person_id = ?',
    personId
  );
  return rows.map(r => r.team_id);
}

async function checkTeamIdsChange(personId: number, team_ids: number[]): Promise<number[]> {
  const currentRows = await db.connection!.all(
    'SELECT team_id FROM memberships WHERE person_id = ?',
    personId
  );
  const oldIds = currentRows!.map(r => r.team_id);

  const newIds : number[] = Array.isArray(team_ids) ? [ ... new Set(team_ids)] : [];
  
  const removed = oldIds.filter(id => !newIds.includes(id));

  return removed;
}

// persons endpoints
personsRouter.get('/', requireRole([0, 1]), async (req: Request, res: Response) => {
  let query = `
    SELECT
      id, firstname, lastname, birthdate, email,
      (
        SELECT COALESCE(
          json_group_array(
            json_object(
              'id', t.id,
              'name', t.name,
              'longname', t.longname,
              'color', t.color,
              'has_avatar', CASE WHEN t.has_avatar = 1 THEN true ELSE false END
            )
          ),
          json('[]')
        )
        FROM memberships m
        JOIN teams t ON t.id = m.team_id
        WHERE m.person_id = persons.id
      ) AS team_objects
    FROM persons
    `; // base query

  const sqlParams: any[] = [];
  const conditions: string[] = [];

  const teamId = req.query.team_id ? parseInt(req.query.team_id as string) : null;
  if (teamId) {
    conditions.push(`EXISTS (SELECT 1 FROM memberships m WHERE m.person_id = persons.id AND m.team_id = ?)`);
    sqlParams.push(teamId);
  }

  const q = req.query.q as string;
  const { total } = await db.connection!.get("SELECT COUNT(1) AS total FROM persons");
  let filtered = total;
  
  if (q) { // filter query provided
    let concat = Object.entries(personTableDef.columns)
      .filter(([_name, def]) => !('skipFiltering' in def && def.skipFiltering))
      .map(([name, def]) => {
        if (def.type === 'DATE') {
          return `COALESCE(strftime('%Y-%m-%d', ${personTableDef.name}.${name} / 1000, 'unixepoch'),'')`;
        }
        return `COALESCE(${personTableDef.name}.${name},'')`;
      }).join(" || ' ' || ");
    concat += " || ' ' || COALESCE(team_objects,'')";
    
    conditions.push(concat + ' LIKE ?');
    sqlParams.push(`%${q.replace(/'/g, "''")}%`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
    const row  = await db.connection!.get(`SELECT COUNT(1) AS filtered FROM (${query}) f`, sqlParams);
    filtered = row.filtered;
  }

  const order = parseInt(req.query.order as string, 10);
  if (order > 0 && order <= Object.keys(personTableDef.columns).length) { 
    query += ` ORDER BY ${order} ASC`; 
  } else if (order < 0 && -order <= Object.keys(personTableDef.columns).length) {
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
  const persons = (await db!.connection!.all(query, sqlParams))!.map(p => ({ ...p, team_objects: JSON.parse(p.team_objects)}));
  const response = { total, filtered, persons };
  res.json(response);
});

// helper to set membership for a person
async function setMembership(person_id: number, team_ids: number[]) {
  await db!.connection!.run('DELETE FROM memberships WHERE person_id=?', person_id);
  for(const team_id of team_ids) {
    await db!.connection!.run('INSERT INTO memberships (person_id, team_id) VALUES (?, ?)', person_id, team_id);
  }
}

personsRouter.post('/', requireRole([0]), async (req: Request, res: Response) => {
  const { firstname, lastname, birthdate, email, team_ids } = req.body; // assume body has correct shape so name is present
  const user = (req as any).user?.username || 'unknown';
  await db!.connection!.exec('BEGIN IMMEDIATE'); // start transaction
  try {
    const newPerson = new Person(firstname, lastname, new Date(birthdate), email);
    // set team ids if provided
    newPerson.team_ids = Array.isArray(team_ids) ? team_ids : [];
    const addedPerson = await db!.connection!.get('INSERT INTO persons (firstname, lastname, birthdate, email) VALUES (?, ?, ?, ?) RETURNING *',
      newPerson.firstname, newPerson.lastname, newPerson.birthdate, newPerson.email
    );
    await setMembership(addedPerson.id, newPerson.team_ids);
    await logChange('persons', 'INSERT', addedPerson.id, null, addedPerson, user);
    await db!.connection!.exec('COMMIT');
    res.json(addedPerson);
  } catch (error: Error | any) {
    await db!.connection!.exec('ROLLBACK');
    throw new HttpError(400, 'Cannot add person: ' + error.message); // bad request; validation or database error
  }
});

personsRouter.put('/', requireRole([0]), async (req: Request, res: Response) => {
  const { id, firstname, lastname, birthdate, email, team_ids } = req.body;
  const user = (req as any).user?.username || 'unknown';
  if (typeof id !== 'number' || id <= 0) {
    throw new HttpError(400, 'ID was not provided correctly');
  }
  await db!.connection!.exec('BEGIN IMMEDIATE'); // start transaction
  try {
    const oldPerson = await db.connection!.get('SELECT * FROM persons WHERE id = ?', id);
    if (!oldPerson) {
      await db!.connection!.exec('ROLLBACK');
      throw new HttpError(404, 'Person to update not found');
    }
    const changes = await checkTeamIdsChange(id, team_ids);
    const tasks = await checkLeadership(id);
    if (changes.length > 0) {
      for (const teamId of changes) {
        if (tasks && tasks.includes(teamId)) {
          throw new HttpError(400, 'Cannot remove person from team they lead' );
        }
      }
    }

    const personToUpdate = new Person(firstname, lastname, new Date(birthdate), email);
    personToUpdate.id = id;  // retain the original id
    // set team ids if provided
    personToUpdate.team_ids = Array.isArray(team_ids) ? team_ids : [];
    const updatedPerson = await db.connection?.get('UPDATE persons SET firstname = ?, lastname = ?, birthdate = ?, email = ? WHERE id = ? RETURNING *',
      personToUpdate.firstname, personToUpdate.lastname, personToUpdate.birthdate, personToUpdate.email, personToUpdate.id
    );
    if (updatedPerson) {
      await setMembership(updatedPerson.id, personToUpdate.team_ids);
      await logChange('persons', 'UPDATE', updatedPerson.id, oldPerson, updatedPerson, user);
      await db!.connection!.exec('COMMIT');
      res.json(updatedPerson); // return the updated person
    } else {
      await db!.connection!.exec('ROLLBACK');
      throw new HttpError(404, 'Person to update not found');
    }
  } catch (error: Error | any) {
    await db!.connection!.exec('ROLLBACK');
    throw new HttpError(400, 'Cannot update person: ' + error.message);  
  }
});

personsRouter.delete('/', requireRole([0]), async (req: Request, res: Response) => {
  const id = parseInt(req.query.id as string, 10);
  const user = (req as any).user?.username || 'unknown';
  if (isNaN(id) || id <= 0) {
    throw new HttpError(400, 'Cannot delete person');  
  }
  await db!.connection!.exec('BEGIN IMMEDIATE'); // start transaction
  try {
    // await setMembership(id, []); // remove all memberships
    const deletedPerson = await db!.connection!.get('DELETE FROM persons WHERE id = ? RETURNING *', id);
    if (deletedPerson) {
      await logChange('persons', 'DELETE', deletedPerson.id, deletedPerson, null, user);
      await db!.connection!.exec('COMMIT');
      res.json(deletedPerson); // return the deleted person
    } else {
      await db!.connection!.exec('ROLLBACK'); 
      throw new HttpError(404, 'Person to delete not found');
    }
  } catch (error: Error | any) {
    await db!.connection!.exec('ROLLBACK');
    throw new HttpError(400, 'Cannot delete person: ' + error.message);  
  }
});

