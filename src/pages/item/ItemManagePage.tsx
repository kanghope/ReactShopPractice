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
        if (endPage > totalPages) {
            endPage = totalPages;
        }

        const pageNumbers = [];
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="d-flex justify-content-center">
                <ul className="pagination">
                    {/* Previous 버튼 */}
                    <li className={`page-item ${itemPage.first ? 'disabled' : ''}`}>
                        <a 
                            className="page-link" 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); !itemPage.first && handlePageChange(currentPage - 1); }}
                        >
                            <span aria-hidden='true'>Previous</span>
                        </a>
                    </li>

                    {/* 페이지 번호 버튼 */}
                    {pageNumbers.map(page => (
                        <li 
                            className={`page-item ${currentPage === page - 1 ? 'active' : ''}`} 
                            key={page}
                        >
                            <a 
                                className="page-link" 
                                href="#" 
                                onClick={(e) => { e.preventDefault(); handlePageChange(page - 1); }}
                            >
                                {page}
                            </a>
                        </li>
                    ))}

                    {/* Next 버튼 */}
                    <li className={`page-item ${itemPage.last ? 'disabled' : ''}`}>
                        <a 
                            className="page-link" 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); !itemPage.last && handlePageChange(currentPage + 1); }}
                        >
                            <span aria-hidden='true'>Next</span>
                        </a>
                    </li>
                </ul>
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
        <div className="container my-5">
            <h2 className="h3 text-center mb-4 border-bottom pb-2">
                <i className="bi bi-list-task me-2"></i> 상품 관리 목록
            </h2>
            
            {loading ? (
                <div className="text-center py-5">목록을 불러오는 중...</div>
            ) : error ? (
                <div className="alert alert-danger text-center py-5">{error}</div>
            ) : (
                <>
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th>상품아이디</th>
                                <th>상품명</th>
                                <th>상태</th>
                                <th>등록자</th>
                                <th>등록일</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemPage.content.length > 0 ? (
                                itemPage.content.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.id}</td>
                                        <td>
                                            <a href={`/admin/item/${item.id}`} 
                                               onClick={(e) => { e.preventDefault(); navigate(`/admin/item/${item.id}`); }}>
                                                {item.itemNm}
                                            </a>
                                        </td>
                                        <td>{item.itemSellStatus === 'SELL' ? '판매중' : '품절'}</td>
                                        <td>{item.createdBy}</td>
                                        <td>{formatDateTime(item.regTime)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center text-muted py-4">조회된 상품이 없습니다.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* 페이징 네비게이션 */}
                    {renderPagination()}
                </>
            )}

            {/* 검색 폼 */}
            <div className="d-flex justify-content-center mt-4">
                <form className="form-inline d-flex gap-2" onSubmit={(e) => e.preventDefault()}>
                    {/* 기간 검색 */}
                    <select id="searchDateType" name="searchDateType" className="form-select" style={{ width: 'auto' }}
                        value={searchForm.searchDateType} onChange={handleSearchChange}>
                        <option value="all">전체기간</option>
                        <option value="1d">1일</option>
                        <option value="1w">1주</option>
                        <option value="1m">1개월</option>
                        <option value="6m">6개월</option>
                    </select>
                    
                    {/* 판매 상태 검색 */}
                    <select id="searchSellStatus" name="searchSellStatus" className="form-select" style={{ width: 'auto' }}
                        value={searchForm.searchSellStatus} onChange={handleSearchChange}>
                        <option value="">판매상태(전체)</option>
                        <option value="SELL">판매</option>
                        <option value="SOLD_OUT">품절</option>
                    </select>

                    {/* 검색 기준 */}
                    <select id="searchBy" name="searchBy" className="form-select" style={{ width: 'auto' }}
                        value={searchForm.searchBy} onChange={handleSearchChange}>
                        <option value="itemNm">상품명</option>
                        <option value="createdBy">등록자</option>
                    </select>
                    
                    {/* 검색어 입력 */}
                    <input 
                        id="searchQuery"
                        name="searchQuery" 
                        type="text" 
                        className="form-control" 
                        placeholder="검색어를 입력해주세요"
                        value={searchForm.searchQuery}
                        onChange={handleSearchChange}
                    />
                    
                    {/* 검색 버튼 */}
                    <button id="searchBtn" type="submit" className="btn btn-primary" onClick={handleSearchSubmit}>
                        검색
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ItemManagePage;