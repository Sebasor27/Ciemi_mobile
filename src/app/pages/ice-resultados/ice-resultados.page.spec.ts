import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IceResultadosPage } from './ice-resultados.page';

describe('IceResultadosPage', () => {
  let component: IceResultadosPage;
  let fixture: ComponentFixture<IceResultadosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(IceResultadosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
