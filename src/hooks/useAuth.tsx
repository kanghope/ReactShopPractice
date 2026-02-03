import {
    createContext, 
    useContext, 
    useMemo, // 성능 최적화를 위해 useMemo 추가
    useCallback, // ⭐️ useCallback 추가
    type ReactNode
} from 'react'; 
import { useSelector, useDispatch } from 'react-redux'; // ⭐️ 리덕스 훅 추가
import axios from 'axios'; 

// 리덕스 관련 타입 및 액션 임포트 (본인의 경로에 맞게 수정하세요)
import { type RootState } from '../store'; 
import { loginSuccess, logoutSuccess, updateRole } from '../store/slices/authSlice';

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
        //accessToken: string, 
        //refreshToken: string, 
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
/*
interface AuthProviderProps {
    children: ReactNode;
}*/

// 로컬 스토리지에서 초기 사용자 정보를 로드하는 유틸리티 함수
/*
const loadInitialUser = (): User | null => {
    const role = localStorage.getItem('userRole') as UserRole | null;
    const id = localStorage.getItem('userId');

    if (role && id) {
        return { id, role };
    }
    return null;
};*/


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => { 

    const dispatch = useDispatch();
   // ⭐️ [변경] useState 대신 리덕스 스토어에서 상태를 가져옴
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const isAdmin = user?.role === 'ADMIN';

   // ⭐️ [변경] 로그인: 리덕스 액션 디스패치
    const login = useCallback((userId: string, userRole: UserRole) => {
        dispatch(loginSuccess({ id: userId, role: userRole }));
        console.log('Redux: 로그인 성공');
    }, [dispatch]);

    // ⭐️ [변경] 역할 업데이트: 리덕스 액션 디스패치
    const setAuthData = useCallback((data: { role: string | null }) => {
        const role = data.role as UserRole | null;
        if (role) {
            dispatch(updateRole(role));
        } else {
            dispatch(logoutSuccess());
        }
    }, [dispatch]);
    
    // ⭐️ [변경] 로그아웃
    const logout = useCallback(async () => {
        try {
            await axios.post('/api/members/logout', {}, { withCredentials: true });
        } catch (error) {
            console.error('서버 로그아웃 실패, 로컬 상태만 정리합니다.');
        } finally {
            dispatch(logoutSuccess());
            window.location.href = '/';
        }
    }, [dispatch]);
    
    // Context Value는 useMemo를 사용하여 불필요한 리렌더링을 방지합니다.
    const contextValue = useMemo(() => ({
        user, 
        isAuthenticated, 
        isAdmin, 
        login, 
        setAuthData, 
        logout
    }), [user, isAuthenticated, isAdmin, login, setAuthData, logout]);


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
