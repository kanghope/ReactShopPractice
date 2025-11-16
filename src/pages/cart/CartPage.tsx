import React from 'react';
import { useCart } from '../../hooks/useCart'; // ⭐️ 커스텀 훅 임포트

// -------------------------------------------------------------
// 장바구니 페이지 컴포넌트
// -------------------------------------------------------------
const CartPage: React.FC = () => {
    const {
        cartItems,
        loading,
        error,
        checkedItems,
        isAllSelected,
        handleUpdateCount,
        handleDeleteItem,
        handleOrderSelectedItems,
        toggleItemSelection,
        toggleAllSelection,
    } = useCart();

    const totalAmount = cartItems
        .filter(item => checkedItems.has(item.cartItemId))
        .reduce((sum, item) => sum + (item.price * item.count), 0);

    // -------------------------------------------------------------
    // JSX 렌더링
    // -------------------------------------------------------------

    if (loading && cartItems.length === 0) {
        return <div className="text-center py-5">장바구니 목록 로딩 중...</div>;
    }
    
    return (
        <div className="container py-4">
            <div className="content-mg mx-auto" style={{ maxWidth: '900px' }}>
                <h2 className="mb-4">
                    🧺 장바구니
                </h2>

                {error && <div className="alert alert-danger text-center mb-4">{error}</div>}

                {/* ⭐️ 전체 선택 및 주문 버튼 영역 */}
                <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded shadow-sm">
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            checked={isAllSelected}
                            disabled={cartItems.length === 0}
                            onChange={toggleAllSelection}
                            id="checkAllCartItems"
                        />
                        <label className="form-check-label ms-2" htmlFor="checkAllCartItems">
                            **전체 선택** (총 {cartItems.length}개)
                        </label>
                    </div>
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={handleOrderSelectedItems}
                        disabled={checkedItems.size === 0}
                    >
                        선택 상품 주문하기 ({checkedItems.size}개)
                    </button>
                </div>

                {/* 장바구니 목록 렌더링 */}
                {cartItems.length === 0 && !loading ? (
                    <div className="text-center py-5">
                        <p className="h4 text-muted">장바구니에 담긴 상품이 없습니다.</p>
                        <button className="btn btn-link mt-3" onClick={() => window.location.href = '/'}>
                             상품 둘러보기
                        </button>
                    </div>
                ) : (
                    cartItems.map((item) => {
                        const isSelected = checkedItems.has(item.cartItemId);
                        
                        return (
                            <div key={item.cartItemId} className="mb-3 p-3 border rounded">
                                <div className="d-flex align-items-center">
                                    {/* ⭐️ 개별 체크박스 */}
                                    <div className="form-check me-4">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleItemSelection(item.cartItemId)}
                                            id={`item-check-${item.cartItemId}`}
                                        />
                                        <label className="form-check-label" htmlFor={`item-check-${item.cartItemId}`}></label>
                                    </div>

                                    {/* 상품 정보 */}
                                    <img
                                        src={item.imgUrl || 'https://via.placeholder.com/100x100?text=No+Image'}
                                        className="rounded me-4"
                                        alt={item.itemNm}
                                        style={{ height: '100px', width: '100px', objectFit: 'cover' }}
                                    />
                                    
                                    <div className="flex-grow-1">
                                        <h5 className="mb-1">{item.itemNm}</h5>
                                        <div className="text-danger font-weight-bold h5">
                                            {(item.price * item.count).toLocaleString()}원
                                        </div>
                                        <div className="text-muted small">단가: {item.price.toLocaleString()}원</div>
                                    </div>
                                    
                                    {/* 수량 조정 */}
                                    <div className="input-group" style={{ width: '120px' }}>
                                        <button
                                            className="btn btn-outline-secondary"
                                            type="button"
                                            onClick={() => handleUpdateCount(item.cartItemId, item.count, -1)}
                                            disabled={item.count <= 1 || loading}
                                        >-</button>
                                        <input
                                            type="text"
                                            className="form-control text-center"
                                            value={item.count}
                                            readOnly
                                        />
                                        <button
                                            className="btn btn-outline-secondary"
                                            type="button"
                                            onClick={() => handleUpdateCount(item.cartItemId, item.count, 1)}
                                            disabled={loading}
                                        >+</button>
                                    </div>
                                    
                                    {/* 삭제 버튼 */}
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm ms-4"
                                        onClick={() => handleDeleteItem(item.cartItemId)}
                                        disabled={loading}
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* 총 결제 예정 금액 */}
                <div className="card mt-4">
                    <div className="card-body">
                        <h4 className="card-title text-center mb-4">선택 상품 결제 예정 금액</h4>
                        <div className="d-flex justify-content-between h3">
                            <span>총 상품 금액</span>
                            <span className="text-primary">{totalAmount.toLocaleString()}원</span>
                        </div>
                        <p className="text-center text-muted small mt-2">
                            (배송비는 주문 시점에 계산됩니다.)
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;