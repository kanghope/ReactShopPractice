import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
//import './index.css'
import App from './App.tsx'

// 1. 부트스트랩 CSS (기본 틀)
//import 'bootstrap/dist/css/bootstrap.min.css';
//import 'bootstrap-icons/font/bootstrap-icons.css'; 

// 2. 기존 전역 CSS (커스텀 스타일)
//import './styles/layout1.css';

// 3. ⭐️ 테일윈드 & shadcn/ui CSS (가장 마지막에 위치해야 함!)
// 주석을 해제하고 반드시 가장 아래에 배치하세요.
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
