// components/common/AuthFormWrapper.tsx

import React, { type ReactNode } from 'react';
import './AuthFormWrapper.css'; // 별도 CSS 파일 생성

interface AuthFormWrapperProps {
  title: string;
  children: ReactNode;
}

const AuthFormWrapper: React.FC<AuthFormWrapperProps> = ({ title, children }) => {
  return (
    <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6 col-xl-5">
                    <div className="card shadow-lg rounded-3 border-0">
                        <div className="card-body p-4 p-md-5">
                            <h2 className="card-title text-center mb-4 fw-bold text-primary">{title}</h2>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
  );
};

export default AuthFormWrapper;