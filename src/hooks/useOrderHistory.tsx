import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getOrderHistory, cancelOrderApi, cancelBulkOrders } from '../api/orderApi';
import type { OrderHistDto, OrderStatus } from '../types/order';
import type { PageResponse } from '../types/item';

const MAX_PAGE_BUTTONS = 5;
const PAGE_SIZE = 4;
const initialPageResponse: PageResponse<OrderHistDto> = {
    content: [],
    number: 0,
    totalPages: 0,
    totalElements: 0,
    first: true,
    last: true,
    size: PAGE_SIZE,
};

// -------------------------------------------------------------
// 커스텀 훅
// -------------------------------------------------------------

export const useOrderHistory = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [ordersPage, setOrdersPage] = useState<PageResponse<OrderHistDto>>(initialPageResponse);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set());

    const currentPage = useMemo(() => {
        const pageParam = searchParams.get('page');
        return pageParam ? parseInt(pageParam, 10) : 0; // 0-based
    }, [searchParams]);

    // ⭐️ 페이지 변경 시 선택 상태 초기화
    useEffect(() => {
        setSelectedOrderIds(new Set());
    }, [ordersPage.number]);


    // 🚀 주문 목록 로드 함수 (재정의)
    const loadOrderHistory = useCallback(async (page: number) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getOrderHistory(page, PAGE_SIZE);
            setOrdersPage(data);
        } catch (err) {
            console.error("주문 이력 로드 오류:", err);
            const errorMessage = err instanceof Error ? err.message : "주문 이력 로드 실패";
            setError(errorMessage);
            setOrdersPage(initialPageResponse);

            if (err instanceof Error && (err.cause as any)?.status === 401) {
                navigate('/members/login');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);


    // 🔄 데이터 로드 트리거
    useEffect(() => {
        loadOrderHistory(currentPage);
    }, [currentPage, loadOrderHistory]);


    // -------------------------------------------------------------
    // 체크박스/취소 로직
    // -------------------------------------------------------------
    
    // 취소 가능한 주문 ID 목록
    const cancellableOrderIds = useMemo(() =>
        ordersPage.content
            .filter(order => order.orderStatus === 'ORDER' as OrderStatus) // 명시적 타입 캐스팅
            .map(order => order.orderId)
    , [ordersPage.content]);

    // 전체 선택/해제 상태
    const isAllSelected = selectedOrderIds.size > 0 && selectedOrderIds.size === cancellableOrderIds.length;

    const toggleOrderSelection = (orderId: number, isCancellable: boolean) => {
        if (!isCancellable) return;

        setSelectedOrderIds(prev => {
            const newSet = new Set(prev);
            newSet.has(orderId) ? newSet.delete(orderId) : newSet.add(orderId);
            return newSet;
        });
    };

    const toggleAllSelection = () => {
        isAllSelected
            ? setSelectedOrderIds(new Set())
            : setSelectedOrderIds(new Set(cancellableOrderIds));
    };
    
    // 단일 주문 취소
    const handleCancelOrder = async (orderId: number) => {
        if (!window.confirm('정말로 주문을 취소하시겠습니까?')) return;

        try {
            await cancelOrderApi(orderId);
            window.alert("주문이 취소되었습니다.");
            loadOrderHistory(currentPage);
        } catch (err) {
            const errorMessage = (err instanceof Error && (err.cause as any)?.data?.message) || (err instanceof Error ? err.message : "주문 취소 실패");
            window.alert(errorMessage);
            if (err instanceof Error && (err.cause as any)?.status === 401) navigate('/members/login');
        }
    };
    
    // 일괄 주문 취소
    const handleBulkCancel = async () => {
        const idsToCancel = Array.from(selectedOrderIds);

        if (idsToCancel.length === 0) return window.alert('취소할 주문을 선택해주세요.');
        if (!window.confirm(`${idsToCancel.length}건의 주문을 일괄 취소하시겠습니까?`)) return;

        try {
            const message = await cancelBulkOrders(idsToCancel);
            window.alert(message);
            setSelectedOrderIds(new Set());
            loadOrderHistory(currentPage);
        } catch (err) {
            const errorMessage = (err instanceof Error && (err.cause as any)?.data?.message) || (err instanceof Error ? err.message : "일괄 주문 취소 실패");
            window.alert(errorMessage);
            if (err instanceof Error && (err.cause as any)?.status === 401) navigate('/members/login');
        }
    };

    // -------------------------------------------------------------
    // 페이지네이션 로직
    // -------------------------------------------------------------

    const { startPage, endPage } = useMemo(() => {
        const number = ordersPage.number;
        const totalPages = ordersPage.totalPages;

        const start = Math.floor(number / MAX_PAGE_BUTTONS) * MAX_PAGE_BUTTONS + 1;
        let end = start + (MAX_PAGE_BUTTONS - 1);
        
        if (totalPages === 0) {
            end = 1;
        } else if (end > totalPages) {
            end = totalPages;
        }
        
        return { startPage: start - 1, endPage: end - 1 };
    }, [ordersPage.number, ordersPage.totalPages]);

    return {
        ordersPage,
        loading,
        error,
        currentPage,
        startPage,
        endPage,
        cancellableOrderIds,
        selectedOrderIds,
        isAllSelected,
        handleCancelOrder,
        handleBulkCancel,
        toggleOrderSelection,
        toggleAllSelection,
    };
};