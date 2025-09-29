import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ApiService } from 'src/app/Service/api.service';
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

  errores: any = {};

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
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {}

  registrarEmprendedor(form: NgForm) {
    this.errores = {};

    // Marcar todos los campos como touched para mostrar errores
    Object.values(form.controls).forEach((control: any) => {
  if (control.markAsTouched) control.markAsTouched();
});

    if (!form.valid) return;

    // Preparar payload compatible con DTO
    const payload = { ...this.emprendedor };
    payload.edad = String(payload.edad);
    payload.empleadosHombres = Number(payload.empleadosHombres);
    payload.empleadosMujeres = Number(payload.empleadosMujeres);
    payload.anoCreacionEmpresa = Number(payload.anoCreacionEmpresa);

    // Convertir strings vacíos a null (para opcionales)
    for (const key in payload) {
      if (payload[key] === '') payload[key] = null;
    }

    // Fecha en formato ISO
    payload.fechaRegistro = payload.fechaRegistro.toISOString();

    this.api.createEmprendedor(payload).subscribe({
      next: async () => {
        await this.mostrarToastExito();
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error('Error backend:', err);

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
