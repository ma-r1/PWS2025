import { Router, Request, Response } from 'express';
import { db } from '../helpers/db';
import { requireRole } from '../helpers/auth';

export const changelogsRouter = Router();

changelogsRouter.get('/', requireRole([0]), async (req: Request, res: Response) => {
  try {
    const rows = await db.connection!.all('SELECT * FROM change_logs ORDER BY timestamp DESC');
    
    const results = rows.map(row => {
      let before = null;
      let after = null;
      
      if (row.diff) {
        try {
          const parsed = JSON.parse(row.diff);
          before = parsed.before;
          after = parsed.after;
        } catch (e) {
          console.error('Failed to parse diff JSON for log', row.id);
        }
      }

      return {
        id: row.id,
        table_name: row.table_name,
        operation_type: row.operation_type,
        record_id: row.record_id,
        timestamp: row.timestamp,
        changed_by: row.changed_by,
        before: before, // <--- Now available for the table
        after: after    // <--- Now available for the table
      };
    });

    res.json(results);

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});