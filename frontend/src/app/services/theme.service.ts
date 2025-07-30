import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  private currentTheme$ = new BehaviorSubject<Theme>('light');

  constructor() {
    this.initTheme();
  }

  private initTheme() {
    const savedTheme = localStorage.getItem(this.THEME_KEY) as Theme;
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;

    const theme: Theme = savedTheme || (prefersDark ? 'dark' : 'light');
    this.setTheme(theme);
  }

  toggleTheme() {
    const currentTheme = this.getCurrentTheme();
    const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  setTheme(theme: Theme) {
    // Remove all theme classes
    document.body.classList.remove('dark-theme', 'light-theme');

    // Add new theme class
    document.body.classList.add(`${theme}-theme`);

    // Save to localStorage
    localStorage.setItem(this.THEME_KEY, theme);

    // Update observable
    this.currentTheme$.next(theme);

    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(theme);
  }

  private updateMetaThemeColor(theme: Theme) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }

    const color = theme === 'dark' ? '#1a1a1a' : '#ffffff';
    metaThemeColor.setAttribute('content', color);
  }

  isDarkMode(): boolean {
    return document.body.classList.contains('dark-theme');
  }

  getCurrentTheme(): Theme {
    return this.isDarkMode() ? 'dark' : 'light';
  }

  // Observable for theme changes
  get theme$() {
    return this.currentTheme$.asObservable();
  }

  // Method to sync theme with user settings from backend
  syncWithUserSettings(userTheme: Theme) {
    if (userTheme !== this.getCurrentTheme()) {
      this.setTheme(userTheme);
    }
  }

  // Listen to system theme changes
  watchSystemTheme() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQuery.addEventListener('change', (e) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem(this.THEME_KEY)) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}
