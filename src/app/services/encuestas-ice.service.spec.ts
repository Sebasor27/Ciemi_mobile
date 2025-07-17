import { TestBed } from '@angular/core/testing';
import { EncuestaIceService } from './encuestas-ice.service'; // Cambio aquí

describe('EncuestaIceService', () => { // Cambio aquí
  let service: EncuestaIceService; // Cambio aquí

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EncuestaIceService); // Cambio aquí
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});