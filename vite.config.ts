import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // **添加或修改这一行**
  // 您的仓库名为 G3-，所以 base 路径就是 '/G3-/'
  base: '/G3-/', 
  plugins: [react()],
})
