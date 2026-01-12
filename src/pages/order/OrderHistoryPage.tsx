import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrderHistory } from '../../hooks/useOrderHistory.tsx'; // ⭐️ 커스텀 훅 임포트



// -------------------------------------------------------------
// 주문 이력 페이지 컴포넌트
// -------------------------------------------------------------
const OrderHistoryPage: React.FC = () => {
    const navigate = useNavigate();
    // URLSearchParams를 사용하여 페이지 번호를 관리
    const [searchParams, setSearchParams] = useSearchParams(); 
    
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

    if (loading && ordersPage.content.length === 0) {
        return <div className="text-center py-5">주문 이력 로딩 중...</div>;
    }
    
    return (
        <div className="container py-4">
            <div className="content-mg mx-auto" style={{ maxWidth: '750px' }}>
                <h2 className="mb-4">
                    📦 구매 이력
                </h2>

                {error && <div className="alert alert-danger text-center mb-4">{error}</div>}

                {/* ⭐️ 전체 선택 및 일괄 취소 버튼 영역 */}
                <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded">
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            checked={isAllSelected}
                            disabled={cancellableOrderIds.length === 0}
                            onChange={toggleAllSelection}
                            id="checkAllOrders"
                        />
                        <label className="form-check-label" htmlFor="checkAllOrders">
                            전체 선택 (취소 가능 주문: {cancellableOrderIds.length}건)
                        </label>
                    </div>
                    <button
                        className="btn btn-danger btn-sm"
                        onClick={handleBulkCancel}
                        disabled={selectedOrderIds.size === 0}
                    >
                        선택 주문 일괄 취소 ({selectedOrderIds.size})
                    </button>
                </div>

                {/* 주문 목록 렌더링 */}
                 {ordersPage.content.length === 0 && !loading ? (
                     <div className="text-center py-5">
                         <p className="h4 text-muted">주문 이력이 없습니다.</p>
                     </div>
                 ) : (
                    ordersPage.content.map((order) => {
                        const isCancellable = order.orderStatus === 'ORDER';
                        const isSelected = selectedOrderIds.has(order.orderId);

                         return (
                            <div key={order.orderId} className="mb-4 p-3 border rounded shadow-sm">
                                <div className="d-flex mb-3 align-items-center justify-content-between">
                                    <h5 className="mb-0">
                                        {/* ⭐️ 개별 체크박스 */}
                                        <div className="form-check d-inline-block me-3">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={isSelected}
                                                disabled={!isCancellable}
                                                onChange={() => toggleOrderSelection(order.orderId, isCancellable)}
                                                id={`order-check-${order.orderId}`}
                                            />
                                            <label className="form-check-label" htmlFor={`order-check-${order.orderId}`}>
                                                **{order.orderDate} 주문**
                                            </label>
                                        </div>
                                    </h5>
                                    <div>
                                        {isCancellable ? (
                                            <button 
                                                type="button" 
                                                className="btn btn-outline-secondary btn-sm" 
                                                onClick={() => handleCancelOrder(order.orderId)}
                                            >
                                                단일 주문취소
                                            </button>
                                        ) : (
                                            <span className="badge bg-secondary">(취소 완료)</span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="d-flex flex-column">
                                    {order.orderItemDtoList.map((orderItem, index) => (
                                        <div key={index} className="d-flex py-2 border-top">
                                            <div className="repImgDiv me-3">
                                                <img 
                                                    src={orderItem.imgUrl || 'https://via.placeholder.com/80x80?text=No+Image'} 
                                                    className="rounded" 
                                                    alt={orderItem.itemNm} 
                                                    style={{ height: '80px', width: '80px', objectFit: 'cover' }}
                                                />
                                            </div>
                                            <div className="align-self-center w-75">
                                                <div className="font-weight-bold mb-1">{orderItem.itemNm}</div>
                                                <div className="text-muted">
                                                    <span>{orderItem.orderPrice.toLocaleString()}원</span>
                                                    <span className="ms-3">수량: {orderItem.count}개</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}

                {/* 페이지네이션 */}
                {ordersPage.totalPages > 1 && (
                    <nav>
                        <ul className="pagination justify-content-center mt-4">
                            {/* 이전 버튼 */}
                            <li className={`page-item ${ordersPage.first ? 'disabled' : ''}`}>
                                <a 
                                    className="page-link" 
                                    href="#" 
                                    aria-label='Previous'
                                    onClick={(e) => { 
                                        e.preventDefault(); 
                                        if (!ordersPage.first) handlePageChange(currentPage - 1); 
                                    }}
                                >
                                    <span aria-hidden='true'>&laquo; 이전</span>
                                </a>
                            </li>

                            {/* 페이지 번호 버튼 */}
                            {/* 0-based pageIndex를 사용자에게는 +1 하여 1-based로 보여줍니다. */}
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
                            <li className={`page-item ${ordersPage.last ? 'disabled' : ''}`}>
                                <a 
                                    className="page-link" 
                                    href="#" 
                                    aria-label='Next'
                                    onClick={(e) => { 
                                        e.preventDefault(); 
                                        if (!ordersPage.last) handlePageChange(currentPage + 1); 
                                    }}
                                >
                                    <span aria-hidden='true'>다음 &raquo;</span>
                                </a>
                            </li>
                        </ul>
                    </nav>
                )}
            </div>
        </div>
    );
};

export default OrderHistoryPage;