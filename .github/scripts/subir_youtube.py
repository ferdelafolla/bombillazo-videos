"""Sube a YouTube los vídeos pedidos en publicar/youtube/<nombre>.json (si aún no tienen publicar/youtube/<nombre>.hecho.json).
JSON: {"video": "videos/x.mp4", "titulo": "...", "descripcion": "...", "tags": [...], "categoria": "27",
       "publicar": "2026-10-20T13:00:00+02:00" (opcional: se sube privado y YouTube lo publica a esa hora),
       "miniatura": "miniaturas/x.jpg" (opcional), "ia": true}
Credenciales en secretos del repo: YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN."""
import glob, json, os, sys, datetime
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

cred = Credentials(None, refresh_token=os.environ['YT_REFRESH_TOKEN'], token_uri='https://oauth2.googleapis.com/token',
                   client_id=os.environ['YT_CLIENT_ID'], client_secret=os.environ['YT_CLIENT_SECRET'],
                   scopes=['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube'])
yt = build('youtube', 'v3', credentials=cred)
fallos = 0
# comprobación: si existe publicar/youtube/comprobar, deja el canal autorizado (o el error) en comprobar.hecho.json
if __import__('os').path.exists('publicar/youtube/comprobar'):
    try:
        r = yt.channels().list(part='snippet,statistics', mine=True).execute()
        res = [{'id': c['id'], 'titulo': c['snippet']['title'], 'subs': c['statistics'].get('subscriberCount')} for c in r.get('items', [])]
    except Exception as e:
        res = {'error': str(e)}
    json.dump(res, open('publicar/youtube/comprobar.hecho.json', 'w'), ensure_ascii=False, indent=1); print('comprobar', res)
    os.remove('publicar/youtube/comprobar')
for f in sorted(glob.glob('publicar/youtube/*.json')):
    if f.endswith('.hecho.json') or os.path.exists(f[:-5] + '.hecho.json'):
        continue
    p = json.load(open(f))
    status = {'privacyStatus': 'public', 'selfDeclaredMadeForKids': False, 'containsSyntheticMedia': bool(p.get('ia', True))}
    if p.get('publicar'):
        t = datetime.datetime.fromisoformat(p['publicar']).astimezone(datetime.timezone.utc)
        if t > datetime.datetime.now(datetime.timezone.utc):
            status = {**status, 'privacyStatus': 'private', 'publishAt': t.strftime('%Y-%m-%dT%H:%M:%SZ')}
    body = {'snippet': {'title': p['titulo'][:100], 'description': p.get('descripcion', '')[:5000], 'tags': p.get('tags', []),
                        'categoryId': str(p.get('categoria', '27')), 'defaultLanguage': 'es', 'defaultAudioLanguage': 'es'},
            'status': status}
    try:
        req = yt.videos().insert(part='snippet,status', body=body, media_body=MediaFileUpload(p['video'], chunksize=8 * 1024 * 1024, resumable=True))
        resp = None
        while resp is None:
            _, resp = req.next_chunk()
        vid = resp['id']
        out = {'id': vid, 'url': f'https://www.youtube.com/watch?v={vid}', 'estado': status}
        if p.get('miniatura'):
            try:
                yt.thumbnails().set(videoId=vid, media_body=MediaFileUpload(p['miniatura'])).execute(); out['miniatura'] = 'ok'
            except Exception as e:  # canales sin verificar no pueden poner miniaturas
                out['miniatura'] = f'error: {e}'
        if p.get('comentario'):
            try:
                yt.commentThreads().insert(part='snippet', body={'snippet': {'videoId': vid, 'topLevelComment': {'snippet': {'textOriginal': p['comentario']}}}}).execute()
            except Exception as e:
                out['comentario'] = f'error: {e}'
    except Exception as e:
        fallos += 1; out = {'error': str(e)}
    json.dump(out, open(f[:-5] + '.hecho.json', 'w'), ensure_ascii=False, indent=1)
    print(f, out)
sys.exit(1 if fallos else 0)
