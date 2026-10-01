import { env, findEnvProblems } from "@/shared/lib/env";

/** Sunucu acilirken bir kez calisir: eksik ya da zayif ayarlari gunluge yazar. */
export function register() {
  if (!env.isProduction) return;
  for (const problem of findEnvProblems()) console.warn(`[ayar] ${problem}`);
}
