import { useSelector } from 'react-redux';

export function useRBAC() {
  const user = useSelector((state) => state.auth.user);
  
  const isSuperAdmin = user?.role?.name === 'SUPER_ADMIN';
  const isStaff = user?.role && user.role.name !== 'CUSTOMER';
  const currentRole = user?.role;
  const permissions = user?.role?.permissions || [];

  const hasPermission = (permissionName) => {
    if (isSuperAdmin) return true;
    return permissions.some(p => p.name === permissionName);
  };

  const hasAnyPermission = (permissionNames = []) => {
    if (isSuperAdmin) return true;
    return permissionNames.some(name => permissions.some(p => p.name === name));
  };

  const hasAllPermissions = (permissionNames = []) => {
    if (isSuperAdmin) return true;
    return permissionNames.every(name => permissions.some(p => p.name === name));
  };

  return {
    user,
    currentRole,
    permissions,
    isSuperAdmin,
    isStaff,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  };
}
