import { Routes } from '@angular/router';
import {HomeComponent} from './home/home.component';
import {LoginComponent} from './login/login.component';
import {SignupComponent} from './signup/signup.component';


export const routes: Routes = [
  { path: '', component: LoginComponent }, // Redirige la racine vers '/home'
  { path: 'home', component: HomeComponent }, // Route Home
  { path: 'signup', component: SignupComponent }, // Route Register
  { path: 'login', component: LoginComponent }, // Route Login
  { path: '**',  component: LoginComponent  } // Gestion des routes inconnues
];

