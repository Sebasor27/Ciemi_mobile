import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EncuestaIepmService } from '../../Service/encuesta-iepm.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButton,
  IonIcon,
  IonLabel,
  IonText,
  IonItem, IonList, IonRadio, IonSpinner

} from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-encuesta-iepm',
  templateUrl: './encuesta-iepm.page.html',
  styleUrls: ['./encuesta-iepm.page.scss'],
  standalone: true,
imports: [
  IonicModule,
  CommonModule,
  FormsModule
],
})
export class EncuestaIepmPage implements OnInit {
idEmprendedor: string | null = null;
  questions: any[] = [];
  groupedQuestions: any = {};
  currentDestinatario: string = '';
  answers: { [key: number]: any } = {};
  comments: { [key: number]: string } = {};
  isLoading = true;
  isSubmitting = false;
  submitSuccess = false;
  error: string | null = null;
  showUnansweredAlert = false;
  destinatarios: string[]=[];

  constructor(
    private route: ActivatedRoute,
    private encuestaService: EncuestaIepmService,
    private router: Router
  ) {}

  ngOnInit() {
    this.idEmprendedor = this.route.snapshot.paramMap.get('id');
  console.log('ID del emprendedor recibido:', this.idEmprendedor);

  if (!this.idEmprendedor) {
    this.error = 'No se ha proporcionado un ID de emprendedor válido';
    return;
  }

  this.cargarPreguntas();
}

  cargarPreguntas() {
    this.isLoading = true;
    this.encuestaService.obtenerPreguntas().subscribe({
      next: (data) => {
        this.questions = data;
        this.groupQuestions();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al obtener preguntas';
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  groupQuestions() {
    this.groupedQuestions = this.questions.reduce((acc: any, pregunta: any) => {
      const dest = pregunta.destinatario;
      acc[dest] = acc[dest] || [];
      acc[dest].push(pregunta);
      return acc;
    }, {});
  this.destinatarios = Object.keys(this.groupedQuestions);
    this.currentDestinatario = Object.keys(this.groupedQuestions)[0];
  }

  handleAnswerChange(idPregunta: number, valor: any) {
    this.answers[idPregunta] = valor;
    this.showUnansweredAlert = false;
  }

  handleCommentChange(idPregunta: number, comentario: string) {
    this.comments[idPregunta] = comentario;
  }

  checkAllAnswered(): boolean {
    const preguntasActuales = this.groupedQuestions[this.currentDestinatario];
    return preguntasActuales.every((q: any) => this.answers[q.idPregunta] !== undefined);
  }

  async enviarRespuestas() {
    this.isSubmitting = true;
    const payload = Object.entries(this.answers).map(([id, valor]) => ({
      idPregunta: +id,
      valor,
      comentarios: this.comments[+id] || null,
      idEmprendedor: this.idEmprendedor
    }));

    this.encuestaService.enviarRespuestas(payload).subscribe({
      next: () => {
        this.submitSuccess = true;
      },
      error: (err) => {
        console.error('Error al enviar respuestas', err);
        this.error = 'Error al enviar respuestas';
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  siguiente() {
    if (!this.checkAllAnswered()) {
      this.showUnansweredAlert = true;
      return;
    }

    const destinatarios = Object.keys(this.groupedQuestions);
    const index = destinatarios.indexOf(this.currentDestinatario);
    if (index < destinatarios.length - 1) {
      this.currentDestinatario = destinatarios[index + 1];
    } else {
      this.enviarRespuestas();
    }
  }

  anterior() {
    const destinatarios = Object.keys(this.groupedQuestions);
    const index = destinatarios.indexOf(this.currentDestinatario);
    if (index > 0) {
      this.currentDestinatario = destinatarios[index - 1];
    }
  }

  volver() {
    this.router.navigate(['/ventanaencuestas', this.idEmprendedor]);
  }
  
}
