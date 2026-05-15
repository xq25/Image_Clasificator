export interface Permission {
  id: string;
  url: string;
  method?: string;
  model?:string;
}

export enum HttpMethod {
  GET    = 'GET',
  POST   = 'POST',
  PUT    = 'PUT',
  DELETE = 'DELETE'
}
 
export enum PermissionModel {
  ROLE       = 'Role',
  USER       = 'User',
  PERMISSION = 'Permission',
  PROFILE    = 'Profile',
  ROLEEPERMISSION = 'RolePermission',
  USERROLE   = 'UserRole',
  PHOTOS = 'Photo'
}