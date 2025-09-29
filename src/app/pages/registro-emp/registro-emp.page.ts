import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ApiService } from 'src/app/Service/api.service';
import { AuthService } from 'src/app/Service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro-emp',
  templateUrl: './registro-emp.page.html',
  styleUrls: ['./registro-emp.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class RegistroEmpPage implements OnInit {
  emprendedor: any = {
    nombre: '',
    edad: '',
    nivelEstudio: '',
    trabajoRelacionDependencia: false,
    sueldoMensual: '',
    ruc: '',
    empleadosHombres: 0,
    empleadosMujeres: 0,
    rangoEdadEmpleados: '',
    tipoEmpresa: '',
    anoCreacionEmpresa: new Date().getFullYear(),
    direccion: '',
    telefono: '',
    celular: '',
    correo: '',
    cedula: '',
    fechaRegistro: new Date(),
    estado: true,
  };

  errores: any = {}; // Errores backend

  opcionesRangoEdad = ['Ninguno', '18-25', '26-35', '36-45', '46-59', '60+'];
  opcionesRangoSueldo = ['0-460', '460-750', '750-1000', '1000+'];
  opcionesNivelEstudio = [
    'Primaria', 'Secundaria', 'Bachillerato', 'Licenciatura', 'Técnico',
    'Tecnológico', 'Universitario', 'Postgrado', 'Maestría', 'Doctorado',
    'Especialización', 'Certificación Profesional', 'Formación Profesional',
    'Educación Preescolar', 'Educación Media Superior', 'Ninguno',
  ];
  opcionesTipoEmpresa = [
    'Servicios Profesionales', 'Comercio', 'Producción', 'Agrícola', 'Servicios',
    'Construcción', 'Educación', 'Tecnología', 'Diseño', 'Automotriz',
    'Transporte', 'Salud', 'Textil', 'Comunicación', 'Varios', 'Turismo',
    'Manufactura', 'Gastronomía',
  ];

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {}

  registrarEmprendedor(form: any) {
    this.errores = {};

    // Validación frontend
    if (!form.valid) {
      return; // no envía si falla la validación
    }

    this.api.createEmprendedor(this.emprendedor).subscribe({
      next: async () => {
        await this.mostrarToastExito();
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error(err);

        if (err.status === 400 && err.error?.errors) {
          this.errores = err.error.errors;
        } else {
          alert(err.error?.message || 'Error al registrar el emprendedor');
        }
      },
    });
  }

  async mostrarToastExito() {
    const toast = await this.toastController.create({
      message: '✔ Emprendedor registrado con éxito',
      duration: 2500,
      position: 'top',
      color: 'success',
      icon: 'checkmark-circle-outline',
    });
    await toast.present();
  }
}
