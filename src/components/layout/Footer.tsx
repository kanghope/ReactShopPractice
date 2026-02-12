import React from 'react';
//import { Link } from 'react-router-dom';
import { Instagram, Facebook, Youtube, Info } from 'lucide-react';

const Footer: React.FC = () => {
  // 헤더 메뉴와 동일한 느낌의 호버 효과 변수
  //const footerLinkStyle = "inline-block px-2 py-1 text-sm text-slate-600 rounded-md transition-all duration-200 hover:!text-white hover:!scale-105 active:!scale-95 hover-white-force";

  return (
    <footer className="!w-full !bg-[#f8f9fa] !border-t !border-slate-200 !mt-auto !shadow-inner">
      <div className="max-w-[1400px] mx-auto px-17 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-12">
          
          {/* 1. 쇼핑몰 정보 (부트스트랩 col-md-6 영역) */}
          <div className="!flex-1 !space-y-3 flex flex-col items-center md:items-start">
            <h5 className="!text-blue-600 !font-bold !uppercase !tracking-tight !flex !items-start !gap-2">
              <Info className="h-4 w-4" /> 쇼핑몰 정보
            </h5>
            <div className="!text-slate-500 !text-sm !leading-relaxed !flex !flex-col !items-start">
              <p className="!font-medium !text-slate-700 !text-left !w-full">
                대표: 홍길동 | 주소: 서울시 강남구 테헤란로
              </p>
              <p className="!font-medium !text-slate-700 !text-left !w-full">
                사업자 등록번호: 123-45-67890
              </p>
              <p className="!font-medium !text-slate-700 !text-left !w-full">
                통신판매업 신고: 2023-서울강남-0001호
              </p>
            </div>
          </div>

          {/* 2. 고객센터 (부트스트랩 col-md-3 영역)/faq /inquiry /privacy */}
          {/*<div className="!w-full !space-y-3 flex items-center flex-col  md:!w-48 ">
            <h5 className=" !text-blue-600 !font-bold uppercase tracking-tight md:mr-7">고객센터</h5>
            <ul className="!flex !flex-col !items-center mr-6 md:!items-start !gap-1 md:!-ml-2"> 
              <li><Link to="/" className={footerLinkStyle}>FAQ</Link></li>
              <li><Link to="/" className={footerLinkStyle}>1:1 문의</Link></li>
              <li><Link to="/" className={footerLinkStyle}>개인정보처리방침</Link></li>
            </ul>
          </div>*/}

          {/* 3. 팔로우 (부트스트랩 col-md-3 영역) */}
          <div className="w-full flex flex-col items-center md:w-48 !space-y-3">
            <h5 className="!text-blue-600 !font-bold uppercase tracking-tight">팔로우</h5>
            <div className="flex gap-3">
              <a href="https://instagram.com" className="p-2 bg-white rounded-full border border-slate-200 text-slate-500  hover:!text-white hover:!scale-110 transition-all shadow-sm">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://facebook.com" className="p-2 bg-white rounded-full border border-slate-200 text-slate-500  hover:!text-white hover:!scale-110 transition-all shadow-sm">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://youtube.com" className="p-2 bg-white rounded-full border border-slate-200 text-slate-500  hover:!text-white hover:!scale-110 transition-all shadow-sm">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

        </div>
      </div>
      <div className="max-w-[1400px] mx-auto px-17 py-1 pb-5">
        <div className="flex flex-col">
           <h3 className="!text-slate-600 !font-bold !uppercase !tracking-tight !flex !items-start !gap-2">
               1.프론트엔드 node.js기반 Shadcn/UI, tailwind/css, TypeScript, Redux/tookit 전역설정등을 활용한 React 구현
            </h3>
            <h3 className="!text-slate-600 !font-bold !uppercase !tracking-tight !flex !items-start !gap-2"> 
              2.백엔드 : JavaSpring Boot, 클라우드 MyBatis 오라클DB 연동, Marven 환경설정 </h3>
              <h3 className="!text-slate-600 !font-bold !uppercase !tracking-tight !flex !items-start !gap-2"> 
              3.배포 및 서버 : 우분트 설치후 Docker를 활용하여 빌드후 Azure 클라우드 서버에 배포</h3>
        </div>
      </div>
      {/* Copyright (부트스트랩 footer-copyright 영역) */}
      <div className="border-t border-slate-200 bg-white/50 py-4">
        <div className="max-w-[1400px] mx-auto px-6 text-center text-xs text-slate-400 font-medium">
          &copy; {new Date().getFullYear()} Copyright: <span className="text-slate-600">Shopping Mall Example WebSite</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;