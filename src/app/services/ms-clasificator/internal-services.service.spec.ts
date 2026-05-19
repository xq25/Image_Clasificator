import { TestBed } from '@angular/core/testing';

import { InternalServicesService } from './internal-services.service';

describe('InternalServicesService', () => {
  let service: InternalServicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InternalServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
