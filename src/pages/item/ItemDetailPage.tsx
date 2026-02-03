import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// 인증 상태를 확인하는 useAuth 훅이 있다고 가정합니다. (이전에 구현하셨던 구조를 따름)
import { useAuth } from '../../hooks/useAuth'; 
import type { ItemFormDto, ItemSellStatus } from '../../types/item';

// 🚨 주의: 주문하기 및 장바구니 담기 API는 현재 itemApi.ts에 정의되어 있지 않아 
// 이전 요청에서 사용된 목업 함수를 재현합니다. 실제 API 엔드포인트에 맞춰 수정해야 합니다.
import { getPublicItemDetail } from '../../api/itemApi'; 
import { orderItem, addCart } from '../../api/orderApi'; // 주문 및 장바구니 API 함수
import { CreditCard, Info, Loader2, Package, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';


// -------------------------------------------------------------
// 상품 상세 페이지 컴포넌트
// -------------------------------------------------------------


// Thymeleaf에서 사용된 ItemSellStatus 상수를 프론트엔드에서 참조하기 위한 상수
const ITEM_SELL_STATUS = {
    SELL: 'SELL' as ItemSellStatus,
    SOLD_OUT: 'SOLD_OUT' as ItemSellStatus,
};

const ItemDetailPage = () => {
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
            //alert('로그인 후 이용해주세요');
            toast.warning("로그인 후 이용해주세요.");
            // 로그인 페이지 경로가 '/members/login'이라고 가정
             setTimeout(() => {
                navigate('/members/login'); 
            }, 1000);
            
            return;
        }

        try {
            const resultMsg = await orderItem(itemId, count); // itemApi에 정의된 함수 사용
            //alert(resultMsg); // "주문이 완료 되었습니다."
            toast.success(resultMsg);
            setTimeout(() => {
                navigate('/');
            }, 1000);
            
        } catch (e) {
            // 401 Unauthorized 에러 처리 (API에서 처리했다면)
            const errorMsg = (e as Error).message;
            if (errorMsg.includes('401') || errorMsg.includes('로그인')) {
                 //alert('로그인 후 이용해주세요');
                 toast.warning("로그인 후 이용해주세요.");
                  setTimeout(() => {
                navigate('/members/login');
            }, 1000);
                 
            } else {
                 //alert(errorMsg || '주문 처리 중 오류가 발생했습니다.');
                 toast.warning("주문 처리 중 오류가 발생했습니다.");
            }
        }
    }, [itemId, count, isAuthenticated, navigate, item]);

    // 장바구니 담기 함수
    const handleAddCart = useCallback(async () => {
        if (!item) return;
        
        if (!isAuthenticated) {
            //alert('로그인 후 이용해주세요');
            toast.warning("로그인 후 이용해주세요.");
             setTimeout(() => {
                navigate('/members/login');
            }, 1000);
             
            return;
        }

        try {
            const resultMsg = await addCart(itemId, count); // itemApi에 정의된 함수 사용
            //alert(resultMsg); // "상품을 장바구니에 담았습니다."
            toast.success(resultMsg);
            setTimeout(() => {
                navigate('/');
            }, 1000);
            
        } catch (e) {
             const errorMsg = (e as Error).message;
             if (errorMsg.includes('401') || errorMsg.includes('로그인')) {
                 //alert('로그인 후 이용해주세요');
                 toast.warning("로그인 후 이용해주세요.");
                  setTimeout(() => {
                navigate('/members/login');
            }, 1000);
                 
             } else {
                 //alert(errorMsg || '장바구니 담기 중 오류가 발생했습니다.');
                 toast.warning(errorMsg || '장바구니 담기 중 오류가 발생했습니다.');
             }
        }
    }, [itemId, count, isAuthenticated, navigate, item]);

    // -------------------------------------------------------------
    // 렌더링
    // -------------------------------------------------------------
    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
            <Loader2 className="animate-spin !text-blue-600" size={32} />
            <p className="!text-slate-500 !font-medium">상품 정보를 불러오고 있습니다...</p>
        </div>
    );

    if (error || !item) return (
        <div className="max-w-xl mx-auto my-20 p-6 !bg-red-50 border !border-red-100 rounded-2xl !text-center">
            <p className="!text-red-600 !font-semibold">❌ {error || '상품 정보를 찾을 수 없습니다.'}</p>
        </div>
    );

    const isSelling = item.itemSellStatus === ITEM_SELL_STATUS.SELL;
    const repImg = item.itemImgDtoList?.find(img => img.isRepImg === 'Y') || item.itemImgDtoList?.[0];
    const repImgUrl = repImg?.imgUrl || 'https://via.placeholder.com/400x400?text=No+Image';
    const otherImgs = item.itemImgDtoList?.filter(img => img.imgUrl && img.id !== repImg?.id) || [];
    
    // HTML 구조와 스타일을 Thymeleaf 템플릿과 최대한 유사하게 재현
    return (
        <div className="!max-w-[1100px] !mx-auto px-4 py-10 !space-y-16">
            <input type="hidden" id="itemId" value={itemId} />

            <div className="!grid !grid-cols-1 md:!grid-cols-2 !gap-10 !items-start">
                {/* 상품 대표 이미지 */}
                <div className="!rounded-3xl overflow-hidden !shadow-lg !border !border-slate-100">
                    <img 
                        src={repImgUrl} 
                        className="!w-full !aspect-square !object-cover hover:!scale-105 !transition-transform !duration-500" 
                        alt={item.itemNm}
                    />
                </div>

                {/* 상품 정보 및 구매 인터페이스 */}
                <div className="!flex !flex-col !h-full !py-2">
                    <div className="!mb-6">
                        <span className={`!px-3 !py-1 !rounded-full !text-xs !font-bold ${isSelling ? '!bg-emerald-100 !text-emerald-700' : '!bg-rose-100 !text-rose-700'}`}>
                            {isSelling ? '판매중' : '품절'}
                        </span>
                        <h1 className="!text-3xl !font-black !text-slate-900 !mt-3">{item.itemNm}</h1>
                    </div>

                    <div className="!space-y-6 !flex-grow">
                        <div className="flex !items-baseline !gap-1 !border-b !border-slate-100 !pb-6">
                            <span className="!text-3xl !font-bold !text-rose-600">{item.price?.toLocaleString()}</span>
                            <span className="!text-lg !font-medium !text-slate-500">원</span>
                        </div>

                        {/* 수량 입력 (기존 handleCountChange 유지) */}
                        <div className="!space-y-2">
                            <label htmlFor="count" className="!text-sm !font-semibold !text-slate-700 !ml-1">주문 수량</label>
                            <div className="flex !items-center !w-40 !bg-slate-50 !border !border-slate-200 !rounded-xl !px-4 !py-2 focus-within:!ring-2 focus-within:!ring-blue-500/20 focus-within:!border-blue-500 !transition-all">
                                <Package className="!text-slate-400 !mr-2" size={18} />
                                <input 
                                    type="number" name="count" id="count" 
                                    className="!w-full !bg-transparent !outline-none !font-bold !text-slate-900" 
                                    value={count} onChange={handleCountChange} 
                                    min="1" disabled={!isSelling}
                                />
                            </div>
                        </div>

                        {/* 결제 금액 섹션 */}
                        <div className="!bg-slate-900 !text-white !p-6 !rounded-2xl !shadow-inner !flex !justify-between !items-center">
                            <span className="!text-slate-400 !font-medium">총 결제 금액</span>
                            <span className="!text-2xl !font-black !text-white">{totalPrice.toLocaleString()}원</span>
                        </div>
                    </div>

                    {/* 구매 버튼 그룹 */}
                    <div className="!grid !grid-cols-2 !gap-3 !mt-8">
                        {isSelling ? (
                            <>
                                <button 
                                    type="button" 
                                    onClick={handleAddCart}
                                    className="flex items-center justify-center gap-2 !py-4 !border-slate-200 rounded-2xl !font-bold !text-slate-700 hover:!bg-gray-200 !shadow-lg active:scale-95 transition-all"
                                >
                                    <ShoppingCart size={20} /> 장바구니
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleOrder}
                                    className="flex items-center justify-center gap-2 !py-4 !bg-blue-600 !text-white rounded-2xl !font-bold hover:!bg-blue-700 !shadow-lg !shadow-blue-100 active:scale-95 transition-all"
                                >
                                    <CreditCard size={20} /> 주문하기
                                </button>
                            </>
                        ) : (
                            <button type="button" className="col-span-2 py-4 bg-slate-200 text-slate-500 rounded-2xl font-bold cursor-not-allowed" disabled>
                                품절된 상품입니다
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 상품 상세 설명 섹션 */}
            <div className="!pt-10 !border-t !border-slate-100">
                <div className="flex items-center gap-2 !mb-6">
                    <Info className="!text-blue-600" size={24} />
                    <h2 className="!text-2xl !font-bold !text-slate-900">상품 상세 정보</h2>
                </div>
                <div className="!bg-slate-50 rounded-3xl !p-8 md:!p-12 !leading-relaxed !text-slate-700 !text-lg !whitespace-pre-wrap !shadow-sm">
                    {item.itemDetail}
                </div>
            </div>

            {/* 추가 이미지 목록 */}
            <div className="!space-y-10 !pt-10">
                <h3 className="!text-xl !font-bold !text-center !text-slate-400 !uppercase !tracking-widest">More Images</h3>
                <div className="flex flex-col items-center !gap-8">
                    {otherImgs.map((img, index) => (
                        <div key={img.id || index} className="w-full !max-w-[850px] !rounded-2xl !overflow-hidden !shadow-md">
                            <img 
                                src={img.imgUrl!} 
                                className="!w-full !h-auto !object-cover" 
                                alt={`상품 이미지 ${index + 2}`}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ItemDetailPage;