import contextlib,http.client,importlib.util,io,json,pathlib,sys,tempfile,threading,unittest
from unittest.mock import patch
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('forno_launcher',ROOT/'iniciar.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Launcher(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.server=m.make_server(port=0);threading.Thread(target=cls.server.serve_forever,daemon=True).start();cls.port=cls.server.server_port
 @classmethod
 def tearDownClass(cls):cls.server.shutdown();cls.server.server_close()
 def get(self,path,method='GET'):
  c=http.client.HTTPConnection('127.0.0.1',self.port,timeout=3);c.request(method,path);r=c.getresponse();result=(r.status,dict(r.getheaders()),r.read());c.close();return result
 def test_html_and_js_served_from_packaged_files(self):
  for path in ['/','/index.html','/app/ui.js','/app/order-intent.js','/sw.js','/manifest.webmanifest']:
   status,headers,body=self.get(path);self.assertEqual(status,200,path);self.assertGreater(len(body),0);self.assertIn('no-store',headers['Cache-Control'])
 def test_sensitive_files_and_traversal_blocked(self):
  for path in ['/.env','/iniciar.py','/PRIVADO_NAO_PUBLICAR/alunos.xlsx','/backups/real.json','/../index.html','/%2e%2e/index.html','/docs/']:
   self.assertEqual(self.get(path)[0],404,path)
 def test_health_no_database_access(self):
  status,_,body=self.get('/_forno_health');self.assertEqual(status,200);self.assertEqual(json.loads(body),{'application':'forno-das-artes','static_only':True,'database_changed':False})
 def test_head_body_empty(self):
  status,headers,body=self.get('/app/core.js','HEAD');self.assertEqual(status,200);self.assertEqual(body,b'');self.assertGreater(int(headers['Content-Length']),0)
 def test_package_check_does_not_start_server(self):
  with patch.object(m,'make_server') as server,patch.object(m.webbrowser,'open') as browser,contextlib.redirect_stdout(io.StringIO()):self.assertEqual(m.main(['--check']),0)
  server.assert_not_called();browser.assert_not_called()
 def test_incomplete_zip_is_rejected(self):
  with tempfile.TemporaryDirectory() as tmp:
   with self.assertRaisesRegex(RuntimeError,'Pacote incompleto'):m.check_package(pathlib.Path(tmp))
 def test_busy_port_no_fallback_or_data_reset(self):
  with patch.object(m,'make_server',side_effect=OSError('Porta ocupada')),patch.object(m.webbrowser,'open') as browser,contextlib.redirect_stderr(io.StringIO()) as err:self.assertEqual(m.main([]),1)
  browser.assert_not_called();self.assertIn('Não troque de porta',err.getvalue())
 def test_browser_opens_correct_origin(self):
  called=threading.Event();urls=[]
  class Server:
   def serve_forever(self):called.wait(2);raise KeyboardInterrupt
   def server_close(self):pass
  def open_url(url):urls.append(url);called.set();return True
  with patch.object(m,'make_server',return_value=Server()),patch.object(m.webbrowser,'open',side_effect=open_url),contextlib.redirect_stdout(io.StringIO()):self.assertEqual(m.main([]),0)
  self.assertEqual(urls,['http://127.0.0.1:8766/index.html'])
 def test_windows_cmd_encoding_paths_and_error_pause(self):
  raw=(ROOT/'INICIAR_WINDOWS.cmd').read_bytes();self.assertNotIn(b'\n',raw.replace(b'\r\n',b''));text=raw.decode('ascii');self.assertIn('pushd "%~dp0"',text);self.assertIn('pause',text);self.assertIn('powershell.exe -NoLogo -NoProfile',text);self.assertIn('goto ERRO_PACOTE',text);self.assertNotIn('git clone',text)
 def test_preview_server_cannot_serve_operational_app(self):
  server=m.make_server(port=0,preview_only=True);threading.Thread(target=server.serve_forever,daemon=True).start()
  try:
   for path,status in [('/',200),('/PREVIA_VISUAL.html',200),('/app/ui.js',404),('/index.html',404)]:
    conn=http.client.HTTPConnection('127.0.0.1',server.server_port);conn.request('GET',path);r=conn.getresponse();self.assertEqual(r.status,status);r.read();conn.close()
  finally:server.shutdown();server.server_close()
 def test_preview_browser_opens_isolated_origin(self):
  event=threading.Event();urls=[]
  class Server:
   def serve_forever(self):event.wait(2);raise KeyboardInterrupt
   def server_close(self):pass
  def open_url(url):urls.append(url);event.set();return True
  with patch.object(m,'make_server',return_value=Server()),patch.object(m.webbrowser,'open',side_effect=open_url),contextlib.redirect_stdout(io.StringIO()):self.assertEqual(m.main(['--preview']),0)
  self.assertEqual(urls,['http://127.0.0.1:8870/PREVIA_VISUAL.html'])
 def test_busy_preview_does_not_tell_user_to_stop_operational_server(self):
  with patch.object(m,'make_server',side_effect=OSError('Porta ocupada')),contextlib.redirect_stderr(io.StringIO()) as err:self.assertEqual(m.main(['--preview']),1)
  self.assertIn('8870',err.getvalue());self.assertIn('mantenha o servidor operacional 8766 intacto',err.getvalue())
if __name__=='__main__':unittest.main()
