import {Component, ElementRef} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import { UserService } from '../user.service';
import {Router} from '@angular/router';
import { User } from '../user.model';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule, HttpClientModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  passwordFieldType: string = 'password'; // Initialement, on cache le mot de passe

  constructor(private http: HttpClient, private userService: UserService,private router: Router, private elementRef: ElementRef) {}
  ngAfterViewInit() {
    this.elementRef.nativeElement.ownerDocument
      .body.style.backgroundColor = '#1a1a1a';
  }

  // Toggle pour afficher/masquer le mot de passe
  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }
goToregister():void{
  this.router.navigate(['/signup'], { replaceUrl: true }).then(r => console.log("register ?"));

}
  // Fonction appelée lors de la soumission du formulaire
  onSubmit(): void {
    const body = {
      Username: this.username,
      Password: this.password,
    };

    this.http.post<User>("https://smarthomebackend-c9hacbgkd6d6fxhx.westeurope-01.azurewebsites.net/api/login", body).subscribe(
      (response: any) => {
        // Map the response to only include the desired fields
        const user: User = {
          id: response.id, // Adjust if `id` is a string elsewhere
          username: this.username,
          password: this.password,
        };
        console.log(user);
        console.log(response);

        this.userService.setUser(user); // Save user to the service
        console.log("new user saved", this.userService.getUser());
        this.router.navigate(['/home']);
      },
      (error) => {
        console.error("Login error:", error);
      }
    );
  }



  // Vous pouvez maintenant ajouter un appel HTTP pour envoyer ces informations au backend
  }
