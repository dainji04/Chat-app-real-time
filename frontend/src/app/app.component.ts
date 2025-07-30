import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ThemeToggleComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'frontend';

  constructor(public themeService: ThemeService) {}
}
