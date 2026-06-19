export interface SidebarSection {
    navCap: NavCap;
    icon?: string;

    visible: boolean;

    routes: SidebarRoute[];
}


// Ruta especifica de cada pagina de nuestro aplicativo(Principalmente List)
export interface SidebarRoute {
  displayName: string;
  iconName?: string;
  route?: string;
  visible: boolean;
  disabled?: boolean;
  children?: SidebarRoute[];
}

export enum NavCap{
    HOME = 'Home',
    SECURITY_ADMIN = 'Security Admin',
    MANAGEMENT_CLASIFICATOR = 'Management Clasificator',
    CLASIFICATION = 'Classification',
    PATIENT = 'My Health',
    DOCTOR_MANAGEMENT = 'Medical Management'
}