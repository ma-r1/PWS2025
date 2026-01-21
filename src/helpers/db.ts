// open sqlite database and create tables if they do not exist

import { open, Database } from "sqlite";
import sqlite3 from "sqlite3";
import { faker } from "@faker-js/faker";

import { Person } from "../model/person";
import { COLORS } from "../shared/colors";

export const db: { connection: Database | null} = {
  connection: null
};

export async function openDb(): Promise<void> {
  db.connection = await open({
    filename: process.env.DBFILE || './db/data.sqlite3',
    driver: sqlite3.Database
  });
  await db.connection.exec('PRAGMA foreign_keys = ON'); // to enforce FOREIGN KEY constraints checking
  const { user_version } = await db.connection.get('PRAGMA user_version;') // get current db version
  if(!user_version) { // fresh database
    await db.connection!.exec('PRAGMA user_version = 1;');
    console.log('Reinitialize content...');
    await createSchemaAndData();
  }
}

export const personTableDef = {
  name: 'persons',
  columns: {
    id: { type: 'INTEGER', primaryKey: true, autoincrement: true },
    firstname: { type: 'TEXT' },
    lastname: { type: 'TEXT' },
    birthdate: { type: 'DATE' },
    email: { type: 'TEXT' }
  }
};

export const teamTableDef = {
  name: 'teams',
  columns: {
    id: { type: 'INTEGER', primaryKey: true, autoincrement: true },
    name: { type: 'TEXT' },
    longname: { type: 'TEXT' },
    color: { type: 'TEXT', skipFiltering: true },
    has_avatar: { type: 'INTEGER', skipFiltering: true }
  }
};

export const membershipTableDef = {
  name: 'memberships',
  columns: {
    person_id: { type: 'INTEGER', notNull: true },
    team_id: { type: 'INTEGER', notNull: true }
  },
  primaryKey: ['person_id', 'team_id'], // to create composite primary key
  foreignKeys: [
    { column: 'person_id', references: 'persons(id)' },
    { column: 'team_id', references: 'teams(id)' }
  ]
};

export const taskTableDef = {
  name: 'tasks',
  columns: {
    id: { type: 'INTEGER', primaryKey: true, autoincrement: true },
    name: { type: 'TEXT', notNull: true },
    team_id: { type: 'INTEGER', notNull: true },
    person_id: { type: 'INTEGER', notNull: true },
    start_date: { type: 'DATE', notNull: false },
    end_date: { type: 'DATE' }
  },
  foreignKeys: [
    { column: 'team_id', references: 'teams(id)' },
    { column: 'person_id', references: 'persons(id)' }
  ]
  };

export const changeLogTableDef = {
  name: 'change_logs',
  columns: {
    id: { type: 'INTEGER', primaryKey: true, autoincrement: true },
    table_name: { type: 'TEXT', notNull: true },
    operation_type: { type: 'TEXT', notNull: true },
    record_id: { type: 'INTEGER', notNull: true },
    timestamp: { type: 'DATETIME', notNull: true, default: "CURRENT_TIMESTAMP" },
    diff: { type: 'TEXT' },
    changed_by: { type: 'TEXT' }
  }
};


