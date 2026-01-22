import { Route } from '@angular/router';
import { HomePage } from './pages/home/home';
import { PersonsPage } from './pages/persons/persons';
import { TeamsPage } from './pages/teams/teams';
import { TasksPage } from './pages/tasks/tasks';
import { ChangelogsPage } from './pages/changelogs/changelogs';
import { ActiveUsersPage } from './pages/active-users/active-users';

export interface AppRoute extends Route {
  icon?: string;
  roles?: number[];
}

export const routes: AppRoute[] = [
  { path: '', component: HomePage, title: 'Home', icon: 'home' },
  { path: 'persons', component: PersonsPage, title: 'Persons', icon: 'person', roles: [0,1] },
  { path: 'teams', component: TeamsPage, title: 'Teams', icon: 'groups', roles: [0,1] },
  { path: 'tasks', component: TasksPage, title: 'Tasks', icon: 'assignment', roles: [0,1] },
  { path: 'changelogs', component: ChangelogsPage, title: 'Change logs', icon: 'history', roles: [0] },
  { path: 'active-users', component: ActiveUsersPage, title: 'Active Users', icon: 'people', roles: [0] }
];

