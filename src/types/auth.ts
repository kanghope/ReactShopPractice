// src/types/auth.ts

/**
 * 사용자 역할 타입 (예: USER, ADMIN)
 */
export type UserRole = 'USER' | 'ADMIN' | 'GUEST';

/**
 * 인증된 사용자의 정보를 담는 타입
 */
export interface User {
    userId: string | null;
    userEmail: string | null;
    userRole: UserRole;
}

/**
 * 인증 컨텍스트가 제공하는 값의 타입
 */
export interface AuthContextType {
    user: User;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (accessToken: string, refreshToken: string, userId: string, userRole: UserRole) => void;
    logout: () => void;
}
