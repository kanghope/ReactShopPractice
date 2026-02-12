// src/pages/admin/ItemFormPage.tsx

import React, { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItemDetail, registerItem, updateItem } from '../../api/itemApi.ts';
import type { ItemFormDto, ItemImgDto } from '../../types/item.ts'; 
import { AlertCircle, ImageIcon, Loader2, Package, RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';

// 초기 폼 상태 정의
const initialItemImgDtoList: ItemImgDto[] = Array(5).fill(null).map((_, index) => ({
    id: null, imgName: null, oriImgName: null, imgUrl: null, isRepImg: index === 0 ? 'Y' : 'N'
}));

const initialFormState: ItemFormDto = {
    id: null,
    itemNm: '',
    price: null,
    stockNumber: null,
    itemDetail: '',
    itemSellStatus: 'SELL',
    itemImgFiles: new Array(5).fill(null), // 클라이언트에서 파일을 담는 배열
    itemImgDtoList: initialItemImgDtoList, // 기존 이미지 정보를 담는 배열
};

const ItemFormPage: React.FC = () => {
    const { itemId } = useParams<{ itemId: string }>();
    const isEditMode = !!itemId;
    const navigate = useNavigate();
    const [formData, setFormData] = useState<ItemFormDto>(initialFormState);

    const [loading, setLoading] = useState(true);
    const [submitError, setSubmitError] = useState<string | null>(null);
    // 서버 유효성 검사 에러를 저장하는 상태
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({}); 

    // -------------------------------------------------------------
    // 1. 수정 모드일 때 상품 데이터 로드
    // -------------------------------------------------------------
    useEffect(() => {
        if (!isEditMode || !itemId) {
            setLoading(false);
            return;
        }

        const loadItemData = async () => {
            try {
                const id = parseInt(itemId, 10);
                if (isNaN(id)) throw new Error('잘못된 상품 ID입니다.');

                const detailDto = await getItemDetail(id);
                
                // 로드된 이미지 데이터에 빈 이미지를 추가하여 총 5개를 맞춥니다.
                const loadedImgs: ItemImgDto[] = detailDto.itemImgDtoList || [];
                const paddedImgs = [...loadedImgs];
                while (paddedImgs.length < 5) {
                    // isRepImg 설정은 서버에서 결정되므로, 빈 공간은 'N'으로 설정
                    paddedImgs.push({ id: null, imgName: null, oriImgName: null, imgUrl: null, isRepImg: 'N' });
                }

                // DTO 업데이트 (itemImgFiles는 서버 응답에 없으므로 유지됨)
                setFormData({ 
                    ...detailDto, 
                    itemImgDtoList: paddedImgs,
                    itemImgFiles: new Array(5).fill(null) // 파일 인풋 초기화
                });

            } catch (error) {
                console.error('상품 정보 로드 실패:', error);
                setSubmitError(`상품 정보를 불러올 수 없습니다. ${(error as Error).message}`);
            } finally {
                setLoading(false);
            }
        };

        loadItemData();
    }, [isEditMode, itemId]);


    // -------------------------------------------------------------
    // 2. 폼 입력 필드 변경 핸들러
    // -------------------------------------------------------------
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        let processedValue: string | number | null = value;
        if (name === 'price' || name === 'stockNumber') {
            // 빈 문자열이 들어오면 null로 처리 (숫자 입력 필드의 일반적인 관행)
            processedValue = value === '' ? null : parseInt(value, 10);
            if (value !== '' && isNaN(processedValue as number)) return; 
        }

        setFormData(
            prev => 
            (
                {
                    ...prev,
                    [name]: processedValue as any // 타입 캐스팅으로 DTO 구조 유지
                }
            )
        );

        // 에러 초기화
        setFieldErrors(prev => ({ ...prev, [name]: null }));
    };

    // -------------------------------------------------------------
    // 3. 이미지 파일 변경 핸들러 (Thymeleaf의 bindDomEvent 로직 구현)
    // -------------------------------------------------------------
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0] || null;

        if (file) {
            const fileName = file.name;
            const fileExt = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
            const allowedExts = ["jpg", "jpeg", "gif", "png", "bmp"];

            if (!allowedExts.includes(fileExt)) {
                alert("이미지 파일(jpg, jpeg, gif, png, bmp)만 등록이 가능합니다.");
                e.target.value = ''; // 파일 선택 취소 (비우기)
                setFormData(prev => {
                    const newFiles = [...prev.itemImgFiles];
                    newFiles[index] = null;
                    return { ...prev, itemImgFiles: newFiles };
                });
                return;
            }
        }
        
        // 파일 상태 업데이트
        setFormData(prev => {
            const newFiles = [...prev.itemImgFiles];
            newFiles[index] = file;
            return { ...prev, itemImgFiles: newFiles };
        });
    };

    // -------------------------------------------------------------
    // 4. 폼 제출 핸들러 (등록/수정)
    // -------------------------------------------------------------
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        setFieldErrors({});

        const form = new FormData();
        
        // 1. ItemFormDto (JSON)
        // 파일을 제외하고 서버가 필요로 하는 필드만 추출
        const { itemImgFiles, ...itemFormDtoToSubmit } = formData;

        // 수정 모드일 경우 기존 이미지 ID 리스트(itemImgIds)를 생성하여 DTO에 추가
        if (isEditMode) {
            // 기존 이미지 ID를 hidden 필드 대신 DTO에 명시적으로 추가하여 서버로 보냄
            // 서버는 이 ID 리스트와 함께 전송된 파일 리스트를 비교하여 이미지 업데이트/삭제를 처리해야 함
            itemFormDtoToSubmit.itemImgIds = formData.itemImgDtoList
                .map(img => img.id)
                //.filter((id): id is number => id !== null); 
        }

        form.append('itemFormDto', new Blob([JSON.stringify(itemFormDtoToSubmit)], {
            type: 'application/json'
        }));

        // 2. 이미지 파일 (MultipartFile 리스트)
        itemImgFiles.forEach((file, index) => { 
            const fieldName = 'itemImgFile'; 
            
            if (file) {
                // A. 새 파일 전송 (등록/수정 공통)
                form.append(fieldName, file);
            } else if (isEditMode) {
                // B. 수정 모드일 때, 파일이 없으면 무조건 빈 파일(Placeholder)을 전송
                // 이 파일은 ID가 null이면 INSERT를 막고, ID가 Long이면 UPDATE를 막아 기존 이미지를 유지
                const emptyFile = new File([], `placeholder_img${index}`, { type: 'application/octet-stream' });
                form.append(fieldName, emptyFile);
            } else {
                // C. 등록 모드일 때, 파일이 없으면 전송하지 않음 (서버 List<MultipartFile>의 크기를 줄임)
            }
        });
        
        try {
            const id = isEditMode ? parseInt(itemId!, 10) : null;
            const resultMessage = id
                ? await updateItem(id, form) // ⬅️ updateItem 함수는 PUT 요청을 보내야 함
                : await registerItem(form); // ⬅️ registerItem 함수는 POST 요청을 보내야 함

            //alert(isEditMode ? `상품 수정 성공: ${resultMessage}` : `상품 등록 성공: ${resultMessage}`);
            toast.success(isEditMode ? `상품 수정 성공: ${resultMessage}` : `상품 등록 성공: ${resultMessage}`);
            navigate('/admin/item/items'); 

        } catch (error) {
            const err = error as Error;
            const status = (err.cause as { status?: number, data?: any })?.status;
            const errorData = (err.cause as { status?: number, data?: any })?.data; // API에서 넘겨준 원본 에러 데이터

            console.error('API Error:', err.message, 'Data:', errorData);

            // ⭐️ 수정된 로직: 에러 데이터가 객체 형태(필드 에러 맵)일 경우 fieldErrors를 업데이트
            if (status === 400 && typeof errorData === 'object' && errorData !== null && !('message' in errorData)) {
                // 서버에서 { itemNm: "필수입니다", price: "0보다 커야합니다" } 형태로 응답했다고 가정
                // 에러 데이터를 fieldErrors 상태에 직접 매핑하여 필드별 에러를 표시합니다.
                setFieldErrors(errorData as Record<string, string>); 
                setSubmitError("유효성 검사 오류가 발생했습니다. 아래 필드를 확인해주세요.");
            } else {
                // 일반적인 서버 에러(500, 인증 에러 등) 또는 일반 메시지 에러
                setSubmitError(err.message || '알 수 없는 오류가 발생했습니다.');
            }
        }
    };

    // 이미지 라벨 텍스트 처리 함수 (가독성을 위해 분리)
    const getImageLabel = (imgDto: ItemImgDto, file: File | null) => {
        if (file) return file.name;
        if (imgDto.oriImgName) return imgDto.oriImgName;
        return isEditMode ? '이미지 교체' : '파일 선택';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-blue-600" size={40} />
                <p className="text-slate-500 font-medium animate-pulse">상품 정보를 불러오고 있습니다...</p>
            </div>
        );
    }

    //const pageTitle = isEditMode ? '수정' : '등록';
    //const submitButtonText = `상품 ${pageTitle}`;
    //const submitButtonClass = isEditMode ? 'btn-success' : 'btn-primary';

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            {/* 헤더 섹션 */}
            <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Package className="text-blue-600" size={32} />
                        상품 {isEditMode ? '수정' : '등록'}
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">관리자 전용 상품 관리 시스템</p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden transition-all">
                <div className="p-8 md:p-12">
                    {/* 에러 알림 */}
                    {submitError && (
                        <div className="mb-8 flex items-center gap-3 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={20} className="flex-shrink-0" />
                            <p className="text-sm font-bold">{submitError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* 그리드 레이아웃: 상태, 명칭, 가격, 재고 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* 판매 상태 */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">판매 상태</label>
                                <div className="relative">
                                    <select 
                                        name="itemSellStatus" 
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium appearance-none"
                                        value={formData.itemSellStatus}
                                        onChange={handleChange}
                                    >
                                        <option value="SELL">판매중</option>
                                        <option value="SOLD_OUT">품절</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <RefreshCw size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* 상품명 */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">상품명</label>
                                <input 
                                    type="text" name="itemNm"
                                    className={`w-full h-12 px-4 bg-slate-50 border rounded-xl outline-none transition-all focus:ring-2 ${
                                        fieldErrors.itemNm ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                                    }`}
                                    value={formData.itemNm} onChange={handleChange}
                                />
                                {fieldErrors.itemNm && <p className="text-xs text-red-500 font-bold ml-1">{fieldErrors.itemNm}</p>}
                            </div>

                            {/* 가격 & 재고 (동일한 스타일 패턴 적용) */}
                            {['price', 'stockNumber'].map((field) => (
                                <div key={field} className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">
                                        {field === 'price' ? '가격' : '재고 수량'}
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="number" name={field}
                                            className={`w-full h-12 pl-4 pr-12 bg-slate-50 border rounded-xl outline-none transition-all focus:ring-2 ${
                                                fieldErrors[field] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                                            }`}
                                            value={(formData as any)[field] ?? ''} 
                                            onChange={handleChange}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                                            {field === 'price' ? '원' : 'EA'}
                                        </span>
                                    </div>
                                    {fieldErrors[field] && <p className="text-xs text-red-500 font-bold ml-1">{fieldErrors[field]}</p>}
                                </div>
                            ))}
                        </div>

                        {/* 상세 내용 */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">상품 상세 내용</label>
                            <textarea 
                                name="itemDetail" rows={5}
                                className={`w-full p-4 bg-slate-50 border rounded-2xl outline-none transition-all focus:ring-2 resize-none ${
                                    fieldErrors.itemDetail ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                                }`}
                                value={formData.itemDetail} onChange={handleChange}
                            />
                        </div>

                        {/* 이미지 업로드 영역 - 가장 에러가 많이 나는 부분 수정 */}
                        <div className="space-y-4 pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-blue-600 font-black">
                                <ImageIcon size={20} />
                                <h3>상품 이미지 (최대 5개)</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-3">
                                {formData.itemImgDtoList.map((imgDto, index) => (
                                    <div key={index} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200 hover:border-blue-400 transition-all group">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs shadow-sm border border-slate-100">
                                            {index + 1}
                                        </div>
                                        <div className="flex-grow">
                                            <label className="cursor-pointer block">
                                                <span className={`text-sm font-semibold ${getImageLabel(imgDto, formData.itemImgFiles[index]) !== '파일 선택' ? 'text-blue-600' : 'text-slate-400'}`}>
                                                    {getImageLabel(imgDto, formData.itemImgFiles[index])}
                                                </span>
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    onChange={(e) => handleFileChange(e, index)}
                                                />
                                            </label>
                                        </div>
                                        <div className="text-[10px] font-black uppercase px-2 py-1 rounded bg-white text-slate-300 group-hover:text-blue-500 border border-slate-100 transition-colors">
                                            {index === 0 ? "Main" : "Sub"}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 제출 버튼 */}
                        <div className="pt-8 flex justify-center">
                            <button 
                                type="submit" 
                                className={`w-full max-w-sm h-14 flex items-center justify-center gap-3 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg ${
                                    isEditMode 
                                    ? '!bg-emerald-600 hover:!bg-emerald-700 !text-white !shadow-emerald-100' 
                                    : '!bg-slate-900 hover:!bg-blue-700 !text-white !shadow-slate-200'
                                }`}
                            >
                                {isEditMode ? <RefreshCw size={22} /> : <Save size={22} />}
                                상품 {isEditMode ? '수정' : '등록'} 완료
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ItemFormPage;