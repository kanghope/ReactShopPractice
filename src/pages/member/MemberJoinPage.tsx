import React, { useState, useEffect, type FormEvent } from 'react'; // ⭐️ FormEvent에 'type' 적용
import AuthFormWrapper from '../../components/common/AuthFormWrapper';
import { registerMember } from '../../api/memberApi';
import type { MemberForm } from '../../types/member.ts'; // ⭐️ MemberForm에 'type' 적용
import { Link, useNavigate, useSearchParams } from 'react-router-dom'; // useSearchParams 추가
import { Lock, Mail, MapPin, MessageCircle, User } from 'lucide-react';
import { toast } from 'sonner';

// 실제 프로젝트에서는 .env 파일이나 context를 통해 가져올 것입니다.
const KAKAO_CLIENT_ID = '41995ca715ee4777c817d8ba08ac344f';
const KAKAO_REDIRECT_URI = 'https://shop-app1.azurewebsites.net/api/auth/kakao/callback'; 

const KAKAO_AUTH_URL = 
  `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}`;

/*
const registerMember2 = async (data: MemberForm): Promise<string> => { 
    if (data.email === 'duplicate@test.com') {
        throw new Error('회원가입에 실패했습니다.: ["이미 등록된 이메일입니다."]');
    }
    return "Success"; 
}; // Mock API
*/



// Custom message display function (alert() 대체)
const showMessage = (message: string) => {
  console.log(message); // 실제로는 Modal/Toast UI로 교체 필요
  // alert(message); // 개발 환경에서는 임시로 사용할 수 있으나, 프로덕션에서는 Custom UI 사용 권장
};

const initialFormState: MemberForm = {
  name: '',
  email: '',
  password: '',
  address: '',
};

