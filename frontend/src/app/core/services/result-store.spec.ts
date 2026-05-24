import { TestBed } from '@angular/core/testing';

import { ResultStore } from './result-store';

describe('ResultStore', () => {
  let service: ResultStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResultStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
