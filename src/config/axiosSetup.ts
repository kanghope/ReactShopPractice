import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { type TokenResponse } from '../types/member.ts';

// -------------------------------------------------------------------------
// [수정된 부분] 
// InternalAxiosRequestConfig를 확장하여 커스텀 _retry 플래그를 추가합니다.
interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}
// -------------------------------------------------------------------------

// 1. 기본 Axios 인스턴스 생성
const apiClient = axios.create({
    baseURL: '/api', // 기본 API 경로 설정 (예: /api/members, /api/items)
    timeout: 10000, // 10초 타임아웃
    headers: {
        'Content-Type': 'application/json',
    },
    // ⭐️ 핵심 추가: 브라우저가 HttpOnly 쿠키를 서버에 함께 전송하도록 허용
    withCredentials: true,
});

/**
 * 2. 요청 인터셉터: 모든 요청에 JWT Access Token 추가
 */
apiClient.interceptors.request.use(
    (config) => {
        // ⭐️ 권장: 실제 앱에서는 localStorage 대신 Auth Context/Global State를 사용해야 합니다.
       
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


// 토큰 리프레시 플래그 (무한 루프 방지)
let isRefreshing = false;

// 실패한 요청을 저장할 큐의 타입 정의
type FailedRequestPromise = {
    resolve: (value: string) => void;
    reject: (reason?: any) => void;
}

let failedQueue: FailedRequestPromise[] = [];

// 실패한 요청들을 큐에 넣거나 실행시키는 함수
const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (token) {
            // 갱신된 새 토큰으로 큐에 있던 요청의 재시도를 준비
            prom.resolve(token);
        } else {
            // 토큰 갱신 자체가 실패하여 큐에 있던 요청들을 모두 실패 처리
            prom.reject(error);
        }
    });
    failedQueue = [];
};

/**
 * 3. 응답 인터셉터: 401 Unauthorized 에러 처리 (토큰 만료 시 재발급)
 */
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        // ------------------------------------------------------------------
        // ⭐️ 디버깅 코드 추가 ⭐️
        console.error("Axios Error Detected:", error);
        if (!error.response) {
            console.error("🚨 CRITICAL: error.response is undefined. This is a Network/Timeout issue, not a Server issue.");
            console.error("Error Name:", error.name);
            console.error("Error Code:", error.code);
            // 여기에서 네트워크 오류 처리를 추가할 수 있습니다.
            // 예: 사용자에게 "네트워크 연결 상태를 확인해주세요" 메시지를 표시
            // window.alert("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
            return Promise.reject(error); // 여기서 함수를 종료하고 error를 반환
        }
        // ------------------------------------------------------------------
        
        const originalRequest = error.config as RetryAxiosRequestConfig;
        const status = error.response?.status; 
        
        if (status === 401 && originalRequest && !originalRequest._retry) {
            
            // =========================================================================
            // ⭐️ 수정된 로직: 로그인 실패 시 서버 메시지를 명확하게 전달
            // =========================================================================
            if (originalRequest.url && originalRequest.url.includes('/members/login')) {
                console.warn("Axios Interceptor: Login 401 detected (ID/PW mismatch).");
                
                // 서버가 보낸 JSON 응답 데이터에서 메시지를 추출합니다.
                const serverMessage = (error.response?.data as { message?: string })?.message;

                // 추출한 메시지가 있다면 error 객체에 포함시켜 Promise.reject()로 전달합니다.
                // 이렇게 하면 최종 호출자는 error.message를 사용하여 사용자에게 바로 보여줄 수 있습니다.
                if (serverMessage) {
                    error.message = serverMessage; // error.message를 서버 메시지로 덮어씁니다.
                }

                return Promise.reject(error); // 수정된 error 객체를 전달
            }
            // =========================================================================

            // 리프레시 요청 자체였는데 401이 뜬 경우 (리프레시 토큰 만료)
            if (originalRequest.url === '/api/members/refresh') {
                // ⭐️ 변경: localStorage.clear() 대신 서버 로그아웃 API 호출 (쿠키 제거)
                await axios.post('/api/members/logout', {}, { withCredentials: true }); 
                console.error("Axios Interceptor: Refresh token expired. Logging out.");
                window.location.href = '/members/login'; 
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            if (isRefreshing) {
                // ... (큐 대기 로직 유지)
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(_token => {
                    // 새 토큰을 수동으로 헤더에 추가하지 않아도 브라우저가 자동으로 쿠키를 포함하여 전송하지만,
                    // 무한 루프 방지를 위해 여기서 다시 한번 오리지널 요청을 실행합니다.
                    return apiClient(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }
            
            isRefreshing = true;

            // ❌ 변경: 리프레시 토큰 존재 여부 확인 로직 제거 (쿠키는 JS 접근 불가)
            // 서버에 리프레시 요청을 보내고 401이 뜨면 리프레시 토큰이 만료된 것으로 간주합니다.

            try {
                // 4. 리프레시 토큰을 사용하여 새 토큰 요청 (쿠키가 자동 전송됨)
                const refreshResponse = await axios.post<TokenResponse>(
                    '/api/members/refresh', 
                    {}, // ⬅️ 요청 본문에 refreshToken 불필요
                    { withCredentials: true }
                );

                const newAccessToken = refreshResponse.data.accessToken;
                const newRole = refreshResponse.data.role; // 역할 정보

                // 5. 로컬 스토리지 업데이트 ❌ (토큰 쿠키 대체)
                // ⭐️ 변경: userRole만 JS에서 사용하기 위해 로컬 스토리지에 유지
                localStorage.setItem('userRole', newRole);
                
                // 6. 큐에 있는 요청들을 새 토큰으로 재시도
                // (Axios 기본 헤더 업데이트 불필요 - 쿠키 자동 전송)
                processQueue(null, newAccessToken); // 큐에 대기 중이던 요청들에게 새 토큰 발급 완료 알림
                
                // 7. 원래 실패했던 요청 재시도 (새 AccessToken 쿠키가 자동으로 포함됨)
                return apiClient(originalRequest);

            } catch (refreshError) {
                // 갱신 실패 시 (리프레시 토큰 만료)
                processQueue(refreshError);
                console.error("Axios Interceptor: Failed to refresh token. Logging out.");

                // ⭐️ [수정된 부분]: 로그아웃 API 호출을 별도의 try-catch로 감싸 $401$ 오류를 처리
                try {
                    // withCredentials: true로 쿠키를 전송하여 서버가 쿠키를 제거하도록 요청
                    // 이 요청이 401을 반환해도 에러를 무시하고 진행합니다.
                    await axios.post('/api/members/logout', {}, { withCredentials: true }); 
                    console.log("Axios Interceptor: Forced logout successful.");
                } catch (logoutError) {
                    // 401 오류가 발생하더라도 (토큰이 없어서) 로그아웃 처리를 계속 진행합니다.
                    if (axios.isAxiosError(logoutError) && logoutError.response?.status === 401) {
                        console.warn("Axios Interceptor: Logout API returned 401, but proceeding to redirect.");
                    } else {
                        // 다른 심각한 로그아웃 오류(네트워크 등)가 발생하면 기록합니다.
                        console.error("Axios Interceptor: Critical error during forced logout:", logoutError);
                    }
                }

                localStorage.removeItem('userRole');
                localStorage.removeItem('userId');

                // 최종적으로 로그인 페이지로 리다이렉트
                window.location.href = '/members/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        
        return Promise.reject(error);
    }
);
export default apiClient;
