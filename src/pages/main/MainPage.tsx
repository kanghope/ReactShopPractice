// pages/main/MainPage.tsx

import React from 'react';

/**
 * Thymeleaf의 메인 페이지 (fragments/content) 역할을 하는 컴포넌트입니다.
 * 전체 레이아웃 (Header, Footer 등)은 App.tsx에서 Layout 컴포넌트가 담당합니다.
 */
const MainPage: React.FC = () => {
  return (
    // 'layout:fragment="content"'에 해당하는 내용만 반환합니다.
    <div className="main-content-wrapper">
      <h1 className="text-center mt-3"> {/* ⭐️ Bootstrap 클래스 추가 */}
        메인페이지 입니다. 개발중
      </h1>
      {/* 여기에 쇼핑몰의 메인 콘텐츠 (예: 상품 목록, 캐러셀 등)가 들어갑니다.
      */}
    </div>
  );
};

export default MainPage;