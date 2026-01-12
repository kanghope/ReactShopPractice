import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { type UserRole } from '../../types/auth';

const SocialCallbackPage : React.FC = () =>
{
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect( () => {
        // 1. URL 쿼리 파라미터에서 토큰 및 사용자 정보 추출
        //const accessToken = searchParams.get('accessToken');
        //const refreshToken = searchParams.get('refreshToken');

        const userId = searchParams.get('userId');
        const role = searchParams.get('role');
        // const accessTokenExpiresIn = searchParams.get('accessTokenExpiresIn');

        // 서버에서 에러 메시지가 쿼리 파라미터로 전달된 경우 처리
        const errorParam = searchParams.get('error');

        if (errorParam) {
            console.error("소셜 로그인 서버 오류:", errorParam);
            navigate('/members/login', { state: { error: errorParam } });
            return;
        }

        // 2. 필수 정보가 모두 있는지 확인
        if (userId && role) {
            try {
                // 3. AuthContext의 login 함수를 호출하여 상태 저장
                login(
                    '', // Access Token은 쿠키로 처리되므로 빈 문자열 전달
                    '', // Refresh Token은 쿠키로 처리되므로 빈 문자열 전달
                    userId,
                    role as UserRole
                );

                // 4. 로그인 성공 후 메인 페이지로 이동
                navigate('/');

            } catch (error) {
                console.error("소셜 로그인 처리 중 오류 발생:", error);
                // 5. 실패 시 로그인 페이지로 이동 (에러 메시지 표시)
                navigate('/login', { state: { error: '소셜 로그인에 실패했습니다.' } });
            }
        } else {
            // 6. 토큰 정보가 누락된 경우
            console.error("소셜 로그인 콜백 파라미터 누락");
            navigate('/login', { state: { error: '로그인 정보가 올바르지 않습니다.' } });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, login, navigate]);

// 로딩 중 UI
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontSize: '1.2rem'
        }}>
            <p>로그인 처리 중입니다. 잠시만 기다려주세요...</p>
        </div>
    );
};

export default SocialCallbackPage;