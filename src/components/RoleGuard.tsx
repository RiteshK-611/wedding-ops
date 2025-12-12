import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../contexts/AuthContext';

interface RoleGuardProps {
    children: ReactNode;
    allowedRoles: UserRole[];
    fallback?: ReactNode;
}

/**
 * Conditionally renders children based on user role
 * @example
 * <RoleGuard allowedRoles={['planner']}>
 *   <DeleteButton />
 * </RoleGuard>
 */
export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
    const { hasRole, loading } = useAuth();

    if (loading) {
        return null;
    }

    if (!hasRole(allowedRoles)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

/**
 * Higher-order component for role-based access
 */
export function withRoleGuard<P extends object>(
    Component: React.ComponentType<P>,
    allowedRoles: UserRole[]
) {
    return function WrappedComponent(props: P) {
        return (
            <RoleGuard allowedRoles={allowedRoles}>
                <Component {...props} />
            </RoleGuard>
        );
    };
}

/**
 * Hook to check if current user can perform action
 */
export function useCanPerform() {
    const { hasRole, isPlanner } = useAuth();

    return {
        canEdit: isPlanner,
        canDelete: isPlanner,
        canViewGuests: hasRole(['planner', 'couple']),
        canViewSeating: hasRole(['planner', 'couple']),
        canViewRooms: hasRole(['planner', 'couple', 'hotel']),
        canViewTransport: hasRole(['planner', 'couple', 'vendor']),
        canManageTeam: isPlanner,
        canExport: hasRole(['planner', 'couple']),
        canFlagVip: hasRole(['planner', 'couple']),
        canAddNotes: hasRole(['planner', 'couple']),
    };
}
