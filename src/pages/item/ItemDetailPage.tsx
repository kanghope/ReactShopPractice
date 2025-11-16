import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// 인증 상태를 확인하는 useAuth 훅이 있다고 가정합니다. (이전에 구현하셨던 구조를 따름)
import { useAuth } from '../../hooks/useAuth'; 
import type { ItemFormDto, ItemSellStatus } from '../../types/item';

// 🚨 주의: 주문하기 및 장바구니 담기 API는 현재 itemApi.ts에 정의되어 있지 않아 
// 이전 요청에서 사용된 목업 함수를 재현합니다. 실제 API 엔드포인트에 맞춰 수정해야 합니다.
import { getPublicItemDetail } from '../../api/itemApi'; 
import { orderItem, addCart } from '../../api/orderApi'; // 주문 및 장바구니 API 함수

// -------------------------------------------------------------
// 상품 상세 페이지 컴포넌트
// -------------------------------------------------------------


// Thymeleaf에서 사용된 ItemSellStatus 상수를 프론트엔드에서 참조하기 위한 상수
const ITEM_SELL_STATUS = {
    SELL: 'SELL' as ItemSellStatus,
    SOLD_OUT: 'SOLD_OUT' as ItemSellStatus,
};

const ItemDetailPage: React.FC = () => {
    // -------------------------------------------------------------
    // 상태 및 훅 초기화
    // -------------------------------------------------------------
    const { itemId: itemIdStr } = useParams<{ itemId: string }>();
    const itemId = useMemo(() => Number(itemIdStr), [itemIdStr]);
    
    const navigate = useNavigate();
    // 'useAuth' 훅이 로그인 상태와 유저 정보를 제공한다고 가정합니다.
    const { isAuthenticated } = useAuth(); 

    const [item, setItem] = useState<ItemFormDto | null>(null);
    const [count, setCount] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // -------------------------------------------------------------
    // 데이터 로딩
    // -------------------------------------------------------------
    /**
     * 상품 상세 정보 로드
     */
    const fetchItemDetail = useCallback(async () => {
        if (isNaN(itemId) || itemId <= 0) {
            setError('유효하지 않은 상품 ID입니다.');
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        try {
            // getPublicItemDetail API 서비스 호출
            const data = await getPublicItemDetail(itemId);
            setItem(data);
            setError(null);
        } catch (e) {
            const message = (e as Error).message;
            setError(message);
            setItem(null);
        } finally {
            setIsLoading(false);
        }
    }, [itemId]);

    useEffect(() => {
        fetchItemDetail();
    }, [fetchItemDetail]);

    // -------------------------------------------------------------
    // 파생 상태 및 핸들러
    // -------------------------------------------------------------
    
    // 총 결제 금액 계산
    const totalPrice = useMemo(() => {
        if (!item || !item.price || isNaN(count)) return 0;
        return (item.price * count) || 0;
    }, [item, count]);

    // 수량 변경 핸들러
    const handleCountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        // 수량은 최소 1개 이상이어야 합니다.
        if (value >= 1) {
            setCount(value);
        }
    }, []);

    // 주문하기 함수
    const handleOrder = useCallback(async () => {
        if (!item) return;

        if (!isAuthenticated) {
            alert('로그인 후 이용해주세요');
            // 로그인 페이지 경로가 '/members/login'이라고 가정
            navigate('/members/login'); 
            return;
        }

        try {
            const resultMsg = await orderItem(itemId, count); // itemApi에 정의된 함수 사용
            alert(resultMsg); // "주문이 완료 되었습니다."
            navigate('/');
        } catch (e) {
            // 401 Unauthorized 에러 처리 (API에서 처리했다면)
            const errorMsg = (e as Error).message;
            if (errorMsg.includes('401') || errorMsg.includes('로그인')) {
                 alert('로그인 후 이용해주세요');
                 navigate('/members/login');
            } else {
                 alert(errorMsg || '주문 처리 중 오류가 발생했습니다.');
            }
        }
    }, [itemId, count, isAuthenticated, navigate, item]);

    // 장바구니 담기 함수
    const handleAddCart = useCallback(async () => {
        if (!item) return;
        
        if (!isAuthenticated) {
            alert('로그인 후 이용해주세요');
            navigate('/members/login'); 
            return;
        }

        try {
            const resultMsg = await addCart(itemId, count); // itemApi에 정의된 함수 사용
            alert(resultMsg); // "상품을 장바구니에 담았습니다."
            navigate('/');
        } catch (e) {
             const errorMsg = (e as Error).message;
             if (errorMsg.includes('401') || errorMsg.includes('로그인')) {
                 alert('로그인 후 이용해주세요');
                 navigate('/members/login');
             } else {
                 alert(errorMsg || '장바구니 담기 중 오류가 발생했습니다.');
             }
        }
    }, [itemId, count, isAuthenticated, navigate, item]);

    // -------------------------------------------------------------
    // 렌더링
    // -------------------------------------------------------------
    if (isLoading) {
        return <div className="text-center py-5">상품 정보를 로딩 중입니다... 🔄</div>;
    }

    if (error || !item) {
        return <div className="alert alert-danger text-center py-5">❌ {error || '상품 정보를 찾을 수 없습니다.'}</div>;
    }

    const isSelling = item.itemSellStatus === ITEM_SELL_STATUS.SELL;
    const repImg = item.itemImgDtoList?.find(img => img.isRepImg === 'Y') || item.itemImgDtoList?.[0];
    const repImgUrl = repImg?.imgUrl || 'https://via.placeholder.com/400x400?text=No+Image';
    const otherImgs = item.itemImgDtoList?.filter(img => img.imgUrl && img.id !== repImg?.id) || [];
    
    // HTML 구조와 스타일을 Thymeleaf 템플릿과 최대한 유사하게 재현
    return (
        <div className="container py-5" style={{ minHeight: '600px', marginLeft: '25%', marginRight: '25%' }}>

            <input type="hidden" id="itemId" value={itemId} />

            <div className="d-flex flex-column flex-md-row">
                {/* 상품 대표 이미지 영역 */}
                <div className="repImgDiv me-md-4 mb-4 mb-md-0" style={{ width: '50%' }}>
                    <img 
                        src={repImgUrl} 
                        className="rounded repImg img-fluid" 
                        alt={item.itemNm}
                        style={{ height: '400px', width: '100%', objectFit: 'cover' }}
                    />
                </div>

                {/* 상품 정보 및 구매 인터페이스 */}
                <div className="wd50" style={{ width: '50%' }}>
                    {/* 판매 상태 배지 */}
                    <span 
                        className={`badge mgb-15 ${isSelling ? 'badge-primary' : 'btn-danger'}`}
                    >
                        {isSelling ? '판매중' : '품절'}
                    </span>
                    
                    <div className="h4 mt-2 mb-4">**{item.itemNm}**</div>
                    <hr className="my-4" />

                    <div className="text-right">
                        {/* 가격 정보 */}
                        <div className="h4 text-danger text-left">
                            <input type="hidden" value={item.price || 0} id="price" name="price" />
                            <span>{item.price?.toLocaleString() || 0}</span>원
                        </div>
                        
                        {/* 수량 입력 필드 */}
                        <div className="input-group w-50 mt-3">
                            <div className="input-group-prepend">
                                <span className="input-group-text">수량</span>
                            </div>
                            <input 
                                type="number" 
                                name="count" 
                                id="count" 
                                className="form-control" 
                                value={count} 
                                onChange={handleCountChange} 
                                min="1" 
                                disabled={!isSelling}
                            />
                        </div>
                    </div>
                    <hr className="my-4" />

                    {/* 결제 금액 섹션 */}
                    <div className="text-right mgt-50" style={{ marginTop: '50px' }}>
                        <h5>결제 금액</h5>
                        <h3 id="totalPrice" className="font-weight-bold">{totalPrice.toLocaleString()}원</h3>
                    </div>

                    {/* 구매 버튼 그룹 */}
                    <div className="text-right mt-3">
                        {isSelling ? (
                            <>
                                <button 
                                    type="button" 
                                    className="btn btn-light border border-primary btn-lg me-2" 
                                    onClick={handleAddCart}
                                >
                                    🛒 장바구니 담기
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary btn-lg" 
                                    onClick={handleOrder}
                                >
                                    💰 주문하기
                                </button>
                            </>
                        ) : (
                            <button type="button" className="btn btn-danger btn-lg" disabled>
                                🚫 품절
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 상품 상세 설명 (Jumbotron 스타일) */}
            <div className="jumbotron jumbotron-fluid mgt-30 p-4 bg-light rounded" style={{ marginTop: '30px' }}>
                <div className="container">
                    <h4 className="display-5">상품 상세 설명</h4>
                    <hr className="my-4" />
                    <p className="lead" style={{ whiteSpace: 'pre-wrap' }}>{item.itemDetail}</p>
                </div>
            </div>

            {/* 추가 이미지 목록 */}
            <h4 className="mt-5 text-center">추가 이미지</h4>
            <hr />
            {otherImgs.map((img, index) => (
                <div key={img.id || index} className="text-center">
                    <img 
                        src={img.imgUrl!} 
                        className="rounded mgb-15 img-fluid" 
                        width="800" 
                        alt={`상품 이미지 ${index + 2}`}
                        style={{ marginBottom: '15px' }}
                    />
                </div>
            ))}

        </div>
    );
};

export default ItemDetailPage;