function createTableStatement(def: { 
    name: string;
    columns: { [key: string]: { type: string; primaryKey?: boolean; autoincrement?: boolean; notNull?: boolean; unique?: boolean; default?: any; foreignKey?: any }},
    primaryKey?: string[];
    foreignKeys?: { column: string; references: string }[];
  }): string {
  // Create a create query by Def object
  const cols = Object.entries(def.columns).map(([name, opts]) => {
    let colDef = `${name} ${opts.type}`;
    if (opts.primaryKey) colDef += ' PRIMARY KEY';
    if (opts.autoincrement) colDef += ' AUTOINCREMENT';
    if (opts.notNull) colDef += ' NOT NULL';
    if (opts.unique) colDef += ' UNIQUE';
    if (opts.default !== undefined) colDef += ` DEFAULT ${opts.default}`;
    return colDef;
  });    
  if(def.primaryKey) {
    cols.push(`PRIMARY KEY (${def.primaryKey.join(', ')})`);
  }
  if(def.foreignKeys) {
    def.foreignKeys.forEach(fk => {
      cols.push(`FOREIGN KEY (${fk.column}) REFERENCES ${fk.references}`);
    });
  }
  return `CREATE TABLE IF NOT EXISTS ${def.name} (\n ${cols.join(',\n ')} \n);`;
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export async function createSchemaAndData(): Promise<void> {
  console.log('Dropping old tables...');
  await db.connection!.exec(`
    DROP TABLE IF EXISTS tasks;
    DROP TABLE IF EXISTS memberships;
    DROP TABLE IF EXISTS teams;
    DROP TABLE IF EXISTS persons;
    DROP TABLE IF EXISTS change_logs;
  `);

  const createPersonsStatement = createTableStatement(personTableDef);
  await db.connection!.run(createPersonsStatement);
  console.log('Persons table created');
  
  const personNum: number = parseInt(process.env.DBFAKEPERSONS || '1000');
  for(let i = 0; i < personNum; i++) {
    const options = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName()
    }
    const fakePerson = new Person(
      options.firstName,
      options.lastName,
      faker.date.birthdate({ min: 1950, max: 2007, mode: 'year' }),
      faker.internet.email(options).toLowerCase()
    );
    await db.connection!.run(
      'INSERT INTO persons (firstname, lastname, birthdate, email) VALUES (?, ?, ?, ?)',
      fakePerson.firstname, fakePerson.lastname, fakePerson.birthdate, fakePerson.email
    );
  }
  console.log(`${personNum} fake persons data created`);    

  const createTeamsStatement = createTableStatement(teamTableDef);
  await db.connection!.run(createTeamsStatement);
  console.log('Teams table created');
  
  const teamsNum: number = parseInt(process.env.DBFAKETEAMS || '10') || 10;
  for(let i = 0; i < teamsNum; i++) { 
    const name = faker.commerce.department() + ' ' + faker.person.jobTitle();
    await db.connection!.run('INSERT INTO teams (name, longname, color, has_avatar) VALUES (?, ?, ?, ?)',
      initials(name),
      name,
      COLORS[Math.floor(Math.random() * COLORS.length)],
      0
    );
  }
  console.log(`${teamsNum} fake teams data created`);

  const createMembershipsStatement = createTableStatement(membershipTableDef);
  await db.connection!.run(createMembershipsStatement);
  
  const sampleMemberships = [[1,1], [1,2], [2,1], [2,3], [3,1], [3,2], [3,3], [3,4], [4,1], [5,1]];
  for(let membership of sampleMemberships) {
    await db.connection!.run('INSERT OR IGNORE INTO memberships (person_id, team_id) VALUES (?, ?)', ...membership);
  }

  for (let pId = 6; pId <= personNum; pId++) {
    const randomTeamId = Math.floor(Math.random() * teamsNum) + 1;
    await db.connection!.run('INSERT INTO memberships (person_id, team_id) VALUES (?, ?)', pId, randomTeamId);
  }
  console.log('Memberships table created with sample and random data');

  await db.connection!.run(createTableStatement(taskTableDef));
  
  const validPairs = await db.connection!.all<{person_id: number, team_id: number}[]>('SELECT person_id, team_id FROM memberships');

  if (validPairs.length > 0) {
    const tasksNum: number = parseInt(process.env.DBFAKETASKS || '50') || 50;
    
    for(let i = 0; i < tasksNum; i++) { 
      const tempname = faker.food.adjective();
      const name = tempname.charAt(0).toUpperCase() + tempname.slice(1) + ' ' + faker.animal.petName(); // Short task names
      const startDate = faker.date.past(); 
      const endDate = faker.date.between({ from: startDate, to: new Date() });

      const pair = validPairs[Math.floor(Math.random() * validPairs.length)];

      await db.connection!.run(
        'INSERT INTO tasks (name, team_id, person_id, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
        name,
        pair.team_id,
        pair.person_id,
        startDate,
        endDate
      );
    }
    console.log(`${tasksNum} fake tasks created`);
  }

  const createChangeLogStatement = createTableStatement(changeLogTableDef);
  await db.connection!.run(createChangeLogStatement);
  console.log('Change logs table created');
}

//function to automatically log changes in apis
export async function logChange(
  tableName: string,
  operationType: 'INSERT' | 'UPDATE' | 'DELETE',
  recordId: number,
  oldData: any | null,
  newData: any | null,
  changedBy: string = 'unknown'
): Promise<void> {
  if (!db.connection) return;

  let diffObj: any = {};

  if (operationType === 'INSERT') {
    diffObj = { after: newData };
  } else if (operationType === 'DELETE') {
    diffObj = { before: oldData };
  } else if (operationType === 'UPDATE') {
    diffObj = { before: oldData, after: newData };
  }

  try {
    await db.connection.run(
      `INSERT INTO change_logs (table_name, operation_type, record_id, diff, changed_by)
       VALUES (?, ?, ?, ?, ?)`,
      tableName,
      operationType,
      recordId,
      JSON.stringify(diffObj),
      changedBy
    );
  }
  catch (error) {
    console.error(`Failed to log ${operationType} for ${tableName}:`, error);
    //doesnt exit because its not a critical failure
  }
}