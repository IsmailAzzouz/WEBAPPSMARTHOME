import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import {LoginComponent} from './login/login.component';  // Remplacez par le nom de votre composant


const routes: Routes = [
  { path: '', component: HomeComponent },
  {path:'/login', component:LoginComponent},

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],  // Importez le module de routing avec les routes définies
  exports: [RouterModule]  // Exposez le module pour qu'il soit utilisé dans l'application
})
export class AppRoutingModule { }
