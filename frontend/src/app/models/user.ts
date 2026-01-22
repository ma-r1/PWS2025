export interface User {
  id?: number | null;
  username: string | null;
  password?: string;
  roles?: number[] | null;
  lastPong?: number | null;
}
