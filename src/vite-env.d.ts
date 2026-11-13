/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public Mapbox token (pk.). URL-restricted to binthere.online in the Mapbox dashboard. */
  readonly VITE_MAPBOX_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
