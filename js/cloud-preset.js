/**
 * Zajednički Supabase za celu ekipu — popuni JEDNOM pre deploya (Netlify).
 * Prijatelji u aplikaciji unose samo League ID (npr. "PES - RISHUB").
 *
 * Anon ključ je namenjen da bude u klijentu; zaštita je kroz RLS u Supabase.
 * Kopija primera: cloud-preset.example.js
 */
window.PES_CLOUD_PRESET = {
	supabaseUrl: "https://dypfkafzcyrekedamknp.supabase.co",
	supabaseAnonKey:
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5cGZrYWZ6Y3lyZWtlZGFta25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3Mzc3NDEsImV4cCI6MjA5MTMxMzc0MX0.wLSEcANXh5k-pS62KuomypGHidxpFekQrlIuQMBwStY",
};
