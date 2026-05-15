import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { ProfileService } from '@app/services/profile-service';
import { SecurityService } from '@app/services/ms-security/security';
import { Router } from '@angular/router';
import { Subject, catchError, of, takeUntil } from 'rxjs';

@Component({
  selector: 'app-profile-dropdown',
  standalone: true,
  imports: [RouterModule, MaterialModule],
  templateUrl: './profile-dropdown.component.html',
  styleUrl: './profile-dropdown.component.scss',
})
export class ProfileDropdownComponent implements OnInit, OnDestroy {
  activePhoto = '/assets/images/profile/user-1.jpg';
  private readonly destroy$ = new Subject<void>();

  private readonly ROUTES = {
    profile: ['/profile'],
    edit: ['/profile', 'edit'],
    tasks: ['/dashboard'],
    login: ['/authentication', 'login'],
  } as const;

  constructor(
    private profileService: ProfileService,
    private securityService: SecurityService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const session = this.securityService.getCurrentSession();
    const sessionUser = session?.user;
    if (!sessionUser?.id) return;

    this.profileService.profilePhotoChanges.pipe(takeUntil(this.destroy$)).subscribe((photo) => {
      this.activePhoto = photo || '/assets/images/profile/user-1.jpg';
    });

    this.profileService.getProfileByUserID(sessionUser.id).pipe(
      takeUntil(this.destroy$),
      catchError(() => of(null))
    ).subscribe((profile) => {
      this.profileService.setProfilePhoto(profile?.photo || null);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goToProfile(): void {
    this.router.navigate(this.ROUTES.profile);
  }

  goToEdit(): void {
    this.router.navigate(this.ROUTES.edit);
  }

  goToTasks(): void {
    this.router.navigate(this.ROUTES.tasks);
  }

  logout(): void {
    this.securityService.logout();
    this.router.navigate(['auth/login']);
  }

}
