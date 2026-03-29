export type AdminRoleDTO = 'super_admin' | 'admin' | 'receptionist';

export interface AdminUserDTO {
    readonly uid: string;
    readonly email: string;
    readonly role: AdminRoleDTO;
    readonly displayName?: string;
    readonly createdAt: string;
}

export interface AuthStateDTO {
    readonly user: AdminUserDTO | null;
    readonly loading: boolean;
    readonly error: string | null;
}
