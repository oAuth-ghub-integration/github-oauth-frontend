import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { MatProgressBarModule } from '@angular/material/progress-bar';

// AG Grid
import { AgGridModule } from 'ag-grid-angular';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Services
import { GithubIntegrationService } from '../../services/github-integration.service';
import { interval, Subscription } from 'rxjs';

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
    MatProgressBarModule,
    AgGridModule
  ],
  templateUrl: './github-integration.component.html',
  styleUrl: './github-integration.component.scss'
})
export class GithubIntegrationComponent implements OnInit, OnDestroy {
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

  // Sync status polling
  syncStatus: any = {};
  syncPollingSub?: Subscription;

  pageSize = 50;
  currentPage = 1;
  totalRecords = 0;
  Math = Math; // Make Math available in template

  get pageNumbers(): number[] {
    const totalPages = Math.ceil(this.totalRecords / this.pageSize);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  get visiblePageNumbers(): (number | 'ellipsis')[] {
    const totalPages = Math.ceil(this.totalRecords / this.pageSize);
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (this.currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('ellipsis', totalPages);
      } else if (this.currentPage >= totalPages - 3) {
        pages.push(1, 'ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1, 'ellipsis');
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) pages.push(i);
        pages.push('ellipsis', totalPages);
      }
    }
    return pages;
  }

  goToPage(page: number): void {
    const totalPages = Math.ceil(this.totalRecords / this.pageSize);
    if (page < 1 || page > totalPages || page === this.currentPage) return;
    this.loadData(page, this.searchText);
  }

  constructor(private readonly gitService: GithubIntegrationService) {}

  ngOnInit(): void {
    this.gitService.getStatus().subscribe({
      next: status => {
        this.connected = status.connected;
        if (this.connected) {
          this.username = status.username;
          if (status.lastSynced) {
            this.lastSynced = new Date(status.lastSynced).toLocaleString();
          }
          this.pollSyncStatus();
        } else {
          this.syncStatus = {};
          this.syncPollingSub?.unsubscribe();
        }
      },
      error: error => {
        console.error('Failed to get integration status', error);
      }
    });
  }

  ngOnDestroy(): void {
    this.syncPollingSub?.unsubscribe();
  }

  pollSyncStatus(): void {
    this.fetchSyncStatus();
    this.syncPollingSub = interval(3000).subscribe(() => this.fetchSyncStatus());
  }

  fetchSyncStatus(): void {
    this.gitService.getSyncStatus().subscribe({
      next: status => {
        this.syncStatus = status;
        if (status.allSynced && this.syncPollingSub) {
          this.syncPollingSub.unsubscribe();
        }
      },
      error: err => {
        console.error('Failed to fetch sync status', err);
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
        this.currentPage = 1;
        this.totalRecords = 0;
        this.syncStatus = {};
        this.syncPollingSub?.unsubscribe();
      },
      error: error => {
        console.error('Failed to remove integration', error);
      }
    });
  }

  loadData(page: number = 1, searchText: string = this.searchText): void {
    if (!this.selectedEntity) return;
    
    this.currentPage = page;
    this.gitService.getData(this.selectedEntity, page, this.pageSize, searchText).subscribe({
      next: response => {
        console.log(`API response for ${this.selectedEntity} page ${page}:`, response);
        this.rowData = response.data || [];
        this.totalRecords = response.total || 0;
        
        // Always set column definitions based on new data
        if (this.rowData.length) {
          const firstObj = this.rowData[0];
          this.columnDefs = Object.keys(firstObj).map(key => ({ field: key }));
        } else {
          this.columnDefs = [];
        }
      },
      error: error => {
        console.error(`Failed to fetch ${this.selectedEntity} data for page ${page}`, error);
        this.rowData = [];
        this.totalRecords = 0;
        this.columnDefs = [];
      }
    });
  }

  onSelectEntity(entity: string): void {
    if (!entity) {
      return;
    }
    this.selectedEntity = entity;
    this.currentPage = 1;
    this.loadData(1, this.searchText);
  }

  onPageChanged(event: any): void {
    const newPage = event.api.paginationGetCurrentPage() + 1; // AG Grid uses 0-based indexing
    if (newPage !== this.currentPage) {
      this.loadData(newPage, this.searchText);
    }
  }

  onSearchChange(searchValue: string) {
    this.searchText = searchValue;
    this.currentPage = 1;
    this.loadData(1, this.searchText);
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridApi.setQuickFilter(this.searchText);
  }
}
