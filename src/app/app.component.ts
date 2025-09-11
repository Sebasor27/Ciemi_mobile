import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  timeOutline, 
  documentTextOutline, 
  addCircleOutline, 
  add, 
  eye, 
  power, 
  refresh,
  // Iconos adicionales que podrías necesitar
  homeOutline,
  personOutline,
  settingsOutline,
  logOutOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  informationCircleOutline,
  printOutline,
  chatbubbleOutline,
  print,
  refreshOutline,
  bugOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  
  constructor() {
    this.initializeIcons();
  }

  ngOnInit() {
    // Aquí puedes agregar inicializaciones adicionales si es necesario
    console.log('App inicializada correctamente');
  }

  /**
   * Inicializar todos los iconos de la aplicación
   */
  private initializeIcons(): void {
    addIcons({
      // Iconos principales que ya tienes
      'time-outline': timeOutline,
      'document-text-outline': documentTextOutline,
      'add-circle-outline': addCircleOutline,
      'add': add,
      'eye': eye,
      'power': power,
      'refresh': refresh,
      
      // Iconos adicionales comunes (opcional)
      'home-outline': homeOutline,
      'person-outline': personOutline,
      'settings-outline': settingsOutline,
      'log-out-outline': logOutOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'alert-circle-outline': alertCircleOutline,
      'information-circle-outline': informationCircleOutline,
      'print-outline': printOutline,
      'chatbubble-outline': chatbubbleOutline,
      'print': print,
      'refresh-outline': refreshOutline,
      'bug-outline': bugOutline
    });
  }
}