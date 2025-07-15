import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EncuestaIEPMPage } from './encuesta-iepm.page';

describe('EncuestaIEPMPage', () => {
  let component: EncuestaIEPMPage;
  let fixture: ComponentFixture<EncuestaIEPMPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EncuestaIEPMPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
