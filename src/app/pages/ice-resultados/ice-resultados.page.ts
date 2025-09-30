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
  descripcion: string;
  color: string;
  nivel: string;
}

interface Emprendedor {
  idEmprendedor: number;
  nombre: string;
  email?: string;
}

interface CompetenciaInfo {
  id: number;
  nombre: string;
  descripcion: string;
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

  // 10 Competencias ICE - EXACTAMENTE 10 COMPETENCIAS
  private readonly competenciasInfo: CompetenciaInfo[] = [
    { id: 1, nombre: 'Comportamiento Emprendedor', descripcion: 'Iniciativa y actitud emprendedora' },
    { id: 2, nombre: 'Creatividad', descripcion: 'Capacidad de generar ideas innovadoras' },
    { id: 3, nombre: 'Liderazgo', descripcion: 'Habilidad para dirigir y motivar equipos' },
    { id: 4, nombre: 'Personalidad Proactiva', descripcion: 'Anticipación y acción preventiva' },
    { id: 5, nombre: 'Tolerancia a la Incertidumbre', descripcion: 'Manejo de situaciones ambiguas' },
    { id: 6, nombre: 'Trabajo en Equipo', descripcion: 'Colaboración y comunicación efectiva' },
    { id: 7, nombre: 'Pensamiento Estratégico', descripcion: 'Visión a largo plazo y planificación' },
    { id: 8, nombre: 'Proyección Social', descripcion: 'Responsabilidad social y comunitaria' },
    { id: 9, nombre: 'Orientación Financiera', descripcion: 'Gestión de recursos económicos' },
    { id: 10, nombre: 'Orientación Tecnológica e Innovación', descripcion: 'Adopción de tecnología e innovación' }
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
    console.log('Inicializando IceResultadosPage');
    
    this.idEmprendedor = this.route.snapshot.paramMap.get('id');
    this.idEncuesta = this.route.snapshot.paramMap.get('idEncuesta');

    if (!this.idEmprendedor || !this.idEncuesta) {
      this.handleError('Parámetros faltantes: ID emprendedor o encuesta');
      return;
    }

    this.loadData();
  }

  ngOnDestroy(): void {
    console.log('Limpiando componente IceResultados');
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadData(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;

      await Promise.all([
        this.fetchEmprendedor(),
        this.fetchResultados()
      ]);

      console.log('Datos ICE cargados:', {
        emprendedor: this.emprendedor?.nombre,
        competencias: this.resultados.length,
        valorTotal: this.valorIceTotal
      });

    } catch (error) {
      console.error('Error al cargar datos ICE:', error);
      this.handleError('Error al cargar datos. Por favor, intenta nuevamente.');
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

      if (!this.emprendedor) {
        throw new Error('Emprendedor no encontrado');
      }
    } catch (error) {
      console.error('Error al cargar emprendedor:', error);
      throw new Error('Error al cargar información del emprendedor');
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

      if (!data || !data.resultados) {
        throw new Error('No se encontraron resultados ICE');
      }

      this.resultados = this.transformData(data.resultados);
      this.valorIceTotal = data.resumen?.valorIceTotal || 0;

      // VALIDACIÓN: Asegurar que solo hay 10 competencias
      if (this.resultados.length !== 10) {
        console.warn(` ADVERTENCIA: Se esperaban 10 competencias pero se encontraron ${this.resultados.length}`);
      }

      console.log('Resultados transformados:', this.resultados.length, 'competencias');
      
    } catch (error) {
      console.error('Error al cargar resultados ICE:', error);
      throw new Error('Error al cargar resultados de competencias');
    }
  }

  private transformData(resultados: any[]): Resultado[] {
    if (!Array.isArray(resultados)) {
      console.warn('Los resultados no son un array:', resultados);
      return [];
    }

    // IMPORTANTE: Filtrar para obtener solo competencias únicas del 1 al 10
    const competenciasMap = new Map<number, any>();
    
    resultados.forEach(resultado => {
      const idCompetencia = resultado.idCompetencia;
      
      // Normalizar ID: si es mayor a 10, mapear al rango 1-10
      const idNormalizado = idCompetencia > 10 
        ? ((idCompetencia - 1) % 10) + 1 
        : idCompetencia;
      
      // Solo guardar si es un ID válido (1-10) y aún no existe
      if (idNormalizado >= 1 && idNormalizado <= 10) {
        if (!competenciasMap.has(idNormalizado)) {
          competenciasMap.set(idNormalizado, {
            ...resultado,
            idCompetencia: idNormalizado
          });
        } else {
          // Si ya existe, sumar las puntuaciones (promedio)
          const existente = competenciasMap.get(idNormalizado);
          existente.puntuacionCompetencia = 
            (Number(existente.puntuacionCompetencia) + Number(resultado.puntuacionCompetencia)) / 2;
        }
      }
    });

    // Convertir el Map a array y transformar
    const resultadosUnicos = Array.from(competenciasMap.values()).map((resultado, index) => {
      const idCompetencia = resultado.idCompetencia;
      const competenciaInfo = this.getCompetenciaInfo(idCompetencia);
      
      return {
        idCompetencia: idCompetencia,
        puntuacionCompetencia: Number(resultado.puntuacionCompetencia) || 0,
        nombre: competenciaInfo.nombre,
        descripcion: competenciaInfo.descripcion,
        color: this.colors[(idCompetencia - 1) % this.colors.length],
        nivel: this.getNivelCompetencia(Number(resultado.puntuacionCompetencia) || 0)
      };
    }).sort((a, b) => a.idCompetencia - b.idCompetencia);

    // Asegurar que tenemos exactamente 10 competencias
    console.log(` Competencias procesadas: ${resultadosUnicos.length}/10`);
    
    return resultadosUnicos;
  }

