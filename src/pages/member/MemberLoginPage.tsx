import React, { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthFormWrapper from '../../components/common/AuthFormWrapper';
import { loginMember } from '../../api/memberApi';
import { type LoginRequest } from '../../types/member.ts';
import { useAuth } from '../../hooks/useAuth'; // 인증 상태 관리 훅
import { type UserRole } from '../../types/auth'; // UserRole 타입 추가


const initialFormState: LoginRequest = {
    email: '',
    password: '',
};

// =========================================================================
// ⭐️ [추가] 카카오 인증 URL 설정 ⭐️
// 실제 배포 시에는 .env 파일 등을 사용하여 환경 변수로 관리해야 합니다.
// REACT_APP_KAKAO_CLIENT_ID와 REACT_APP_KAKAO_REDIRECT_URI 값을 설정해야 합니다.
// 서버의 리다이렉트 URI는 인가 코드를 받아 JWT를 발급할 백엔드 API 경로여야 합니다.
const KAKAO_CLIENT_ID = import.meta.env.REACT_APP_KAKAO_CLIENT_ID || '41995ca715ee4777c817d8ba08ac344f';
// 카카오 로그인이 완료되면 이 주소로 인가 코드(Code)를 가지고 리다이렉트 됩니다.
// 이 주소는 Spring Boot의 소셜 로그인 처리 REST API 경로와 일치해야 합니다.
const KAKAO_REDIRECT_URI = import.meta.env.REACT_APP_KAKAO_REDIRECT_URI || 'http://localhost:8080/api/auth/kakao/callback';

const KAKAO_AUTH_URL = 
  `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}`;
// =========================================================================


const MemberLoginPage: React.FC = () => {
    const [formData, setFormData] = useState<LoginRequest>(initialFormState);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null); // 성공 메시지 상태 추가
    const navigate = useNavigate();
    //const { setToken } = useAuth(); // AuthContext에서 setToken 함수 가져오기
    // ⭐️ [수정] setAuthData 대신 login 함수를 가져옵니다.
    const { login } = useAuth(); 
    const location = useLocation(); // ⭐️ state를 읽기 위해 추가

    // ⭐️ 소셜 로그인 실패로 리디렉션되었을 경우 에러 메시지 설정
    useEffect( () => 
    {
        if(location.state?.error)
        {
            setError(location.state.error);
            //state를 비워 중복 표시 방시
            navigate(location.pathname, { replace: true, state : {} });
        }
    }, [location.state, navigate, location.pathname]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null); // 이전 오류 초기화
        setSuccessMessage(null); // 메시지 초기화

        try {
            // 1. 로그인 API 호출 및 JWT 토큰 받기 (role 포함)
            const tokenResponse = await loginMember(formData);

            // ⭐️ 오류 해결: memberId가 올바른 number 타입인지 확인
            if (typeof tokenResponse.id !== 'number') {
                throw new Error('로그인 응답에 사용자 ID가 올바르게 포함되어 있지 않습니다. 서버 응답 형식을 확인해주세요.');
            }

            // Access Token은 서버가 쿠키로 알아서 처리합니다.
            /*setAuthData({
                role: tokenResponse.role, 
            });*/
            
            // 2. AuthContext의 login 함수를 호출하여 사용자 정보(ID, ROLE) 저장
            login(
                tokenResponse.accessToken, 
                tokenResponse.refreshToken, 
                tokenResponse.id.toString(), // memberId를 string으로 변환하여 userId로 사용
                tokenResponse.role as UserRole 
            );
            
            // ⭐️ Custom Message UI 사용
            setSuccessMessage('로그인 성공! 잠시 후 메인 페이지로 이동합니다.');
            // 성공 메시지 표시 후 1초 뒤 이동
            setTimeout(() => {
                navigate('/'); 
            }, 1000);
        
        } catch (err) {
            // 3. 로그인 실패 시 에러 메시지 표시
            
            // API 파일에서 던진 Error 객체를 받습니다.
            const apiError = err as Error;
            
            // Error 객체의 .cause 속성에서 status와 data를 추출합니다.
            const cause = apiError.cause as { status: number, data: any } | undefined;

            // ⭐️ memberId 체크에서 발생한 에러를 포함하여 기본 메시지 설정
            let errorMessage = apiError.message || '알 수 없는 오류로 로그인에 실패했습니다.';

            // 4. 추출한 상태 코드와 데이터를 기반으로 에러 메시지 설정
            if (cause && cause.status === 401) {
                // 401: 인증 실패 (ID/PW 불일치)
                // 서버가 보낸 메시지(예: "아이디 또는 비밀번호를 확인해주세요.")를 우선 사용
                errorMessage = cause.data?.message || '이메일 또는 비밀번호가 일치하지 않습니다.';
            } else if (cause && cause.data && cause.data.message) {
                // 기타 서버 에러 응답 (400, 500 등)에서 메시지 추출
                errorMessage = cause.data.message;
            } else {
                // 네트워크 오류 또는 memberApi에서 설정한 기본 메시지 사용
                errorMessage = apiError.message || errorMessage;
            }

            setError(errorMessage);
        }
    };

    return (
        <AuthFormWrapper title="로그인">
            <form onSubmit={handleSubmit} method="post">
                {/* 이메일 */}
                <div className="form-group mb-3">
                    <label htmlFor="email">이메일주소</label>
                    <input
                        type="email" name="email" className="form-control"
                        placeholder="이메일을 입력해주세요" value={formData.email}
                        onChange={handleChange} required
                    />
                </div>
                {/* 비밀번호 */}
                <div className="form-group mb-4">
                    <label htmlFor="password">비밀번호</label>
                    <input
                        type="password" name="password" className="form-control"
                        placeholder="비밀번호를 입력해주세요" value={formData.password}
                        onChange={handleChange} required
                    />
                </div>

                {/* 오류 메시지 표시 */}
                {error && (
                    <div className="alert alert-danger p-2 mb-3">
                        <p className="fieldError mb-0 small">{error}</p>
                    </div>
                )}
              
                {/* 성공 메시지 표시 (alert 대체) */}
                {successMessage && (
                    <div className="alert alert-success p-2 mb-3">
                        <p className="mb-0 small">{successMessage}</p>
                    </div>
                )}

                {/* 버튼 그룹 */}
                <div className="button-group d-flex flex-column align-items-center gap-2 mt-4">
                    <button type="submit" className="btn btn-primary w-100" style={{ maxWidth: '300px' }}>
                        로그인
                    </button>
                    
                    {/* ⭐️ 카카오 소셜 로그인 버튼 ⭐️ */}
                    <a href={KAKAO_AUTH_URL} className="btn btn-warning w-100" style={{ maxWidth: '300px' }}>
                        <img
                            src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_small.png"
                            style={{ height: '1.2em', marginRight: '8px' }} alt="카카오 로고"
                        />
                        카카오로 로그인
                    </a>
                    
                    <div className="d-flex justify-content-between w-100 mt-2" style={{ maxWidth: '300px' }}>
                        <a href="/members/new" className="text-muted small">회원가입</a>
                        <a href="/findPassword" className="text-muted small">비밀번호 찾기</a>
                    </div>
                </div>
            </form>
        </AuthFormWrapper>
    );
};

export default MemberLoginPage;
