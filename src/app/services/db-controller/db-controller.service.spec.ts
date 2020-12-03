import { TestBed } from '@angular/core/testing';

import { DbControllerService } from './db-controller.service';

describe('DbControllerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DbControllerService = TestBed.get(DbControllerService);
    expect(service).toBeTruthy();
  });
});
