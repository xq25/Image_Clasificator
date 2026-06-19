import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { environment } from '@environments/environment';
import { SidebarSection, SidebarRoute, NavCap } from '@app/models/sideBarRules';
import { SecurityService } from '@app/services/ms-security/security';
import { UserRoleService } from '@app/services/ms-security/user-role-service';
import { DoctorService } from '@app/services/ms-clasificator/doctor.service';
import { DoctorAreaService } from '@app/services/ms-clasificator/doctor-area.service';
import { EvaluationAreaService } from '@app/services/ms-clasificator/evaluation-area.service';
import { MedicalImageTypeService } from '@app/services/ms-clasificator/medical-image-type.service';
import { InternalServicesService } from '@app/services/ms-clasificator/internal-services.service';
import { Doctor, DoctorArea, EvaluationArea, MedicalImageType, ApiResponse } from '@app/models/ms-clasificator';
import { PatientExtended } from '@app/models/ms-clasificator/Patient/Patient';
import { PatientService } from '@app/services/ms-clasificator/patient.service';

@Injectable({
  providedIn: 'root',
})
export class SideBarService {

  private readonly fullAccessRoleId     = environment.securityRoles.fullAccessRoleId;
  private readonly securityAccessRoleId = environment.securityRoles.securityAccessRoleId;
  private readonly doctorAccessRoleId   = environment.securityRoles.doctorRole;

  constructor(
    private securityService: SecurityService,
    private userRoleService: UserRoleService,
    private doctorService: DoctorService,
    private doctorAreaService: DoctorAreaService,
    private evaluationAreaService: EvaluationAreaService,
    private medicalImageTypeService: MedicalImageTypeService,
    private internalService: InternalServicesService,
    private patientService: PatientService,
  ) {}

  // ── Punto de entrada principal ────────────────────────────────
  getSideBarSections(): Observable<SidebarSection[]> {
    const userId = this.securityService.getCurrentSession()?.user?.id;

    if (!userId) {
      return of(this.buildSections(false, false));
    }

    return this.userRoleService.getUserRoles(userId).pipe(
      map((response) => this.extractRoleIds(response)),
      switchMap((roleIds) => {
        const fullAccessRoleId     = this.fullAccessRoleId?.trim();
        const securityAccessRoleId = this.securityAccessRoleId?.trim();

        const hasFullAccess         = !!fullAccessRoleId && roleIds.includes(fullAccessRoleId);
        const hasSecurityAccess     = hasFullAccess || (!!securityAccessRoleId && roleIds.includes(securityAccessRoleId));
        const hasClasificatorAccess = hasFullAccess;

        const baseSections = this.buildSections(hasSecurityAccess, hasClasificatorAccess);

        // La sección de clasificación se carga de forma completamente aislada.
        // Cualquier fallo interno devuelve baseSections sin afectar lo ya cargado.
        return this.resolveClassificationSection(userId, baseSections);
      }),
      catchError((error) => {
        // Solo cubre fallos en getUserRoles — las secciones base se muestran sin roles.
        console.error('[SideBarService] Error al obtener roles del usuario:', error);
        return of(this.buildSections(false, false));
      })
    );
  }

  // ── Carga aislada de las secciones dinámicas (doctor / paciente) ──
  /**
   * Corre ambas verificaciones en paralelo para que un fallo en una
   * no bloquee la otra. Las secciones se acumulan sobre baseSections.
   */
  private resolveClassificationSection(
    userId: string,
    baseSections: SidebarSection[],
  ): Observable<SidebarSection[]> {

    const isDoctor$ = this.internalService.existRelationWithDoctor(userId).pipe(
      catchError((err) => {
        console.error('[SideBarService] Error en existRelationWithDoctor:', err);
        return of(false);
      })
    );

    const isPatient$ = this.internalService.existRelationWithPatient(userId).pipe(
      catchError((err) => {
        console.error('[SideBarService] Error en existRelationWithPatient:', err);
        return of(false);
      })
    );

    return forkJoin({ isDoctor: isDoctor$, isPatient: isPatient$ }).pipe(
      switchMap(({ isDoctor, isPatient }) => {
        console.log('[SideBarService] isDoctor:', isDoctor, '| isPatient:', isPatient);

        const doctor$ = isDoctor
          ? this.resolveDoctorSection(userId, [])
          : of([] as SidebarSection[]);

        const patient$ = isPatient
          ? this.resolvePatientSections(userId)
          : of([] as SidebarSection[]);

        return forkJoin({ doctorSections: doctor$, patientSections: patient$ }).pipe(
          map(({ doctorSections, patientSections }) =>
            [...baseSections, ...patientSections, ...doctorSections]
          )
        );
      }),
      catchError((error) => {
        console.error('[SideBarService] Error en resolveClassificationSection:', error);
        return of(baseSections);
      })
    );
  }

