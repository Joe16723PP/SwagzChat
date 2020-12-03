import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnswerCallComponent } from './answer-call.component';

describe('AnswerCallComponent', () => {
  let component: AnswerCallComponent;
  let fixture: ComponentFixture<AnswerCallComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnswerCallComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnswerCallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
