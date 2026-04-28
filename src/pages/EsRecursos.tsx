// /es/recursos — Spanish-language resource hub.
// Renders the same Resources component; the I18nProvider detects the /es/ path
// prefix and activates the Spanish locale automatically.
// This file exists solely to register a named ES export for the router and to
// ensure hreflang is set correctly for the /es/recursos canonical URL.
export { default } from "./Resources";
