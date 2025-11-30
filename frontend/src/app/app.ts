import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './shared/components/header/header';
import { Sidebar } from './shared/components/sidebar/sidebar';
import { Auth } from './core/services/auth';
import { LoadingSpinner } from './shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, Sidebar, LoadingSpinner],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly auth = inject(Auth);
}