import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { type TokenResponse } from '../types/member.ts';
import { logoutSuccess, updateRole } from '@/store/slices/authSlice.ts';
import { store } from '@/store/index.ts';

// -------------------------------------------------------------------------
// [인터페이스 확장] 
// InternalAxiosRequestConfig를 확장하여 커스텀 _retry 플래그를 추가합니다.
// 이 플래그는 동일한 요청이 무한정 재시도되는 것을 방지합니다.
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
 * config 객체(URL, 헤더, 데이터 등 설정값)를 인자로 받습니다.
이 안에서 **공통 헤더(예: JWT 토큰)**를 심거나 로그를 남기는 작업을 합니다.
반드시 return config;를 해줘야 요청이 멈추지 않고 서버로 전송됩니다.
 * 모든 요청이 서버로 나가기 직전에 실행됩니다.
 * 쿠키 방식을 사용하므로 헤더에 토큰을 직접 넣는 코드는 생략하지만, 
 * 요청 로그를 남기거나 설정을 변경할 때 사용합니다.
 */
apiClient.interceptors.request.use(
    (config) => {
        // ⭐️ 권장: 실제 앱에서는 localStorage 대신 Auth Context/Global State를 사용해야 합니다.
       
        return config;
    },
    (error) => {
        return Promise.reject(error);
        //받은 error 객체를 Promise.reject(error)로 감싸서 반환합니다. 이는 오류를 즉시 전파하여 API 호출의 catch 블록으로 넘어가도록 합니다.
    }
);


// 토큰 리프레시 플래그 (무한 루프 방지)
let isRefreshing = false;
let failedQueue: any[] = []; // 갱신 중 들어온 요청들을 담아두는 대기열


// 실패한 요청들을 큐에 넣거나 실행시키는 함수
const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (token) {
            // 갱신된 새 토큰으로 큐에 있던 요청의 재시도를 준비// 성공 시 대기 중인 Promise 해결
            prom.resolve(token);
        } else {
            // 토큰 갱신 자체가 실패하여 큐에 있던 요청들을 모두 실패 처리// 실패 시 대기 중인 Promise 거절
            prom.reject(error);
        }
    });
    failedQueue = [];
};

/**
 * 3. 응답 인터셉터: 401 Unauthorized 에러 처리 (토큰 만료 시 재발급)
 * interceptors.response.use는 **두 개의 인자(함수)**를 받는 함수입니다.
자바스크립트 함수에서 인자를 여러 개 보낼 때 (인자1, 인자2)와 같이 콤마로 구분하는 것과 같습니다.
첫 번째 인자: 응답이 **성공(2xx 상태 코드)**했을 때 실행될 함수
두 번째 인자: 응답이 **실패(4xx, 5xx 상태 코드)**했을 때 실행될 함수
구조를 풀어서 쓰면 이렇습니다:
JavaScript
apiClient.interceptors.response.use(
    function (response) { 
        // 성공했을 때 할 일
        return response; 
    }, 
    function (error) { 
        // 에러 났을 때 할 일
        return Promise.reject(error); 
    }
);
 */
