import { HttpError } from "../helpers/errors";
import { COLORS } from "../shared/colors";

// schema for a team
export class Team {
  id: number;
  name: string;
  longname: string;
  color: string;
  has_avatar: boolean;

  constructor(name: string, longname: string, color: string, has_avatar: boolean = false) {

    if (!name || typeof name !== 'string' || name.trim().length === 0)
      throw new HttpError(400, 'Name was not provided correctly');
    if (!name || typeof longname !== 'string' || longname.trim().length === 0)
      throw new HttpError(400, 'Long name was not provided correctly');
    if (!color || typeof color !== 'string' || color.trim().length === 0 || !COLORS.includes(color.trim()))
      throw new HttpError(400, 'Color was not provided correctly');

    this.id = 0; // will be set by the database AUTOINCREMENT
    this.name = name.trim();
    this.longname = longname.trim();
    this.color = color.trim();
    this.has_avatar = has_avatar;
  }
}
