import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons } from '@ionic/angular/standalone';

@Component({
  selector: 'app-reporteria',
  templateUrl: './reporteria.page.html',
  styleUrls: ['./reporteria.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar,IonBackButton, CommonModule, FormsModule, IonButtons]
})
export class ReporteriaPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
