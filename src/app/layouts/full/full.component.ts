import { BreakpointObserver, MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatSidenav, MatSidenavContent } from '@angular/material/sidenav';
import { CoreService } from 'src/app/services/core.service';
import { AppSettings } from 'src/app/config';
import { filter } from 'rxjs/operators';
import { NavigationEnd, Router } from '@angular/router';
import { NavService } from '../../services/nav.service';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { TablerIconsModule } from 'angular-tabler-icons';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AppNavItemComponent } from './sidebar/nav-item/nav-item.component';
import { NavItem } from './sidebar/nav-item/nav-item';
import { SidebarSection, SidebarRoute } from '@app/models/sideBarRules';
import { SideBarService } from '@app/services/side-bar.service';

const MOBILE_VIEW   = 'screen and (max-width: 768px)';
const TABLET_VIEW   = 'screen and (min-width: 769px) and (max-width: 1024px)';
const MONITOR_VIEW  = 'screen and (min-width: 1024px)';
const BELOWMONITOR  = 'screen and (max-width: 1023px)';

interface apps       { id: number; img: string; title: string; subtitle: string; link: string; }
interface quicklinks { id: number; title: string; link: string; }

@Component({
  selector: 'app-full',
  imports: [
    RouterModule,
    AppNavItemComponent,
    MaterialModule,
    CommonModule,
    SidebarComponent,
    NgScrollbarModule,
    TablerIconsModule,
    HeaderComponent,
  ],
  templateUrl: './full.component.html',
  styleUrl:    './full.component.scss',   // ← referencia al nuevo SCSS
  encapsulation: ViewEncapsulation.None   // los estilos afectan al DOM real (necesario para Material)
})
export class FullComponent implements OnInit {
  navItems: NavItem[] = [];
  isLoadingSidebar = true;

  @ViewChild('leftsidenav') public sidenav!: MatSidenav;
  @ViewChild('content', { static: true }) content!: MatSidenavContent;

  resView = false;
  options = this.settings.getOptions();

  private layoutChangesSubscription = Subscription.EMPTY;
  private sidebarSubscription       = Subscription.EMPTY;
  private isMobileScreen            = false;
  private isContentWidthFixed       = true;
  private isCollapsedWidthFixed     = false;
  private htmlElement!: HTMLHtmlElement;

  isFilterNavOpen = false;

  get isOver():   boolean { return this.isMobileScreen; }
  get isTablet(): boolean { return this.resView; }

  // ── datos heredados del template original (sin cambios) ──────────────
  apps: apps[] = [
    { id:1, img:'/assets/images/svgs/icon-dd-chat.svg',        title:'Chat Application', subtitle:'Messages & Emails',    link:'/apps/chat'         },
    { id:2, img:'/assets/images/svgs/icon-dd-cart.svg',        title:'Todo App',         subtitle:'Completed task',       link:'/apps/todo'         },
    { id:3, img:'/assets/images/svgs/icon-dd-invoice.svg',     title:'Invoice App',      subtitle:'Get latest invoice',   link:'/apps/invoice'      },
    { id:4, img:'/assets/images/svgs/icon-dd-date.svg',        title:'Calendar App',     subtitle:'Get Dates',            link:'/apps/calendar'     },
    { id:5, img:'/assets/images/svgs/icon-dd-mobile.svg',      title:'Contact App',      subtitle:'2 Unsaved Contacts',   link:'/apps/contacts'     },
    { id:6, img:'/assets/images/svgs/icon-dd-lifebuoy.svg',    title:'Tickets App',      subtitle:'Create new ticket',    link:'/apps/tickets'      },
    { id:7, img:'/assets/images/svgs/icon-dd-message-box.svg', title:'Email App',        subtitle:'Get new emails',       link:'/apps/email/inbox'  },
    { id:8, img:'/assets/images/svgs/icon-dd-application.svg', title:'Courses',          subtitle:'Create new course',    link:'/apps/courses'      },
  ];

