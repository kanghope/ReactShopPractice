import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  // ⭐ 여기에 server 설정을 추가합니다.
  server: {
    port: 3000, // 포트를 3000으로 고정합니다.
    open: true, // 서버 시작 시 자동으로 브라우저를 열도록 설정 (선택 사항)
    
    // ⭐️ API 요청을 스프링 부트 서버로 전달하도록 프록시 설정
    proxy: {
      // React에서 '/api'로 시작하는 모든 요청이 프록시 됩니다.
      // 1. '/api'로 시작하는 모든 요청 (인증, 관리자 API 등)을 8080으로 전달
      '/api': {
        target: 'http://localhost:8080', 
        changeOrigin: true, 
      },
      
      // 2. '/items' 메인 페이지 상품 목록 API 요청을 8080으로 전달
      '/items': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },

      // 3. 🖼️ '/images' 상품 이미지 요청을 8080으로 전달 (이미지 경로 문제 해결)
      '/images': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  }
})
