import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-encuesta-iepm',
  templateUrl: './encuesta-iepm.page.html',
  styleUrls: ['./encuesta-iepm.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class EncuestaIEPMPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
