import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonRouterLink,
  IonButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shieldOutline } from 'ionicons/icons';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonIcon,
    IonRouterLink,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
  ],
})
export class HomePage {
  constructor(private router: Router) {
    // Registrar el icono del escudo
    addIcons({
      'shield-outline': shieldOutline
    });
  }
  
  logout() {
    localStorage.removeItem('token'); // elimina token
     this.router.navigate(['/login'], {
    replaceUrl: true,         // reemplaza la página actual
    skipLocationChange: true, // evita efecto de historial
  });
}
}