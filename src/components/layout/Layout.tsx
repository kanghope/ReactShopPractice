// components/layout/Layout.tsx

import React, {type ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

/**
 * Thymeleaf의 'layouts/layout1' 역할을 하는 컴포넌트입니다.
 * 모든 페이지 콘텐츠를 Header와 Footer 사이에 배치하고, 공통 스타일을 적용합니다.
 */
interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    /* flex flex-col: 수직 정렬
      min-h-screen: 최소 높이를 화면 전체로 설정 (푸터를 바닥에 고정)
      bg-white: 전체 배경색 설정
    */
    <div className="flex flex-col min-h-screen bg-white">
      
      {/* 1. 헤더 영역 */}
      <Header />

      {/* 2. 본문 콘텐츠 영역
        flex-grow: 남은 공간을 모두 차지 (푸터를 아래로 밀어냄)
        mx-auto: 수평 중앙 정렬
        w-full max-w-[1400px]: 헤더/푸터와 동일한 최대 너비 유지
        px-4: 모바일 좌우 여백
        py-8 lg:py-12: 모바일과 PC에서 서로 다른 상하 여백 (반응형)
      */}
      <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 py-8 lg:py-12">
        {/* 콘텐츠가 부드럽게 나타나도록 애니메이션 추가 가능 */}
        <div className="animate-in fade-in duration-500">
          {children}
        </div>
      </main>

      {/* 3. 푸터 영역 */}
      <Footer />
    </div>
  );
};

export default Layout;