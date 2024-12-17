import {Component, ElementRef} from '@angular/core';
import {FormsModule, NgForm} from '@angular/forms';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import { UserService } from '../user.service';
import {Router} from '@angular/router';
import { User } from '../user.model';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    FormsModule,HttpClientModule
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  username: string = '';
  password: string = '';
  passwordFieldType: string = 'password';
  showPassword: boolean = false; // Par défaut, on masque le mot de passe

  constructor(private http: HttpClient, private userService: UserService,private router: Router,private elementRef: ElementRef) {}
  ngAfterViewInit() {
    this.elementRef.nativeElement.ownerDocument
      .body.style.backgroundColor = '#1a1a1a';
  }
  // Fonction pour envoyer les données d'enregistrement
  onSubmit() {
    const user = {
      username: this.username,
      password: this.password,
      device: {
        id:"",
        Name: 'Default Device',
        state: false
      }
    };
    console.log(user);

    // Remplacez l'URL par celle de votre backend
    this.http.post('https://smarthomebackend-c9hacbgkd6d6fxhx.westeurope-01.azurewebsites.net/api/register', user).subscribe(
      (response:any) => {
        console.log(response);
        const user: User = {
          id: response.id, // Adjust if `id` is a string elsewhere
          username: this.username,
          password: this.password,
        };
        console.log(user);


        this.userService.setUser(user); // Save user to the service
        console.log("new user saved", this.userService.getUser());
        if (response && response.id) {
          this.router.navigate(['/home']);
        }
        // Vous pouvez rediriger ou afficher un message de succès ici
      },
      (error) => {
        console.error('Registration failed:', error);
      }
    );
  }

  // Fonction pour afficher/masquer le mot de passe
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
  goTologin():void{
    this.router.navigate(['/login'], { replaceUrl: true }).then(r => console.log("login ?"));

  }
}
