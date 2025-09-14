import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IepmResultadosPage } from './iepm-resultados.page';

describe('IepmResultadosPage', () => {
  let component: IepmResultadosPage;
  let fixture: ComponentFixture<IepmResultadosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(IepmResultadosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
