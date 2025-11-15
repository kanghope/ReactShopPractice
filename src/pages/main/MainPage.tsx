// pages/main/MainPage.tsx

import React,{ useState, useEffect, useCallback, useMemo, type FormEvent} from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getMainItems } from '../../api/itemApi';
import type { PageResponse, MainItemDto } from '../../types/item';
import mainlogo from '../../assets/images/mainlogo.png';

// -------------------------------------------------------------
// 상수 정의
// -------------------------------------------------------------

const MAX_PAGE_BUTTONS = 5; // 페이지네이션에 표시할 최대 버튼 수
const PAGE_SIZE = 6; // 메인 페이지에서 한 번에 보여줄 상품 수

// 초기 API 응답 상태
const initialPageResponse : PageResponse<MainItemDto> = {
    content: [],
    number: 0,
    totalPages: 0,
    totalElements: 0,
    first: true,
    last: true,
    size: PAGE_SIZE,
};

// -------------------------------------------------------------
// 메인 페이지 컴포넌트
// -------------------------------------------------------------
const MainPage: React.FC = () => {
    const navigate = useNavigate(); 
    const [searchParams, setSearchParams] = useSearchParams();
    
    // API 응답 데이터 상태
    const [itemsPage, setItemsPage] = useState<PageResponse<MainItemDto>>(initialPageResponse);
    // 검색 입력 필드 상태
    const [searchQueryInput, setSearchQueryInput] = useState<string>('');
    // 로딩 및 에러 상태
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // URL에서 현재 상태 추출 (검색어와 페이지는 URL이 Single Source of Truth)
    const currentPage = useMemo(() => {
        const pageParam = searchParams.get('page');
        return pageParam ? parseInt(pageParam, 10) : 0;
    }, [searchParams]);
    
    const currentSearchQuery = useMemo(() => {
        return searchParams.get('searchQuery') || '';
    }, [searchParams]);

    /**
     * 🚀 상품 목록 로드 함수
     */

    const loadItems = useCallback(async (page: number, query: string) => {
        setLoading(true);
        setError(null);
        try{
            const data = await getMainItems({ searchQuery: query }, page, PAGE_SIZE);
            
            setItemsPage(data);
            setLoading(false);
        }
        catch (err) {
            console.error("메인 페이지 상품 목록 로드 오류:", err);
            setError("메인 페이지 상품 목록 로드 오류");
            setLoading(false);
            setItemsPage(initialPageResponse);
        }
    },[]);

    // 🔄 URL 파라미터 변경 감지 및 데이터 로드 (mount 및 update 시)
    useEffect(() => {
        // URL의 searchParams가 변경될 때마다 로드
        loadItems(currentPage, currentSearchQuery);
        // 검색 입력 필드 상태 동기화 (사용자가 입력 중인 텍스트가 아닌 URL의 값으로 초기화)
        setSearchQueryInput(currentSearchQuery);
    }, [currentPage, currentSearchQuery, loadItems]);

    /**
     * 🔍 검색 폼 제출 핸들러
     */
    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();

        const newParams = new URLSearchParams(searchParams);
        const trimmedQuery = searchQueryInput.trim();

        if (trimmedQuery) {
            newParams.set('searchQuery', searchQueryInput);
        } else {
            newParams.delete('searchQuery');
        }
        // 검색어가 변경되면 페이지를 0으로 리셋 
        newParams.set('page', '0');
        setSearchParams(newParams);
    };

    /**
     * ➡️ 페이지네이션 버튼 클릭 핸들러
     */
    const handlePageChange = (newPage: number) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', newPage.toString());
        setSearchParams(newParams);
    };

    /**
     * 🔢 페이지네이션 범위 계산 (Thymeleaf 로직 재현)
     */
    const { startPage, endPage } = useMemo(() => {
        const number = itemsPage.number; // 현재 페이지 (0-based)
        const totalPages = itemsPage.totalPages;

        // start: (number / maxPage) * maxPage + 1 (1-based)
        const start = Math.floor(number / MAX_PAGE_BUTTONS) * MAX_PAGE_BUTTONS + 1;

        // end: start + (maxPage - 1) 또는 totalPages 중 작은 값 (1-based)
        let end = start + (MAX_PAGE_BUTTONS - 1);
        
        if (totalPages === 0) {
            end = 1; 
        } else if (end > totalPages) {
            end = totalPages; 
        }
        
        // 0-based index로 반환
        return { startPage: start - 1, endPage: end - 1 };
    }, [itemsPage.number, itemsPage.totalPages]);


