// components/common/AuthFormWrapper.tsx

import { type ReactNode } from 'react';
//import './AuthFormWrapper.css'; // 별도 CSS 파일 생성

interface AuthFormWrapperProps {
  title: string;
  children: ReactNode;
}
const AuthFormWrapper = ({ title, children } : AuthFormWrapperProps) => {
  return (
    /* container: 중앙 정렬
       mx-auto: 수평 중앙
       py-10 lg:py-16: 상하 여백 (모바일 40px / PC 64px)
    */
    <div className="container mx-auto px-4 py-10 lg:py-16 flex justify-center items-center">
      
      {/* 카드 컨테이너 
         w-full: 기본 너비 100%
         max-w-[450px]: PC에서의 최대 너비 (기존 40%와 350px 사이의 적정값)
         bg-white shadow-xl: 흰색 배경과 깊이감 있는 그림자
         rounded-2xl: 둥근 모서리 (부트스트랩 rounded-3보다 세련된 느낌)
      */}
      <div className="w-full max-w-[450px] bg-white shadow-xl rounded-2xl border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-2xl">
        
        <div className="p-8 md:p-10">
          {/* 타이틀 영역 
             text-primary: 사이트 포인트 컬러 (파란색 계열)
             tracking-tight: 글자 간격을 좁혀 세련되게
          */}
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-[#1d4ed8] tracking-tight">
            {title}
          </h2>

          {/* 폼 콘텐츠 영역 */}
          <div className="space-y-4">
            {children}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthFormWrapper;