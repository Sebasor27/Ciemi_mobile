import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController } from '@ionic/angular';
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

  constructor(
    private auth: AuthService,
    private router: Router,
    private alertCtrl: AlertController
  ) {}

  login() {
    this.auth.login(this.nombre, this.contrasena).subscribe({
      next: (resp: { token: any }) => {
        this.auth.guardarToken(resp.token);
        this.router.navigate(['/home']);
      },
      error: (err: { error: any }) => {
        alert('Error de login: ' + (err.error || 'intenta nuevamente'));
      },
    });
  }

  async openRecuperarContrasena() {
    const alert = await this.alertCtrl.create({
      header: 'Recuperar contraseña',
      inputs: [
        {
          name: 'correo',
          type: 'email',
          placeholder: 'Ingrese su correo',
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Enviar',
          handler: (data: any) => {
            if (data.correo) {
              this.auth.recuperarContrasena(data.correo).subscribe({
                next: (resp: string) => {
                  window.alert(
                    resp || 'Se ha enviado un correo con sus credenciales.'
                  );
                },
                error: (err: any) => {
                  window.alert('Error: ' + (err.error || 'intenta nuevamente'));
                },
              });
            }
          },
        },
      ],
    });

    await alert.present();
  }
}