const MemberJoinPage: React.FC = () => {
  const [formData, setFormData] = useState<MemberForm>(initialFormState);
  const [errors, setErrors] = useState<string[]>([]);
  const navigate = useNavigate();
  // ⭐️ [핵심] URL 쿼리 파라미터를 읽고 조작하기 위한 훅
  const [searchParams, setSearchParams] = useSearchParams(); 

  // ⭐️ [핵심] 컴포넌트 마운트 시 URL의 'error' 쿼리 파라미터 확인 및 처리
  useEffect(() => {
    // 1. URLSearchParams 객체에서 'error' 키에 해당하는 값을 가져옵니다.
    const socialError = searchParams.get('error'); 
    
    if (socialError) {
      // 2. 에러 값이 존재하면, errors 상태에 해당 메시지를 배열 형태로 설정하여 UI에 표시합니다.
      setErrors([socialError]); 
      
      // 3. URL 정리: 쿼리 파라미터에서 'error'를 제거합니다.
      searchParams.delete('error');
      // URL을 변경하고 (history state를 교체: replace), 새로고침 시 에러가 중복 표시되는 것을 방지합니다.
      setSearchParams(searchParams, { replace: true });
      
      // 카카오 로그인 에러는 폼 데이터와 관련이 없으므로, 폼 데이터는 초기화하지 않습니다.
    }
  }, [searchParams, setSearchParams]); // searchParams의 변경에 반응하도록 의존성 배열에 포함

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors([]); // 이전 오류 초기화

    try {
      const successMessage = await registerMember(formData);
      
      showMessage(`회원가입 성공: ${successMessage}`); // alert() 대신 showMessage 사용
      //alert();
      toast.success(`회원가입 성공: ${successMessage}`);
      navigate('/members/login'); // 성공 시 로그인 페이지로 이동
      
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      // 백엔드가 List<String> 형태의 에러를 반환하는 경우 처리 로직
      let finalErrors: string[] = [];
      
      // '회원가입에 실패했습니다.: ' 접두사를 제거하고 JSON 파싱 시도
      const jsonString = errorMessage.replace('회원가입에 실패했습니다.: ', '').trim();
      
      try {
        const errorData = JSON.parse(jsonString);
        if (Array.isArray(errorData) && errorData.every(item => typeof item === 'string')) {
          // 배열이고 모든 요소가 문자열인 경우 (유효성 검사 에러 리스트)
          finalErrors = errorData;
        } else if (typeof errorData === 'string') {
           // JSON으로 파싱되었으나 단일 문자열인 경우
           finalErrors = [errorData];
        } else {
           // JSON 파싱은 되었으나 예상치 못한 형태인 경우 (원래 메시지 사용)
           finalErrors = [errorMessage];
        }
      } catch (parseError) {
        // JSON 파싱 실패 시 (단순 문자열 에러)
        finalErrors = [errorMessage];
      }
      
      setErrors(finalErrors);
      // 에러 메시지가 길면 콘솔에 출력하여 확인 (showMessage 대신 직접 console.error 사용)
      console.error("회원가입 처리 오류:", finalErrors.join(" / "));
    }
  };

  // 공통 스타일
  const inputStyle = "w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 text-sm";
  const labelStyle = "block text-sm font-medium text-slate-700 mb-1.5 ml-1";
  const iconStyle = "absolute left-3 top-9 text-slate-400 h-4 w-4";

  return (
    <AuthFormWrapper title="회원가입">
      <form onSubmit={handleSubmit} method="post" className="space-y-4">
        {/* 이름 */}
        <div className="relative flex flex-col">
          <label htmlFor="name" className={labelStyle}>이름</label>
          <User className={iconStyle} />
          <input 
            type="text" name="name" className={inputStyle} 
            placeholder="홍길동" value={formData.name} 
            onChange={handleChange} required
          />
        </div>

        {/* 이메일 */}
        <div className="relative flex flex-col">
          <label htmlFor="email" className={labelStyle}>이메일 주소</label>
          <Mail className={iconStyle} />
          <input 
            type="email" name="email" className={inputStyle} 
            placeholder="example@mail.com" value={formData.email} 
            onChange={handleChange} required
          />
        </div>

        {/* 비밀번호 */}
        <div className="relative flex flex-col">
          <label htmlFor="password" className={labelStyle}>비밀번호</label>
          <Lock className={iconStyle} />
          <input 
            type="password" name="password" className={inputStyle} 
            placeholder="8~16자 영문, 숫자, 특수문자" value={formData.password} 
            onChange={handleChange} required
          />
        </div>

        {/* 주소 */}
        <div className="relative flex flex-col">
          <label htmlFor="address" className={labelStyle}>주소</label>
          <MapPin className={iconStyle} />
          <input 
            type="text" name="address" className={inputStyle} 
            placeholder="서울시 강남구..." value={formData.address} 
            onChange={handleChange} required
          />
        </div>

        {/* 에러 메시지 (리스트 형태) */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 animate-in fade-in slide-in-from-top-2">
            {errors.map((msg, index) => (
              <p key={index} className="text-red-600 text-xs font-medium flex items-center gap-1">
                • {msg}
              </p>
            ))}
          </div>
        )}

        {/* 버튼 그룹 */}
        <div className="flex flex-col gap-3 pt-4">
          <button 
            type="submit" 
            className="w-full py-2.5 !bg-[#1d4ed8] !text-white !font-semibold !rounded-lg !shadow-md 
                       hover:!bg-blue-700 hover:!scale-[1.02] active:!scale-[0.98] !transition-all duration-200"
          >
            회원가입 완료
          </button>
          
          <a 
            href={`${KAKAO_AUTH_URL}&state=join`} 
            className="w-full py-2.5 !bg-[#FEE500] !text-[#191919] !font-semibold rounded-lg !flex !items-center !justify-center gap-2
                       hover:!bg-[#fdd835] hover:!scale-[1.02] active:!scale-[0.98] transition-all duration-200"
          >
            <MessageCircle className="h-5 w-5 fill-current" />
            카카오로 1초 가입하기
          </a>
        </div>
      </form>

      <div className="!text-center !mt-6">
        <p className="!text-sm !text-slate-500">
          이미 계정이 있으신가요?{" "}
          <Link to="/members/login" className="hover:!underline">
            <span className="!text-blue-600 !font-medium">로그인하기</span>
          </Link>
        </p>
      </div>
    </AuthFormWrapper>
  );
};

export default MemberJoinPage;
