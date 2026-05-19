import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';

import { MaterialModule } from '@app/material.module';
import { Profile } from '@app/models/Profile';
import { User } from '@app/models/User';
import { ProfileService } from '@app/services/profile-service';
import { SecurityService } from '@app/services/ms-security/security';
import { UserService } from '@app/services/ms-security/user-service';
import { catchError, forkJoin, of } from 'rxjs';

type ProfileTab = 'account' | 'notifications' | 'bills' | 'security';

interface NotificationPrefs {
  emailUpdates: boolean;
  securityAlerts: boolean;
  productNews: boolean;
}

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './view.component.html',
  styleUrl: './view.component.scss',
})
export class ProfileViewComponent implements OnInit {

  loading = signal(true);
  errorMessage = signal<string | null>(null);
  previewUrl = signal<string | null>(null);
  selectedTabIndex = 0;

  user: User = { id: '', name: '', email: '' };
  profile: Profile | null = null;

  notifications: NotificationPrefs = {
    emailUpdates: true,
    securityAlerts: true,
    productNews: false,
  };

  constructor(
    private router: Router,
    private securityService: SecurityService,
    private profileService: ProfileService,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    const session = this.securityService.getCurrentSession();
    const sessionUser = session?.user;

    if (!sessionUser?.id) {
      this.loading.set(false);
      this.errorMessage.set('No se encontró una sesión activa.');
      return;
    }

    forkJoin({
      user: this.userService.getUserById(sessionUser.id).pipe(
        map((response) => response.data ?? sessionUser as User),
        catchError(() => of(sessionUser as User))
      ),
      profile: this.profileService.getProfileByUserID(sessionUser.id).pipe(
        map((response) => response.data ?? null),
        catchError(() => of(null))
      )
    }).subscribe({
      next: ({ user, profile }) => {
        this.user = {
          id: user?.id || sessionUser.id,
          name: user?.name || sessionUser.name || '',
          email: user?.email || sessionUser.email || '',
          password: user?.password,
        };

        this.profile = profile;
        this.previewUrl.set(profile?.photo || null);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('No se pudo cargar el perfil.');
      }
    });
  }

  onTabChanged(index: number): void {
    this.selectedTabIndex = index;
  }

  goToEdit(): void {
    this.router.navigate(['/profile/edit']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  getInitials(): string {
    const name = this.user.name || 'Profile';
    return name
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  get activePhoto(): string {
    return this.previewUrl() || '/assets/images/profile/user-1.jpg';
  }

  get profilePhone(): string {
    return this.profile?.phone || 'N/A';
  }

  get profileId(): string {
    return this.profile?.id || 'Pending';
  }
}