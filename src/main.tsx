import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
//import './index.css'
import App from './App.tsx'

// ⭐️ 부트스트랩 CSS Import 추가 (npm/yarn으로 설치된 경우)
import 'bootstrap/dist/css/bootstrap.min.css';

// ⭐️ Bootstrap Icons도 설치했다면 Import
import 'bootstrap-icons/font/bootstrap-icons.css'; 

// ⭐️ 기존 Thymeleaf의 layout1.css에 해당하는 전역 CSS 파일을 import (아래 3번 참고)
import './styles/layout1.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