  // ── Sección de paciente ───────────────────────────────────────
  private resolvePatientSections(userId: string): Observable<SidebarSection[]> {
    return this.patientService.findByUserId(userId).pipe(
      map((response) => {
        const patient = this.unwrapData<PatientExtended | null>(response, null);
        console.log('[SideBarService] paciente encontrado:', patient);

        if (!patient?.document) return [];

        return this.buildPatientSection(patient.document);
      }),
      catchError((error) => {
        console.error('[SideBarService] Error al obtener paciente:', error);
        return of([] as SidebarSection[]);
      })
    );
  }

  private resolveDoctorSection(
    userId: string,
    _baseSections: SidebarSection[],
  ): Observable<SidebarSection[]> {

    return this.doctorService.findByUserId(userId).pipe(
      switchMap((doctorsRes) => {
        const doctor = this.normalizeDoctors(doctorsRes).find((d) => d?.id != null);
        console.log('[SideBarService] doctor encontrado:', doctor);

        if (!doctor?.id) return of([] as SidebarSection[]);

        return this.resolveAreaSection(doctor.id).pipe(
          map((areaSections) => [this.buildDoctorManagementSection(), ...areaSections])
        );
      }),
      catchError((error) => {
        console.error('[SideBarService] Error al obtener doctor:', error);
        return of([] as SidebarSection[]);
      })
    );
  }

  private resolveAreaSection(doctorId: number): Observable<SidebarSection[]> {

    return this.doctorAreaService.findByDoctorId(doctorId).pipe(
      switchMap((doctorAreasRes) => {
        const areaIds = this.normalizeDoctorAreas(doctorAreasRes)
          .map((a) => a.evaluationAreaId)
          .filter((id): id is number => id != null);
        console.log('[SideBarService] evaluationAreaIds del doctor:', areaIds);

        if (!areaIds.length) return of(this.buildNoAreasSection([]));

        return this.resolveImageTypeGroups(areaIds);
      }),
      catchError((error) => {
        console.error('[SideBarService] Error al obtener áreas del doctor:', error);
        return of([] as SidebarSection[]);
      })
    );
  }

  private resolveImageTypeGroups(areaIds: number[]): Observable<SidebarSection[]> {

    return forkJoin(
      areaIds.map((areaId) =>
        forkJoin({
          area:       this.evaluationAreaService.findById(areaId),
          imageTypes: this.medicalImageTypeService.findByEvaluationAreaId(areaId),
        }).pipe(
          map(({ area, imageTypes }) => ({
            area:       area.data!,
            imageTypes: (imageTypes.data ?? []) as MedicalImageType[],
          })),
          catchError((err) => {
            console.error(`[SideBarService] Error al cargar área ${areaId}:`, err);
            return of(null);
          })
        )
      )
    ).pipe(
      map((groups) => {
        const valid = groups.filter(
          (g): g is { area: EvaluationArea; imageTypes: MedicalImageType[] } => g !== null
        );
        console.log('[SideBarService] grupos de clasificación:', valid);
        return this.buildClassificationSection([], valid);
      }),
      catchError((error) => {
        console.error('[SideBarService] Error al resolver grupos de imagen:', error);
        return of([] as SidebarSection[]);
      })
    );
  }

  // ── Constructores de secciones (retornan solo su propia sección) ──
  private buildDoctorManagementSection(): SidebarSection {
    return {
      navCap:  NavCap.DOCTOR_MANAGEMENT,
      visible: true,
      routes: [
        { displayName: 'Patients',            iconName: 'solar:user-heart-line-duotone',   route: '/patients/list',            visible: true },
        { displayName: 'Medical Diagnostics', iconName: 'solar:stethoscope-line-duotone',  route: '/medical-diagnostics/list', visible: true },
      ],
    };
  }

  private buildPatientSection(document: string): SidebarSection[] {
    return [{
      navCap:  NavCap.PATIENT,
      visible: true,
      routes: [{
        displayName: 'Mis Visitas Médicas',
        iconName:    'solar:heart-pulse-line-duotone',
        route:       `/clinical-records/patient/${document}/records`,
        visible:     true,
      }],
    }];
  }

  private buildNoAreasSection(_sections: SidebarSection[]): SidebarSection[] {
    return [{
      navCap:  NavCap.CLASIFICATION,
      visible: true,
      routes: [{
        displayName: 'No perteneces a ningún área de evaluación. Solicita acceso y recarga la página.',
        iconName:    'solar:info-circle-line-duotone',
        visible:     true,
        disabled:    true,
      }],
    }];
  }

