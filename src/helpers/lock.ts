import { WebSocket } from "ws";

interface Lock {
  type: 'team' | 'person' | 'task';
  id: number;
  userId: number;
  username: string;
}

const activeLocks: Lock[] = [];

export const LockManager = {
  lock: (type: 'team' | 'person' | 'task', id: number, user: any): boolean => {
    const existing = activeLocks.find(l => l.type === type && l.id === id);
    if (existing && existing.userId !== user.id) return false;
    if (!existing) activeLocks.push({type, id, userId: user.id, username: user.username });
    return true
  },

  unlock: (type: 'team' | 'person' | 'task', id: number, userId:number) => {
    const index = activeLocks.findIndex(l => l.type === type && l.id === id && l.userId === userId);
    if (index!== -1) activeLocks.splice(index, 1);
  },

  releaseAllForUser: (userId: number) => {
    let i = activeLocks.length;
    while (i--){
      if (activeLocks[i].userId === userId){
        console.log(`Releasing lock on ${activeLocks[i].type} ${activeLocks[i].id} held by user ${activeLocks[i].username}`);
        activeLocks.splice(i, 1);
      }
    }
  },

  getHolder: (type: 'team' | 'person' | 'task', id: number) => {
    return activeLocks.find(l => l.type === type && l.id === id);
  }

};