import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrderHistory } from '../../hooks/useOrderHistory.tsx'; // ⭐️ 커스텀 훅 임포트
import { AlertCircle, Calendar, Package } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { PagingCon } from '@/components/common/PagingCon';
import { ConfirmModal } from '@/components/common/ConfirmModal.tsx';
import { AlertModal } from '@/components/common/AlertModal.tsx';

// -------------------------------------------------------------
// 주문 이력 페이지 컴포넌트
// -------------------------------------------------------------
const OrderHistoryPage: React.FC = () => {
    const navigate = useNavigate();
    // URLSearchParams를 사용하여 페이지 번호를 관리
    //const [searchParams, setSearchParams] = useSearchParams();
    const [searchParams] = useSearchParams(); 
    
    // ⭐️ 커스텀 훅에서 모든 상태와 로직을 가져옵니다.
    const {
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
        isModalOpen, 
        setIsModalOpen,
        openOrderModal,
        isModalOpenTotal, 
        setIsModalOpenTotal,
        alertConfig, 
        setAlertConfig,
        openOrderCancelModal
    } = useOrderHistory();

    /**
     * ➡️ 페이지네이션 버튼 클릭 핸들러 (URL 업데이트)
     */
    const handlePageChange = (newPage: number) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', newPage.toString());
        // URL을 변경하여 useEffect를 통해 데이터 재로딩 트리거
        navigate(`/orders?${newParams.toString()}`); 
    };

    
    // -------------------------------------------------------------
    // JSX 렌더링
    // -------------------------------------------------------------

    // 1. 로딩 상태 UI (Skeleton 스타일)
    if (loading && ordersPage.content.length === 0) {
        return (
            <div className="max-w-[750px] mx-auto py-12 px-4 space-y-6">
                <div className="flex items-center gap-3 mb-8 animate-pulse">
                    <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                    <div className="h-8 w-40 bg-slate-200 rounded-md"></div>
                </div>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-40 w-full bg-slate-100 rounded-[2rem] animate-pulse"></div>
                ))}
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-white py-12 px-4 text-slate-900">
            <div className="max-w-[750px] mx-auto">
                
                {/* 헤더 */}
                <header className="mb-10">
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Package className="w-8 h-8" /> 구매 이력
                    </h2>
                </header>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 font-semibold italic">
                        <AlertCircle className="w-5 h-5" /> {error}
                    </div>
                )}

                {/* ⭐️ 상단 컨트롤 바: 전체 선택 및 일괄 취소 */}
                <div className="flex items-center justify-between mb-6 p-4 px-6 bg-slate-50/80 border border-slate-100 rounded-2xl">
                    <div className="flex items-center gap-3 font-bold text-sm">
                        <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer"
                            checked={isAllSelected}
                            disabled={cancellableOrderIds.length === 0}
                            onChange={toggleAllSelection}
                            id="checkAllOrders"
                        />
                        <label htmlFor="checkAllOrders" className="cursor-pointer select-none">
                            전체 선택 <span className="ml-1 text-slate-400 font-medium">({cancellableOrderIds.length}건 가능)</span>
                        </label>
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-xl font-black h-10 shadow-sm transition-transform active:scale-95"
                        onClick={openOrderCancelModal}
                        disabled={selectedOrderIds.size === 0}
                    >
                        선택 주문 일괄 취소 ({selectedOrderIds.size})
                    </Button>
                </div>

                {/* 주문 목록 */}
                {ordersPage.content.length === 0 && !loading ? (
                    <div className="text-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                        <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <p className="text-xl font-bold text-slate-400 tracking-tight">주문 이력이 없습니다.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {ordersPage.content.map((order) => {
                            const isCancellable = order.orderStatus === 'ORDER';
                            const isSelected = selectedOrderIds.has(order.orderId);

                            return (
                                <div key={order.orderId} className={`group relative bg-white border border-slate-100 rounded-[2.5rem] p-6 transition-all hover:shadow-xl hover:shadow-slate-100 ${!isCancellable && 'opacity-70 grayscale-[0.5]'}`}>
                                    
                                    {/* 개별 주문 상단 바 */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded border-slate-300 accent-slate-900 cursor-pointer"
                                                checked={isSelected}
                                                disabled={!isCancellable}
                                                onChange={() => toggleOrderSelection(order.orderId, isCancellable)}
                                                id={`order-check-${order.orderId}`}
                                            />
                                            <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                                <Calendar className="w-4 h-4 opacity-40" />
                                                <label htmlFor={`order-check-${order.orderId}`} className="cursor-pointer">
                                                    {order.orderDate} 주문
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            {isCancellable ? (
                                                <button 
                                                    className="px-4 py-1.5 text-xs font-black border-2 border-slate-100 rounded-full hover:bg-slate-50 transition-colors"
                                                    onClick={() => openOrderModal(order.orderId)}
                                                >
                                                    취소하기
                                                </button>
                                            ) : (
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-400 border-none font-bold px-3 py-1">
                                                    취소 완료
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* 주문 상품 상세 */}
                                    <div className="space-y-4">
                                        {order.orderItemDtoList.map((orderItem, index) => (
                                            <div key={index} className="flex gap-5 group/item">
                                                <div className="shrink-0 relative">
                                                    <img 
                                                        src={orderItem.imgUrl || 'https://via.placeholder.com/80x80?text=No+Image'} 
                                                        className="rounded-[1.25rem] object-cover border border-slate-50 shadow-sm" 
                                                        alt={orderItem.itemNm} 
                                                        style={{ height: '80px', width: '80px' }}
                                                    />
                                                </div>
                                                <div className="flex flex-col justify-center gap-1 min-w-0">
                                                    <h4 className="font-bold text-lg text-slate-800 tracking-tight truncate group-hover/item:text-slate-900 transition-colors">
                                                        {orderItem.itemNm}
                                                    </h4>
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <span className="font-black text-slate-900 italic">
                                                            {orderItem.orderPrice.toLocaleString()}원
                                                        </span>
                                                        <Separator orientation="vertical" className="h-3 bg-slate-200" />
                                                        <span className="font-medium text-slate-400 underline underline-offset-4">
                                                            {orderItem.count}개 구매
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            {/* ✅ 여기 한 곳에만 배치해두면, 상태가 true가 될 때 자동으로 뜹니다. */}
            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig( ({ ...alertConfig, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
            />
                {/* ⭐️ 훅의 상태와 함수를 모달에 연결 */}
                <ConfirmModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleCancelOrder}
                    title="주문 취소"
                    message="정말로 주문을 취소하시겠습니까?"
                    loading={loading}
                />
                <ConfirmModal
                    isOpen={isModalOpenTotal}
                    onClose={() => setIsModalOpenTotal(false)}
                    onConfirm={handleBulkCancel}
                    title="주문 취소"
                    message="정말로 주문을 취소하시겠습니까?"
                    loading={loading}
                />

                {/* 페이지네이션 (shadcn/ui 컨셉 기반) */}
                {/* 4. 페이지네이션 (Modern shadcn style) */}
                <PagingCon currentPage = {currentPage} totalPages={ordersPage.totalPages} handlePageChange={handlePageChange} first={ordersPage.first} last={ordersPage.last} startPage={startPage} endPage={endPage} />
            {/*ordersPage.totalPages > 1 && (
                <nav className="flex justify-center items-center gap-2 pt-10">
                    <button 
                        disabled={ordersPage.first}
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
                        disabled={ordersPage.last}
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="p-2 rounded-lg border !border-slate-200 hover:!bg-slate-50 disabled:!opacity-30 transition-all"
                    >
                        <ChevronRight size={20} />
                    </button>
                </nav>
            )*/}
                
            </div>
        </div>
    );
};

export default OrderHistoryPage;