import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EncuestaIcePage } from './encuesta-ice.page';

describe('EncuestaIcePage', () => {
  let component: EncuestaIcePage;
  let fixture: ComponentFixture<EncuestaIcePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EncuestaIcePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
