import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EncuestaIepmPage } from './encuesta-iepm.page';

describe('EncuestaIEPMPage', () => {
  let component: EncuestaIepmPage;
  let fixture: ComponentFixture<EncuestaIepmPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EncuestaIepmPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
