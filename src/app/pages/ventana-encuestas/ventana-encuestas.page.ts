import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButton,
  IonCard,
  IonIcon,
  IonModal,
  IonButtons,
  IonAvatar,
  IonBackButton,
  IonCardContent
} from '@ionic/angular/standalone';
import { Router, ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons'
import { 
  documentTextOutline, 
  clipboardOutline, 
  checkmarkCircleOutline, 
  arrowBackOutline,
  timeOutline,
  playOutline,
  informationCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-ventana-encuestas',
  templateUrl: './ventana-encuestas.page.html',
  styleUrls: ['./ventana-encuestas.page.scss'],
  imports: [
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    CommonModule, 
    FormsModule,
    IonButton,
    IonCard,
    IonIcon,
    IonModal,
    IonButtons,
    IonAvatar,
    IonIcon,
    IonBackButton,
    IonCardContent
  ]
})
export class VentanaEncuestasPage implements OnInit {
  
  showModal = false;
  selectedSurvey: string | null = null;
  idEmprendedor: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    addIcons({
      documentTextOutline,
      clipboardOutline,
      checkmarkCircleOutline,
      arrowBackOutline,
      timeOutline,
      playOutline,
      informationCircleOutline
    });
  }

  ngOnInit() {
    this.idEmprendedor = this.route.snapshot.paramMap.get('id');
    console.log('ID del emprendedor obtenido:', this.idEmprendedor);
    
    if (!this.idEmprendedor) {
      console.error('No se pudo obtener el ID del emprendedor');
      this.router.navigate(['/home']);
    }
  }

  handleSurveySelection(surveyType: string) {
    console.log('Encuesta seleccionada:', surveyType);
    this.selectedSurvey = surveyType;
    this.showModal = true;
    console.log('Modal abierto, selectedSurvey:', this.selectedSurvey);
  }

  proceedToSurvey() {
    console.log('=== INICIO proceedToSurvey ===');
    console.log('ID Emprendedor:', this.idEmprendedor);
    console.log('Encuesta seleccionada:', this.selectedSurvey);
    
    // Verificar que tenemos un ID válido y una encuesta seleccionada
    if (!this.idEmprendedor || !this.selectedSurvey) {
      console.error('ID del emprendedor o encuesta no válidos');
      this.closeModal();
      return;
    }

    // Primero cerrar el modal
    this.showModal = false;
    console.log('Modal cerrado');
    
    // Usar setTimeout para asegurar que el modal se cierre antes de navegar
    setTimeout(() => {
      try {
        if (this.selectedSurvey === 'ice') {
          console.log('Navegando a encuesta ICE...');
          const route = `/encuesta-ice/${this.idEmprendedor}`;
          console.log('Ruta a navegar:', route);
          this.router.navigate(['/encuesta-ice', this.idEmprendedor])
            .then((success: boolean) => {
              console.log('Navegación exitosa:', success);
            })
            .catch((error: any) => {
              console.error('Error en navegación:', error);
            });
        } else if (this.selectedSurvey === 'iepm') {
          console.log('Navegando a encuesta IEPM...');
          const route = `/encuesta-iepm/${this.idEmprendedor}`;
          console.log('Ruta a navegar:', route);
          this.router.navigate(['/encuesta-iepm', this.idEmprendedor])
            .then((success: boolean) => {
              console.log('Navegación exitosa:', success);
            })
            .catch((error: any) => {
              console.error('Error en navegación:', error);
            });
        }
        
        // Limpiar la selección después de navegar
        this.selectedSurvey = null;
        console.log('=== FIN proceedToSurvey ===');
      } catch (error) {
        console.error('Error en proceedToSurvey:', error);
      }
    }, 100);
  }

  async goToResults() {
    // Navegar directamente a los resultados
    this.router.navigate([`/resultados/${this.idEmprendedor}`]);
  }

  // Método para regresar a la página de detalles del emprendedor
  goToDetails() {
    if (this.idEmprendedor) {
      this.router.navigate(['/detalle-emp', this.idEmprendedor]);
    } else {
      console.error('No se puede navegar a detalles: ID del emprendedor no disponible');
      this.router.navigate(['/historico']);
    }
  }

  goBack() {
    this.router.navigate(['/historico']);
  }

  closeModal() {
    console.log('Cerrando modal - cancelado por usuario');
    // Solo cerrar el modal y limpiar la selección
    // NO navegar a ningún lado, quedarse en la página actual
    this.showModal = false;
    this.selectedSurvey = null;
  }

  // Método adicional para manejar el evento de cierre del modal
  onModalDidDismiss() {
    console.log('Modal cerrado por evento didDismiss');
    // Solo cerrar el modal y limpiar la selección
    // NO navegar a ningún lado, quedarse en la página actual
    this.showModal = false;
    this.selectedSurvey = null;
  }
}