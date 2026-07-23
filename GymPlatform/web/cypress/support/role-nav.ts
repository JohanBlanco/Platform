/** Rutas de aterrizaje por rol (abren el grupo correcto del sidebar). */
export const ROLE_LANDING: Record<'admin' | 'reception' | 'instructor' | 'member', string> = {
  reception: '/ventas/punto-de-venta',
  instructor: '/training/rutinas',
  member: '/servicios/actividades',
  admin: '/reception/usuarios',
}

export const ROLE_NAV = {
  reception: {
    hrefPrefixes: ['/ventas/', '/reception/'],
    forbiddenHrefPrefixes: ['/estadisticas/'],
  },
  instructor: {
    hrefPrefixes: ['/training/', '/agenda/'],
    forbiddenHrefPrefixes: ['/estadisticas/'],
  },
  member: {
    hrefPrefixes: ['/servicios/'],
    forbiddenHrefPrefixes: ['/reception/', '/estadisticas/'],
  },
  admin: {
    hrefPrefixes: ['/reception/', '/estadisticas/'],
    forbiddenHrefPrefixes: [] as string[],
  },
} as const

export type RoleNavKey = keyof typeof ROLE_NAV
