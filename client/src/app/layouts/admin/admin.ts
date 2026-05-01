import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth-service';
import { AdminApiService } from '../../features/admin/services/admin-api.service';
import { CommonModule } from '@angular/common';
import { GlobalSearchResults } from '../../types/dashboard';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
  private authService = inject(AuthService);
  private adminApi = inject(AdminApiService);
  private router = inject(Router);

  isSidebarOpen = signal(false);
  
  // Search
  searchQuery = signal('');
  searchResults = signal<GlobalSearchResults | null>(null);
  isSearchLoading = signal(false);
  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  performSearch(query: string) {
    if (query.length < 2) {
      this.searchResults.set(null);
      return;
    }
    this.isSearchLoading.set(true);
    this.adminApi.globalSearch(query).subscribe({
      next: (results) => {
        this.searchResults.set(results);
        this.isSearchLoading.set(false);
      },
      error: () => this.isSearchLoading.set(false)
    });
  }

  closeSearch() {
    this.searchQuery.set('');
    this.searchResults.set(null);
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}
