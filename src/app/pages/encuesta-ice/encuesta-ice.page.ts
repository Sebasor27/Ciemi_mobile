import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-encuesta-ice',
  templateUrl: './encuesta-ice.page.html',
  styleUrls: ['./encuesta-ice.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class EncuestaICEPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
