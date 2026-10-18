# Publicar sin Metricool

## YouTube (automático, GitHub Action `subir_youtube.yml`)
Para pedir una subida, añade un archivo `publicar/youtube/<nombre>.json` y haz push:
```json
{ "video": "videos/2026-10-15_largo_burbuja_ia_short2_v2.mp4",
  "titulo": "Internet cambió el mundo… y su bolsa se desplomó 💻 #Shorts",
  "descripcion": "…", "tags": ["chispazo"], "categoria": "27",
  "publicar": "2026-10-20T13:00:00+02:00", "miniatura": "miniaturas/x.jpg",
  "comentario": "Primer comentario", "ia": true }
```
- `publicar` es opcional. Si va, el vídeo se sube privado y YouTube lo publica a esa hora; sin él, se publica al momento.
- Categorías: 27 Educación, 28 Ciencia y tecnología, 25 Noticias y política, 17 Deportes, 24 Entretenimiento.
- La Action deja `publicar/youtube/<nombre>.hecho.json` con el enlace del vídeo, o con el error.
- Cuota de la API: unas 6 subidas al día (cada subida gasta 1.600 de 10.000 unidades).

### Claves (una sola vez)
1. https://console.cloud.google.com → crea un proyecto ("Chispazo").
2. APIs y servicios → Biblioteca → **YouTube Data API v3** → Habilitar.
3. Pantalla de consentimiento OAuth:
   - tipo **Externo**, nombre "Chispazo";
   - añade tu correo como usuario de prueba;
   - después pulsa **Publicar la app** (en "prueba", el token caduca a los 7 días).
4. Credenciales → Crear credenciales → **ID de cliente de OAuth**:
   - tipo **Aplicación web**;
   - URI de redirección autorizado: `https://developers.google.com/oauthplayground`.
   - Copia el ID de cliente y el secreto.
5. Abre https://developers.google.com/oauthplayground:
   - ⚙️ (arriba a la derecha) → marca **Use your own OAuth credentials** → pega el ID y el secreto.
   - En el paso 1 escribe `https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl` → **Authorize APIs**.
   - Entra con la cuenta del canal Chispazo y acepta.
   - Paso 2 → **Exchange authorization code for tokens** → copia el **Refresh token**.
6. GitHub → repo bombillazo-videos → Settings → Secrets and variables → Actions → New repository secret. Crea tres secretos:
   - `YT_CLIENT_ID`
   - `YT_CLIENT_SECRET`
   - `YT_REFRESH_TOKEN`

## Instagram (vidIQ)
Conecta la cuenta de Instagram en https://app.vidiq.com. A partir de ahí, las tareas publican los Reels con `vidiq_instagram_publish_reel`.

## TikTok
Se sigue publicando con Metricool, con el cupo que quede del plan.
