import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraficaIceResultadosPage } from './grafica-ice-resultados.page';

describe('GraficaIceResultadosPage', () => {
  let component: GraficaIceResultadosPage;
  let fixture: ComponentFixture<GraficaIceResultadosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GraficaIceResultadosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