apiClient.interceptors.response.use(
    // (1) 성공 콜백: 서버 응답이 정상(200~299)일 때 실행
    (response) => response,
    // (2) 실패 콜백: 서버 응답이 에러이거나 네트워크 문제가 있을 때 실행
    async (error: AxiosError) => {
        // 여기에 에러 처리 로직(예: 토큰 재발급)이 들어감
        // ------------------------------------------------------------------
        // ⭐️ 디버깅 코드 추가 ⭐️
        console.error("Axios Error Detected:", error);
        if (!error.response) {
            console.error("🚨 서버와 연결할 수 없습니다. 네트워크 상태를 확인하거나 나중에 다시 시도하세요.");
            console.error("Error Name:", error.name);
            console.error("Error Code:", error.code);
            // 여기에서 네트워크 오류 처리를 추가할 수 있습니다.
            // 예: 사용자에게 "네트워크 연결 상태를 확인해주세요" 메시지를 표시
            // window.alert("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
            return Promise.reject(error); // 여기서 함수를 종료하고 error를 반환
        }
        // ------------------------------------------------------------------
        //직역: "에러가 난 원래의 요청 설정을 RetryAxiosRequestConfig 타입으로 간주해서 originalRequest 변수에 담아라."
        /*
        의미: 이 변수는 **"사고가 나기 직전의 상황 기록"**입니다.
        어떤 주소(url)로 보냈었는지, 어떤 데이터(data)를 담았었는지 등의 정보가 들어있습니다.
        왜 필요한가?: 나중에 토큰을 새로 발급받은 뒤, 이 정보를 그대로 사용해서 **"아까 실패했던 그 요청 그대로 다시 한번 보내기(재시도)"**를 하기 위해 미리 저장해두는 것입니다.
        as ... 부분은 타입스크립트에게 "이 변수는 재시도 여부(_retry) 같은 추가 속성이 들어있는 특수한 타입이야"라고 알려주는 것입니다.
        */
        const originalRequest = error.config as RetryAxiosRequestConfig;
        /*
        직역: "서버의 응답 에러 객체가 존재한다면 그 안의 상태 코드(status)를 꺼내서 status 변수에 담아라."
        의미: 이 변수는 **"에러의 원인 번호"**입니다.
        ?. (옵셔널 체이닝): 앞서 설명드린 대로 서버 응답이 아예 없는(네트워크 에러 등) 경우에는 error.response가 undefined일 수 있습니다.
         이때 에러가 나지 않도록 "있으면 꺼내고, 없으면 통과해"라는 안전장치입니다.
        번호의 의미:
        401: "너 토큰 만료됐어" (가장 핵심)
        403: "너 권한 없어"
        500: "나(서버) 아파"
        */
        const status = error.response?.status; 
        //const dispatch = useDispatch();

        if (status === 401 && originalRequest && !originalRequest._retry) {
            
            // =========================================================================
            // ⭐️ 수정된 로직: 로그인 실패 시 서버 메시지를 명확하게 전달
            // =========================================================================
            if (originalRequest.url && originalRequest.url.includes('/members/login')) {
                console.warn("Axios 인터셉터: 로그인 401 에러 감지 (아이디/비밀번호 불일치).");
                
                // 서버가 보낸 JSON 응답 데이터에서 메시지를 추출합니다.
                /*
                서버가 응답을 보냈을 때 그 안에 담긴 실제 데이터(Body)입니다.
                ?.를 써서 혹시라도 응답 자체가 없을 때 에러가 나는 것을 방지합니다.
                타입스크립트에게 "이 데이터는 아마 { "message": "어쩌구" } 형태의 객체일 거야"라고 알려주는 것입니다. (타입 단언)
                데이터 안에서 실제로 message라는 이름의 키(Key) 값을 가져옵니다.
                */
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
                console.error("Axios 인터셉터: 리프레시 토큰이 만료되었습니다. 로그아웃 처리합니다.");
                window.location.href = '/members/login'; 
                return Promise.reject(error);
            }

                /*
            이 코드는 **"토큰을 새로 바꾸는 동안(isRefreshing) 
            다른 API 요청들이 줄지어 들어오면, 
            그 요청들을 잠시 멈춰 세우고 대기시키는 로직"**입니다.
            은행에서 한 명이 업무를 보는 동안(토큰 갱신), 
            뒤에 온 손님들에게 "잠시 대기표를 받고 기다리세요"라고 
            하는 것과 같습니다.
            */
            if (isRefreshing) {
                // 1. 새로운 '약속(Promise)'을 만들어서 리턴합니다. 
                // 이 요청은 여기서 일단 '멈춤' 상태가 됩니다.
                return new Promise<string>((resolve, reject) => {
                    // 2. 대기열(failedQueue)에 이 요청의 해결 방법(resolve, reject)을 담아둡니다.
                    failedQueue.push({ resolve, reject });
                })
                .then(_token => {
                    // 3. 토큰 갱신이 성공하여 resolve(token)이 호출되면 이 부분이 실행됩니다.
                    // 4. 실패했던 원래 요청(originalRequest)을 다시 서버에 보냅니다.
                    return apiClient(originalRequest);
                })
                .catch(err => {
                    // 5. 만약 토큰 갱신 자체가 실패(reject)하면 이 요청도 최종 실패 처리합니다.
                    return Promise.reject(err);
                });
            }
            
            // 4. 토큰 갱신 시작
            originalRequest._retry = true;
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
                //localStorage.setItem('userRole', newRole);// UI 권한 제어용 저장
                // ✅ dispatch 대신 store.dispatch를 직접 사용
                store.dispatch(updateRole(newRole));
                

                
                // 6. 큐에 있는 요청들을 새 토큰으로 재시도
                // (Axios 기본 헤더 업데이트 불필요 - 쿠키 자동 전송)
                processQueue(null, newAccessToken); // 큐에 대기 중이던 요청들에게 새 토큰 발급 완료 알림
                
                // 7. 원래 실패했던 요청 재시도 (새 AccessToken 쿠키가 자동으로 포함됨)
                return apiClient(originalRequest);

            } catch (refreshError) {
                // 갱신 실패 시 (리프레시 토큰 만료 등)
                processQueue(refreshError, null);
                
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

                
                            
                /*
                localStorage.removeItem('userRole');
                localStorage.removeItem('userId');
            */
                // 최종적으로 로그인 페이지로 리다이렉트
                store.dispatch(logoutSuccess());
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
