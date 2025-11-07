import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // ⭐ 여기에 server 설정을 추가합니다.
  server: {
    port: 3000, // 포트를 3000으로 고정합니다.
    open: true, // 서버 시작 시 자동으로 브라우저를 열도록 설정 (선택 사항)
    
    // ⭐️ API 요청을 스프링 부트 서버로 전달하도록 프록시 설정
    proxy: {
      // React에서 '/api'로 시작하는 모든 요청이 프록시 됩니다.
      '/api': {
        // Spring Boot 서버의 주소로 요청을 전달
        target: 'http://localhost:8080', 
        changeOrigin: true, // 호스트 헤더를 백엔드 서버에 맞게 변경 (일반적으로 필수)
        // rewrite: (path) => path.replace(/^\/api/, ''), // Spring Boot API가 '/api' 접두사를 포함하면 이 줄은 주석 처리합니다.
      },
    },
  }
})
