import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';

// AG Grid
import { AgGridModule } from 'ag-grid-angular';

// Services
import { GithubIntegrationService } from '../../services/github-integration.service';

@Component({
  selector: 'app-github-integration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCardModule,
    AgGridModule
  ],
  templateUrl: './github-integration.component.html',
  styleUrl: './github-integration.component.scss'
})
export class GithubIntegrationComponent implements OnInit {
  connected = false;
  username?: string;
  lastSynced?: string;
  readonly entities: string[] = [
    'organizations', 'repos', 'commits', 'pulls', 'issues', 'changelogs', 'users'
  ];
  selectedEntity = '';
  selectedIntegration = 'github';
  columnDefs: any[] = [];
  rowData: any[] = [];
  readonly defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true
  };

  constructor(private readonly gitService: GithubIntegrationService) {}

  ngOnInit(): void {
    this.gitService.getStatus().subscribe({
      next: status => {
        this.connected = status.connected;
        if (status.connected) {
          this.username = status.username;
          if (status.lastSynced) {
            this.lastSynced = new Date(status.lastSynced).toLocaleString();
          }
        }
      },
      error: error => {
        console.error('Failed to get integration status', error);
      }
    });
  }

  connectGithub(): void {
    window.location.href = 'http://localhost:3000/auth/github';
  }

  removeIntegration(): void {
    if (!confirm('Are you sure you want to disconnect your GitHub integration?')) {
      return;
    }
    this.gitService.removeIntegration().subscribe({
      next: () => {
        this.connected = false;
        this.username = undefined;
        this.lastSynced = undefined;
        this.selectedEntity = '';
        this.rowData = [];
        this.columnDefs = [];
      },
      error: error => {
        console.error('Failed to remove integration', error);
      }
    });
  }

  onSelectEntity(entity: string): void {
    if (!entity) {
      return;
    }
    this.gitService.getData(entity).subscribe({
      next: dataArray => {
        this.selectedEntity = entity;
        if (dataArray && dataArray.length > 0) {
          const firstObj = dataArray[0];
          this.columnDefs = Object.keys(firstObj).map(key => ({ field: key }));
        } else {
          this.columnDefs = [];
        }
        this.rowData = dataArray;
      },
      error: error => {
        console.error(`Failed to fetch ${entity} data`, error);
        this.rowData = [];
        this.columnDefs = [];
      }
    });
  }
}
