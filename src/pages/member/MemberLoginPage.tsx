import React, { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AuthFormWrapper from '../../components/common/AuthFormWrapper';
import { loginMember } from '../../api/memberApi';
import { type LoginRequest } from '../../types/member.ts';
import { useAuth } from '../../hooks/useAuth'; // 인증 상태 관리 훅
import { type UserRole } from '../../types/auth'; // UserRole 타입 추가
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { toast } from 'sonner';


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
const KAKAO_REDIRECT_URI = import.meta.env.REACT_APP_KAKAO_REDIRECT_URI ||
 'https://shop-app1.azurewebsites.net/api/auth/kakao/callback';
//'http://localhost:8080/api/auth/kakao/callback' 
const KAKAO_AUTH_URL = 
  `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}`;
// =========================================================================


const MemberLoginPage = () => {
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
                //tokenResponse.accessToken, 
                //tokenResponse.refreshToken, 
                tokenResponse.id.toString(), // memberId를 string으로 변환하여 userId로 사용
                tokenResponse.role as UserRole 
            );
            
            // ⭐️ Custom Message UI 사용
            setSuccessMessage('로그인 성공! 잠시 후 메인 페이지로 이동합니다.');
            toast.success('로그인 되었습니다.');
            // 성공 메시지 표시 후 1초 뒤 이동
            setTimeout(() => {
                navigate('/'); 
            }, 3000);
            //toast.success('로그인 되었습니다.')
        
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
    // 공통 스타일 정의
    const inputStyle = "w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400";
    const labelStyle = "block text-sm font-medium text-slate-700 mb-1.5 ml-1";
    

    return (
        <AuthFormWrapper title="로그인">
            <form onSubmit={handleSubmit} method="post" className="space-y-5">
                {/* 이메일 */}
                <div className="flex flex-col">
                    <label htmlFor="email" className={labelStyle}>이메일 주소</label>
                    <input
                        type="email" name="email" id="email"
                        className={inputStyle}
                        placeholder="example@mail.com" value={formData.email}
                        onChange={handleChange} required
                    />
                </div>

                {/* 비밀번호 */}
                <div className="flex flex-col">
                    <label htmlFor="password" className={labelStyle}>비밀번호</label>
                    <input
                        type="password" name="password" id="password"
                        className={inputStyle}
                        placeholder="••••••••" value={formData.password}
                        onChange={handleChange} required
                    />
                </div>

                {/* 에러/성공 메시지 */}
                {(error || successMessage) && (
                    <div className={`p-3 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-1 ${
                        error ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
                    }`}>
                        {error || successMessage}
                    </div>
                )}

                {/* 버튼 그룹 */}
                <div className="flex flex-col gap-3 !pt-2">
                    <Button 
                        type="submit" 
                        className="w-full py-2.5 !bg-[#1d4ed8] !text-white !font-semibold rounded-lg !shadow-md 
                                   hover:!bg-blue-700 hover:!scale-[1.02] active:!scale-[0.98] transition-all duration-200"
                    >
                        로그인
                    </Button>
                    
                    <a 
                        href={KAKAO_AUTH_URL} 
                        className="w-full py-2.5 !bg-[#FEE500] !text-[#191919] !font-semibold rounded-lg flex items-center justify-center gap-2
                                   hover:!bg-[#fdd835] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    >
                        <MessageCircle className="h-5 w-5 fill-current" />
                        카카오로 시작하기
                    </a>
                </div>

                {/* 하단 링크 */}
                <div className="flex justify-between items-center px-1 mt-6">
                    <Link to="/members/new" className="">
                        <span className='!text-sm !text-slate-500 hover:!text-blue-600 hover:!underline transition-colors'>회원가입</span>
                    </Link>
                    {/*findPassword */}
                    <Link to="/" className="">
                        <span className='!text-sm !text-slate-500 hover:!text-blue-600 hover:!underline !transition-colors'>비밀번호 찾기</span>
                    </Link>
                </div>
            </form>
        </AuthFormWrapper>
    );
};

export default MemberLoginPage;
