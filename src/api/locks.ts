import { Router } from "express";
import { LockManager } from "../helpers/lock";

export const locksRouter = Router();


locksRouter.post('/acquire', async (req, res) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const {type, id} = req.body;

  if (LockManager.lock(type, id, user)) {
    res.json({ success: true });
  } else {
    const holder = LockManager.getHolder(type, id);
    res.json({ success: false, holder: holder?.username || 'unknown' });
  }
});

locksRouter.post('/release', async (req, res) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const {type, id} = req.body;

  LockManager.unlock(type, id, user.id);
  res.json({ success: true });
});