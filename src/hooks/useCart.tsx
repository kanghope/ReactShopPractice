import { useState, useEffect, useCallback } from 'react';
import * as cartApi from '../api/cartApi';
import {type CartDetailDto } from '../types/cart';

/**
 * @interface UseCartResult
 * 장바구니 커스텀 훅의 반환 타입
 */
interface UseCartResult {
    cartItems: CartDetailDto[];
    loading: boolean;
    error: string | null;
    checkedItems: Set<number>; // 선택된 cartItemId 목록
    isAllSelected: boolean;
    loadCartItems: () => void;
    handleUpdateCount: (cartItemId: number, currentCount: number, delta: number) => Promise<void>;
    handleDeleteItem: (cartItemId: number) => Promise<void>;
    handleOrderSelectedItems: () => Promise<number | null>;
    toggleItemSelection: (cartItemId: number) => void;
    toggleAllSelection: () => void;
}

export const useCart = (): UseCartResult => {
    const [cartItems, setCartItems] = useState<CartDetailDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
    
    // 장바구니 목록 불러오기
    const loadCartItems = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await cartApi.fetchCartList();
            setCartItems(data);
            // 목록 로드 후 선택된 항목 초기화 (전체 선택 해제)
            setCheckedItems(new Set());
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "장바구니 목록을 불러오는 데 실패했습니다.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCartItems();
    }, [loadCartItems]);

    // 상품 선택 토글
    const toggleItemSelection = useCallback((cartItemId: number) => {
        setCheckedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(cartItemId)) {
                newSet.delete(cartItemId);
            } else {
                newSet.add(cartItemId);
            }
            return newSet;
        });
    }, []);

    // 전체 선택/해제 토글
    const toggleAllSelection = useCallback(() => {
        const allItemIds = new Set(cartItems.map(item => item.cartItemId));
        if (checkedItems.size === cartItems.length) {
            setCheckedItems(new Set()); // 전체 해제
        } else {
            setCheckedItems(allItemIds); // 전체 선택
        }
    }, [cartItems, checkedItems.size]);

    const isAllSelected = cartItems.length > 0 && checkedItems.size === cartItems.length;


    // 수량 변경
    const handleUpdateCount = useCallback(async (cartItemId: number, currentCount: number, delta: number) => {
        const newCount = currentCount + delta;
        if (newCount < 1) return; 

        try {
            setLoading(true);
            await cartApi.updateCartItemCount(cartItemId, newCount);
            
            // 성공 시 상태 업데이트
            setCartItems(prevItems => 
                prevItems.map(item => 
                    item.cartItemId === cartItemId ? { ...item, count: newCount } : item
                )
            );
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "수량 변경 실패";
            alert(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);


    // 상품 삭제
    const handleDeleteItem = useCallback(async (cartItemId: number) => {
        if (!window.confirm("선택한 상품을 장바구니에서 삭제하시겠습니까?")) return;

        try {
            setLoading(true);
            await cartApi.deleteCartItem(cartItemId);
            
            // 성공 시 상태 업데이트 및 선택 목록에서 제거
            setCartItems(prevItems => prevItems.filter(item => item.cartItemId !== cartItemId));
            setCheckedItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(cartItemId);
                return newSet;
            });
            alert("장바구니 상품이 삭제되었습니다.");
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "상품 삭제 실패";
            alert(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);


    // 선택된 상품 주문
    const handleOrderSelectedItems = useCallback(async (): Promise<number | null> => {
        if (checkedItems.size === 0) {
            alert("주문할 상품을 선택해주세요.");
            return null;
        }
        
        if (!window.confirm(`${checkedItems.size}개의 상품을 주문하시겠습니까?`)) return null;

        const cartOrderDtoList = Array.from(checkedItems).map(id => ({ cartItemId: id }));
        const orderDto = { cartOrderDtoList };

        try {
            setLoading(true);
            const orderId = await cartApi.orderCartItems(orderDto);
            alert(`주문 성공! 주문 번호: ${orderId}`);
            
            // 주문 성공 후, 주문된 상품을 목록에서 제거하고 상태를 갱신
            setCartItems(prevItems => 
                prevItems.filter(item => !checkedItems.has(item.cartItemId))
            );
            setCheckedItems(new Set());
            return orderId;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "주문 실패";
            alert(errorMessage);
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, [checkedItems]);


    return {
        cartItems,
        loading,
        error,
        checkedItems,
        isAllSelected,
        loadCartItems,
        handleUpdateCount,
        handleDeleteItem,
        handleOrderSelectedItems,
        toggleItemSelection,
        toggleAllSelection
    };
};