// -------------------------------------------------------------
    // JSX 렌더링
    // -------------------------------------------------------------

    return (
        <div className="container py-4">
            {/* 1. 배너 영역 */}
            <div className="mb-4">
                <img 
                    src={mainlogo} 
                    alt="Main Banner" 
                    className="d-block w-100 banner" 
                    style={{ height: '350px', objectFit: 'cover' }}
                />
            </div>

            {/* 2. 검색 폼 및 결과 표시 */}
            <div className="row justify-content-center mb-4">
                <div className="col-md-6">
                    <form onSubmit={handleSearchSubmit} className="input-group">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="상품명을 입력하세요"
                            value={searchQueryInput}
                            onChange={(e) => setSearchQueryInput(e.target.value)}
                        />
                        <button type="submit" className="btn btn-dark">🔍 검색</button>
                    </form>
                </div>
            </div>

            {currentSearchQuery && (
                <div className="text-center mb-4">
                    <p className="h3 font-weight-bold">"{currentSearchQuery}" 검색 결과</p>
                </div>
            )}
            
            {/* 3. 로딩/에러/결과 없음 */}
            {loading && <div className="text-center py-5">상품 목록 로딩 중...</div>}
            {error && <div className="alert alert-danger text-center">{error}</div>}

            {!loading && !error && itemsPage.content.length === 0 && (
                <div className="text-center py-5">
                    <p className="h4 text-muted">검색된 상품이 없습니다.</p>
                </div>
            )}
            
            {/* 4. 상품 목록 렌더링 */}
            <div className="row">
                {itemsPage.content.map((item) => (
                    <div className="col-md-4 mb-4" key={item.id}>
                        <div className="card h-100 shadow-sm">
                            <a 
                                href={`/item/${item.id}`} 
                                className="text-dark" 
                                onClick={(e) => { e.preventDefault(); navigate(`/item/${item.id}`); }}
                            >
                                <img 
                                    src={item.imgUrl || 'https://via.placeholder.com/400x400?text=No+Image'} 
                                    className="card-img-top" 
                                    alt={item.itemNm} 
                                    style={{ height: '400px', objectFit: 'cover' }}
                                />
                                <div className="card-body">
                                    <h5 className="card-title">**{item.itemNm}**</h5>
                                    <p className="card-text text-muted" style={{ 
                                        textOverflow: 'ellipsis', 
                                        whiteSpace: 'nowrap', 
                                        overflow: 'hidden' 
                                    }}>
                                        {item.itemDetail}
                                    </p>
                                    <h4 className="card-title text-danger">**{item.price.toLocaleString()}원**</h4>
                                </div>
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {/* 5. 페이지네이션 */}
            {itemsPage.totalPages > 1 && (
                <nav>
                    <ul className="pagination justify-content-center mt-4">
                        {/* 이전 버튼 */}
                        <li className={`page-item ${itemsPage.first ? 'disabled' : ''}`}>
                            <a 
                                className="page-link" 
                                href="#" 
                                onClick={(e) => { 
                                    e.preventDefault(); 
                                    handlePageChange(currentPage - 1); 
                                }}
                            >
                                <span aria-hidden="true">&laquo; 이전</span>
                            </a>
                        </li>

                        {/* 페이지 번호 버튼 */}
                        {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(pageIndex => (
                            <li 
                                key={pageIndex} 
                                className={`page-item ${pageIndex === currentPage ? 'active' : ''}`}
                            >
                                <a 
                                    className="page-link" 
                                    href="#" 
                                    onClick={(e) => { 
                                        e.preventDefault(); 
                                        handlePageChange(pageIndex); 
                                    }}
                                >
                                    {pageIndex + 1}
                                </a>
                            </li>
                        ))}

                        {/* 다음 버튼 */}
                        <li className={`page-item ${itemsPage.last ? 'disabled' : ''}`}>
                            <a 
                                className="page-link" 
                                href="#" 
                                onClick={(e) => { 
                                    e.preventDefault(); 
                                    handlePageChange(currentPage + 1); 
                                }}
                            >
                                <span aria-hidden="true">다음 &raquo;</span>
                            </a>
                        </li>
                    </ul>
                </nav>
            )}
        </div>
    );
};

export default MainPage;