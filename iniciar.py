"""Servidor estático de loopback; não lê nem modifica IndexedDB ou bancos.
Windows: o CMD usa Python disponível ou o servidor nativo PowerShell incluído.
"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote,urlsplit
import argparse,json,sys,threading,webbrowser

ROOT=Path(__file__).resolve().parent
PORT=8766
REQUIRED=('index.html','app/ui.js','app/core.js','app/storage.js','app/app.css','app/seed.js','app/appearance.js','app/order-intent.js','sw.js','manifest.webmanifest')

def check_package(root=ROOT):
    missing=[name for name in REQUIRED if not(root/name).is_file()]
    if missing:raise RuntimeError('Pacote incompleto. Extraia TODO o ZIP em uma pasta normal. Ausentes: '+', '.join(missing))
    return {'package':'Forno das Artes','port':PORT,'mode':'loopback-static','files_checked':len(REQUIRED),'database_changed':False}

def allowed_path(path):
    path=unquote(urlsplit(path).path)
    parts=path.strip('/').split('/')
    if any(x in ('..','.') or x.startswith('.') for x in parts) or '\\' in path:return False
    if path in ('/','/index.html','/sw.js','/manifest.webmanifest','/PREVIA_VISUAL.html'):return True
    suffix=Path(path).suffix.lower()
    return (parts[0]=='app' and suffix in ('.js','.css')) or (parts[0] in ('docs','plano-c','evidencias') and suffix in ('.md','.html','.pdf','.png','.json','.txt'))

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,root=ROOT,preview_only=False,**kwargs):
        self.preview_only=preview_only;super().__init__(*args,directory=str(root),**kwargs)
    def log_message(self,*args):pass
    def list_directory(self,path):self.send_error(404,'Listagem de pasta desativada');return None
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma','no-cache');self.send_header('Expires','0')
        self.send_header('X-Content-Type-Options','nosniff')
        super().end_headers()
    def do_GET(self):
        if urlsplit(self.path).path=='/_forno_health':
            raw=json.dumps({'application':'forno-das-artes','static_only':True,'database_changed':False}).encode()
            self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw);return
        if self.preview_only and urlsplit(self.path).path not in ('/','/PREVIA_VISUAL.html'):self.send_error(404);return
        if self.preview_only and urlsplit(self.path).path=='/':self.path='/PREVIA_VISUAL.html'
        if not allowed_path(self.path):self.send_error(404);return
        super().do_GET()
    def do_HEAD(self):
        if self.preview_only and urlsplit(self.path).path not in ('/','/PREVIA_VISUAL.html'):self.send_error(404);return
        if self.preview_only and urlsplit(self.path).path=='/':self.path='/PREVIA_VISUAL.html'
        if not allowed_path(self.path):self.send_error(404);return
        super().do_HEAD()

def make_server(root=ROOT,port=PORT,preview_only=False):
    check_package(root)
    return ThreadingHTTPServer(('127.0.0.1',port),lambda *a,**kw:Handler(*a,root=root,preview_only=preview_only,**kw))

def main(argv=None):
    parser=argparse.ArgumentParser(description='Forno das Artes — notebook central')
    parser.add_argument('--check',action='store_true',help='Verificar pacote sem iniciar servidor, navegador ou banco')
    parser.add_argument('--preview',action='store_true',help='Prévia fictícia isolada na porta 8870; não serve o aplicativo operacional')
    parser.add_argument('--no-browser',action='store_true',help='Não abrir navegador automaticamente')
    args=parser.parse_args(argv)
    try:
        if sys.version_info<(3,10):raise RuntimeError('Python 3.10 ou superior necessário; use o iniciador CMD para alternativa nativa do Windows.')
        result=check_package()
        if args.check:print(json.dumps(result,ensure_ascii=False));return 0
        server=make_server(port=8870 if args.preview else PORT,preview_only=args.preview)
    except (OSError,RuntimeError) as exc:
        print('Não foi possível iniciar o Forno das Artes: '+str(exc),file=sys.stderr)
        print('Se a porta 8766 estiver ocupada, preserve o banco e feche o servidor anterior conscientemente. Não troque de porta ou limpe dados. Se abriu dentro do ZIP, extraia todos os arquivos.',file=sys.stderr);return 1
    url=f"http://127.0.0.1:{8870 if args.preview else PORT}/{'PREVIA_VISUAL.html' if args.preview else 'index.html'}"
    print('Forno das Artes — '+url,flush=True)
    print('Mantenha esta janela aberta. Ctrl+C encerra somente o servidor. Dados do navegador não são apagados.',flush=True)
    if not args.no_browser:
        def open_browser():
            try:
                if not webbrowser.open(url):print('Abra manualmente '+url,flush=True)
            except Exception:print('Abra manualmente '+url,flush=True)
        threading.Thread(target=open_browser,daemon=True).start()
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
    return 0
if __name__=='__main__':raise SystemExit(main())
