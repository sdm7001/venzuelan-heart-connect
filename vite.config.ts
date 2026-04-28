import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // ── Vendor splitting ──────────────────────────────────────────────
          if (id.includes("node_modules")) {
            // React core + router — loaded on every page; keep together
            if (
              id.includes("react-dom") ||
              id.includes("react-router") ||
              id.includes("react/jsx")
            ) {
              return "vendor-react";
            }
            // Supabase client — heavy, only needed on data-fetching pages
            if (id.includes("@supabase")) {
              return "vendor-supabase";
            }
            // Tanstack Query — data-layer peer of Supabase
            if (id.includes("@tanstack")) {
              return "vendor-query";
            }
            // Lucide icons — large icon set, shared across many components
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            // Markdown renderer — only used in ResourceDetail
            if (id.includes("react-markdown") || id.includes("remark") || id.includes("rehype")) {
              return "vendor-markdown";
            }
            // Form libraries
            if (id.includes("react-hook-form") || id.includes("zod") || id.includes("@hookform")) {
              return "vendor-forms";
            }
            // Everything else in node_modules
            return "vendor";
          }

          // ── First-party splitting ─────────────────────────────────────────
          // Admin pages — never visited by public; separate chunk eliminates
          // admin code from the initial public-facing bundle entirely
          if (id.includes("/pages/admin/")) {
            return "admin";
          }
          // Authenticated app pages — only reached after login
          if (id.includes("/pages/app/")) {
            return "app-pages";
          }
          // Landing page content data — 2000+ lines of static content
          if (id.includes("/content/landingPages")) {
            return "landing-content";
          }
        },
      },
    },
  },
}));
