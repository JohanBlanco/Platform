/** Cuenta bootstrap de pruebas: login gymplatformadmin — oculta en listados UI. */
const BOOTSTRAP_EMAIL = 'gymplatformadmin@gymplatform.local'

export function isBootstrapUser(user: { email?: string | null }): boolean {
  return (user.email ?? '').trim().toLowerCase() === BOOTSTRAP_EMAIL
}

export function withoutBootstrapUsers<T extends { email?: string | null }>(users: T[]): T[] {
  return users.filter((u) => !isBootstrapUser(u))
}
