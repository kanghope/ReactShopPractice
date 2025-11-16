// App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth'; // Context Provider
import Layout from './components/layout/Layout';
import MainPage from './pages/main/MainPage';
import MemberLoginPage from './pages/member/MemberLoginPage';
import MemberJoinPage from './pages/member/MemberJoinPage'; // 
import SocialCallbackPage from './pages/auth/SocialCallbackPage';

// 새로 추가된 관리자 페이지 임포트
import ItemManagePage from './pages/item/ItemManagePage'; // 확장자 추가
import ItemFormPage from './pages/item/ItemFormPage'; // 확장자 추가
// ⭐️ 상품 상세 페이지 임포트 추가
import ItemDetailPage from './pages/item/ItemDetailPage'; // ⬅️ 이 부분을 추가해야 합니다.
// ⭐️ 구매 이력 페이지 컴포넌트 임포트 추가
import OrderHistoryPage from './pages/order/OrderHistoryPage';
// 장바구이 이력 페이지 컴포넌트 임포트 추가
import CartPage from './pages/cart/CartPage';

const App: React.FC = () => {
  return (
    // 1. 라우팅 환경 제공
    <Router>
      {/* 2. 인증 Context 제공 (App 전체에서 인증 상태 접근 가능) */}
      <AuthProvider>
        {/* 3. 전체 레이아웃 적용 (Header와 Footer 포함) */}
        <Layout>
          <Routes>
            {/* 메인 페이지 */}
            <Route path="/" element={<MainPage />} />

            {/* ⭐️ 상품 상세 보기 라우트 추가 */}
            <Route path="/item/:itemId" element={<ItemDetailPage />} />
            
            {/* 회원/인증 관련 페이지 */}
            <Route path="/members/login" element={<MemberLoginPage />} />
            <Route path="/members/new" element={<MemberJoinPage />} /> 

            {/* ⭐️ 신규 소셜 로그인 콜백 라우트 추가 */}
            <Route path="/auth/social/callback" element={<SocialCallbackPage />} />

            {/* =======================================================
                 ⭐️ 상품 관리자 페이지 라우트 
                 ======================================================= */}
            
            {/* 1. 상품 목록 조회 및 검색 */}
            <Route path="/admin/item/items" element={<ItemManagePage />} />

            {/* 2. 상품 등록 및 수정 (같은 컴포넌트를 사용하며 :itemId 유무로 등록/수정 구분) */}
            <Route path="/admin/item/new" element={<ItemFormPage />} />
            <Route path="/admin/item/:itemId" element={<ItemFormPage />} />
            
            {/* 임시 경로 (Header 메뉴 대응) */}
            <Route path="/cart" element={<CartPage />} />
            {/*<Route path="/cart" element={<div className="text-center py-5">장바구니 페이지 (개발중)</div>} />*/}

            {/* ⭐️ /orders 경로에 OrderHistoryPage 컴포넌트를 연결 */}
            <Route path="/orders" element={<OrderHistoryPage />} />
            
            {/* 404 Not Found */}
            <Route path="*" element={<div className="text-center py-5">404 - 페이지를 찾을 수 없습니다.</div>} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
};

export default App;