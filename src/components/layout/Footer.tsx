// components/layout/Footer.tsx

import React from 'react';
import { Link } from 'react-router-dom'; // 페이지 이동을 위해 react-router-dom의 Link 사용

const Footer: React.FC = () => {
  return (
    // Tailwind CSS 대신 Bootstrap 클래스를 그대로 사용하여 기존 디자인을 유지합니다.
    <div className="footer mt-auto">
      <footer className="page-footer font-small bg-light text-dark border-top shadow-sm">
        <div className="container text-center text-md-start pt-4">
          <div className="row">
            {/* 쇼핑몰 정보 */}
            <div className="col-md-6 mt-md-0 mt-3 mb-4">
              <h5 className="text-uppercase fw-bold text-info">쇼핑몰 정보</h5>
              <p className="text-secondary small">대표: 홍길동 | 주소: 서울시 강남구</p>
              <p className="text-secondary small mb-0">사업자 등록번호: 123-45-67890 | 통신판매업 신고: 2023-서울강남-0001호</p>
            </div>
            
            <hr className="clearfix w-100 d-md-none pb-3" />
            
            {/* 고객센터 링크 */}
            <div className="col-md-3 mb-md-0 mb-3">
              <h5 className="text-uppercase fw-bold text-info">고객센터</h5>
              <ul className="list-unstyled">
                <li><Link to="/faq" className="text-secondary">FAQ</Link></li>
                <li><Link to="/inquiry" className="text-secondary">1:1 문의</Link></li>
                <li><Link to="/privacy" className="text-secondary">개인정보처리방침</Link></li>
              </ul>
            </div>

            {/* 소셜 미디어/추가 정보 영역 */}
             <div className="col-md-3 mb-md-0 mb-3">
              <h5 className="text-uppercase fw-bold text-info">팔로우</h5>
              <ul className="list-unstyled d-flex gap-3">
                <li><a href="https://www.instagram.com" className="text-secondary"><i className="bi bi-instagram fs-4"></i></a></li>
                <li><a href="https://www.facebook.com" className="text-secondary"><i className="bi bi-facebook fs-4"></i></a></li>
                <li><a href="https://www.youtube.com" className="text-secondary"><i className="bi bi-youtube fs-4"></i></a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer-copyright text-center py-3 bg-light text-muted border-top mt-3">
          &copy; {new Date().getFullYear()} Copyright: Shopping Mall Example WebSite
        </div>
      </footer>
    </div>
  );
};

export default Footer;