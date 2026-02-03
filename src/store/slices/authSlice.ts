import { createSlice,type PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  role: 'USER' | 'ADMIN' | 'GUEST';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// 로컬스토리지 초기값 로드
const initialId = localStorage.getItem('userId');
const initialRole = localStorage.getItem('userRole') as User['role'] | null;

const initialState: AuthState = {
  user: initialId && initialRole ? { id: initialId, role: initialRole } : null,
  isAuthenticated: !!(initialId && initialRole),
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 로그인 액션
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('userId', action.payload.id);
      localStorage.setItem('userRole', action.payload.role);
    },
    // 로그아웃 액션
    logoutSuccess: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
    },
    // 역할만 업데이트
    updateRole: (state, action: PayloadAction<User['role']>) => {
      if (state.user) {
        state.user.role = action.payload;
        localStorage.setItem('userRole', action.payload);
      }
    }
  }
});

export const { loginSuccess, logoutSuccess, updateRole } = authSlice.actions;
export default authSlice.reducer;