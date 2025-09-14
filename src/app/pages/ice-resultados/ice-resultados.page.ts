import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ResultadosService } from '../../services/resultados.service';

interface Resultado {
  idCompetencia: number;
  puntuacionCompetencia: number;
  nombre: string;
  color: string;
  nivel: string;
}

interface Emprendedor {
  idEmprendedor: number;
  nombre: string;
}

@Component({
  selector: 'app-ice-resultados',
  templateUrl: './ice-resultados.page.html',
  styleUrls: ['./ice-resultados.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class IceResultadosPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  idEmprendedor: string | null = null;
  idEncuesta: string | null = null;
  emprendedor: Emprendedor | null = null;
  resultados: Resultado[] = [];
  valorIceTotal = 0;

  isLoading = true;
  error: string | null = null;

  readonly competenciasNombres = [
    'Comportamiento Emprendedor', 'Creatividad', 'Liderazgo',
    'Personalidad Proactiva', 'Tolerancia a la incertidumbre',
    'Trabajo en Equipo', 'Pensamiento Estratégico', 'Proyección Social',
    'Orientación Financiera', 'Orientación Tecnológica e innovación'
  ];

  readonly colors = [
    '#e91e63', '#9c27b0', '#3f51b5', '#2196f3', '#00bcd4',
    '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastController: ToastController,
    private resultadosService: ResultadosService
  ) {}

  ngOnInit(): void {
    this.idEmprendedor = this.route.snapshot.paramMap.get('id');
    this.idEncuesta = this.route.snapshot.paramMap.get('idEncuesta');

    if (!this.idEmprendedor || !this.idEncuesta) {
      this.handleError('Parámetros faltantes');
      return;
    }

    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadData(): Promise<void> {
    try {
      await Promise.all([
        this.fetchEmprendedor(),
        this.fetchResultados()
      ]);
    } catch (error) {
      this.handleError('Error al cargar datos');
    } finally {
      this.isLoading = false;
    }
  }

  private async fetchEmprendedor(): Promise<void> {
    try {
      this.emprendedor = await firstValueFrom(
        this.resultadosService.getEmprendedor(Number(this.idEmprendedor))
          .pipe(takeUntil(this.destroy$))
      );
    } catch (error) {
      throw new Error('Error al cargar emprendedor');
    }
  }

  private async fetchResultados(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.resultadosService.getResultadosResumen(
          Number(this.idEmprendedor), 
          Number(this.idEncuesta)
        ).pipe(takeUntil(this.destroy$))
      );

      this.resultados = this.transformData(data.resultados || []);
      this.valorIceTotal = data.resumen?.valorIceTotal || 0;
    } catch (error) {
      throw new Error('Error al cargar resultados');
    }
  }

  private transformData(resultados: any[]): Resultado[] {
    return resultados.map((resultado, index) => {
      const idCompetencia = resultado.idCompetencia;
      let nombreCompetencia: string;
      
      // Mapear IDs correctamente
      if (idCompetencia >= 1 && idCompetencia <= 10) {
        // IDs normales 1-10
        nombreCompetencia = this.competenciasNombres[idCompetencia - 1];
      } else if (idCompetencia >= 1001) {
        // IDs como 1001, 1002, 1003... mapear a posiciones del array
        const indice = ((idCompetencia - 1001) % this.competenciasNombres.length);
        nombreCompetencia = this.competenciasNombres[indice];
      } else {
        // Fallback: usar nombre del resultado o generar uno
        nombreCompetencia = resultado.nombre || `Competencia ${idCompetencia}`;
      }
      
      return {
        idCompetencia: idCompetencia,
        puntuacionCompetencia: Number(resultado.puntuacionCompetencia) || 0,
        nombre: nombreCompetencia,
        color: resultado.color || this.colors[index % this.colors.length],
        nivel: this.getNivelCompetencia(Number(resultado.puntuacionCompetencia) || 0)
      };
    });
  }

  private getNivelCompetencia(puntuacion: number): string {
    if (puntuacion < 0.6) return 'Bajo';
    if (puntuacion < 0.8) return 'Medio';
    return 'Alto';
  }

  calcularIceGeneral(): number {
    return this.valorIceTotal;
  }

  getProgressColor(nivel: string): string {
    switch (nivel) {
      case 'Alto': return 'success';
      case 'Medio': return 'warning';
      case 'Bajo': return 'danger';
      default: return 'medium';
    }
  }

  // Track function for ngFor
  trackByCompetencia(index: number, resultado: Resultado): number {
    return resultado.idCompetencia;
  }

  // Getters para las estadísticas
  get nivelAltoCount(): number {
    return this.resultados.filter(r => r.nivel === 'Alto').length;
  }

  get nivelMedioCount(): number {
    return this.resultados.filter(r => r.nivel === 'Medio').length;
  }

  get nivelBajoCount(): number {
    return this.resultados.filter(r => r.nivel === 'Bajo').length;
  }

  navigateBack(): void {
    this.router.navigate(['/home']);
  }

  navegarAResultados(): void {
    this.router.navigate(['informacion-resultados', this.idEmprendedor]);
  }

  async imprimir(): Promise<void> {
    try {
      window.print();
    } catch (error) {
      await this.showToast('Error al imprimir', 'danger');
    }
  }

  private async handleError(message: string): Promise<void> {
    this.error = message;
    this.isLoading = false;
    await this.showToast(message, 'danger');
  }

  private async showToast(message: string, color: 'success' | 'danger' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}