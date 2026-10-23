const adminRoutes = new Set(['/admin/manage-users', '/admin/activity-logs', '/admin/appearance', '/change-password']);
const protectedRoutes = new Set([
  '/accounts', '/admin/appearance', '/admin/manage-users', '/admin/activity-logs',
  '/ai-assistant', '/analytics', '/budget', '/change-password', '/dashboard',
  '/loans', '/obligations', '/onboarding/budget', '/onboarding/income',
  '/onboarding/recurring', '/onboarding/role', '/settings', '/subscription', '/transactions',
]);

export function normalizeAppPathname(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

export function getRouteAccess(pathname: string, accountRole?: string) {
  const path = normalizeAppPathname(pathname);
  const isProtected = protectedRoutes.has(path);
  const isAdmin = accountRole === 'ADMIN';
  const hasWrongRole = Boolean(isProtected && accountRole && (
    (path.startsWith('/admin/') && !isAdmin) || (isAdmin && !adminRoutes.has(path))
  ));
  return { isProtected, isAdmin, hasWrongRole };
}
