import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { MaterialModule } from '@app/material.module';
import { ProfileService } from '@app/services/profile-service';
import { PhotoService } from '@app/services/ms-security/photo-service';
import { SecurityService } from '@app/services/ms-security/security';
import { UserService } from '@app/services/ms-security/user-service';
import { Profile } from '@app/models/Profile';
import { User } from '@app/models/User';

type ProfileTab = 'account' | 'notifications' | 'bills' | 'security';

interface NotificationPrefs {
  emailUpdates: boolean;
  securityAlerts: boolean;
  productNews: boolean;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {

  loading = signal(true);
  saving = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  previewUrl = signal<string | null>(null);
  selectedTabIndex = 0;

  currentSessionUserId = '';
  profileId = '';
  selectedFile: File | null = null;

  userForm: User = {};
  profileForm: Partial<Profile> = {};

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
    private photoService: PhotoService,
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

    this.currentSessionUserId = sessionUser.id;

    forkJoin({
      user: this.userService.getUserById(sessionUser.id).pipe(
        catchError(() => of(sessionUser as User))
      ),
      profile: this.profileService.getProfileByUserID(sessionUser.id).pipe(
        catchError(() => of(null))
      )
    }).subscribe({
      next: ({ user, profile }) => {
        const profileUser = profile?.user;
        const loadedPhoto = profile?.photo || null;

        this.userForm = {
          id: profileUser?.id || user?.id || sessionUser.id,
          name: profileUser?.name || user?.name || sessionUser.name || '',
          email: profileUser?.email || user?.email || sessionUser.email || '',
          password: profileUser?.password || user?.password || ''
        };

        if (profile) {
          this.profileId = profile.id;
          this.profileForm = {
            phone: profile.phone || '',
            photo: profile.photo || '',
          };
        } else {
          this.profileForm = { phone: '', photo: '' };
        }

        this.previewUrl.set(loadedPhoto);
        this.profileService.setProfilePhoto(loadedPhoto);

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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.selectedFile = input.files[0];
    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(reader.result as string);
    reader.readAsDataURL(this.selectedFile);
  }

  resetPhoto(): void {
    const currentPhoto = this.profileForm.photo || '';

    this.selectedFile = null;
    this.profileForm.photo = '';
    this.previewUrl.set(null);

    if (!currentPhoto || currentPhoto.startsWith('data:') || currentPhoto.includes('/assets/images/profile/user-1.jpg')) {
      return;
    }

    this.photoService.deletePhoto(currentPhoto).subscribe({
      error: () => {
        // Keep the UI reset even if the backend photo removal fails.
      }
    });
  }

  saveProfile(): void {
    if (this.saving()) return;

    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.saving.set(true);

    const applyProfileUpdate = () => {
      const payload: Profile = {
        id: this.profileId,
        phone: this.profileForm.phone,
        photo: this.profileForm.photo,
        user: this.userForm,
      };

      const request = this.profileId
        ? this.profileService.updateProfile(this.profileId, payload)
        : this.profileService.createProfile(payload);

      request.subscribe({
        next: (savedProfile) => {
          if (!this.profileId) {
            this.profileId = savedProfile.id;
          }

          this.profileForm.phone = savedProfile.phone || this.profileForm.phone;
          this.profileForm.photo = savedProfile.photo || this.profileForm.photo;
          const savedPhoto = this.profileForm.photo || null;
          this.previewUrl.set(savedPhoto);
          this.profileService.setProfilePhoto(savedPhoto);
          this.selectedFile = null;
          this.saving.set(false);
          this.successMessage.set('Perfil actualizado correctamente.');
        },
        error: () => {
          this.saving.set(false);
          this.errorMessage.set('No se pudo actualizar el perfil.');
        }
      });
    };

    const updateUser = () => {
      if (!this.userForm.id) {
        this.saving.set(false);
        this.errorMessage.set('No se pudo identificar el usuario actual.');
        return;
      }

      this.userService.updateUser(this.userForm.id, this.userForm).subscribe({
        next: (updatedUser) => {
          this.userForm = {
            ...this.userForm,
            ...updatedUser,
          };

          const currentSession = this.securityService.getCurrentSession();
          if (currentSession) {
            this.securityService.saveSession({
              ...currentSession,
              user: {
                ...currentSession.user,
                ...updatedUser,
              },
            });
          }

          applyProfileUpdate();
        },
        error: () => {
          this.saving.set(false);
          this.errorMessage.set('No se pudo actualizar el usuario.');
        }
      });
    };

    if (this.selectedFile) {
      this.photoService.uploadPhoto(this.selectedFile).subscribe({
        next: (response) => {
          this.profileForm.photo = response.url;
          updateUser();
        },
        error: () => {
          this.saving.set(false);
          this.errorMessage.set('No se pudo subir la foto.');
        }
      });
      return;
    }

    updateUser();
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }

  getInitials(): string {
    const name = this.userForm.name || 'Profile';
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

}
