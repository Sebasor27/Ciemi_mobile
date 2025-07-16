import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AlertController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardTitle, 
  IonButton, 
  IonRadioGroup, 
  IonRadio, 
  IonItem, 
  IonLabel,
  IonSpinner,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonLoading
} from '@ionic/angular/standalone';

interface Pregunta {
  idPregunta: number;
  textoPregunta: string;
  idCompetencia: number;
}

interface Competencia {
  idCompetencia: number;
  nombreCompetencia: string;
}

interface GroupedQuestions {
  [key: number]: Pregunta[];
}

interface Answers {
  [key: number]: number;
}

@Component({
  selector: 'app-encuesta-ice',
  templateUrl: './encuesta-ice.page.html',
  styleUrls: ['./encuesta-ice.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonButton,
    IonRadioGroup,
    IonRadio,
    IonItem,
    IonLabel,
    IonSpinner,
    IonText,
    IonGrid,
    IonRow,
    IonCol,
    IonLoading
  ]
})
export class EncuestaICEPage implements OnInit {
  questions: Pregunta[] = [];
  competencias: Competencia[] = [];
  currentCompetenciaIndex = 0;
  groupedQuestions: GroupedQuestions = {};
  answers: Answers = {};
  loading = true;
  idEmprendedor: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.idEmprendedor = this.route.snapshot.paramMap.get('idEmprendedor');
    this.fetchQuestionsAndCompetencias();
  }

  ionViewWillEnter() {
    // Se ejecuta cada vez que la página está a punto de entrar
    this.scrollToTop();
  }

  ionViewDidEnter() {
    this.scrollToTop();
  }

  private scrollToTop() {
    const content = document.querySelector('ion-content');
    if (content) {
      content.scrollToTop(300);
    }
  }

  async fetchQuestionsAndCompetencias() {
    const loading = await this.loadingController.create({
      message: 'Cargando...',
    });
    await loading.present();

    try {
      const [preguntasResponse, competenciasResponse] = await Promise.all([
        this.http.get<Pregunta[]>('https://localhost:7075/api/PreguntasIce').toPromise(),
        this.http.get<Competencia[]>('https://localhost:7075/api/Competencia').toPromise()
      ]);

      const preguntasData = preguntasResponse || [];
      const competenciasData = competenciasResponse || [];

      const grouped = preguntasData.reduce((acc: GroupedQuestions, question) => {
        const compId = question.idCompetencia;
        if (!acc[compId]) acc[compId] = [];
        acc[compId].push(question);
        return acc;
      }, {});

      this.questions = preguntasData;
      this.groupedQuestions = grouped;
      this.competencias = competenciasData;
    } catch (error) {
      console.error('Error al obtener datos:', error);
      this.showAlert('Error', 'No se pudieron cargar los datos. Inténtalo de nuevo más tarde.');
    } finally {
      this.loading = false;
      await loading.dismiss();
    }
  }

  handleAnswer(questionId: number, value: number) {
    this.answers = { ...this.answers, [questionId]: value };
  }

  async handleNextCompetencia() {
    const currentCompetenciaId = this.competenciasIds[this.currentCompetenciaIndex];
    const currentQuestions = this.groupedQuestions[currentCompetenciaId] || [];

    const allAnswered = currentQuestions.every(
      q => this.answers[q.idPregunta] !== undefined
    );

    if (!allAnswered) {
      await this.showAlert('Advertencia', 'Responde todas las preguntas antes de continuar.');
      return;
    }

    if (this.currentCompetenciaIndex < this.competenciasIds.length - 1) {
      this.currentCompetenciaIndex++;
      this.scrollToTop();
    }
  }

  handlePreviousCompetencia() {
    if (this.currentCompetenciaIndex > 0) {
      this.currentCompetenciaIndex--;
      this.scrollToTop();
    }
  }

  async enviarRespuestas() {
    if (!this.idEmprendedor) {
      await this.showAlert('Error', 'El ID del emprendedor no es válido.');
      return;
    }

    const requestData = {
      emprendedorId: parseInt(this.idEmprendedor, 10),
      respuestas: Object.keys(this.answers).map(idPregunta => ({
        idEmprendedor: parseInt(this.idEmprendedor!, 10),
        valorRespuesta: this.answers[parseInt(idPregunta, 10)],
        idPregunta: parseInt(idPregunta, 10)
      }))
    };

    const loading = await this.loadingController.create({
      message: 'Enviando respuestas...',
    });
    await loading.present();

    try {
      await this.http.post(
        'https://localhost:7075/api/EncuestasIce/procesar-encuesta',
        requestData
      ).toPromise();

      await this.showAlert('Éxito', 'Encuesta finalizada correctamente.');
      this.router.navigate(['/ventanaencuestas']);
    } catch (error) {
      console.error('Error al enviar las respuestas:', error);
      await this.showAlert('Error', 'Hubo un error al finalizar la encuesta. Inténtalo de nuevo.');
    } finally {
      await loading.dismiss();
    }
  }

  async handleFinalizarEncuesta() {
    const allQuestionsAnswered = this.competenciasIds.every(compId => {
      const questions = this.groupedQuestions[compId] || [];
      return questions.every(q => this.answers[q.idPregunta] !== undefined);
    });

    if (!allQuestionsAnswered) {
      await this.showAlert('Advertencia', 'Por favor, responde todas las preguntas antes de finalizar la encuesta.');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Estás seguro de que deseas finalizar la encuesta?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Confirmar',
          handler: () => {
            this.enviarRespuestas();
          },
        },
      ],
    });

    await alert.present();
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });

    await alert.present();
  }

  get competenciasIds(): number[] {
    return Object.keys(this.groupedQuestions)
      .map(id => parseInt(id, 10))
      .sort((a, b) => a - b);
  }

  get currentCompetenciaId(): number {
    return this.competenciasIds[this.currentCompetenciaIndex];
  }

  get currentQuestions(): Pregunta[] {
    return this.groupedQuestions[this.currentCompetenciaId] || [];
  }

  get isLastCompetencia(): boolean {
    return this.currentCompetenciaIndex === this.competenciasIds.length - 1;
  }

  get isFirstCompetencia(): boolean {
    return this.currentCompetenciaIndex === 0;
  }

  get currentCompetencia(): Competencia | undefined {
    return this.competencias.find(
      c => c.idCompetencia === this.currentCompetenciaId
    );
  }

  getScale(competenciaId: number): number[] {
    if (competenciaId >= 1 && competenciaId <= 6) {
      return [1, 2, 3, 4, 5];
    } else if (competenciaId >= 7 && competenciaId <= 10) {
      return [1, 3, 5];
    }
    return [];
  }

  getScaleLabel(competenciaId: number, value: number): string {
    if (competenciaId <= 6) {
      switch (value) {
        case 1: return 'Nunca';
        case 2: return 'A veces';
        case 3: return 'Muchas veces';
        case 4: return 'Casi siempre';
        case 5: return 'Siempre';
        default: return '';
      }
    } else {
      switch (value) {
        case 1: return 'No';
        case 3: return 'Medianamente';
        case 5: return 'Sí';
        default: return '';
      }
    }
  }

  getScaleInstructions(competenciaId: number): string {
    if (competenciaId <= 6) {
      return 'Escala: 5: Siempre; 4: Casi siempre; 3: Muchas veces; 2: A veces; 1: Nunca.';
    } else {
      return 'Escala: 5: Sí; 3: Medianamente; 1: No.';
    }
  }
}