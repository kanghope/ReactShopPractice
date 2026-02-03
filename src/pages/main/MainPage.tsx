// pages/main/MainPage.tsx

import { useState, useEffect, useCallback, useMemo, type FormEvent} from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getMainItems } from '../../api/itemApi';
import type { PageResponse, MainItemDto } from '../../types/item';
import mainlogo from '../../assets/images/mainlogo.png';
import { Loader2, Search } from 'lucide-react';
import { PagingCon } from '@/components/common/PagingCon';

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
const MainPage = () => {
    //const navigate = useNavigate(); 
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
     * 🔢 페이지네이션 범위 계산
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
        <div className="w-full max-w-[1400px] mx-auto px-4 py-6 space-y-10">
            
            {/* 1. 배너 영역 (shadcn-like Rounded Banner) */}
            <div className="relative w-full h-[300px] md:h-[400px] rounded-3xl overflow-hidden shadow-2xl group">
                <img 
                    src={mainlogo} 
                    alt="Main Banner" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent flex items-end p-10">
                    <h2 className="text-white text-3xl md:text-5xl font-bold tracking-tighter">
                        새로운 시즌, <br/>특별한 컬렉션
                    </h2>
                </div>
            </div>

            {/* 2. 검색 바 (Floating Search) */}
            <div className="flex flex-col items-center space-y-6">
                <form onSubmit={handleSearchSubmit} className="relative w-full max-w-2xl group">
                    <Search className="!absolute left-4 top-1/2 -translate-y-1/2 !text-slate-400 group-focus-within:!text-blue-600 !transition-colors" size={20} />
                    <input
                        type="text"
                        className="w-full pl-12 pr-28 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-lg"
                        placeholder="찾으시는 상품이 있으신가요?"
                        value={searchQueryInput}
                        onChange={(e) => setSearchQueryInput(e.target.value)}
                    />
                    <button type="submit" className="absolute right-2 top-2 bottom-2 px-6 !bg-slate-900 !text-white !rounded-xl !font-medium hover:!bg-blue-600 !transition-all active:!scale-95">
                        검색
                    </button>
                </form>

                {currentSearchQuery && (
                    <h3 className="text-2xl font-semibold text-slate-800 animate-in fade-in slide-in-from-bottom-2">
                        <span className="text-blue-600">"{currentSearchQuery}"</span> 검색 결과
                    </h3>
                )}
            </div>

            {/* 3. 상품 그리드 영역 */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="animate-spin text-blue-600" size={48} />
                    <p className="text-slate-500 font-medium">상품을 불러오고 있습니다...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-2xl text-center font-medium">
                    {error}
                </div>
            ) : itemsPage.content.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-slate-400 text-xl italic font-light">해당하는 상품이 존재하지 않습니다.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {itemsPage.content.map((item) => (
                        <Link 
                            to={`/item/${item.id}`} 
                            key={item.id}
                            className="group flex flex-col bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                        >
                            <div className="relative aspect-square overflow-hidden">
                                <img 
                                    src={item.imgUrl || 'https://via.placeholder.com/400x400?text=No+Image'} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                    alt={item.itemNm} 
                                />
                                {item.price > 100000 && (
                                    <span className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-md">Premium</span>
                                )}
                            </div>
                            <div className="p-5 space-y-2">
                                <h5 className="text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                    {item.itemNm}
                                </h5>
                                <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed h-10">
                                    {item.itemDetail}
                                </p>
                                <div className="pt-2 flex justify-between items-center">
                                    <span className="text-xl font-black text-rose-600">
                                        {item.price.toLocaleString()}원
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium group-hover:underline">상세보기 →</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* 4. 페이지네이션 (Modern shadcn style) */}
            <PagingCon currentPage = {currentPage} totalPages={itemsPage.totalPages} handlePageChange={handlePageChange} first={itemsPage.first} last={itemsPage.last} startPage={startPage} endPage={endPage} />
            {/*itemsPage.totalPages > 1 && (
                <nav className="flex justify-center items-center gap-2 pt-10">
                    <button 
                        disabled={itemsPage.first}
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="p-2 rounded-lg border border-slate-200 hover:!bg-slate-50 disabled:!opacity-30 transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex gap-1">
                        {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(pageIndex => (
                            <button 
                                key={pageIndex}
                                onClick={() => handlePageChange(pageIndex)}
                                className={`w-10 h-10 rounded-lg !text-sm !font-semibold !transition-all !border-slate-200 ${
                                    pageIndex === currentPage 
                                    ? '!bg-slate-900 !text-white !shadow-lg !shadow-slate-200 !scale-110 ' 
                                    : '!text-slate-600 hover:!bg-slate-100'
                                }`}
                            >
                                {pageIndex + 1}
                            </button>
                        ))}
                    </div>

                    <button 
                        disabled={itemsPage.last}
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="p-2 rounded-lg border !border-slate-200 hover:!bg-slate-50 disabled:!opacity-30 transition-all"
                    >
                        <ChevronRight size={20} />
                    </button>
                </nav>
            )*/}
        </div>
    );
};

export default MainPage;