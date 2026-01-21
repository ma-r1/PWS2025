import { Router, Request, Response } from 'express';

import { HttpError } from '../helpers/errors';
import { db, changeLogTableDef } from '../helpers/db';
import { requireRole } from '../helpers/auth';

export const changelogsRouter = Router();

changelogsRouter.get('/', requireRole([0]), async (req: Request, res: Response) => {
  const changelogs = await db.connection!.all(`SELECT * FROM ${changeLogTableDef.name} ORDER BY timestamp DESC`);
  res.json(changelogs);
});