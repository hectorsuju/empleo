# Radar de empleo (Fase 1)

Página estática + GitHub Action que cada 15 min consulta InfoJobs y Adzuna y guarda `jobs.json`.

## Puesta en marcha
1. Claves gratuitas:
   - InfoJobs: https://developer.infojobs.net (client id + secret)
   - Adzuna: https://developer.adzuna.com (app id + app key)
2. Repo → Settings → Secrets and variables → Actions → New repository secret:
   `INFOJOBS_ID`, `INFOJOBS_SECRET`, `ADZUNA_ID`, `ADZUNA_KEY` (basta con uno de los dos portales).
3. Settings → Pages → rama `main`, carpeta `/ (root)`.
4. Actions → "Buscar ofertas" → Run workflow para la primera ejecución.

Los puestos se editan en el array `roles` de `jobs.json`.
