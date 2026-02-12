import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.tsx'; 

// shadcn/ui 컴포넌트
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// 아이콘
import { Menu, Store, Search, LogOut } from "lucide-react";

const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  //const location = useLocation();
  const { isAuthenticated, isAdmin, logout } = useAuth(); 

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?searchQuery=${searchQuery}`);
    }
  };


  const navItemStyle = "inline-flex items-center justify-center px-2 py-2 text-sm font-medium transition-all duration-200 ease-in-out text-slate-600 rounded-md  hover:!fill-white hover:!scale-110 hover:shadow-md active:!scale-95 ";

  return (
    /* Bootstrap의 navbar-light bg-light shadow-sm 재현 */
    <header className="w-full border-b border-slate-200 bg-[#f8f9fa] sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* --- 1. 브랜드/로고 (navbar-brand) --- */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-slate-800 uppercase tracking-tighter">
            <Store className="h-5 w-5 text-blue-600" />
            <span>Shop</span>
          </Link>

          {/* --- 2. 데스크탑 네비게이션 (md 이상에서만 보임) --- */}
          <nav className="hidden md:flex items-center gap-6">
            {isAdmin && (
              <>
                <Link to="/admin/item/new" className={navItemStyle}>상품 등록</Link>
                <Link to="/admin/item/items" className={navItemStyle}>상품 관리</Link>
              </>
            )}
            {isAuthenticated && (
              <>
                <Link to="/cart" className={navItemStyle}>장바구니</Link>
                <Link to="/orders"  
                className={navItemStyle}>구매이력</Link>
              </>
            )}
          </nav>
        </div>

        {/* --- 3. 우측 액션 영역 (검색 + 버튼) --- */}
        <div className="flex items-center justify-center gap-3">
          
          {/* 데스크탑 검색 (lg 이상) */}
          <form onSubmit={handleSearch} className="hidden lg:flex items-center gap-2">
            <div className="relative w-64 md:w-80">
            {/* 검색어가 없을 때만 돋보기 아이콘 표시 */}
            {!searchQuery && (
                <Search className="!absolute !left-3 top-1/2 -translate-y-1/2 !text-slate-400 group-focus-within:!text-blue-600 !transition-colors" />
            )}
            
            <input
                type="search"
                placeholder={searchQuery ? "" : "상품 검색"}
                className="w-full h-10 pl-10 pr-3 !bg-white border !border-slate-300 rounded-lg !text-sm !outline-none focus:!ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
            <Button type="submit" variant="outline" className=" px-3 
             !bg-white !text-slate-600 !border-slate-300
             transition-all duration-200 ease-in-out 
             hover:!scale-110 
             active:!scale-95">
              검색
            </Button>
          </form>

          {/* 로그인/로그아웃 버튼 (데스크탑 전용) */}
          <div className="hidden md:flex items-center border-l border-slate-300 ml-2 pl-4">
            {!isAuthenticated ? (
              <Button asChild variant="outline" size="sm" 
              className="border-slate-300 text-slate-600 hover:text-white
              transition-all 
               duration-200 ease-in-out 
                hover:!scale-110 
                active:!scale-95">
                <Link to="/members/login">로그인</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => logout()} 
              className="gap-2 border-slate-300 
               text-slate-600 
               transition-all 
               duration-200 ease-in-out 
                hover:!scale-110 
                active:!scale-95">
                <LogOut className="h-4 w-4" />
                로그아웃
              </Button>
            )}
          </div>

          {/* --- 4. 모바일 네비게이션 (햄버거 버튼) --- */}
          <div className="md:hidden flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="border border-slate-300">
                  <Menu className="h-6 w-6 text-slate-600" />
                  <span className="sr-only">메뉴 열기</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[#f8f9fa] w-[40%]">
                <SheetHeader>
                  <SheetTitle className="text-left border-b pb-4 text-slate-800">Shop Menu</SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col gap-4 mt-6">
                  {/* 모바일 검색바 */}
                  <form onSubmit={handleSearch} className="relative w-full">
                    {!searchQuery && (
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    )}
                    
                    <Input
                      type="search"
                      placeholder="    상품 검색"
                      className="w-full pl-10 bg-white"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </form>

                  <nav className="flex flex-col gap-2">
                    <Link to="/" className="p-2 text-slate-700 hover:bg-slate-200 rounded-md">홈으로</Link>
                    {isAdmin && (
                      <>
                        <Link to="/admin/item/new" className="p-2 text-slate-700 hover:bg-slate-200 rounded-md">상품 등록</Link>
                        <Link to="/admin/item/items" className="p-2 text-slate-700 hover:bg-slate-200 rounded-md">상품 관리</Link>
                      </>
                    )}
                    {isAuthenticated && (
                      <>
                        <Link to="/cart" className="p-2 text-slate-700 hover:bg-slate-200 rounded-md">장바구니</Link>
                        <Link to="/orders" className="p-2 text-slate-700 hover:bg-slate-200 rounded-md">구매이력</Link>
                      </>
                    )}
                  </nav>

                  <div className="h-px !bg-slate-300 my-2" />

                  {!isAuthenticated ? (
                    <Button asChild className="w-full !text-white">
                      <Link to="/members/login"><span className='!text-white'>로그인</span></Link>
                    </Button>
                  ) : (
                    <Button variant="destructive" onClick={() => logout()} className="w-full gap-2">
                      <LogOut className="h-4 w-4" /> 로그아웃
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;