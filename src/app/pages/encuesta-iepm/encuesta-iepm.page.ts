import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { EncuestaIepmService } from '../../Service/encuesta-iepm.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-encuesta-iepm',
  templateUrl: './encuesta-iepm.page.html',
  styleUrls: ['./encuesta-iepm.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    IonicModule
  ]
})
export class EncuestaIepmPage implements OnInit {
  idEmprendedor: string = '';
  questions: any[] = [];
  groupedQuestions: { [key: string]: any[] } = {};
  currentDestinatario: string = '';
  answers: { [key: number]: number } = {};
  comments: { [key: number]: string } = {};
  isLoading: boolean = true;
  error: string | null = null;
  isSubmitting: boolean = false;
  submitSuccess: boolean = false;
  showUnansweredAlert: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private encuestaService: EncuestaIepmService, // Corregido el nombre de la variable
    private alertController: AlertController
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('idEmprendedor');
    if (id) {
      this.idEmprendedor = id;
    } else {
      this.error = "No se ha proporcionado un ID de emprendedor válido";
      this.isLoading = false;
      return;
    }
    this.fetchQuestions();
  }

  async fetchQuestions() {
    this.isLoading = true;
    this.error = null;
    try {
this.questions = (await this.encuestaService.getPreguntasDetalladas().toPromise())!;      this.groupQuestions();
    } catch (error) {
      console.error("Error al obtener preguntas:", error);
      this.error = "Error al obtener las preguntas";
    } finally {
      this.isLoading = false;
    }
  }

  groupQuestions() {
    const grouped = this.questions.reduce((acc, question) => {
      if (!acc[question.destinatario]) {
        acc[question.destinatario] = [];
      }
      acc[question.destinatario].push(question);
      return acc;
    }, {});

    this.groupedQuestions = grouped;
    this.currentDestinatario = Object.keys(grouped)[0];
  }

  handleAnswerChange(questionId: number, value: number) {
    this.answers[questionId] = value;
    if (this.showUnansweredAlert) {
      this.showUnansweredAlert = false;
    }
  }

  handleCommentChange(questionId: number, comment: string) {
    this.comments[questionId] = comment;
  }

  preparePayload() {
    if (!this.idEmprendedor) {
      throw new Error("idEmprendedor es requerido");
    }

    return Object.entries(this.answers).map(([idPregunta, valor]) => ({
      idPregunta: parseInt(idPregunta),
      valor: valor,
      comentarios: this.comments[parseInt(idPregunta)] || null,
      idEmprendedor: parseInt(this.idEmprendedor, 10)
    }));
  }

   async submitAnswers() {
    this.isSubmitting = true;
    this.error = null;
    
    try {
      if (!this.idEmprendedor) {
        throw new Error("No se ha proporcionado un ID de emprendedor válido");
      }

      const payload = this.preparePayload();
      console.log("Enviando payload:", payload);

      await this.encuestaService.enviarRespuestas(payload).toPromise();

      this.submitSuccess = true;
    } catch (error) {
      console.error("Error al enviar respuestas:", error);
      this.error = "Error al enviar las respuestas";
    } finally {
      this.isSubmitting = false;
    }
  }

  checkAllQuestionsAnswered(): boolean {
    if (!this.currentDestinatario || !this.groupedQuestions[this.currentDestinatario]) return false;
    
    const currentQuestions = this.groupedQuestions[this.currentDestinatario];
    return currentQuestions.every(q => this.answers[q.idPregunta] !== undefined);
  }

  async handleNextDestinatario() {
    const allAnswered = this.checkAllQuestionsAnswered();
    
    if (!allAnswered) {
      this.showUnansweredAlert = true;
      return;
    }

    const destinatarios = Object.keys(this.groupedQuestions);
    const currentIndex = destinatarios.indexOf(this.currentDestinatario);
    
    if (currentIndex < destinatarios.length - 1) {
      this.currentDestinatario = destinatarios[currentIndex + 1];
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.handleSubmit();
    }
  }

  async handleSubmit() {
    const allAnswered = this.checkAllQuestionsAnswered();
    
    if (!allAnswered) {
      this.showUnansweredAlert = true;
      return;
    }
    
    try {
      await this.submitAnswers();
    } catch (error) {
      // El error ya está manejado en submitAnswers
    }
  }

  handleReturnToSurveys() {
    this.router.navigate(["/ventanaencuestas"]);
  }

  async presentUnansweredAlert() {
    const alert = await this.alertController.create({
      header: 'Preguntas sin responder',
      message: 'Por favor responda todas las preguntas de esta sección antes de continuar.',
      buttons: ['Entendido']
    });

    await alert.present();
  }
}