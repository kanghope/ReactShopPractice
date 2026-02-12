import apiClient from "../config/axiosSetup";
import axios from 'axios';
import { type ErrorResponseData } from '../types/item.ts'; // 공통 에러 타입 가정
import { type CartDetailDto,type CartItemDto,type CartOrderDto } from '../types/cart.ts'; // ⭐️ 장바구니 DTO 임포트

// -------------------------------------------------------------
// API Calls for Cart
// -------------------------------------------------------------

/**
 * 장바구니에 상품을 추가합니다. (POST /api/cart)
 * @param cartItemDto - { itemId: number, count: number }
 * @returns {Promise<number>} - cartItemId
 */
export const addCartItem = async (cartItemDto: CartItemDto): Promise<number> => {
    const url = '/cart'; // @RequestMapping("/api/cart") 가정
    
    try {
        // 서버가 Long(cartItemId)을 반환한다고 가정
        const response = await apiClient.post<number>(url, cartItemDto);
        return response.data; 
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status === 401) {
                throw new Error('401: 로그인 후 이용해주세요', { cause: 401 });
            }
            // 장바구니 추가 시 유효성 검사 에러(Map 형태)도 처리할 수 있음
            const errorData = error.response.data as { message?: string } | Record<string, string>;
            
            let errorMessage = '장바구니 추가 실패';
            if (typeof errorData === 'object' && 'message' in errorData) {
                 errorMessage = errorData.message || errorMessage;
            }
            // 1. 에러 데이터가 '객체' 형태이고, 그 안에 내용물(Key)이 하나라도 있는지 확인합니다. 
            else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
                 // Map 형태의 유효성 검사 오류 메시지를 결합
                 // 2. 객체 안에 있는 '값(Value)'들만 쏙쏙 뽑아냅니다.
                // 결과: ["아이디는 5글자 이상...", "비밀번호에...", "이메일 형식이..."]
                // 3. 뽑아낸 메시지들을 콤마(,)와 공백으로 연결해서 하나의 문장으로 만듭니다.
                // 결과: "아이디는 5글자 이상..., 비밀번호에..., 이메일 형식이..."
                 errorMessage = Object.values(errorData).join(', ');//에러 메시지 내용들만 다 모아서 목록(배열)으로 만든다.
                 //목록에 있는 내용들 사이에 쉼표를 찍어서 보기 좋은 한 문장으로 합친다.
            }
            //"이 에러의 원인(cause)은 서버가 보내온 상태 코드(error.response.status)이다."
            //의미: 에러 객체를 새로 만들어서 던질 때, 단순히 "에러 발생!"이라고만 하지 않고
            //  **"사실은 서버에서 401(또는 404, 500 등) 번호가 와서 생긴 에러야"**라고 꼬표를 달아두는 것입니다.
            throw new Error(errorMessage, { cause: error.response.status });
        }
        throw new Error('네트워크 오류가 발생했습니다.');
    }
};

/**
 * 장바구니 목록을 조회합니다. (GET /api/cart)
 * @returns {Promise<CartDetailDto[]>}
 */
export const fetchCartList = async (): Promise<CartDetailDto[]> => {
    const url = '/cart';
    try {
        const response = await apiClient.get<CartDetailDto[]>(url);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status === 401) {
                throw new Error('401: 로그인 후 이용해주세요', { cause: 401 });
            }
            const errorData = error.response.data as { message?: string };
            throw new Error(errorData?.message || `장바구니 목록 조회 실패: ${error.response.status}`);
        }
        throw new Error('네트워크 오류가 발생했습니다.');
    }
};

/**
 * 장바구니 상품 수량을 변경합니다. (PATCH /api/cart/items/{cartItemId})
 * @param cartItemId - 장바구니 상품 ID
 * @param count - 변경할 수량
 * @returns {Promise<string>} - 성공 메시지
 */
export const updateCartItemCount = async (cartItemId: number, count: number): Promise<string> => {
    const url = `/cart/items/${cartItemId}?count=${count}`;
    try {
        // 백엔드가 String 메시지를 반환한다고 가정
        const response = await apiClient.patch<string>(url);
        return response.data || "수량 변경 성공";
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status === 401) {
                throw new Error('401: 로그인 후 이용해주세요', { cause: 401 });
            }
            const errorData = error.response.data as string | ErrorResponseData;
            const errorMessage = typeof errorData === 'string' ? errorData : (errorData as ErrorResponseData)?.message || `수량 변경 실패: ${error.response.status}`;
            throw new Error(errorMessage, { cause: error.response.status });
        }
        throw new Error('네트워크 오류가 발생했습니다.');
    }
};

/**
 * 장바구니 상품을 삭제합니다. (DELETE /api/cart/items/{cartItemId})
 * @param cartItemId - 장바구니 상품 ID
 * @returns {Promise<string>} - 성공 메시지
 */
export const deleteCartItem = async (cartItemId: number): Promise<string> => {
    const url = `/cart/items/${cartItemId}`;
    try {
        // 백엔드가 String 메시지를 반환한다고 가정
        const response = await apiClient.delete<string>(url);
        return response.data || "장바구니 상품 삭제 성공";
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status === 401) {
                throw new Error('401: 로그인 후 이용해주세요', { cause: 401 });
            }
            const errorData = error.response.data as string | ErrorResponseData;
            const errorMessage = typeof errorData === 'string' ? errorData : (errorData as ErrorResponseData)?.message || `삭제 실패: ${error.response.status}`;
            throw new Error(errorMessage, { cause: error.response.status });
        }
        throw new Error('네트워크 오류가 발생했습니다.');
    }
};

/**
 * 장바구니 상품을 주문합니다. (POST /api/cart/orders)
 * @param cartOrderDto - { cartOrderDtoList: CartOrderDtoItem[] }
 * @returns {Promise<number>} - orderId
 */
export const orderCartItems = async (cartOrderDto: CartOrderDto): Promise<number> => {
    const url = '/cart/orders';
    try {
        // 서버가 Long(orderId)을 반환한다고 가정
        const response = await apiClient.post<number>(url, cartOrderDto);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status === 401) {
                throw new Error('401: 로그인 후 이용해주세요', { cause: 401 });
            }
            const errorData = error.response.data as string | ErrorResponseData;
            const errorMessage = typeof errorData === 'string' ? errorData : (errorData as ErrorResponseData)?.message || `장바구니 주문 실패: ${error.response.status}`;
            throw new Error(errorMessage, { cause: error.response.status });
        }
        throw new Error('네트워크 오류가 발생했습니다.');
    }
};