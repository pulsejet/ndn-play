import { Component, OnInit } from '@angular/core';

const LS_KEY_DARK = 'force-dark';

@Component({
  selector: 'theme-toggle',
  template: `
    <button class="theme-btn" (click)="toggle()">
      <svg width="30" height="30" class="theme-icon light">
        <circle cx="15" cy="15" r="6" fill="currentColor" />
        <line id="ray" stroke="currentColor" stroke-width="2" stroke-linecap="round" x1="15" y1="1" x2="15" y2="4"></line>
        <use href="#ray" transform="rotate(45 15 15)" />
        <use href="#ray" transform="rotate(90 15 15)" />
        <use href="#ray" transform="rotate(135 15 15)" />
        <use href="#ray" transform="rotate(180 15 15)" />
        <use href="#ray" transform="rotate(225 15 15)" />
        <use href="#ray" transform="rotate(270 15 15)" />
        <use href="#ray" transform="rotate(315 15 15)" />
      </svg>

      <svg width="30" height="30" class="theme-icon dark">
        <path fill="currentColor" d="M 23, 5 A 12 12 0 1 0 23, 25 A 12 12 0 0 1 23, 5" />
      </svg>
    </button>
  `,
  styles: [`
    .theme-btn {
      position: relative;
      transform: scale(0.8) translateY(6px);

      .theme-icon {
        position: absolute;
        bottom: 0;
        left: 0;

        transition: opacity 0.3s;
        &.dark { opacity: calc(1 - var(--is-dark)); }
        &.light { opacity: var(--is-dark); }
      }
    }
  `]
})
export class ThemeToggleComponent implements OnInit {
  constructor() { }

  ngOnInit(): void {
    this.forceTheme();
  }

  forceTheme(): void {
    if (this.isLsLight()) {
      document.documentElement.setAttribute('data-theme', 'light');
    } else if (this.isLsDark()) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      // let media query handle it
    }
  }

  toggle(): void {
    const isDark = getComputedStyle(document.documentElement).getPropertyValue('--is-dark') === '1';
    this.setLsDark(!isDark);
    this.forceTheme();
  }

  isLsLight(): boolean {
    return localStorage.getItem(LS_KEY_DARK) === 'false';
  }

  isLsDark(): boolean {
    return localStorage.getItem(LS_KEY_DARK) === 'true';
  }

  setLsDark(isDark: boolean): void {
    localStorage.setItem(LS_KEY_DARK, isDark ? 'true' : 'false');
  }
}
