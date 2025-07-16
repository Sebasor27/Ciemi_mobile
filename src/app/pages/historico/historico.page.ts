import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../Service/api.service';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonSearchbar,
  IonIcon,
  IonList,
  IonItemGroup,
  IonItem,
  IonLabel,
  IonBadge,
  IonButtons,
  IonSpinner,
  IonBackButton
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-historico',
  templateUrl: './historico.page.html',
  styleUrls: ['./historico.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    CommonModule,
    FormsModule,
    IonSearchbar,
    IonIcon,
    IonList,
    IonItemGroup,
    IonItem,
    IonLabel,
    IonBadge,
    IonButtons,
    IonSpinner,
    IonBackButton
  ],
})
export class HistoricoPage implements OnInit {
  emprendedores: any[] = [];
  searchTerm: string = '';
  loading: boolean = true;

  constructor(
    private apiService: ApiService,
    private alertController: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarEmprendedores();
  }
  ionViewWillEnter() {
    this.cargarEmprendedores();
  }

  cargarEmprendedores() {
    this.apiService.getEmprendedores().subscribe({
      next: (data) => {
        this.emprendedores = Array.isArray(data) ? data : [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.mostrarAlerta('Error', 'No se pudieron cargar los emprendedores');
        this.loading = false;
      },
    });
  }

  async inactivarEmprendedor(id: number) {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Estás seguro de inactivar este emprendedor?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Inactivar',
          handler: () => {
            this.apiService.inactivarEmprendedor(id).subscribe({
              next: () => {
                this.cargarEmprendedores();
                this.mostrarAlerta(
                  'Éxito',
                  'Emprendedor inactivado correctamente'
                );
              },
              error: (error) => {
                this.mostrarAlerta(
                  'Error',
                  'No se pudo inactivar el emprendedor'
                );
              },
            });
          },
        },
      ],
    });

    await alert.present();
  }

  async activarEmprendedor(id: number) {
    this.apiService.activarEmprendedor(id).subscribe({
      next: () => {
        this.cargarEmprendedores();
        this.mostrarAlerta('Éxito', 'Emprendedor activado correctamente');
      },
      error: (error) => {
        this.mostrarAlerta('Error', 'No se pudo activar el emprendedor');
      },
    });
  }

  verDetalles(id: number) {
    this.router.navigate([`/detalle-emp/${id}`]);
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK'],
    });
    await alert.present();
  }

  // Filtra emprendedores basado en el término de búsqueda
  filtrarEmprendedores() {
    return this.emprendedores.filter(
      (emp) =>
        emp.nombre?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        emp.correo?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // Formatea fecha de inactivación
  formatearFecha(fecha: string): string {
    if (!fecha) return 'Activo';
    const date = new Date(fecha);
    return `Inactivo desde ${date.toLocaleDateString('es-ES')}`;
  }
}
