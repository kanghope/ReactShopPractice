import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
// useAuth.tsx 파일이 생성되었으므로 확장자를 명시합니다.
import { useAuth } from '../../hooks/useAuth.tsx'; 

const Header: React.FC = () => {
const [searchQuery, setSearchQuery] = useState('');
// ⭐️ Bootstrap Navbar Collapse 상태 관리를 위한 훅
const [isNavCollapsed, setIsNavCollapsed] = useState(true);
const navigate = useNavigate();

const location = useLocation(); // ⭐️ 현재 URL 경로 가져오기
// AuthContext에서 인증 상태와 관리자 여부를 가져옵니다.
const {  isAuthenticated, isAdmin, logout } = useAuth(); 

const handleSearch = (e: FormEvent) => {
 e.preventDefault();
 // 검색 쿼리를 URL 파라미터로 메인 페이지로 이동
 navigate(`/?searchQuery=${searchQuery}`);
};

const handleLogout = (e: React.MouseEvent) => {
 e.preventDefault();
 logout(); // AuthContext의 로그아웃 함수 호출 (토큰 제거)
 console.log('로그아웃되었습니다.'); 
 navigate('/');
}

// ⭐️ 현재 경로와 링크 경로를 비교하여 active 클래스 반환 (이제 사용됩니다)
 const getNavLinkClass = (path: string) => {
   // 메인 페이지('/')의 경우 쿼리스트링 제거 후 비교
   const currentPath = location.pathname.split('?')[0]; 
   return currentPath === path ? 'nav-link active' : 'nav-link';
 };
 
// ⭐️ Navbar 토글 핸들러
 const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);
 
// ⭐️ 링크 클릭 시 네비게이션이 닫히도록 하는 핸들러 (모바일 UX 개선)
  const handleLinkClick = () => {
    if (!isNavCollapsed) {
        setIsNavCollapsed(true);
    }
  };

return (
 <div className="header">
 <nav className="navbar navbar-expand-md navbar-light bg-light shadow-sm border-bottom">
  <div className="container-fluid">
  {/* 로고 / 브랜드 */}
  <Link className="navbar-brand text-uppercase fw-bold" to="/" onClick={handleLinkClick}>
   <i className="bi bi-shop me-2"></i> Shop
  </Link>

  {/* ⭐️ 토글 버튼 */}
          <button 
            className="navbar-toggler" 
            type="button" 
            onClick={handleNavCollapse} // React 핸들러
            aria-controls="navbarContent" 
            aria-expanded={!isNavCollapsed} // 상태 반영
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

  <div className={`collapse navbar-collapse ${!isNavCollapsed ? 'show' : ''}`} id="navbarContent"
          >
   {/* 왼쪽 메뉴 그룹 (관리자/로그인 사용자 전용) */}
   <ul className="navbar-nav me-auto mb-2 mb-lg-0">
  
   {/* 상품 등록/관리 (관리자 전용) */}
   {isAdmin && (
    <>
    <li className="nav-item">
            {/* ⭐️ getNavLinkClass 적용 */}
     <Link className={getNavLinkClass("/admin/item/new")} to="/admin/item/new" onClick={handleLinkClick}>상품 등록</Link>
    </li>
    <li className="nav-item">
            {/* ⭐️ getNavLinkClass 적용 */}
     <Link className={getNavLinkClass("/admin/items")} to="/admin/items" onClick={handleLinkClick}>상품 관리</Link>
    </li>
    </>
   )}
  
   {/* 장바구니/구매이력 (인증된 사용자 전용) */}
   {isAuthenticated && (
    <>
    <li className="nav-item">
            {/* ⭐️ getNavLinkClass 적용 */}
     <Link className={getNavLinkClass("/cart")} to="/cart" onClick={handleLinkClick}>장바구니</Link>
    </li>
    <li className="nav-item">
            {/* ⭐️ getNavLinkClass 적용 */}
     <Link className={getNavLinkClass("/orders")} to="/orders" onClick={handleLinkClick}>구매이력</Link>
    </li>
    </>
   )}
   </ul>

   {/* 오른쪽 메뉴 그룹 (인증/검색) */}
   <ul className="navbar-nav d-flex align-items-center">
   {/* 로그인/로그아웃 버튼 */}
   <li className="nav-item me-2">
    {
            /* ⭐️ 오류 해결: JSX 조건부 렌더링 부분을 괄호로 감싸 JSX 요소임을 명확히 합니다. */
            !isAuthenticated ? (
       // 익명 사용자 (isAnonymous())
                <Link className={getNavLinkClass("/members/login") + " btn btn-outline-dark"} to="/members/login" onClick={handleLinkClick}>로그인</Link>
     ) : (
       // 인증된 사용자 (isAuthenticated())
       <a className="nav-link btn btn-outline-dark" href="#" onClick={(e) => { handleLogout(e); handleLinkClick(); }}>
         로그아웃
       </a>
     )
        }
   </li>

   {/* 검색 폼 */}
   <li className="nav-item">
    <form className="d-flex" onSubmit={handleSearch}>
    <input
     name="searchQuery"
     className="form-control me-2"
     type="search"
     placeholder="상품 검색"
     aria-label="Search"
     value={searchQuery}
     onChange={(e) => setSearchQuery(e.target.value)}
    />
    <button className="btn btn-secondary" type="submit">검색</button>
    </form>
   </li>
   </ul>
  </div>
  </div>
 </nav>
 </div>
);
};

export default Header;
