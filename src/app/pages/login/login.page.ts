import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from 'src/app/Service/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  nombre = '';
  contrasena = '';

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    this.auth.login(this.nombre, this.contrasena).subscribe({
      next: (resp: { token: any; }) => {
        this.auth.guardarToken(resp.token);
        this.router.navigate(['/home']);
      },
      error: (err: { error: any; }) => {
        alert('Error de login: ' + (err.error || 'intenta nuevamente'));
      },
    });
  }
}


