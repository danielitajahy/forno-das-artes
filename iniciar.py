"""Servidor estático local do Plano B. Não conecta ao Supabase nem instala pacotes."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import webbrowser

ROOT = Path(__file__).resolve().parent
PORT = 8766

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        # A cada pacote local, entregar HTML/CSS/JS atualizados. O Service Worker
        # controla o cache offline; o cache HTTP do navegador não deve reter UI antiga.
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == '__main__':
    try:
        server = ThreadingHTTPServer(('127.0.0.1', PORT), Handler)
    except OSError:
        raise SystemExit('Porta 8766 indisponível. Verifique se o Forno das Artes já está aberto. Não mude de porta durante a operação: o armazenamento depende do endereço.')
    print('Forno das Artes — http://127.0.0.1:8766/index.html')
    print('Mantenha esta janela aberta. Para encerrar, pressione Ctrl+C.')
    webbrowser.open(f'http://127.0.0.1:{PORT}/index.html')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
