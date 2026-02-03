import { useState, useEffect, useCallback} from 'react';
import * as cartApi from '../api/cartApi';
import {type CartDetailDto } from '../types/cart';
import { toast } from 'sonner';



/**
 * @interface UseCartResult
 * 장바구니 커스텀 훅의 반환 타입
 
    Set은 자바스크립트에서 **"중복을 허용하지 않는 값들의 집합"**을 관리하는 특수한 자료구조입니다.
    장바구니의 체크박스 기능을 구현할 때 일반 배열([]) 대신 Set을 사용하는 이유는 성능과 편의성 때문입니다.
    1. Set의 핵심 특징
    중복 불가: 똑같은 cartItemId를 두 번 넣어도 하나만 유지됩니다.
    빠른 검색: 특정 아이디가 포함되어 있는지 확인(has)할 때 배열보다 훨씬 빠릅니다. (배열은 처음부터 끝까지 다 뒤져야 하지만, Set은 즉시 찾아냅니다.)
    간편한 추가/삭제: add, delete 메서드로 직관적으로 관리할 수 있습니다.
 */
interface UseCartResult {
    cartItems: CartDetailDto[];
    loading: boolean;
    error: string | null;
    checkedItems: Set<number>; // 선택된 cartItemId 목록
    isAllSelected: boolean;
    loadCartItems: () => void;
    handleUpdateCount: (cartItemId: number, currentCount: number, delta: number) => Promise<void>;
    handleDeleteItem: () => Promise<void>;
    handleOrderSelectedItems: () => Promise<number | null>;
    toggleItemSelection: (cartItemId: number) => void;
    toggleAllSelection: () => void;
    isModalOpen: boolean;
    setIsModalOpen: (open: boolean) => void;
    openDeleteModal :  (cartItemId: number) => void;
    alertConfig : {isOpen : boolean, title :string, message: string};
    setAlertConfig : (config : any) => void;
    isOrderModalOpen: boolean
    setIsOrderModalOpen:(open: boolean) => void;
    openOrderModal: () => void;
}

export const useCart = (): UseCartResult => {
    const [cartItems, setCartItems] = useState<CartDetailDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
    // ⭐️ 모달 제어 상태 추가
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
    const [alertConfig, setAlertConfig] = useState({ 
        isOpen: false, 
        title: "", 
        message: "" 
    });

    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);//주문시 

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
    /*
    1. prev => ... (함수형 업데이트)의 정체
    setCheckedItems 안에서 사용하는 prev => ...는 리액트의 **함수형 업데이트(Functional Update)**라는 기능입니다.
    누가 넣어주나?: 리액트가 넣어줍니다. 우리가 호출할 때 인자를 전달하는 게 아니라, 
    리액트의 useState가 "내가 지금 가지고 있는 가장 최신의 상태값을 너한테 줄게, 
    이걸로 새 상태를 만들어봐"라고 알아서 넣어주는 것입니다.
    왜 이렇게 쓰나?: useCallback과 함께 쓸 때 가장 큰 빛을 발합니다.
    만약 new Set(checkedItems)처럼 외부 변수를 직접 쓰면, useCallback의 의존성 배열에 [checkedItems]를 넣어야 합니다.
    그러면 checkedItems가 바뀔 때마다 함수가 새로 만들어지므로 useCallback을 쓰는 의미가 퇴색됩니다.
    하지만 prev => ...를 쓰면 외부 변수(checkedItems)를 참조할 필요가 없으므로, 의존성 배열을 []로 비워둘 수 있고 
    함수를 딱 한 번만 만들어 재사용할 수 있습니다.
    */
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

    // 1. 삭제 버튼 클릭 시 호출 (모달만 띄움)
    const openDeleteModal = useCallback((cartItemId: number) => {
        setPendingDeleteId(cartItemId);
        setIsModalOpen(true);
    }, []);

    // 상품 삭제
    const handleDeleteItem = useCallback(async () => { 
/*cartItemId: number */
        //if (!window.confirm("선택한 상품을 장바구니에서 삭제하시겠습니까?")) return;
        if(pendingDeleteId === null) return;

        try {
            setLoading(true);
            await cartApi.deleteCartItem(pendingDeleteId);
            
            // 성공 시 상태 업데이트 및 선택 목록에서 제거
            //.filter(...): 배열의 각 요소를 돌면서, 조건에 맞는 요소만 남겨서 새로운 배열을 만드는 자바스크립트 함수입니다.
            setCartItems(prevItems => prevItems.filter(item => item.cartItemId !== pendingDeleteId));
            setCheckedItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(pendingDeleteId);
                return newSet;
            });
            setIsModalOpen(false);
            //alert("장바구니 상품이 삭제되었습니다.");

            toast.success("장바구니 상품이 삭제되었습니다.");


        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "상품 삭제 실패";
            alert(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
            setPendingDeleteId(null);
        }
    }, [pendingDeleteId]);

    // 2. 주문 버튼 클릭 시 호출할 함수 
    const openOrderModal = useCallback(() => {
        if (checkedItems.size === 0) {
            setAlertConfig({
                isOpen: true,
                title: "주문 불가",
                message: "주문할 상품을 선택해주세요."
            });
            return;
        }
        setIsOrderModalOpen(true); // 주문 확인 모달 띄우기
    }, [checkedItems.size]);
    // 선택된 상품 주문
    const handleOrderSelectedItems = useCallback(async (): Promise<number | null> => {
        setIsOrderModalOpen(false); // 모달 닫기
        /*
        if (checkedItems.size === 0) {
            // ✅ JSX를 넣는 대신 상태를 바꿉니다.
            setAlertConfig({
                isOpen: true,
                title: "주문 불가",
                message: "주문할 상품을 선택해주세요."
            });
            return null; // 함수 종료
        }
        
        if (!window.confirm(`${checkedItems.size}개의 상품을 주문하시겠습니까?`)) return null;
*/
        const cartOrderDtoList = Array.from(checkedItems).map(id => ({ cartItemId: id }));
        const orderDto = { cartOrderDtoList };

        try {
            setLoading(true);
            const orderId = await cartApi.orderCartItems(orderDto);
            // 성공 토스트 (기존 alert 대신 사용 추천)
            toast.success(`주문이 완료되었습니다! (번호: ${orderId})`);
            
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
        toggleAllSelection,
        isModalOpen, 
        setIsModalOpen,
        openDeleteModal,
        alertConfig, 
        setAlertConfig,
        isOrderModalOpen,
        setIsOrderModalOpen,
        openOrderModal
    };
};