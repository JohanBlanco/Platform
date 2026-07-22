import { canViewAgendaCitas } from '../roles'

export type NavSection = {
  path: string
  label: string
  description?: string
  badge?: string
  /** Si es true, se muestra como submenú colapsable (como Administración). */
  collapsible?: boolean
  children?: NavSection[]
}

export const VENTAS_SECTIONS: NavSection[] = [
  {
    path: 'punto-de-venta',
    label: 'Punto de venta',
    description: 'Cobra productos y membresías en recepción',
  },
  {
    path: 'historial',
    label: 'Ventas',
    description: 'Historial del día, mes y año; ingresos y gastos',
  },
]

export const ESTADISTICAS_SECTIONS: NavSection[] = [
  {
    path: 'resumen',
    label: 'Dashboard',
    description: 'Finanzas del gym: ingresos, gastos y ventas en gráficas fáciles de leer',
  },
]

/** Grupo Reservaciones: explorar y agendar */
export const MEMBER_RESERVACIONES_SECTIONS: NavSection[] = [
  { path: 'actividades', label: 'Actividades', description: 'Explora clases y reserva tu cupo' },
  { path: 'solicitudes-citas', label: 'Citas', description: 'Elige un horario disponible' },
]

/** Ítems planos del miembro (fuera de Reservaciones) */
export const MEMBER_FLAT_SECTIONS: NavSection[] = [
  { path: 'mis-actividades', label: 'Mis actividades', description: 'Clases que ya reservaste' },
  { path: 'mis-citas', label: 'Mis citas', description: 'Citas que ya agendaste' },
  { path: 'rutinas', label: 'Mis rutinas', description: 'Rutinas asignadas por tu instructor' },
  { path: 'nutricion', label: 'Mi nutrición', description: 'Plan alimenticio asignado', badge: 'Beta' },
  { path: 'medidas', label: 'Mis medidas', description: 'Composición corporal', badge: 'Beta' },
]

/** Todas las secciones miembro (para layouts / redirects) */
export const MEMBER_SECTIONS: NavSection[] = [
  ...MEMBER_RESERVACIONES_SECTIONS,
  ...MEMBER_FLAT_SECTIONS,
]

export const RECEPTION_SECTIONS: NavSection[] = [
  {
    path: 'usuarios',
    label: 'Usuarios',
    collapsible: true,
    children: [
      {
        path: 'usuarios',
        label: 'Personal y miembros',
        description: 'Personal y miembros del gimnasio',
      },
      {
        path: 'expedientes',
        label: 'Expedientes',
        description: 'Formularios completados por cada miembro. Visualiza y descarga en PDF.',
      },
    ],
  },
  { path: 'productos', label: 'Productos', description: 'Inventario y catálogo de la tienda' },
  {
    path: 'actividades',
    label: 'Actividades',
    description: 'Catálogo de clases con imagen, horario y cupo',
  },
  { path: 'membresias', label: 'Membresías', description: 'Planes de acceso y actividades incluidas' },
]

/** Secciones de recepción en lista plana (incluye anidadas; omite nodos solo-colapso). */
export function flattenNavSections(sections: NavSection[]): NavSection[] {
  const out: NavSection[] = []
  for (const section of sections) {
    if (section.collapsible && section.children?.length) {
      out.push(...flattenNavSections(section.children))
      continue
    }
    out.push(section)
    if (section.children?.length) {
      out.push(...flattenNavSections(section.children))
    }
  }
  return out
}

export const AGENDA_CITAS_SECTION: NavSection = {
  path: 'citas',
  label: 'Citas',
  description: 'Agenda, disponibilidad y solicitudes de cita',
}

export const AGENDA_ACTIVIDADES_SECTION: NavSection = {
  path: 'actividades',
  label: 'Actividades',
  description: 'Clases y eventos por periodo',
}

export const AGENDA_SECTIONS: NavSection[] = [
  AGENDA_CITAS_SECTION,
  AGENDA_ACTIVIDADES_SECTION,
]

/** Agenda filtrada por rol (citas: staff; actividades: administrador/recepción). */
export function getAgendaSections(activeRole: string | null | undefined): NavSection[] {
  const sections: NavSection[] = []
  if (canViewAgendaCitas(activeRole)) {
    sections.push(AGENDA_CITAS_SECTION)
  }
  // Calendario de actividades: administrador y recepción (no instructor)
  if (activeRole != null && ['GYM_OWNER', 'RECEPTIONIST'].includes(activeRole)) {
    sections.push(AGENDA_ACTIVIDADES_SECTION)
  }
  return sections
}

export function agendaSectionsForRole(activeRole: string | null | undefined): NavSection[] {
  return getAgendaSections(activeRole)
}

export function canViewAgenda(activeRole: string | null | undefined): boolean {
  return getAgendaSections(activeRole).length > 0
}

export const TRAINING_SECTIONS: NavSection[] = [
  { path: 'rutinas', label: 'Rutinas', description: 'Solicitudes y rutinas personalizadas' },
  { path: 'medidas', label: 'Medidas', description: 'Mediciones corporales y análisis', badge: 'Beta' },
  { path: 'nutricion', label: 'Nutrición', description: 'Planes alimenticios personalizados', badge: 'Beta' },
]

export const MERCADEO_SECTIONS: NavSection[] = [
  {
    path: 'actividades',
    label: 'Promocionar actividades',
    description: 'Carrusel del inicio: hasta 3 clases destacadas con imagen',
  },
  {
    path: 'productos',
    label: 'Descuentos',
    description: 'Ofertas y descuentos con etiqueta % OFF en la tienda',
  },
]

export const DEFAULT_PASSWORD = '12345678'
