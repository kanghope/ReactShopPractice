import apiClient from "../config/axiosSetup";
import axios from 'axios';
import type { PageResponse, ErrorResponseData } from '../types/item.ts'; // 공통 DTO
import type { OrderHistDto } from '../types/order.ts'; // ⭐️ 주문 DTO 임포트

// -------------------------------------------------------------
// API Calls for Orders & Cart
// -------------------------------------------------------------

/**
 * 주문 API 호출 (POST /order) - 기존 itemApi.ts에서 이동
 */
export const orderItem = async (itemId: number, count: number): Promise<string> => {
    // 실제 백엔드 경로는 '/api/order' 또는 이와 유사한 형태여야 합니다.
    // OrderController의 @RequestMapping("/api/order")를 가정하면, '/order'로 호출해야 합니다.
    const url = '/order'; 
    const paramData = { itemId, count };

    try {
        await apiClient.post(url, paramData);
        return "주문이 완료 되었습니다."; 
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status === 401) {
                // 401 오류 시, cause에 status를 담아 리다이렉트를 유도
                throw new Error('401: 로그인 후 이용해주세요', { cause: 401 }); 
            }
            const errorData = error.response.data as { message?: string };
            throw new Error(errorData?.message || `주문 처리 실패: ${error.response.status}`);
        }
        throw new Error('네트워크 오류가 발생했습니다.');
    }
};

/**
 * 장바구니 담기 API 호출 (POST /cart) - 기존 itemApi.ts에서 이동
 */
export const addCart = async (itemId: number, count: number): Promise<string> => {
    // 실제 백엔드 경로는 '/api/cart' 또는 이와 유사한 형태여야 합니다.
    const url = '/cart';
    const paramData = { itemId, count };

    try {
        await apiClient.post(url, paramData);
        return "상품을 장바구니에 담았습니다."; 
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status === 401) {
                // 401 오류 시, cause에 status를 담아 리다이렉트를 유도
                throw new Error('401: 로그인 후 이용해주세요', { cause: 401 });
            }
            const errorData = error.response.data as { message?: string };
            throw new Error(errorData?.message || `장바구니 담기 실패: ${error.response.status}`);
        }
        throw new Error('네트워크 오류가 발생했습니다.');
    }
};

/**
 * ⭐️ 주문 이력 목록 조회 (GET /api/order/orders) - [NEW]
 * @param page 페이지 번호 (0-based)
 * @param size 페이지 크기
 * @returns PageResponse<OrderHistDto>
 */
export const getOrderHistory = async (
    page: number = 0,
    size: number = 4 
): Promise<PageResponse<OrderHistDto>> => {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });
        
        // OrderController의 @RequestMapping("/api/order")를 가정
        const response = await apiClient.get<PageResponse<OrderHistDto>>(`/order/orders?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error("주문 이력 목록 조회 오류:", error);
        
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status === 401) {
                throw new Error('401: 로그인 후 이용해주세요', { cause: 401 });
            }
            const errorData = error.response.data as { message?: string };
            throw new Error(errorData?.message || `주문 이력 조회 실패: ${error.response.status}`);
        }
        throw new Error('네트워크 오류가 발생했습니다.');
    }
};

/**
 * ⭐️ 주문 취소 API 호출 (POST /api/order/orders/{orderId}/cancel) - [NEW]
 * @param orderId 취소할 주문 ID
 * @returns 성공 메시지
 */
export const cancelOrderApi = async (orderId: number): Promise<string> => {
    try {
        // OrderController의 @PostMapping("/orders/{orderId}/cancel")를 사용
        const response = await apiClient.post<string>(`/order/orders/${orderId}/cancel`);
        
        // 서버가 문자열 응답을 주거나, 주문 취소 성공 시 메시지를 반환한다고 가정
        return response.data || "주문이 취소되었습니다.";
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const status = error.response.status;
            if (status === 401) {
                throw new Error('401: 로그인 후 이용해주세요', { cause: 401 });
            }
            
            const errorData = error.response.data as string | ErrorResponseData;
            let errorMessage: string;
            
            if (typeof errorData === 'string') {
                errorMessage = errorData;
            } else if (typeof errorData === 'object' && 'message' in errorData) {
                errorMessage = errorData.message;
            } else {
                errorMessage = `주문 취소 실패: 서버 응답 (${status})`;
            }

            throw new Error(errorMessage, { cause: status });
        }
        throw new Error('네트워크 오류가 발생했습니다.');
    }
};

/**
 * ⭐️ 여러 주문 일괄 취소 API 호출 (POST /api/order/orders/bulk-cancel) - [NEW]
 * @param orderIds 취소할 주문 ID 목록
 * @returns 성공 메시지
 */
export const cancelBulkOrders = async (orderIds: number[]): Promise<string> => {
    // 백엔드 경로를 POST /orders/bulk-cancel로 가정
    const url = '/order/orders/bulk-cancel'; 
    
    try {
        // 백엔드에 { orderIds: [1, 2, 3] } 형태의 JSON 객체를 전송
        const response = await apiClient.post<string>(url, { orderIds: orderIds });
        
        return response.data || `${orderIds.length}건의 주문이 취소되었습니다.`;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const status = error.response.status;
            if (status === 401) {
                throw new Error('401: 로그인 후 이용해주세요', { cause: 401 });
            }
            
            const errorData = error.response.data as string | ErrorResponseData;
            let errorMessage: string;
            
            if (typeof errorData === 'string') {
                errorMessage = errorData;
            } else if (typeof errorData === 'object' && 'message' in errorData) {
                errorMessage = errorData.message;
            } else {
                errorMessage = `일괄 주문 취소 실패: 서버 응답 (${status})`;
            }

            throw new Error(errorMessage, { cause: status });
        }
        throw new Error('네트워크 오류가 발생했습니다.');
    }
};