import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages는 https://<user>.github.io/<repo>/ 하위 경로로 서빙되므로
// 빌드 시 base를 저장소 이름으로 맞춘다. 로컬 dev("/")는 그대로.
// 배포 저장소 이름이 다르면 BASE_PATH 환경변수로 덮어쓸 수 있다.
const base = process.env.BASE_PATH ?? "/shared-notes/";

export default defineConfig(({ command }) => ({
  base: command === "build" ? base : "/",
  plugins: [react()],
  server: {
    port: 5180,
  },
}));
