import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useCart } from '../../hooks/useCart'; // ⭐️ 커스텀 훅 임포트
import {
  Card,

  CardContent,

  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { AlertModal } from '@/components/common/AlertModal';


// -------------------------------------------------------------
// 장바구니 페이지 컴포넌트
// -------------------------------------------------------------
const CartPage = () => {
    const {
        cartItems,
        loading,
        //error,
        checkedItems,
        isAllSelected,
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
        openOrderModal,
    } = useCart();

    /*
    .filter(item => checkedItems.has(item.cartItemId)):
    전체 장바구니(cartItems) 중에서, 체크박스가 선택된(checkedItems 집합에 ID가 포함된) 상품들만 골라냅니다.
    즉, "체크 안 된 상품은 계산에서 제외"하는 필터링 단계입니다.
    .reduce((sum, item) => sum + (item.price * item.count), 0):
    필터링된 상품들을 하나씩 돌면서 누적 합계를 구합니다.
    (item.price * item.count): 각 상품의 (단가 × 수량)을 계산합니다.
    sum + ...: 이전까지 더해온 합계(sum)에 현재 상품의 금액을 더합니다.
    , 0: 합계의 시작값(초깃값)을 0원부터 시작하겠다는 뜻입니다.
    */
    const totalAmount = cartItems
        .filter(item => checkedItems.has(item.cartItemId))
        .reduce((sum, item) => sum + (item.price * item.count), 0);

    // -------------------------------------------------------------
    // JSX 렌더링
    // -------------------------------------------------------------
if (loading && cartItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground font-medium animate-pulse">장바구니 목록 로딩 중...</p>
            </div>
        );
    }

    return (
        <div className="relative max-w-5xl mx-auto px-4 py-12 pb-40 lg:pb-20">
            {/* 헤더 */}
            <header className="mb-10">
                <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                    <ShoppingCart className="w-8 h-8 text-primary" /> 장바구니
                </h2>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                <div className="lg:col-span-2 space-y-6">
                    {/* 전체 선택 바 - 배경색을 더 연하게 조정 */}
                    <div className="flex items-center justify-between p-4 px-6 border rounded-2xl bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <input 
                                type="checkbox"
                                id="all-select"
                                className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 accent-slate-900 cursor-pointer"
                                checked={isAllSelected}
                                onChange={toggleAllSelection} // 기존 input은 onChange 사용
                                disabled={cartItems.length === 0}
                            />
                            <label htmlFor="all-select" className="text-sm font-bold cursor-pointer select-none">
                                전체 선택 <span className="ml-1 text-slate-400 font-medium">({cartItems.length})</span>
                            </label>
                        </div>
                    </div>

                    {/* 상품 리스트 */}
                    <div className="space-y-4">
                        {cartItems.map((item) => {
                            const isSelected = checkedItems.has(item.cartItemId);
                            return (
                                <div 
                                    key={item.cartItemId} 
                                    className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm"
                                >
                                    {/* 체크박스 영역: 선택 여부와 상관없이 카드 스타일 유지 */}
                                    <div className="flex items-center justify-center">
                                        <input 
                                            type="checkbox"
                                            className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 accent-slate-900 cursor-pointer"
                                            checked={isSelected}
                                            onChange={() => toggleItemSelection(item.cartItemId)}
                                            id={`item-check-${item.cartItemId}`}
                                        />
                                    </div>
                                    
                                    {/* 상품 이미지 */}
                                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                                        <img 
                                            src={item.imgUrl || 'https://via.placeholder.com/100x100?text=No+Image'} 
                                            alt={item.itemNm} 
                                            className="object-cover w-full h-full" 
                                        />
                                    </div>

                                    {/* 상품 정보 */}
                                    <div className="flex-grow space-y-1 text-center sm:text-left">
                                        <h4 className="font-bold text-lg text-slate-800 tracking-tight">
                                            {item.itemNm}
                                        </h4>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xl font-black text-slate-900">
                                                {(item.price * item.count).toLocaleString()}원
                                            </span>
                                            <span className="!text-xs !font-medium text-blue-300 !tracking-wide">
                                                단가 {item.price.toLocaleString()}원
                                            </span>
                                        </div>
                                    </div>

                                    {/* 수량 및 삭제 컨트롤 */}
                                    <div className="flex flex-row sm:flex-col items-center gap-3">
                                        <div className="flex items-center border border-slate-200 bg-slate-50/50 rounded-xl p-1 h-10">
                                            <Button 
                                                variant="ghost" size="icon" className="h-8 w-8 hover:bg-white rounded-lg"
                                                onClick={() => handleUpdateCount(item.cartItemId, item.count, -1)}
                                                disabled={item.count <= 1 || loading}
                                            >
                                                <Minus className="w-3 h-3 text-slate-500" />
                                            </Button>
                                            <span className="w-8 text-center font-black text-sm text-slate-700">{item.count}</span>
                                            <Button 
                                                variant="ghost" size="icon" className="h-8 w-8 hover:bg-white rounded-lg"
                                                onClick={() => handleUpdateCount(item.cartItemId, item.count, 1)}
                                                disabled={loading}
                                            >
                                                <Plus className="w-3 h-3 text-slate-500" />
                                            </Button>
                                        </div>
                                        <Button 
                                            variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            onClick={() => openDeleteModal(item.cartItemId)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 결제 요약 (Desktop) */}
                <aside className="hidden lg:sticky lg:top-24 self-start lg:block">
                    <Card className="shadow-xl shadow-slate-200/50 border-slate-200 rounded-[2.5rem]">
                        <CardHeader>
                            <CardTitle className="text-lg font-black tracking-tight text-slate-800">주문 요약</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3 px-1">
                                <div className="flex justify-between text-sm font-bold text-slate-500">
                                    <span>상품 수</span>
                                    <span className="text-slate-900">{checkedItems.size}개</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-slate-500">
                                    <span>배송비</span>
                                    <span className="text-blue-600">무료</span>
                                </div>
                            </div>
                            <Separator className="bg-slate-100" />
                            <div className="py-2 px-1">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">총 결제 예정 금액</p>
                                <p className="text-4xl font-black text-slate-900 tracking-tighter">
                                    {totalAmount.toLocaleString()}<span className="text-xl ml-0.5">원</span>
                                </p>
                            </div>
                            <Button 
                                className="w-full h-14 text-lg font-black rounded-2xl shadow-lg shadow-blue-100 transition-all hover:scale-[1.02] active:scale-95"
                                disabled={checkedItems.size === 0}
                                onClick={openOrderModal}
                            >
                                주문하기
                            </Button>
                        </CardContent>
                    </Card>
                </aside>
            </div>

            {/* 모바일 하단 고정 바 */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-100 p-4 pb-10 shadow-[0_-10px_30px_rgba(0,0,0,0,0.05)]">
                <div className="flex items-center justify-between gap-6 max-w-lg mx-auto">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">결제 예정</span>
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-2xl font-black text-slate-900">{totalAmount.toLocaleString()}</span>
                            <span className="text-sm font-bold text-slate-900">원</span>
                        </div>
                    </div>
                    <Button 
                        size="lg"
                        className="flex-grow h-14 rounded-2xl font-black text-lg active:scale-95 shadow-lg !shadow-blue-100"
                        disabled={checkedItems.size === 0}
                        onClick={openOrderModal}
                    >
                        주문하기 <span className="ml-1.5 opacity-60 text-sm">{checkedItems.size}</span>
                    </Button>
                </div>
            </div>
            {/* ⭐️ 훅의 상태와 함수를 모달에 연결 */}
            <ConfirmModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleDeleteItem}
                title="상품 삭제"
                message="정말로 이 상품을 장바구니에서 삭제하시겠습니까?"
                loading={loading}
            />
            {/* ✅ 여기 한 곳에만 배치해두면, 상태가 true가 될 때 자동으로 뜹니다. */}
            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig( ({ ...alertConfig, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
            />
            
            <ConfirmModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                onConfirm={handleOrderSelectedItems} // 여기서 진짜 주문 함수 실행
                title="주문 확인"
                message={`${checkedItems.size}개의 상품을 주문하시겠습니까?`}
                loading={loading}
            />
            
        </div>
    );
};

export default CartPage;