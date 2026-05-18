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
  route: string;
  
  visible: boolean;
}

export enum NavCap{
    HOME = 'Home',
    SECURITY_ADMIN = 'Security Admin',
    MANAGEMENT_CLASIFICATOR = 'Management Clasificator'
}