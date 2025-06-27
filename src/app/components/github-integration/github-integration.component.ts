import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// AG Grid
import { AgGridModule } from 'ag-grid-angular';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

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
    MatFormFieldModule,
    MatInputModule,
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
  searchText = '';
  private gridApi: any;
  readonly defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 120
  };
  readonly gridOptions = {
    theme: 'legacy' as const
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
        // Reset search when new data is loaded
        this.onSearchChange(this.searchText);
      },
      error: error => {
        console.error(`Failed to fetch ${entity} data`, error);
        this.rowData = [];
        this.columnDefs = [];
      }
    });
  }

  onSearchChange(searchValue: string) {
    this.searchText = searchValue;
    this.gridApi?.setQuickFilter(this.searchText);
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridApi.setQuickFilter(this.searchText);
  }
}
