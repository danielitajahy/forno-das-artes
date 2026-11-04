"""Executa o script PS real em runtime de teste. Não equivale a testar Windows."""
import http.client,os,pathlib,socket,subprocess,time,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
RUNTIME=os.environ.get('FDA_PWSH_TEST_RUNTIME','')
@unittest.skipUnless(RUNTIME and pathlib.Path(RUNTIME).is_file(),'Runtime PowerShell de teste não configurado; executar também no Windows real')
class Native(unittest.TestCase):
 def env(self):
  e=os.environ.copy();e.update(XDG_CACHE_HOME='/tmp/forno-pwsh-cache',XDG_CONFIG_HOME='/tmp/forno-pwsh-config',XDG_DATA_HOME='/tmp/forno-pwsh-data',POWERSHELL_TELEMETRY_OPTOUT='1');return e
 def command(self,*args):return [RUNTIME,'-NoLogo','-NoProfile','-File',str(ROOT/'INICIAR_WINDOWS.ps1'),*args]
 def get(self,port,path,method='GET'):
  c=http.client.HTTPConnection('127.0.0.1',port,timeout=2);c.request(method,path);r=c.getresponse();data=r.read();result=(r.status,dict(r.getheaders()),data);c.close();return result
 def server(self,preview=False):
  sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close()
  process=subprocess.Popen(self.command('-SemNavegador','-PortaTeste',str(port),*(['-Previa'] if preview else [])),stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=self.env())
  self.addCleanup(self.stop,process)
  end=time.monotonic()+10
  while time.monotonic()<end:
   if process.poll() is not None:self.fail('Servidor nativo terminou antes da verificação')
   try:
    if self.get(port,'/_forno_health')[0]==200:return port
   except OSError:pass
   time.sleep(.05)
  self.fail('Servidor nativo não iniciou no prazo de teste')
 def stop(self,p):
  if p.poll() is None:
   p.terminate()
   try:p.wait(timeout=5)
   except subprocess.TimeoutExpired:p.kill();p.wait()
  p.stdout.close();p.stderr.close()
 def test_native_preflight(self):
  p=subprocess.run(self.command('-Verificar'),env=self.env(),capture_output=True,timeout=10);self.assertEqual(p.returncode,0);self.assertIn(b'OK:',p.stdout)
 def test_native_http_resources_and_private_file_denial(self):
  port=self.server()
  for path in ['/index.html','/app/ui.js','/sw.js','/manifest.webmanifest']:
   status,headers,raw=self.get(port,path);self.assertEqual(status,200);self.assertTrue(raw);self.assertIn('no-store',headers['Cache-Control'])
  for path in ['/.env','/../index.html','/iniciar.py','/PRIVADO_NAO_PUBLICAR/alunos.xlsx']:self.assertEqual(self.get(port,path)[0],404)
  self.assertEqual(self.get(port,'/app/core.js','HEAD')[2],b'')
 def test_native_busy_port_does_not_kill_existing_listener(self):
  with socket.socket() as sock:
   sock.bind(('127.0.0.1',0));sock.listen(1)
   p=subprocess.run(self.command('-SemNavegador','-PortaTeste',str(sock.getsockname()[1])),env=self.env(),capture_output=True,timeout=10)
   self.assertNotEqual(p.returncode,0);self.assertIn(b'Porta',p.stderr)
 def test_native_preview_blocks_operational_resources(self):
  port=self.server(True);self.assertEqual(self.get(port,'/PREVIA_VISUAL.html')[0],200)
  for path in ['/index.html','/app/storage.js']:self.assertEqual(self.get(port,path)[0],404)
if __name__=='__main__':unittest.main()
