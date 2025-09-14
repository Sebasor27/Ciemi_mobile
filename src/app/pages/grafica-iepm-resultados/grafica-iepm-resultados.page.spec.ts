import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraficaIepmResultadosPage } from './grafica-iepm-resultados.page';

describe('GraficaIepmResultadosPage', () => {
  let component: GraficaIepmResultadosPage;
  let fixture: ComponentFixture<GraficaIepmResultadosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GraficaIepmResultadosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