  private buildClassificationSection(
    _sections: SidebarSection[],
    groups: { area: EvaluationArea; imageTypes: MedicalImageType[] }[]
  ): SidebarSection[] {
    const areaRoutes: SidebarRoute[] = groups
      .filter((g) => g.imageTypes.length > 0)
      .map(({ area, imageTypes }) => ({
        displayName: `${area.name} (${area.codeArea})`,
        iconName:    'solar:stethoscope-line-duotone',
        visible:     true,
        children: imageTypes.map((it) => ({
          displayName: it.name,
          iconName:    'solar:medical-kit-line-duotone',
          route:       `/classification/${it.id}`,
          visible:     true,
        })),
      }));

    if (!areaRoutes.length) return [];

    return [{
      navCap:  NavCap.CLASIFICATION,
      visible: true,
      routes:  areaRoutes,
    }];
  }

  private buildSections(hasSecurityAccess: boolean, hasClasificatorAccess: boolean): SidebarSection[] {
    const sections: SidebarSection[] = [
      {
        navCap:   NavCap.HOME,
        visible:  true,
        routes: [
          { displayName: 'Dashboard', iconName: 'solar:atom-line-duotone',         route: '/dashboard', visible: true },
          { displayName: 'Profile',   iconName: 'solar:user-circle-line-duotone',  route: '/profile',   visible: true },
        ],
      },
      {
        navCap:   NavCap.SECURITY_ADMIN,
        visible:  hasSecurityAccess,
        routes: [
          { displayName: 'Users',       iconName: 'solar:users-group-rounded-line-duotone',       route: '/users/list',       visible: hasSecurityAccess },
          { displayName: 'Roles',       iconName: 'solar:shield-line-duotone',                    route: '/roles/list',       visible: hasSecurityAccess },
          { displayName: 'Permissions', iconName: 'solar:lock-keyhole-minimalistic-line-duotone', route: '/permissions/list', visible: hasSecurityAccess },
        ],
      },
      {
        navCap:   NavCap.MANAGEMENT_CLASIFICATOR,
        visible:  hasClasificatorAccess,
        routes: [
          { displayName: 'Patients',           iconName: 'solar:user-heart-line-duotone',        route: '/patients/list',           visible: hasClasificatorAccess },
          { displayName: 'Evaluation Areas',   iconName: 'solar:map-point-wave-line-duotone',    route: '/evaluation-areas/list',   visible: hasClasificatorAccess },
          { displayName: 'Doctors',            iconName: 'solar:stethoscope-line-duotone',       route: '/doctors/list',            visible: hasClasificatorAccess },
          { displayName: 'Medical Diagnostics',iconName: 'solar:stethoscope-line-duotone',       route: '/medical-diagnostics/list',visible: hasClasificatorAccess },
          { displayName: 'System Data',        iconName: 'solar:database-line-duotone',          route: '/system-data/list',        visible: hasClasificatorAccess },
          { displayName: 'Datasets',           iconName: 'solar:layers-line-duotone',            route: '/datasets/list',           visible: hasClasificatorAccess },
        ],
      },
    ];

    return sections
      .map((section) => ({
        ...section,
        routes: section.routes.filter((route) => route.visible),
      }))
      .filter((section) => section.visible && section.routes.length > 0);
  }

  // ── Helpers ───────────────────────────────────────────────────
  private extractRoleIds(response: unknown): string[] {
    const userRoles = this.unwrapData<unknown[]>(response, []);
    return userRoles
      .map((userRole) => {
        const role = (userRole as { role?: { id?: string; _id?: string } })?.role;
        return role?.id ?? role?._id ?? null;
      })
      .filter((roleId): roleId is string => !!roleId)
      .map((roleId) => roleId.trim());
  }

  private normalizeDoctors(response: unknown): Doctor[] {
    const doctors = this.unwrapData<Doctor[] | Doctor | null>(response, [] as Doctor[] | Doctor | null);
    return Array.isArray(doctors) ? doctors : doctors ? [doctors] : [];
  }

  private normalizeDoctorAreas(response: unknown): DoctorArea[] {
    const doctorAreas = this.unwrapData<DoctorArea[] | DoctorArea | null>(response, [] as DoctorArea[] | DoctorArea | null);
    return Array.isArray(doctorAreas) ? doctorAreas : doctorAreas ? [doctorAreas] : [];
  }

  private unwrapData<T>(response: unknown, fallback: T): T {
    if (response && typeof response === 'object' && 'data' in (response as ApiResponse<T>)) {
      return ((response as ApiResponse<T>).data ?? fallback) as T;
    }
    return (response as T) ?? fallback;
  }
}