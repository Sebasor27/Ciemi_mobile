import { TestBed } from '@angular/core/testing';

import { SeguridadRealService } from './seguridad-real.service';

describe('SeguridadRealService', () => {
  let service: SeguridadRealService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeguridadRealService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
