import contextlib,importlib.util,io,pathlib,unittest
from unittest.mock import Mock,patch
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('evaluators_launcher',ROOT/'iniciar.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class EvaluatorsLauncher(unittest.TestCase):
 def test_evaluators_flag_uses_isolated_port(self):
  server=Mock();server.serve_forever.side_effect=KeyboardInterrupt
  with patch.object(m,'make_server',return_value=server) as make,contextlib.redirect_stdout(io.StringIO()) as out:
   self.assertEqual(m.main(['--evaluators-test','--no-browser']),0)
  self.assertEqual(make.call_args.kwargs['port'],8872);self.assertIn('127.0.0.1:8872',out.getvalue());server.server_close.assert_called_once()
 def test_port_conflict_does_not_change_origin(self):
  with patch.object(m,'make_server',side_effect=OSError('ocupada')),contextlib.redirect_stderr(io.StringIO()) as out:
   self.assertEqual(m.main(['--evaluators-test','--no-browser']),1)
  self.assertIn('8872',out.getvalue());self.assertIn('não importe dados reais',out.getvalue())
 def test_new_preview_and_modules_allowed_private_vault_not_served(self):
  self.assertTrue(m.allowed_path('/PREVIA_AVALIADORES.html'));self.assertTrue(m.allowed_path('/app/evaluators.js'))
  for p in ['/access-v1.json','/backups/acessos.json','/PRIVADO_NAO_PUBLICAR/alunos.xlsx']:self.assertFalse(m.allowed_path(p))
 def test_windows_launcher_selects_evaluators_not_operation(self):
  cmd=(ROOT/'TESTAR_AVALIADORES_WINDOWS.cmd').read_text();ps=(ROOT/'INICIAR_WINDOWS.ps1').read_text()
  self.assertIn('-AvaliadoresTeste',cmd);self.assertIn('8872',cmd);self.assertIn('if ($AvaliadoresTeste) { $Port=8872 }',ps)
