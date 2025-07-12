import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ApiService } from 'src/app/Service/api.service';
import { AuthService } from 'src/app/Service/auth.service';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

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
    anoCreacionEmpresa: 2020,
    direccion: '',
    telefono: '',
    celular: '',
    correo: '',
    cedula: '',
    fechaRegistro: new Date(),
    estado: true,
  };

  opcionesRangoEdad = ['Ninguno', '18-25', '26-35', '36-45', '46-59', '60+'];
  opcionesRangoSueldo = ['0-460', '460-750', '750-1000', '1000+'];
  opcionesNivelEstudio = [
    'Primaria',
    'Secundaria',
    'Bachillerato',
    'Licenciatura',
    'Técnico',
    'Tecnológico',
    'Universitario',
    'Postgrado',
    'Maestría',
    'Doctorado',
    'Especialización',
    'Certificación Profesional',
    'Formación Profesional',
    'Educación Preescolar',
    'Educación Media Superior',
    'Ninguno',
  ];
  opcionesTipoEmpresa = [
    'Servicios Profesionales',
    'Comercio',
    'Producción',
    'Agrícola',
    'Servicios',
    'Construcción',
    'Educación',
    'Tecnología',
    'Diseño',
    'Automotriz',
    'Transporte',
    'Salud',
    'Textil',
    'Comunicación',
    'Varios',
    'Turismo',
    'Manufactura',
    'Gastronomía',
  ];

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {}

  registrarEmprendedor() {
    this.api.createEmprendedor(this.emprendedor).subscribe({
      next: () => {
        this.mostrarToastExito();
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error(err);

        if (err.status === 400 && err.error?.errors) {
          const errores = err.error.errors;
          let mensaje = 'Errores de validación:\n';
          for (const campo in errores) {
            mensaje += `${campo}: ${errores[campo].join(', ')}\n`;
          }
          alert(mensaje);
        } else {
          alert('Error al registrar el emprendedor');
        }
      },
    });
  }
  async mostrarToastExito() {
    const toast = await this.toastController.create({
      message: '✔ Emprendedor registrado con éxito',
      duration: 2500,
      position: 'top',
      color: 'success', // verde
      icon: 'checkmark-circle-outline',
    });
    await toast.present();
  }
}
