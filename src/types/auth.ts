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
    // login 함수 타입 수정 (User 인터페이스와 맞춤)
    login: (accessToken: string, refreshToken: string, userId: string, userRole: UserRole) => void;
    // role만 업데이트하는 setAuthData 함수 추가 (이전에 AuthProvider에 있던 함수)
    setAuthData: (data: { role: string | null }) => void;
    logout: () => void;
}
