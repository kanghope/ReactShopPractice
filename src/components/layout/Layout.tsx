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
    // 'd-flex flex-column min-vh-100' 클래스는 Header/Footer 고정을 위해 사용됩니다.
    // CSS, Bootstrap CDN은 index.html 또는 최상위 파일에 포함되어야 합니다.
    <div className="d-flex flex-column min-vh-100">
      
      {/* 1. 헤더 영역 (th:replace="fragments/header::header") */}
      <Header />

      {/* 2. 본문 콘텐츠 영역 (layout:fragment="content") */}
      <main className="flex-grow-1 container mt-4 mb-5">
        {children}
      </main>

      {/* 3. 푸터 영역 (th:replace="fragments/footer::footer") */}
      <Footer />
    </div>
  );
};

export default Layout;