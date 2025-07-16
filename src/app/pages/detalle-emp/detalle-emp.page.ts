import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../Service/api.service';
import { AlertController } from '@ionic/angular';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonButtons,
  IonSpinner,
  IonBackButton,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonSelectOption,
  IonCardContent,
  IonCardTitle,
  IonCard,
  IonCardHeader,
  IonInput,
  IonSelect,
  IonToggle,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { list, create, close, save, warning } from 'ionicons/icons';

interface Emprendedor {
  idEmprendedor: number;
  nombre: string;
  edad: string;
  nivelEstudio: string;
  trabajoRelacionDependencia: boolean;
  sueldoMensual: string;
  ruc: string;
  empleadosHombres: number;
  empleadosMujeres: number;
  rangoEdadEmpleados: string;
  tipoEmpresa: string;
  anoCreacionEmpresa: number;
  direccion: string;
  telefono: string;
  celular: string;
  correo: string;
  cedula: string;
  datosEmps: any[];
}

@Component({
  selector: 'app-detalle-emp',
  templateUrl: './detalle-emp.page.html',
  styleUrls: ['./detalle-emp.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    CommonModule,
    FormsModule,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonButtons,
    IonSpinner,
    IonBackButton,
    IonGrid,
    IonRow,
    IonCol,
    IonInput,
    IonSelect,
    IonToggle,
    IonText,
    IonSelectOption,
    IonCardContent,
    IonCardTitle,
    IonCard,
    IonCardHeader,
  ],
})
export class DetalleEmpPage implements OnInit {
  emprendedor: Emprendedor | null = null;
  loading = true;
  error: any = null;
  isEditing = false;
  editedEmprendedor: Partial<Emprendedor> = {};

  // Opciones para selects
  opcionesRangoEdad = ['18-25', '26-35', '36-45', '46-59', '60+'];
  opcionesRangoSueldo = ['0-460', '460-750', '750-1000', '1000+'];
  opcionesNivelEstudio = [
    'Primaria',
    'Secundaria',
    'Bachillerato',
    'Licenciatura',
    'Técnico',
    'Tecnológico',
    'Superior',
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
    'Unipersonal',
    'Sociedad',
    'Cooperativa',
    'Asociación',
    'Fundación',
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private alertController: AlertController
  ) {
    addIcons({
      list,
      create,
      close,
      save,
      warning,
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEmprendedor(parseInt(id));
    } else {
      this.error = new Error('ID no definido');
      this.loading = false;
    }
  }

  async loadEmprendedor(id: number) {
    try {
      const data = (await this.apiService
        .getEmprendedor(id)
        .toPromise()) as Emprendedor;
      this.emprendedor = data;
      this.editedEmprendedor = JSON.parse(JSON.stringify(data));
    } catch (error) {
      console.error('Error al obtener los datos:', error);
      this.error = error;
      await this.showAlert('Error', 'No se pudo cargar el emprendedor');
    } finally {
      this.loading = false;
    }
  }

  // Agrega un método para resetear los cambios si cancela la edición
  cancelEdit() {
    if (this.emprendedor) {
      this.editedEmprendedor = JSON.parse(JSON.stringify(this.emprendedor));
    }
    this.isEditing = false;
  }

  // Modifica el toggleEdit para manejar mejor el estado
  toggleEdit() {
    if (!this.isEditing) {
      if (this.emprendedor) {
        this.editedEmprendedor = JSON.parse(JSON.stringify(this.emprendedor));
      }
    } else {
      // Al cancelar edición, resetea los cambios
      this.cancelEdit();
    }
    this.isEditing = !this.isEditing;
  }

  async saveChanges() {
    if (!this.emprendedor) return;

    try {
      await this.apiService
        .updateEmprendedor(
          this.emprendedor.idEmprendedor,
          this.editedEmprendedor
        )
        .toPromise();

      this.emprendedor = { ...this.emprendedor, ...this.editedEmprendedor };
      this.isEditing = false;
      await this.showAlert('Éxito', 'Cambios guardados correctamente');
    } catch (error) {
      console.error('Error al actualizar:', error);
      await this.showAlert('Error', 'No se pudieron guardar los cambios');
    }
  }

  handleInputChange(event: any, field: keyof Emprendedor) {
    if (!this.editedEmprendedor) return;

    const value = event.detail?.value ?? event.target?.value;
    const checked = event.detail?.checked ?? event.target?.checked;

    if (event.target?.type === 'checkbox') {
      (this.editedEmprendedor as any)[field] = checked;
    } else {
      (this.editedEmprendedor as any)[field] = value;
    }
  }
  navigateToEncuestas() {
    if (this.emprendedor) {
      this.router.navigate([
        `/ventana-encuestas/${this.emprendedor.idEmprendedor}`,
      ]);
    }
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
