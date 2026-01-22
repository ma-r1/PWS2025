import { Router } from 'express';
import { requireRole } from '../helpers/auth';
import { getActiveConnections, kickUser } from '../helpers/websocket';

export const adminRouter = Router();

adminRouter.get('/active-users', requireRole([0]), (req, res) => {
  const connections = getActiveConnections();
  console.log('Active connections found:', connections); // Add this log
  res.json(connections);
});

adminRouter.post('/kick-user/', requireRole([0]), (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: 'User ID is required' });
  const kicked = kickUser(userId);
  res.json({ success:true, kicked });
});