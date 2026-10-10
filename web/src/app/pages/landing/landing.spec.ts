import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { GuestService } from '../../core/guest.service';
import { Landing } from './landing';

describe('Landing', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  async function setup(): Promise<ComponentFixture<Landing>> {
    await TestBed.configureTestingModule({
      imports: [Landing],
      providers: [provideRouter([]), GuestService],
    }).compileComponents();
    const fixture = TestBed.createComponent(Landing);
    fixture.detectChanges();
    return fixture;
  }

  it('opens chat for the trimmed name and keeps that guest', async () => {
    const fixture = await setup();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const input = fixture.nativeElement.querySelector('#guest-name') as HTMLInputElement;
    input.value = '  Ann  ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).requestSubmit();
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledWith('/chat');
    expect(TestBed.inject(GuestService).guest()).toEqual({
      id: expect.stringMatching(/^guest_/),
      name: 'Ann',
    });
  });

  it('stays on the landing page when the name is empty', async () => {
    const fixture = await setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).requestSubmit();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Enter a name.');
  });
});
