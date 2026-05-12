# Auth Layout

## Descripción

El **Auth Layout** es un layout especializado para páginas de autenticación sin componentes de navegación como header o sidebar. Este layout está diseñado para presentar página completa con solo el contenido de autenticación.

## Características

- ✅ Sin componentes de navegación (header, sidebar)
- ✅ Página completa (full-page)
- ✅ Rutas limitadas y definidas
- ✅ Componente standalone
- ✅ Estilos optimizados para autenticación

## Rutas Disponibles

Las siguientes rutas están disponibles bajo el path `/auth`:

| Ruta | Descripción |
|------|-------------|
| `/auth/login` | Página de login |
| `/auth/register` | Página de registro |
| `/auth/forgot-password` | Recuperar contraseña |
| `/auth/reset-password` | Resetear contraseña |

## Uso

### Ejemplo de navegación a login:

```typescript
this.router.navigate(['/auth/login']);
```

### Ejemplo de navegación a registro:

```typescript
this.router.navigate(['/auth/register']);
```

## Estructura

```
src/app/layouts/auth/
├── auth-layout.component.ts          # Componente principal
├── auth-layout.component.html         # Template (solo router-outlet)
├── auth-layout.component.scss         # Estilos del layout
├── auth-layout.routes.ts              # Definición de rutas
└── README.md                           # Este archivo
```

## Agregando nuevas rutas

Para agregar una nueva ruta de autenticación:

1. Actualiza `auth-layout.routes.ts`:

```typescript
{
  path: 'nueva-ruta',
  loadChildren: () =>
    import('../../pages/authentication/nueva-ruta/nueva-ruta.routes').then(
      (m) => m.NuevaRutaRoutes
    ),
},
```

2. La ruta estará disponible en `/auth/nueva-ruta`

## Notas

- Este layout no contiene header, sidebar, o cualquier componente de navegación
- Es ideal para páginas de login, registro, recuperación de contraseña, etc.
- Todas las rutas están limitadas y definidas explícitamente
- El componente es standalone y puede ser fácilmente modularizado si es necesario
