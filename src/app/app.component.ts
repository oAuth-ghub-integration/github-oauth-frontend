import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GithubIntegrationComponent } from './components/github-integration/github-integration.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GithubIntegrationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'frontend';
}
