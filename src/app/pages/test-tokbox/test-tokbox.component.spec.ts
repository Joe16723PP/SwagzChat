import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TestTokboxComponent } from './test-tokbox.component';

describe('TestTokboxComponent', () => {
  let component: TestTokboxComponent;
  let fixture: ComponentFixture<TestTokboxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TestTokboxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestTokboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
