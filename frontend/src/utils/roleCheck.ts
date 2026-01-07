// src/utils/roleCheck.ts

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'USER';

export const getRedirectPath = (role: UserRole): string => {
  switch (role) {
    case 'SUPERADMIN':
      return '/dashboard';
    case 'ADMIN':
      return '/';
    case 'USER':
      return '/';
    default:
      return '/';
  }
};

export const hasRole = (
  userRole: UserRole,
  allowedRoles: UserRole[]
): boolean => {
  return allowedRoles.includes(userRole);
};

export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case 'SUPERADMIN':
      return 'Super Administrateur';
    case 'ADMIN':
      return 'Administrateur';
    case 'USER':
      return 'Utilisateur';
    default:
      return 'Utilisateur';
  }
};
