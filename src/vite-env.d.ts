/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端 API 根地址，如 http://localhost:5000；留空则使用 /api */
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
