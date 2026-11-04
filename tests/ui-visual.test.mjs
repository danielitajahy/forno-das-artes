import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const ui=readFileSync(new URL('../app/ui.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../app/app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const server=readFileSync(new URL('../iniciar.py',import.meta.url),'utf8');

test('criação e login incluem botão visível de mostrar/ocultar senha',()=>{
  assert.equal((ui.match(/input\('password'/g)||[]).length,3);
  assert.match(ui,/class="password-toggle" data-action="toggle-password"/);
  assert.match(ui,/password-toggle-text/);
  assert.match(ui,/field\.type=show\?'text':'password'/);
  assert.match(ui,/show\?'Ocultar':'Mostrar'/);
});

test('botão do olho tem coluna própria e permanece visível em telas estreitas',()=>{
  assert.match(css,/grid-template-columns:minmax\(0,1fr\) 88px/);
  assert.match(css,/display:inline-flex!important/);
  assert.match(css,/@media\(max-width:480px\)/);
  assert.match(css,/\.password-toggle-text\{display:none\}/);
});

test('ingredientes dos cards públicos recebem cor própria de destaque',()=>{
  assert.match(ui,/class="ing menu-ingredients"/);
  assert.match(css,/menu-ingredients/); // Contraste efetivo validado também no navegador.
});

test('cache de interface é atualizado sem apagar IndexedDB',()=>{
  assert.match(html,/app\/app\.css\?v=20261104-finalizacao-v1/);
  assert.match(html,/app\/ui\.js\?v=20261104-finalizacao-v1/);
  assert.match(sw,/fda-dev-v2-20261104-finalizacao-v1/);
  assert.match(sw,/caches\.delete\(k\)/);
  assert.match(server,/Cache-Control', 'no-store/);
  assert.doesNotMatch(sw,/indexedDB\.deleteDatabase/);
});
