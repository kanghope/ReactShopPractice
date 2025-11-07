import {
    createContext, 
    useContext, 
    useState,
    useMemo, // 성능 최적화를 위해 useMemo 추가
    useCallback, // ⭐️ useCallback 추가
    type ReactNode
} from 'react'; 

import axios from 'axios'; 
// NOTE: 외부 import인 UserRole을 이 파일 내에서 정의합니다.
// 실제 프로젝트에서는 이 타입을 별도의 파일에서 import해야 합니다.
/** 사용자 역할을 정의하는 타입 */
type UserRole = 'USER' | 'ADMIN' | 'GUEST'; 

/** 사용자 정보 타입 */
interface User {
    id: string; // 사용자의 고유 ID
    role: UserRole; // 사용자의 역할
    // 필요한 경우 email, name 등을 추가할 수 있습니다.
}

// ----------------------------------------------------
// 1. AuthContextType: Role 및 isAdmin 필드 포함
// ----------------------------------------------------
interface AuthContextType {
    user: User | null; // 사용자 정보 또는 null
    isAuthenticated: boolean;
    isAdmin: boolean;  // 관리자 여부 상태
    /**
     * 사용자 로그인을 처리하고 상태를 업데이트하는 함수
     * @param accessToken - JWT 액세스 토큰
     * @param refreshToken - JWT 리프레시 토큰
     * @param userId - 로그인한 사용자의 고유 ID
     * @param userRole - 로그인한 사용자의 역할
     */
    login: (
        accessToken: string, 
        refreshToken: string, 
        userId: string, 
        userRole: UserRole
    ) => void; 

    /**
     * 역할(role) 정보만 업데이트할 때 사용합니다. (부분 업데이트)
     * @param data - 업데이트할 역할 정보를 포함하는 객체
     */
    setAuthData: (data: { role: string | null }) => void; 
    logout: () => void;
}

// ----------------------------------------------------
// 2. AuthContext 생성
// ----------------------------------------------------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * JWT 토큰 및 인증 상태 관리 Context Provider
 */
interface AuthProviderProps {
    children: ReactNode;
}

// 로컬 스토리지에서 초기 사용자 정보를 로드하는 유틸리티 함수
const loadInitialUser = (): User | null => {
    const role = localStorage.getItem('userRole') as UserRole | null;
    const id = localStorage.getItem('userId');

    if (role && id) {
        return { id, role };
    }
    return null;
};


export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => { 
    // ⭐️ [수정] user 상태를 관리하도록 변경
    const [user, setUser] = useState<User | null>(loadInitialUser);
    const [isLogoutProcessing, setIsLogoutProcessing] = useState(false);

    // 파생 상태 (Derived State)
    const isAuthenticated = !!user; 
    const isAdmin = user?.role === 'ADMIN'; 

    /**
     * 사용자 로그인을 처리하고 상태를 업데이트하는 함수
     * ⭐️ useCallback 적용: setUser는 안정된 함수이므로 의존성 배열은 [setUser]
     */
    const login = useCallback((
        accessToken: string, 
        refreshToken: string, 
        userId: string, 
        userRole: UserRole
    ) => {
        // 토큰은 HttpOnly 쿠키로 관리된다고 가정하고, 
        // 클라이언트 상태에는 사용자 ID와 역할만 저장합니다.
        const newUser: User = { id: userId, role: userRole };
        setUser(newUser);

        // 로컬 스토리지에 역할과 ID를 저장하여 새로고침 후에도 상태 유지
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('userId', userId);

        console.log('로그인 성공: 사용자 ID와 역할이 저장됨');
    }, [setUser]);

    /**
     * 역할 정보만 업데이트합니다. (예: 새로고침 후 서버에서 역할 정보만 받은 경우)
     */
    const setAuthData = useCallback(( data : {role: string | null }) => {
        const role = (data.role as UserRole) || null;
        
        if (user && role) {
            const updatedUser = { ...user, role };
            setUser(updatedUser);
            localStorage.setItem('userRole', role);
        } else if (!role) {
            // 역할 정보가 없으면 로그아웃과 동일하게 처리 (선택적)
            setUser(null);
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
        }
        // NOTE: userId가 없으면 이 함수만으로는 user 객체를 만들 수 없습니다.
        // user 객체는 반드시 login 함수를 통해 id와 role이 동시에 설정되어야 합니다.
    }, [user, setUser]);// user 상태가 변경될 때마다 함수 재생성
    
     /**
     * 로그아웃 처리 함수
     * ⭐️ useCallback 적용: 중복 호출 방지 및 상태 정리
     */
    const logout = useCallback(async () => {
        if (isLogoutProcessing) return; // 중복 호출 방지
        setIsLogoutProcessing(true);

        try {
            // ⭐️ 서버에 로그아웃 요청: HttpOnly 쿠키 제거 유도
            // axios를 사용하여 POST 요청을 보내고 withCredentials 옵션을 통해 쿠키를 전송합니다.
            await axios.post('/api/members/logout', {}, { withCredentials: true }); 
            console.log('서버 로그아웃 요청 완료: 쿠키 제거됨');
        } catch (error) {
            // 서버 요청 실패 시에도 로컬 상태는 정리해야 합니다.
            console.error('Logout API call failed, but clearing local state.', error);
        } finally {
            // 로컬 상태 초기화
            setUser(null); 
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
            
            setIsLogoutProcessing(false);

            // (선택 사항) 메인 페이지로 리다이렉트
            window.location.href = '/';
        }
    }, [isLogoutProcessing, setIsLogoutProcessing, setUser]); 
    
    // Context Value는 useMemo를 사용하여 불필요한 리렌더링을 방지합니다.
    const contextValue = useMemo(() => ({
        user, 
        isAuthenticated, 
        isAdmin, 
        login, 
        setAuthData, 
        logout
    }), [user, isAuthenticated, isAdmin]);


    // Provider 컴포넌트는 반드시 JSX를 반환해야 합니다.
    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Auth Context를 사용하는 Custom Hook
 */
export const useAuth = () => {
    const context = useContext(AuthContext); 
    if (context === undefined) {
        // AuthProvider 외부에서 호출 시 예외 발생
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