  quicklinks: quicklinks[] = [
    { id:1, title:'Pricing Page',          link:'/theme-pages/pricing'         },
    { id:2, title:'Authentication Design', link:'/authentication/login'        },
    { id:3, title:'Register Now',          link:'/authentication/side-register'},
    { id:4, title:'404 Error Page',        link:'/authentication/error'        },
    { id:5, title:'Notes App',             link:'/apps/notes'                  },
    { id:6, title:'Employee App',          link:'/apps/employee'               },
    { id:7, title:'Todo Application',      link:'/apps/todo'                   },
    { id:8, title:'Treeview',              link:'/theme-pages/treeview'        },
  ];
  // ─────────────────────────────────────────────────────────────────────

  constructor(
    private settings:         CoreService,
    private mediaMatcher:     MediaMatcher,
    private router:           Router,
    private breakpointObserver: BreakpointObserver,
    private navService:       NavService,
    private cdr:              ChangeDetectorRef,
    private sideBarService:   SideBarService,
  ) {
    this.htmlElement = document.querySelector('html')!;

    this.layoutChangesSubscription = this.breakpointObserver
      .observe([MOBILE_VIEW, TABLET_VIEW, MONITOR_VIEW, BELOWMONITOR])
      .subscribe((state) => {
        this.options.sidenavOpened = true;
        this.isMobileScreen = state.breakpoints[BELOWMONITOR];
        if (!this.options.sidenavCollapsed) {
          this.options.sidenavCollapsed = state.breakpoints[TABLET_VIEW];
        }
        this.isContentWidthFixed = state.breakpoints[MONITOR_VIEW];
        this.resView             = state.breakpoints[BELOWMONITOR];
      });

    this.receiveOptions(this.options);

    // Scroll al tope en cada navegación
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.content.scrollTo({ top: 0 }));
  }

  ngOnInit(): void {
    this.sidebarSubscription = this.sideBarService.getSideBarSections().subscribe({
      next:  (sections) => { this.navItems = this.mapSectionsToNavItems(sections); this.isLoadingSidebar = false; },
      error: (err)      => { console.error('[FullComponent] sidebar error:', err); this.navItems = []; this.isLoadingSidebar = false; },
    });
  }

  ngOnDestroy(): void {
    this.layoutChangesSubscription.unsubscribe();
    this.sidebarSubscription.unsubscribe();
  }

  toggleFilterNav(): void {
    this.isFilterNavOpen = !this.isFilterNavOpen;
    this.cdr.detectChanges();
  }

  toggleCollapsed(): void {
    this.isContentWidthFixed       = false;
    this.options.sidenavCollapsed  = !this.options.sidenavCollapsed;
    this.resetCollapsedState();
  }

  resetCollapsedState(timer = 400): void {
    setTimeout(() => this.settings.setOptions(this.options), timer);
  }

  onSidenavClosedStart(): void  { this.isContentWidthFixed = false; }

  onSidenavOpenedChange(isOpened: boolean): void {
    this.isCollapsedWidthFixed = !this.isOver;
    this.options.sidenavOpened = isOpened;
    this.settings.setOptions(this.options);
  }

  receiveOptions(options: AppSettings): void {
    this.toggleDarkTheme(options);
    this.toggleColorsTheme(options);
  }

  private mapSectionsToNavItems(sections: SidebarSection[]): NavItem[] {
    const items: NavItem[] = [];
    for (const section of sections) {
      items.push({ navCap: section.navCap });
      for (const route of section.routes) {
        items.push(this.mapRouteToNavItem(route));
      }
    }
    return items;
  }

  private mapRouteToNavItem(route: SidebarRoute): NavItem {
    return {
      displayName: route.displayName,
      iconName:    route.iconName,
      route:       route.route,
      disabled:    route.disabled,
      children:    route.children?.map((child) => this.mapRouteToNavItem(child)),
    };
  }

  private toggleDarkTheme(options: AppSettings): void {
    this.htmlElement.classList.toggle('dark-theme',  options.theme === 'dark');
    this.htmlElement.classList.toggle('light-theme', options.theme !== 'dark');
  }

  private toggleColorsTheme(options: AppSettings): void {
    this.htmlElement.classList.forEach((c) => { if (c.endsWith('_theme')) this.htmlElement.classList.remove(c); });
    this.htmlElement.classList.add(options.activeTheme);
  }
}