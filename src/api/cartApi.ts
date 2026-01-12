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
            } else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
                 // Map 형태의 유효성 검사 오류 메시지를 결합
                 errorMessage = Object.values(errorData).join(', ');
            }

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