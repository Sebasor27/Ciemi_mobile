import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButton,
  IonButtons,
  IonBackButton,
  IonLabel,
  IonText,
  IonItem, 
  IonList, 
  IonSpinner,
  AlertController
} from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { EncuestaIceService } from '../../services/encuestas-ice.service';

@Component({
  selector: 'app-encuesta-ice',
  templateUrl: './encuesta-ice.page.html',
  styleUrls: ['./encuesta-ice.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule
  ],
})
export class EncuestaIcePage implements OnInit {
  idEmprendedor: string | null = null;
  questions: any[] = [];
  competencias: any[] = [];
  currentCompetenciaIndex: number = 0;
  groupedQuestions: any = {};
  answers: { [key: number]: number } = {};
  loading: boolean = true;
  error: string | null = null;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private encuestaService: EncuestaIceService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.idEmprendedor = this.route.snapshot.paramMap.get('id');
    console.log('ID del emprendedor recibido:', this.idEmprendedor);

    if (!this.idEmprendedor) {
      this.error = 'No se ha proporcionado un ID de emprendedor válido';
      this.loading = false;
      return;
    }

    this.fetchQuestionsAndCompetencias();
  }

  async fetchQuestionsAndCompetencias() {
    this.loading = true;
    this.error = null;

    try {
      const [preguntasData, competenciasData] = await Promise.all([
        this.encuestaService.obtenerPreguntas().toPromise(),
        this.encuestaService.obtenerCompetencias().toPromise()
      ]);

      this.questions = preguntasData || [];
      this.competencias = competenciasData || [];

      console.log('Preguntas cargadas:', this.questions);
      console.log('Competencias cargadas:', this.competencias);

      // Agrupar preguntas por competencia
      this.groupedQuestions = this.questions.reduce((acc: any, question: any) => {
        const compId = question.idCompetencia;
        if (!acc[compId]) acc[compId] = [];
        acc[compId].push(question);
        return acc;
      }, {});

      console.log('Preguntas agrupadas:', this.groupedQuestions);

      // Verificar que tenemos datos válidos
      if (this.competenciasIds.length === 0) {
        throw new Error('No se encontraron competencias válidas');
      }

      this.loading = false;
    } catch (error) {
      console.error('Error al obtener datos:', error);
      this.error = 'No se pudieron cargar los datos. Inténtalo de nuevo más tarde.';
      this.loading = false;
    }
  }

  handleAnswer(questionId: number, value: number) {
    this.answers[questionId] = value;
    console.log('Respuesta registrada:', questionId, value);
  }

  async handleNextCompetencia() {
    const currentCompetenciaId = this.competenciasIds[this.currentCompetenciaIndex];
    const currentQuestions = this.groupedQuestions[currentCompetenciaId] || [];

    const allAnswered = currentQuestions.every(
      (q: any) => this.answers[q.idPregunta] !== undefined
    );

    if (!allAnswered) {
      const alert = await this.alertController.create({
        header: 'Atención',
        message: 'Responde todas las preguntas antes de continuar.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    if (this.currentCompetenciaIndex < this.competenciasIds.length - 1) {
      this.currentCompetenciaIndex++;
      console.log('Navegando a competencia:', this.currentCompetenciaIndex);
      
      // Scroll to top
      const content = document.querySelector('ion-content');
      if (content) {
        content.scrollToTop(300);
      }
    }
  }

  handlePreviousCompetencia() {
    if (this.currentCompetenciaIndex > 0) {
      this.currentCompetenciaIndex--;
      console.log('Navegando a competencia anterior:', this.currentCompetenciaIndex);
      
      // Scroll to top
      const content = document.querySelector('ion-content');
      if (content) {
        content.scrollToTop(300);
      }
    }
  }

  async enviarRespuestas() {
    if (!this.idEmprendedor) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'El ID del emprendedor no es válido.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const requestData = {
      emprendedorId: parseInt(this.idEmprendedor, 10),
      respuestas: Object.keys(this.answers).map(idPregunta => ({
        idEmprendedor: parseInt(this.idEmprendedor!, 10),
        valorRespuesta: this.answers[parseInt(idPregunta)],
        idPregunta: parseInt(idPregunta, 10)
      }))
    };

    try {
      await this.encuestaService.enviarRespuestas(requestData).toPromise();
      
      const alert = await this.alertController.create({
        header: 'Éxito',
        message: 'Encuesta finalizada correctamente.',
        buttons: [{
          text: 'OK',
          handler: () => {
           this.router.navigate(['/ventana-encuestas', this.idEmprendedor]);
          }
        }]
      });
      await alert.present();
    } catch (error) {
      console.error('Error al enviar las respuestas:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Hubo un error al finalizar la encuesta. Inténtalo de nuevo.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  async handleFinalizarEncuesta() {
    const allQuestionsAnswered = this.competenciasIds.every(compId => {
      const questions = this.groupedQuestions[compId] || [];
      return questions.every((q: any) => this.answers[q.idPregunta] !== undefined);
    });

    if (!allQuestionsAnswered) {
      const alert = await this.alertController.create({
        header: 'Atención',
        message: 'Por favor, responde todas las preguntas antes de finalizar la encuesta.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const confirmAlert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Estás seguro de que deseas finalizar la encuesta?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Finalizar',
          handler: () => {
            this.enviarRespuestas();
          }
        }
      ]
    });
    await confirmAlert.present();
  }

  get competenciasIds(): string[] {
    if (!this.groupedQuestions || Object.keys(this.groupedQuestions).length === 0) {
      return [];
    }
    return Object.keys(this.groupedQuestions).sort((a, b) => parseInt(a) - parseInt(b));
  }

  get currentCompetenciaId(): string {
    const ids = this.competenciasIds;
    if (ids.length === 0 || this.currentCompetenciaIndex >= ids.length) {
      return '';
    }
    return ids[this.currentCompetenciaIndex];
  }

  get currentQuestions(): any[] {
    if (!this.currentCompetenciaId) {
      return [];
    }
    return this.groupedQuestions[this.currentCompetenciaId] || [];
  }

  get isLastCompetencia(): boolean {
    return this.currentCompetenciaIndex === this.competenciasIds.length - 1;
  }

  get isFirstCompetencia(): boolean {
    return this.currentCompetenciaIndex === 0;
  }

  get currentCompetencia(): any {
    if (!this.currentCompetenciaId || this.competencias.length === 0) {
      return null;
    }
    return this.competencias.find(
      c => c.idCompetencia === parseInt(this.currentCompetenciaId, 10)
    );
  }

  getScale(competenciaId: string): number[] {
    if (!competenciaId) return [];
    
    const id = parseInt(competenciaId, 10);
    if (id >= 1 && id <= 6) {
      return [1, 2, 3, 4, 5]; // Escala de 1 a 5
    } else if (id >= 7 && id <= 10) {
      return [1, 3, 5]; // Escala de 1, 3, 5
    }
    return [];
  }

  getScaleLabel(num: number): string {
    if (!this.currentCompetenciaId) return '';
    
    const id = parseInt(this.currentCompetenciaId, 10);
    if (id <= 6) {
      switch (num) {
        case 1: return "Nunca";
        case 2: return "A veces";
        case 3: return "Muchas veces";
        case 4: return "Casi siempre";
        case 5: return "Siempre";
        default: return "";
      }
    } else {
      switch (num) {
        case 1: return "No";
        case 3: return "Medianamente";
        case 5: return "Sí";
        default: return "";
      }
    }
  }

  getScaleInstructions(): string {
    if (!this.currentCompetenciaId) return '';
    
    const id = parseInt(this.currentCompetenciaId, 10);
    if (id <= 6) {
      return "Escala: 5: Siempre; 4: Casi siempre; 3: Muchas veces; 2: A veces; 1: Nunca.";
    } else {
      return "Escala: 5: Sí; 3: Medianamente; 1: No.";
    }
  }

  // Método para verificar si los datos están listos
  get isDataReady(): boolean {
    return !this.loading && !this.error && this.competenciasIds.length > 0;
  }
}