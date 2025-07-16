import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { timeOutline, documentTextOutline, addCircleOutline, add, eye, power, refresh } from 'ionicons/icons';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    addIcons({
      'time-outline': timeOutline,
      'document-text-outline': documentTextOutline,
      'add-circle-outline': addCircleOutline,
      'add': add,
      'eye': eye,
      'power': power,
      'refresh': refresh
    });
  }
  
}