  private getCompetenciaInfo(idCompetencia: number): CompetenciaInfo {
    // Asegurar que el ID está en el rango 1-10
    const idNormalizado = idCompetencia > 10 
      ? ((idCompetencia - 1) % 10) + 1 
      : idCompetencia;
    
    // Buscar la competencia por ID normalizado
    const competencia = this.competenciasInfo.find(c => c.id === idNormalizado);
    
    if (competencia) {
      return competencia;
    }

    // Fallback (no debería llegar aquí)
    return {
      id: idNormalizado,
      nombre: `Competencia ${idNormalizado}`,
      descripcion: 'Sin descripción'
    };
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

  get promedioCompetencias(): number {
    if (this.resultados.length === 0) return 0;
    const suma = this.resultados.reduce((acc, r) => acc + r.puntuacionCompetencia, 0);
    return suma / this.resultados.length;
  }

  get competenciaMasAlta(): Resultado | null {
    if (this.resultados.length === 0) return null;
    return this.resultados.reduce((max, r) => 
      r.puntuacionCompetencia > max.puntuacionCompetencia ? r : max
    );
  }

  get competenciaMasBaja(): Resultado | null {
    if (this.resultados.length === 0) return null;
    return this.resultados.reduce((min, r) => 
      r.puntuacionCompetencia < min.puntuacionCompetencia ? r : min
    );
  }

  // Navegación
  navigateBack(): void {
    this.router.navigate(['/informacion-resultados', this.idEmprendedor])
      .catch(error => {
        console.error('Error en navegación:', error);
        this.showToast('Error al navegar', 'danger');
      });
  }

  navegarAResultados(): void {
    this.router.navigate(['/informacion-resultados', this.idEmprendedor])
      .catch(error => {
        console.error('Error en navegación:', error);
        this.showToast('Error al navegar', 'danger');
      });
  }

  navegarAGraficas(): void {
    this.router.navigate(['/grafica-ice-resultados', this.idEmprendedor, this.idEncuesta])
      .catch(error => {
        console.error('Error en navegación:', error);
        this.showToast('Error al navegar', 'danger');
      });
  }

  async imprimir(): Promise<void> {
    try {
      window.print();
      await this.showToast('Preparando impresión...', 'success');
    } catch (error) {
      console.error('Error al imprimir:', error);
      await this.showToast('Error al imprimir', 'danger');
    }
  }

  // Manejo de errores
  private async handleError(message: string): Promise<void> {
    console.error(message);
    this.error = message;
    this.isLoading = false;
    await this.showToast(message, 'danger');
  }

  private async showToast(
    message: string, 
    color: 'success' | 'danger' | 'warning' = 'success'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
      buttons: [{ text: 'Cerrar', role: 'cancel' }]
    });
    await toast.present();
  }

  // Diagnóstico
  diagnosticarEstado(): void {
    console.log('═══════════════════════════════════════════════');
    console.log('DIAGNÓSTICO - ICE RESULTADOS');
    console.log('═══════════════════════════════════════════════');
    console.log('PARÁMETROS:');
    console.log('  • ID Emprendedor:', this.idEmprendedor);
    console.log('  • ID Encuesta:', this.idEncuesta);
    console.log('───────────────────────────────────────────────');
    console.log('DATOS CARGADOS:');
    console.log('  • Emprendedor:', this.emprendedor?.nombre || 'N/A');
    console.log('  • Competencias:', this.resultados.length, '/ 10 esperadas');
    console.log('  • ICE Total:', this.valorIceTotal.toFixed(3));
    console.log('───────────────────────────────────────────────');
    console.log('COMPETENCIAS (debe ser exactamente 10):');
    this.resultados.forEach(r => {
      console.log(`  C${r.idCompetencia}. ${r.nombre}: ${r.puntuacionCompetencia.toFixed(3)} (${r.nivel})`);
    });
    console.log('───────────────────────────────────────────────');
    console.log('ESTADÍSTICAS:');
    console.log('  • Total Competencias:', this.resultados.length);
    console.log('  • Promedio:', this.promedioCompetencias.toFixed(3));
    console.log('  • Nivel Alto:', this.nivelAltoCount);
    console.log('  • Nivel Medio:', this.nivelMedioCount);
    console.log('  • Nivel Bajo:', this.nivelBajoCount);
    if (this.competenciaMasAlta) {
      console.log('  • Más alta:', this.competenciaMasAlta.nombre, '-', this.competenciaMasAlta.puntuacionCompetencia.toFixed(3));
    }
    if (this.competenciaMasBaja) {
      console.log('  • Más baja:', this.competenciaMasBaja.nombre, '-', this.competenciaMasBaja.puntuacionCompetencia.toFixed(3));
    }
    console.log('═══════════════════════════════════════════════');
    
    // Validación
    if (this.resultados.length !== 10) {
      console.error(' ERROR: La encuesta ICE debe tener EXACTAMENTE 10 competencias');
      console.error('   Competencias encontradas:', this.resultados.length);
    } else {
      console.log(' CORRECTO: 10 competencias cargadas');
    }
  }
}