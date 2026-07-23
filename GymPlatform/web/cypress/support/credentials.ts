/** Cuentas del seed E2E (`dev,e2e`) — login directo, sin cambio de perfil. */
export const E2E_CREDENTIALS = {
  admin: { email: 'admin@gymplatform.local', password: '12345678' },
  reception: { email: 'recepcion@gymplatform.local', password: 'recepcion123' },
  instructor: { email: 'instructor@gymplatform.local', password: 'instructor123' },
  member: { email: 'miembro@gymplatform.local', password: 'miembro123' },
} as const

export type E2eRole = keyof typeof E2E_CREDENTIALS

export const PLATFORM_ADMIN = {
  email: 'gymplatformadmin',
  password: 'gymplatformadmin',
} as const
