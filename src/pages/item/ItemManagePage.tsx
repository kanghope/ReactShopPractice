// src/pages/admin/ItemManagePage.tsx

import React, { useState, useEffect, type ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getItemManageList } from '../../api/itemApi';
import type { 
    ItemListContentDto, 
    ItemSearchDto, 
    PageResponse 
} from '../../types/item.ts';
//import Layout from '../../components/layout/Layout';

const MAX_PAGE_BUTTONS = 5; // Thymeleaf의 maxPage와 동일

const initialSearchState: ItemSearchDto = {
    searchDateType: 'all',
    searchSellStatus: '',
    searchBy: 'itemNm',
    searchQuery: '',
};

const initialPageResponse: PageResponse<ItemListContentDto> = {
    content: [],
    totalPages: 0,
    number: 0, 
    first: true,
    last: true,
    size: 5, // API에서 설정한 기본값
    totalElements: 0,
};

const ItemManagePage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const [searchForm, setSearchForm] = useState<ItemSearchDto>(initialSearchState);
    const [itemPage, setItemPage] = useState<PageResponse<ItemListContentDto>>(initialPageResponse);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // -------------------------------------------------------------
    // 1. URL 쿼리 파라미터에서 검색 조건 및 페이지 번호 로드 및 API 호출
    // -------------------------------------------------------------
    useEffect(() => {
        const currentPage = parseInt(searchParams.get('page') || '0', 10);
        
        // URL 쿼리 파라미터에서 검색 조건을 추출하여 searchForm 상태를 업데이트합니다.
        const currentSearchForm: ItemSearchDto = {
            searchDateType: (searchParams.get('searchDateType') as ItemSearchDto['searchDateType']) || initialSearchState.searchDateType,
            searchSellStatus: (searchParams.get('searchSellStatus') as ItemSearchDto['searchSellStatus']) || initialSearchState.searchSellStatus,
            searchBy: (searchParams.get('searchBy') as ItemSearchDto['searchBy']) || initialSearchState.searchBy,
            searchQuery: searchParams.get('searchQuery') || initialSearchState.searchQuery,
        };
        
        setSearchForm(currentSearchForm); // 폼 UI에 현재 검색 조건 반영

        fetchItems(currentSearchForm, currentPage);

    }, [searchParams]);

    // -------------------------------------------------------------
    // 2. 상품 목록 API 호출 함수
    // -------------------------------------------------------------
    const fetchItems = async (searchDto: ItemSearchDto, page: number) => {
        setLoading(true);
        setError(null);
        try {
            // API 호출 시 ItemSearchDto와 Page 번호를 전달
            const data = await getItemManageList(searchDto, page);
            setItemPage(data);
        } catch (err) {
            setError((err as Error).message);
            setItemPage(initialPageResponse);
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------------------------------------
    // 3. 페이지 이동 함수 (Thymeleaf의 page(page) 함수 대체)
    // -------------------------------------------------------------
    const handlePageChange = (page: number) => {
        // 1. searchForm 객체를 [key, value] 쌍의 배열로 변환합니다.
        // 2. 각 값(value)을 문자열로 안전하게 변환합니다. (null/undefined 처리 포함)
        const searchEntries = Object.entries(searchForm)//이 객체의 **모든 속성(키-값 쌍)**을 [키, 값] 형태의 배열로 변환하여 반환합니다.
        .filter(([, value]) => value !== null && value !== undefined) // null 또는 undefined 값 제외
        .map(([key, value]) => [key, String(value)]); // 모든 값을 문자열로 변환

    // URLSearchParams는 Array<[string, string]> 형태를 인수로 받습니다.
    const newSearchParams = new URLSearchParams(searchEntries);
    
    // 페이지 번호를 새로 설정합니다.
    newSearchParams.set('page', page.toString());
    
    // URL을 변경하여 useEffect를 트리거하고 목록을 다시 로드합니다.
    navigate(`/admin/item/items?${newSearchParams.toString()}`);
    };
    
    // -------------------------------------------------------------
    // 4. 검색 폼 입력 변경 핸들러
    // -------------------------------------------------------------
    const handleSearchChange = (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setSearchForm(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // -------------------------------------------------------------
    // 5. 검색 버튼 클릭 핸들러 (페이지 0으로 이동)
    // -------------------------------------------------------------
    const handleSearchSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        // 검색 시 항상 첫 페이지(0)로 이동하며, 검색 조건을 URL에 반영합니다.
        // 1. searchForm 객체를 [key, value] 쌍의 배열로 변환합니다.
        // 2. 각 값(value)을 문자열로 안전하게 변환합니다. (null/undefined 처리 포함)
        const searchEntries = Object.entries(searchForm)
        .filter(([, value]) => value !== null && value !== undefined) // null 또는 undefined 값 제외
        .map(([key, value]) => [key, String(value)]); // 모든 값을 문자열로 변환
        const newSearchParams = new URLSearchParams(searchEntries);
        newSearchParams.set('page', '0');
        navigate(`/admin/item/items?${newSearchParams.toString()}`);
    };

    // -------------------------------------------------------------
    // 6. 페이징 버튼 생성 로직
    // -------------------------------------------------------------
    const renderPagination = () => {
        if (itemPage.totalPages === 0) return null;

        const maxPage = MAX_PAGE_BUTTONS;
        const currentPage = itemPage.number; 
        const totalPages = itemPage.totalPages;

        const startPage = Math.floor(currentPage / maxPage) * maxPage + 1;
        let endPage = startPage + maxPage - 1;
        if (endPage > totalPages) endPage = totalPages;

        const pageNumbers = [];
        for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

        return (
            <div className="flex justify-center !mt-10">
                <nav className="flex items-center !gap-1 !bg-white !p-2 !rounded-2xl !shadow-sm !border !border-slate-200">
                    {/* Previous 버튼 */}
                    <button 
                        disabled={itemPage.first}
                        onClick={(e) => { e.preventDefault(); !itemPage.first && handlePageChange(currentPage - 1); }}
                        className="!px-4 !py-2 !text-sm !font-bold !text-slate-600 hover:!bg-slate-50 disabled:!opacity-30 disabled:hover:!bg-transparent !rounded-xl !transition-all !border-slate-200"
                    >
                        이전
                    </button>

                    {/* 페이지 번호 버튼 */}
                    {pageNumbers.map(page => (
                        <button 
                            key={page}
                            onClick={(e) => { e.preventDefault(); handlePageChange(page - 1); }}
                            className={`w-10 h-10 flex items-center justify-center !rounded-xl !text-sm !font-black !transition-all !border-slate-200 ${
                                currentPage === page - 1 
                                ? '!bg-slate-900 !text-white !shadow-lg !shadow-slate-200' 
                                : '!text-slate-600 hover:!bg-slate-50'
                            }`}
                        >
                            {page}
                        </button>
                    ))}

                    {/* Next 버튼 */}
                    <button 
                        disabled={itemPage.last}
                        onClick={(e) => { e.preventDefault(); !itemPage.last && handlePageChange(currentPage + 1); }}
                        className="!px-4 !py-2 !text-sm !font-bold !text-slate-600 !hover:!bg-slate-50 disabled:!opacity-30 !outline-none disabled:!hover:!bg-transparent !rounded-xl !transition-all !border-slate-200"
                    >
                        다음
                    </button>
                </nav>
            </div>
        );
    };

    /**
 * ISO 형식의 날짜 문자열을 'YYYY.MM.DD 시분초' 형식으로 포맷합니다.
 * @param {string} isoString - '2025-11-12T22:42:41.011+09:00' 형태의 문자열
 * @returns {string} - '2025.11.12 22:42:41' 형태의 문자열
 */
const formatDateTime = (isoString : string) => {
    // 1. Date 객체 생성
    const date = new Date(isoString);

    // 2. 각 구성 요소 추출
    const year = date.getFullYear();
    // getMonth()는 0부터 시작하므로 +1, 두 자릿수 맞추기 위해 padStart 사용
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // getHours(), getMinutes(), getSeconds()는 로컬 시간대 기준
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // 3. 원하는 형식으로 조합
    return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
};

    // -------------------------------------------------------------
    // 7. 렌더링
    // -------------------------------------------------------------

    return (
        <div className="max-w-6xl mx-auto px-4 py-12">
            {/* 상단 헤더 섹션 */}
            {/* 상단 헤더 섹션 - 모바일에서 버튼이 아래로 내려가도록 조절 */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
                <div>
                    <h2 className="text-3xl md:text-4xl !font-black !text-slate-900 !tracking-tight flex items-center !gap-3">
                        <div className="!p-3 !bg-blue-600 !rounded-2xl !shadow-lg !shadow-blue-100 !text-white">
                            <i className="!bi !bi-list-task text-xl md:text-2xl"></i>
                        </div>
                        상품 관리 목록
                    </h2>
                    <p className="!text-slate-500 !mt-3 !font-medium text-base md:text-lg">등록된 상품의 상태를 확인하고 정보를 수정할 수 있습니다.</p>
                </div>
                
                <button 
                    onClick={() => navigate('/admin/item/new')}
                    className="h-12 w-full md:w-auto px-6 !bg-slate-900 !text-white rounded-xl !font-bold hover:!bg-blue-600 !transition-all !shadow-lg active:!scale-95"
                >
                    + 새 상품 등록
                </button>
            </div>

            {/* 메인 컨텐츠 영역 */}
            <div className="bg-white border border-slate-200 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm overflow-hidden transition-all hover:shadow-md">
                {loading ? (
                    <div className="text-center py-24 flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-500 font-bold">상품 정보를 가져오는 중...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 px-4">
                        <div className="bg-red-50 text-red-600 p-6 rounded-3xl inline-block border border-red-100">
                            <p className="font-black text-lg">⚠️ {error}</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* 1. PC 테이블 (md 이상에서만 보임) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="!w-full !text-left !border-collapse">
                                <thead>
                                    <tr className="!bg-slate-50/50 border-b border-slate-100">
                                        <th className="!px-8 !py-5 !text-xs !font-black !text-slate-400 !uppercase tracking-wider">ID</th>
                                        <th className="!px-8 !py-5 !text-xs !font-black !text-slate-400 !uppercase tracking-wider">상품 정보</th>
                                        <th className="!px-8 !py-5 !text-xs !font-black !text-slate-400 !uppercase tracking-wider text-center">상태</th>
                                        <th className="!px-8 !py-5 !text-xs !font-black !text-slate-400 !uppercase tracking-wider">등록자</th>
                                        <th className="!px-8 !py-5 !text-xs !font-black !text-slate-400 !uppercase tracking-wider">등록일</th>
                                    </tr>
                                </thead>
                                <tbody className="!divide-y !divide-slate-50">
                                    {itemPage.content.length > 0 ? (
                                        itemPage.content.map(item => (
                                            <tr key={item.id} className="group hover:bg-slate-300/80 transition-colors">
                                                <td className="px-8 py-6 text-sm font-bold text-slate-400 italic">#{item.id}</td>
                                                <td className="px-8 py-6">
                                                    <a 
                                                        href={`/admin/item/${item.id}`} 
                                                        onClick={(e) => { e.preventDefault(); navigate(`/admin/item/${item.id}`); }}
                                                        className="text-base font-black !text-slate-800 group-hover:!text-blue-600 transition-colors block !decoration-blue-500/30 underline-offset-4 hover:underline"
                                                    >
                                                        {item.itemNm}
                                                    </a>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black ${
                                                        item.itemSellStatus === 'SELL' 
                                                        ? '!bg-emerald-50 !text-emerald-600 !border !border-emerald-100' 
                                                        : '!bg-red-50 !text-red-600 border !border-red-100'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${item.itemSellStatus === 'SELL' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                                        {item.itemSellStatus === 'SELL' ? '판매중' : '품절'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 !text-sm !font-semibold !text-slate-600">{item.createdBy}</td>
                                                <td className="px-8 py-6 !text-sm !font-medium !text-slate-400">{formatDateTime(item.regTime)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={5} className="px-8 py-20 text-center font-bold text-slate-400">조회된 상품이 없습니다.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* 2. 모바일 카드 리스트 (md 미만에서 보임) */}
                        <div className="md:hidden">
                            {itemPage.content.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {itemPage.content.map(item => (
                                        <div 
                                            key={item.id} 
                                            className="p-6 active:bg-slate-50 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/admin/item/${item.id}`)}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-xs font-bold text-slate-400 italic">#{item.id}</span>
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black ${
                                                    item.itemSellStatus === 'SELL' 
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                    : 'bg-red-50 text-red-600 border border-red-100'
                                                }`}>
                                                    {item.itemSellStatus === 'SELL' ? '판매중' : '품절'}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-black text-slate-800 mb-4">{item.itemNm}</h3>
                                            <div className="flex justify-between items-end">
                                                <div className="space-y-1">
                                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">Registered By</p>
                                                    <p className="text-sm font-bold text-slate-600">{item.createdBy}</p>
                                                </div>
                                                <div className="text-right space-y-1">
                                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">Date</p>
                                                    <p className="text-sm font-medium text-slate-500">{formatDateTime(item.regTime)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-20 text-center font-bold text-slate-400">조회된 상품이 없습니다.</div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* 페이징 네비게이션 */}
            {!loading && renderPagination()}

            {/* 검색 섹션 - shadcn 스타일 필터 바 */}
            <div className="mt-12 flex justify-center">
                <div className="bg-slate-100/50 p-2 rounded-[2rem] border border-slate-200 inline-flex flex-wrap md:flex-nowrap items-center gap-2">
                    <select 
                        name="searchDateType" 
                        className="bg-white border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                        value={searchForm.searchDateType} onChange={handleSearchChange}
                    >
                        <option value="all">전체기간</option>
                        <option value="1d">1일</option>
                        <option value="1w">1주</option>
                        <option value="1m">1개월</option>
                        <option value="6m">6개월</option>
                    </select>
                    
                    <select 
                        name="searchSellStatus" 
                        className="bg-white border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                        value={searchForm.searchSellStatus} onChange={handleSearchChange}
                    >
                        <option value="">상태(전체)</option>
                        <option value="SELL">판매</option>
                        <option value="SOLD_OUT">품절</option>
                    </select>

                    <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden md:block"></div>

                    <select 
                        name="searchBy" 
                        className="bg-white border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                        value={searchForm.searchBy} onChange={handleSearchChange}
                    >
                        <option value="itemNm">상품명</option>
                        <option value="createdBy">등록자</option>
                    </select>

                    <div className="relative flex-grow min-w-[240px]">
                        <input 
                            name="searchQuery" 
                            type="text" 
                            className="w-full bg-white border-none rounded-2xl px-5 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="찾으시는 상품을 입력하세요..."
                            value={searchForm.searchQuery}
                            onChange={handleSearchChange}
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        onClick={handleSearchSubmit}
                        className="!px-8 !py-3 !bg-blue-600 !text-white !rounded-2xl !font-black !text-sm hover:!bg-blue-700 !transition-all !shadow-md active:!scale-95"
                    >
                        검색
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ItemManagePage;