import { Routes } from '@angular/router';
import {HomeComponent} from './home/home.component';
import {LoginComponent} from './login/login.component';
import {RegisterComponent} from './signup/signup.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' }, // Redirige la racine vers '/home'
  { path: 'home', component: HomeComponent }, // Route Home
  { path: 'register', component: RegisterComponent }, // Route Register
  { path: 'login', component: LoginComponent }, // Route Login
  { path: '**', redirectTo: '/login' } // Gestion des routes inconnues
];

