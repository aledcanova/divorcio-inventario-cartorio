// Diagnóstico interativo. As respostas ficam no navegador até a pessoa decidir enviar o caso.
(function () {
  'use strict';

  function div(a) { return a.tipo === 'divorcio' || a.tipo === 'uniao'; }
  function inv(a) { return a.tipo === 'inventario'; }
  var SN = [['nao', 'Não'], ['sim', 'Sim']];
  var Q = {
    tipo: { s: 'O caso', h: 'Escolha a opção mais próxima da sua situação.', t: 'O que você precisa resolver?', o: [
      ['divorcio', 'Divórcio (casamento civil)'],
      ['uniao', 'Dissolução de união estável'],
      ['inventario', 'Inventário (bens de quem faleceu)'] ] },
    acordo: { s: 'O acordo', w: div, h: 'A escritura em cartório exige que os dois concordem.', t: 'Vocês dois estão de acordo com a separação?', o: [
      ['sim', 'Sim, estamos de acordo'], ['nao', 'Não, há discordância'] ] },
    iacordo: { s: 'O acordo', w: inv, h: 'Inclui o cônjuge ou companheiro de quem faleceu, se houver.', t: 'Todos os herdeiros estão de acordo com a partilha?', o: [
      ['sim', 'Sim, todos de acordo'], ['ns', 'Ainda não conversamos'], ['nao', 'Não, há discordância'] ] },
    gravidez: { s: 'A família', w: div, h: 'A lei não permite a escritura quando há gravidez conhecida.', t: 'Há gravidez em curso?', o: SN },
    filhos: { s: 'A família', w: div, t: 'Vocês têm filhos menores de 18 anos ou incapazes?', o: SN },
    judicial: { s: 'A família', w: function (a) { return div(a) && a.filhos === 'sim'; }, h: 'É a condição para a escritura quando há filhos menores ou incapazes.', t: 'Guarda, convivência e pensão dos filhos já foram decididas pela Justiça?', o: [
      ['sim', 'Sim, há decisão judicial'], ['nao', 'Ainda não'] ] },
    incapaz: { s: 'A família', w: inv, t: 'Algum herdeiro é menor de 18 anos ou incapaz?', o: SN },
    ideal: { s: 'A família', w: function (a) { return inv(a) && a.incapaz === 'sim'; }, h: 'Sem trocas nem venda dos bens que couberem a ele.', t: 'Todos aceitam que ele receba a parte dele em fração de cada bem?', o: [['sim', 'Sim'], ['nao', 'Não']] },
    nascituro: { s: 'A família', w: inv, t: 'Há gravidez de um possível herdeiro?', o: SN },
    uniaoe: { s: 'A família', w: inv, t: 'Quem faleceu vivia em união estável?', o: [
      ['nao', 'Não'], ['formal', 'Sim, formalizada por escritura ou sentença'], ['informal', 'Sim, sem formalização'] ] },
    testamento: { s: 'A família', w: inv, t: 'Há testamento?', o: [['nao', 'Não'], ['sim', 'Sim'], ['ns', 'Não sei']] },
    autorizado: { s: 'A família', w: function (a) { return inv(a) && a.testamento === 'sim'; }, h: 'É o processo de abertura e cumprimento do testamento.', t: 'O testamento já passou pela Justiça, com autorização para o inventário em cartório?', o: [['sim', 'Sim'], ['nao', 'Ainda não']] },
    irrevog: { s: 'A família', w: function (a) { return inv(a) && a.testamento === 'sim'; }, t: 'O testamento reconhece algum filho ou contém outra declaração irrevogável?', o: [['nao', 'Não'], ['sim', 'Sim'], ['ns', 'Não sei']] },
    dbens: { s: 'Os bens', w: div, t: 'Há bens a partilhar?', o: [
      ['nao', 'Não há bens comuns'], ['sim', 'Sim, e a partilha será feita agora'], ['depois', 'Sim, mas a partilha fica para depois'] ] },
    dpartilha: { s: 'Os bens', w: function (a) { return div(a) && a.dbens === 'sim'; }, t: 'Vocês estão de acordo sobre a divisão dos bens?', o: [
      ['igual', 'Sim, metade para cada um'], ['desigual', 'Sim, mas um fica com mais'], ['nao', 'Não há acordo sobre a divisão'] ] },
    ibens: { s: 'Os bens', w: inv, t: 'Quem faleceu deixou bens?', o: [
      ['imovel', 'Sim, incluindo imóvel'], ['moveis', 'Sim, sem imóvel (veículos, contas, quotas)'], ['nenhum', 'Não deixou bens'] ] },
    imovel: { s: 'Os bens', w: function (a) { return div(a) && a.dbens === 'sim'; }, t: 'Há imóvel entre os bens?', o: SN },
    exterior: { s: 'Os bens', w: function (a) { return a.dbens === 'sim' || a.ibens === 'imovel' || a.ibens === 'moveis'; }, t: 'Há bens fora do Brasil?', o: SN },
    tempo: { s: 'Situação atual', w: inv, t: 'Há quanto tempo foi o falecimento?', o: [['ate2', 'Até 2 meses'], ['2a6', 'Entre 2 e 6 meses'], ['mais6', 'Mais de 6 meses']] },
    proc: { s: 'Situação atual', t: 'Já existe processo judicial sobre este assunto?', h: 'Por exemplo, ação de divórcio ou inventário em andamento.', o: [['nao', 'Não'], ['sim', 'Sim'], ['ns', 'Não sei']] },
    fora: { s: 'Situação atual', t: 'Alguma das partes mora fora do Brasil?', o: SN }
  };
  var ORDER = ['tipo', 'acordo', 'iacordo', 'gravidez', 'filhos', 'judicial', 'incapaz', 'ideal', 'nascituro', 'uniaoe', 'testamento', 'autorizado', 'irrevog', 'dbens', 'dpartilha', 'imovel', 'ibens', 'exterior', 'tempo', 'proc', 'fora'];
  var COMPLETO = { DIV_SEM_BENS: 1, DIV_COM_BENS: 1, INV: 1, INV_PENDENCIAS: 1, INV_NEGATIVO: 1 };   // resultados que liberam o serviço completo
  var COM_VALOR = { DIV_COM_BENS: 1, INV: 1, INV_PENDENCIAS: 1 };                                  // honorários dependem do valor dos bens

  var stage = document.getElementById('wz-stage');
  if (!stage) return;
  var CFG = window.SITE_CONFIG || {};
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var a = {};          // respostas
  var current = null;  // chave da pergunta na tela
  var result = null;

  var $ = function (id) { return document.getElementById(id); };
  var top = $('wz-top'), bar = $('wz-progress'), count = $('wz-count');
  var pResult = $('wz-result'), pEnvio = $('wz-envio'), pProposta = $('wz-proposta'), pContrato = $('wz-contrato'), pPag = $('wz-pagamento'), pFalar = $('wz-falar');

  function el(tag, text, cls) {
    var e = document.createElement(tag);
    if (text) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  }
  function list(items, ordered) {
    var l = document.createElement(ordered ? 'ol' : 'ul');
    items.forEach(function (t) { l.appendChild(el('li', t)); });
    return l;
  }
  function label(k, v) {
    var r = '';
    Q[k].o.forEach(function (o) { if (o[0] === v) r = o[1]; });
    return r;
  }
  function visible() { return ORDER.filter(function (k) { return !Q[k].w || Q[k].w(a); }); }
  function prune() {   // descarta respostas de perguntas que deixaram de se aplicar
    var vis = visible();
    Object.keys(a).forEach(function (k) { if (vis.indexOf(k) < 0) delete a[k]; });
  }
  function nextKey() {
    var vis = visible();
    for (var i = 0; i < vis.length; i++) if (!a[vis[i]]) return vis[i];
    return null;
  }

  // Troca de painel com transição suave
  function swap(show, focusEl) {
    var panes = [stage, pResult, pEnvio, pProposta, pContrato, pPag, pFalar];
    panes.forEach(function (p) { if (p !== show) { p.hidden = true; p.classList.remove('in'); } });
    show.hidden = false;
    if (show !== stage) {
      show.classList.remove('in');
      void show.offsetWidth;
      show.classList.add('in');
    }
    top.hidden = show !== stage;
    if (focusEl) focusEl.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }

  function renderQuestion(k, back) {
    current = k;
    var q = Q[k], vis = visible(), idx = vis.indexOf(k);
    bar.value = Math.round((idx / vis.length) * 100);
    var secs = ['O caso', 'O acordo', 'A família', 'Os bens', 'Situação atual'];
    count.textContent = 'Etapa ' + (secs.indexOf(q.s) + 1) + ' de ' + secs.length;

    var step = el('div', null, 'wz-step');
    step.appendChild(el('p', q.s, 'wz-section'));
    var h = el('h2', q.t, 'wz-q'); h.id = 'wz-q'; h.tabIndex = -1;
    step.appendChild(h);
    if (q.h) step.appendChild(el('p', q.h, 'wz-help'));
    var opts = el('div', null, 'wz-opts');
    opts.setAttribute('role', 'group'); opts.setAttribute('aria-labelledby', 'wz-q');
    q.o.forEach(function (o) {
      if (q.f && !q.f(a, o[0])) return;
      var b = el('button', o[1], 'wz-opt');
      b.type = 'button';
      b.setAttribute('aria-pressed', a[k] === o[0] ? 'true' : 'false');
      b.addEventListener('click', function () { answer(k, o[0], b); });
      opts.appendChild(b);
    });
    step.appendChild(opts);
    var nav = el('div', null, 'wz-nav');
    if (idx > 0) {
      var v = el('button', '← Voltar', 'btn link'); v.type = 'button';
      v.addEventListener('click', function () { goBack(); });
      nav.appendChild(v);
    } else nav.appendChild(el('span'));
    step.appendChild(nav);
    if (idx === 0) step.appendChild(el('p', 'Nada do que você responder é enviado ou gravado nesta etapa. O envio só acontece no fim, se você quiser.', 'wz-priv'));

    var old = stage.firstChild;
    function enter() {
      stage.textContent = '';
      stage.appendChild(step);
      void step.offsetWidth;
      step.classList.add('in');
      h.focus({ preventScroll: true });
    }
    if (old && !reduce) { old.classList.add('out'); setTimeout(enter, 200); } else enter();
    if (stage.hidden) swap(stage, null);
  }

  var busy = false;
  function answer(k, v, btn) {
    if (busy) return;
    busy = true;
    a[k] = v;
    prune();
    Array.prototype.forEach.call(stage.querySelectorAll('.wz-opt'), function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
    setTimeout(function () {
      busy = false;
      var n = nextKey();
      if (n) renderQuestion(n); else showResult();
    }, reduce ? 0 : 260);
  }
  function goBack() {
    var vis = visible(), idx = vis.indexOf(current);
    if (idx > 0) renderQuestion(vis[idx - 1], true);
  }

  // Classificação por regras fixas (CPC arts. 610 e 733; Res. CNJ 35/2007 com a Res. 571/2024). Devolve {pill, cod, titulo, texto, atencao[], docs[], etapas[]}
  function classify(a) {
    var at = [], uniao = a.tipo === 'uniao', nome = uniao ? 'a dissolução da união estável' : 'o divórcio', fo = uniao ? 'feita' : 'feito';
    var ETAPAS = ['Análise dos documentos por advogado', 'Declaração do imposto, quando devido', 'Minuta da escritura, revisada com as partes', 'Conferência pelo tabelionato competente', 'Assinatura presencial ou por videoconferência, com o advogado', 'Averbações e registros'];
    if (a.proc === 'sim') at.push('Há processo judicial em andamento. As partes podem pedir a suspensão ou desistir dele para seguir no cartório; é preciso examinar em que fase está.');
    if (a.proc === 'ns') at.push('Confirmar se existe processo judicial sobre o mesmo assunto.');
    if (a.fora === 'sim') at.push('Quem mora fora do Brasil pode participar por videoconferência, conforme o caso, ou por procuração pública, que pode ser feita em consulado brasileiro.');
    if (a.exterior === 'sim') at.push('Bens situados fora do Brasil não entram na escritura brasileira: seguem as regras do país onde estão.');

    if (div(a)) {
      var DOCS = [uniao ? 'Escritura ou sentença que reconheceu a união estável, se houver' : 'Certidão de casamento atualizada', 'Documento de identidade e CPF dos dois', 'Pacto antenupcial ou contrato de convivência, se houver'];
      if (a.acordo === 'nao' || a.dpartilha === 'nao') {
        return { pill: 'bad', cod: 'DIV_JUDICIAL', titulo: 'Sem acordo, o caminho é o judicial',
          texto: 'A escritura em cartório exige consenso sobre a separação e, se a partilha for feita agora, sobre a divisão dos bens. Enquanto houver discordância, ' + nome + ' depende de processo judicial. Construído o acordo, a via do cartório volta a ser possível.',
          atencao: a.acordo === 'sim' ? ['Se houver acordo sobre a separação, é possível fazer ' + nome + ' em cartório agora e deixar a partilha para depois.'].concat(at) : at, docs: DOCS, etapas: ['Consulta para avaliar a possibilidade de acordo', 'Definição do caminho: escritura ou ação judicial'] };
      }
      if (a.gravidez === 'sim') {
        return { pill: 'bad', cod: 'DIV_JUDICIAL', titulo: 'Com gravidez em curso, o caminho é o judicial',
          texto: 'O Código de Processo Civil (art. 733) só admite a escritura quando não há nascituro. Com gravidez conhecida, ' + nome + ' é ' + fo + ' por processo judicial, que pode ser consensual.',
          atencao: at, docs: DOCS, etapas: ['Consulta sobre a via judicial consensual'] };
      }
      if (a.filhos === 'sim' && a.judicial === 'nao') {
        return { pill: 'warn', cod: 'DIV_FILHOS', titulo: 'Antes, guarda, convivência e alimentos precisam ser decididos na Justiça',
          texto: 'Com filhos menores ou incapazes, a escritura só é possível depois que guarda, convivência e alimentos forem resolvidos judicialmente (Resolução CNJ nº 35/2007, art. 34, § 2º). Feito isso, ' + nome + ' e a partilha podem ser feitos em cartório.',
          atencao: at, docs: DOCS.concat(['Certidão de nascimento dos filhos']), etapas: ['Ação judicial sobre guarda, convivência e alimentos, que pode ser consensual', 'Depois, escritura em cartório'] };
      }
      if (a.filhos === 'sim') { at.unshift('A decisão judicial sobre guarda, convivência e alimentos é mencionada na escritura.'); DOCS.push('Certidão de nascimento dos filhos', 'Decisão judicial sobre guarda, convivência e alimentos'); }
      if (a.dbens === 'depois') at.push('A partilha pode ser feita depois, em outra escritura. Até lá, os bens continuam em comum.');
      if (a.dbens === 'sim') {
        if (a.dpartilha === 'desigual') at.push('Quando um fica com mais do que a metade, pode incidir imposto sobre a diferença: ITCMD, se não houver compensação, ou ITBI, se houver compensação envolvendo imóvel.');
        if (a.imovel === 'sim') { at.push('Havendo imóvel, o cartório competente para a assinatura por videoconferência é, em regra, o do local do imóvel ou do domicílio de quem o recebe.'); DOCS.push('Matrícula atualizada dos imóveis e carnê ou certidão do IPTU'); }
        DOCS.push('Documentos dos demais bens: veículos, extratos, contrato social');
        return { pill: 'ok', cod: 'DIV_COM_BENS', titulo: 'Elementos compatíveis com a escritura em cartório, com partilha de bens',
          texto: 'Pelas informações fornecidas, ' + nome + ' e a partilha podem ser feitos por escritura pública em tabelionato de notas, sem processo judicial. A confirmação depende da análise dos documentos.',
          atencao: at, docs: DOCS, etapas: ETAPAS };
      }
      return { pill: 'ok', cod: 'DIV_SEM_BENS', titulo: 'Elementos compatíveis com a escritura em cartório',
        texto: 'Pelas informações fornecidas, ' + nome + ' pode ser ' + fo + ' por escritura pública em tabelionato de notas, sem processo judicial. A confirmação depende da análise dos documentos.',
        atencao: at, docs: DOCS, etapas: ETAPAS.filter(function (e) { return e.indexOf('imposto') < 0; }) };
    }

    var DI = ['Certidão de óbito', 'Identidade e CPF de quem faleceu, dos herdeiros, do cônjuge ou companheiro e dos cônjuges dos herdeiros', 'Certidões de nascimento ou casamento que comprovem o parentesco', 'Certidão de casamento de quem faleceu e pacto antenupcial, se houver', 'Certidão negativa de testamento (CENSEC)', 'Certidões negativas de débitos em nome de quem faleceu'];
    if (a.ibens === 'imovel') DI.push('Matrícula atualizada dos imóveis e carnê ou certidão do IPTU');
    if (a.ibens !== 'nenhum') DI.push('Documentos dos demais bens: veículos, extratos, contrato social');
    if (a.iacordo === 'nao') {
      return { pill: 'bad', cod: 'INV_JUDICIAL', titulo: 'Sem acordo entre todos, o inventário é judicial',
        texto: 'A escritura exige que todos os herdeiros e o cônjuge ou companheiro estejam de acordo com a partilha (CPC, art. 610). Havendo discordância, o inventário é feito por processo judicial.',
        atencao: at, docs: DI, etapas: ['Consulta para avaliar a possibilidade de acordo', 'Definição do caminho: escritura ou inventário judicial'] };
    }
    if (a.incapaz === 'sim' && a.ideal === 'nao') {
      return { pill: 'bad', cod: 'INV_JUDICIAL', titulo: 'Com a partilha pretendida, o inventário é judicial',
        texto: 'Havendo herdeiro menor ou incapaz, a escritura só é possível se ele receber a parte dele em fração ideal de cada bem (Resolução CNJ nº 35/2007, art. 12-A). Com outra forma de partilha, o inventário é judicial.',
        atencao: at, docs: DI, etapas: ['Consulta sobre a forma de partilha', 'Definição do caminho'] };
    }
    if (a.testamento === 'sim' && a.irrevog === 'sim') {
      return { pill: 'bad', cod: 'INV_JUDICIAL', titulo: 'Com esse testamento, o inventário é judicial',
        texto: 'Quando o testamento reconhece filho ou contém outra declaração irrevogável, a norma do CNJ determina que o inventário seja judicial (Resolução CNJ nº 35/2007, art. 12-B, § 1º).',
        atencao: at, docs: DI.concat(['Cópia do testamento']), etapas: ['Consulta sobre o inventário judicial'] };
    }
    if (a.nascituro === 'sim') {
      return { pill: 'warn', cod: 'INV_AGUARDAR', titulo: 'É preciso aguardar o nascimento',
        texto: 'Havendo gravidez de possível herdeiro, a escritura aguarda o registro do nascimento da criança (Resolução CNJ nº 35/2007, art. 12-A, § 2º). Enquanto isso, é possível reunir os documentos e nomear o inventariante.',
        atencao: at, docs: DI, etapas: ['Reunião dos documentos', 'Após o nascimento, escritura com manifestação do Ministério Público'] };
    }
    if (a.testamento === 'sim' && a.autorizado === 'nao') {
      return { pill: 'warn', cod: 'INV_AGUARDAR', titulo: 'Antes, o testamento precisa passar pela Justiça',
        texto: 'Havendo testamento, o inventário em cartório depende de autorização do juiz no processo de abertura e cumprimento do testamento, com decisão definitiva (Resolução CNJ nº 35/2007, art. 12-B). Depois disso, a escritura é possível.',
        atencao: at, docs: DI.concat(['Cópia do testamento']), etapas: ['Ação de abertura e cumprimento do testamento', 'Depois, escritura de inventário em cartório'] };
    }
    var pend = false;
    if (a.iacordo === 'ns') { pend = true; at.unshift('O acordo de todos é indispensável. Vale conversar sobre a partilha antes de reunir os documentos.'); }
    if (a.incapaz === 'sim') { pend = true; at.push('Com herdeiro menor ou incapaz, a escritura depende de manifestação favorável do Ministério Público, a quem o cartório encaminha o caso. Isso acrescenta uma etapa.'); DI.push('Certidão de nascimento do herdeiro menor e documentos do representante legal'); }
    if (a.testamento === 'ns') at.push('A existência de testamento é verificada pela certidão da CENSEC, obrigatória em todo inventário.');
    if (a.testamento === 'sim') { at.push('Com a autorização judicial definitiva, o inventário com testamento pode ser feito em cartório.'); DI.push('Cópia do testamento e decisão judicial que autoriza a via extrajudicial'); if (a.irrevog === 'ns') { pend = true; at.push('O conteúdo do testamento precisa ser examinado: se reconhecer filho ou contiver declaração irrevogável, o inventário é judicial.'); } }
    if (a.uniaoe === 'informal') { pend = true; at.push('A união estável não formalizada pode ser reconhecida pelos demais herdeiros na escritura. Se o companheiro for o único herdeiro, ela precisa ser reconhecida antes, por sentença ou escritura.'); }
    if (a.tempo && a.tempo !== 'ate2') at.push('Já passou o prazo de 2 meses do Código de Processo Civil (art. 611). A escritura continua possível, mas o estado pode cobrar multa sobre o imposto pelo atraso.');
    if (a.ibens === 'imovel') at.push('Havendo imóvel, o cartório competente para a assinatura por videoconferência é, em regra, o do local do imóvel ou do domicílio de um dos herdeiros.');
    if (a.ibens === 'nenhum') {
      return { pill: 'ok', cod: 'INV_NEGATIVO', titulo: 'Elementos compatíveis com o inventário negativo em cartório',
        texto: 'Quando a pessoa falecida não deixou bens, a escritura de inventário negativo serve para comprovar essa situação. Pelas informações fornecidas, ela pode ser feita em tabelionato de notas.',
        atencao: at, docs: DI, etapas: ETAPAS.filter(function (e) { return e.indexOf('imposto') < 0; }) };
    }
    DI.push('Declaração do ITCMD à Secretaria da Fazenda do estado');
    if (pend) {
      return { pill: 'warn', cod: 'INV_PENDENCIAS', titulo: 'Possível inventário em cartório, com pontos a esclarecer antes',
        texto: 'Pelas informações fornecidas, o inventário pode ser feito por escritura pública, mas há pontos que precisam ser confirmados com os documentos.',
        atencao: at, docs: DI, etapas: ETAPAS };
    }
    return { pill: 'ok', cod: 'INV', titulo: 'Elementos compatíveis com o inventário em cartório',
      texto: 'Pelas informações fornecidas, o inventário e a partilha podem ser feitos por escritura pública em tabelionato de notas, sem processo judicial. A confirmação depende da análise dos documentos.',
      atencao: at, docs: DI, etapas: ETAPAS };
  }

  function showResult() {
    result = classify(a);
    bar.value = 100;
    var vd = $('verdict');
    vd.className = 'verdict ' + result.pill;
    $('verdict-title').textContent = result.titulo;
    $('verdict-text').textContent = result.texto;
    var m = $('mapa'); m.textContent = '';
    if (result.atencao.length) { m.appendChild(el('h3', 'Pontos de atenção')); m.appendChild(list(result.atencao)); }
    m.appendChild(el('h3', 'Documentos normalmente relevantes')); m.appendChild(list(result.docs));
    var tl = el('ol', null, 'timeline');
    result.etapas.forEach(function (t) { var li = el('li'); li.appendChild(el('strong', t)); tl.appendChild(li); });
    m.appendChild(el('h3', result.pill === 'bad' ? 'Etapas gerais' : 'Como é o caminho até a escritura')); m.appendChild(tl);
    $('campo-valor').hidden = !COM_VALOR[result.cod];
    $('l-valor').textContent = inv(a) ? 'Valor aproximado da herança (R$)' : 'Valor aproximado dos bens a partilhar (R$)';
    swap(pResult, $('verdict-title'));
  }

  $('refazer').addEventListener('click', function () { a = {}; result = null; renderQuestion(ORDER[0]); swap(stage, null); });
  function num(v) { v = String(v).trim().replace(/[R$\s]/g, ''); if (v.indexOf(',') >= 0) v = v.replace(/\./g, '').replace(',', '.'); else if (/^\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, ''); return parseFloat(v); }
  $('imprimir').addEventListener('click', function () { window.print(); });
  ['abrir-envio', 'abrir-envio-2'].forEach(function (id) { $(id).addEventListener('click', function () { swap(pEnvio, $('envio-title')); }); });
  $('voltar-resultado').addEventListener('click', function () { swap(pResult, $('verdict-title')); });

  // ---------- Passo 1: dados e documentos ----------
  var form = $('caso');
  var MAX = 8 * 1024 * 1024;
  var caso = null;   // {protocolo, nome, email} depois do envio
  function setErr(input, errId, bad, msg) {
    var e = $(errId);
    if (msg) e.textContent = msg;
    e.hidden = !bad;
    if (input) input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    return bad;
  }
  function validate() {
    var first = null;
    function chk(id, errId, bad, msg) { if (setErr($(id), errId, bad, msg) && !first) first = $(id); }
    chk('f-nome', 'e-nome', $('f-nome').value.trim().split(/\s+/).length < 2);
    chk('f-email', 'e-email', !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($('f-email').value.trim()));
    chk('f-cidade', 'e-cidade', $('f-cidade').value.trim().length < 2);
    chk('f-uf', 'e-uf', !$('f-uf').value);
    var total = 0, tipoRuim = false;
    ['f-certidao', 'f-bens', 'f-outro'].forEach(function (id) {
      var f = $(id).files && $(id).files[0];
      if (f) { total += f.size; if (!/\.(pdf|jpe?g|png|heic)$/i.test(f.name)) tipoRuim = true; }
    });
    var arqMsg = tipoRuim ? 'Envie apenas arquivos PDF, JPG, PNG ou HEIC.' : 'Os arquivos somam mais de 8 MB. Remova algum; o restante pode ser enviado depois, por e-mail.';
    if (setErr(null, 'e-arq', tipoRuim || total > MAX, arqMsg) && !first) first = $('f-certidao');
    if (result && COM_VALOR[result.cod]) chk('f-valor', 'e-valor', !$('f-valor-ns').checked && !(num($('f-valor').value) > 0));
    chk('f-c1', 'e-c1', !$('f-c1').checked);
    return first;
  }
  function protocolo() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    var r = '', abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var buf = new Uint8Array(5);
    (window.crypto || window.msCrypto).getRandomValues(buf);
    for (var i = 0; i < 5; i++) r += abc[buf[i] % abc.length];
    return 'DI-' + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + '-' + r;
  }
  function setProt(p) {
    Array.prototype.forEach.call(document.querySelectorAll('.prot'), function (e) { e.textContent = p; });
  }
  // Envio ao serviço do escritório no Google (Apps Script), que grava os dados e os arquivos no Drive.
  // O corpo vai como texto simples para evitar a pré-verificação de CORS; os arquivos seguem em base64.
  function lerArquivo(campo, f) {
    return new Promise(function (ok, no) {
      var fr = new FileReader();
      fr.onload = function () { ok({ campo: campo, nome: f.name, tipo: f.type, b64: String(fr.result).split(',')[1] }); };
      fr.onerror = no; fr.readAsDataURL(f);
    });
  }
  // Envio ao serviço do escritório. Se o envio com anexos falhar, manda só os dados e pede os documentos por e-mail.
  var anexosPendentes = false;
  function mandar(dados) {
    if (!CFG.endpoint) return Promise.reject({ codigo: 'sem-endpoint' });
    return fetch(CFG.endpoint, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(dados) })
      .then(function (r) { if (!r.ok) throw { codigo: 'http-' + r.status }; return r.json(); })
      .then(function (j) { if (!j || !j.ok) throw { codigo: (j && j.erro) || 'recusado' }; });
  }
  function post(fd, btn, rotulo, errBox, ok) {
    errBox.hidden = true;
    btn.disabled = true; btn.textContent = 'Enviando…';
    var dados = {}, arquivos = [], nomes = [];
    fd.forEach(function (v, k) {
      if (typeof v === 'object' && v && 'size' in v) { if (v.size) { arquivos.push(lerArquivo(k, v)); nomes.push(v.name); } }
      else dados[k] = v;
    });
    try {   // origem da visita (anúncio), guardada só durante a visita; ver Política de Privacidade
      var og = JSON.parse(sessionStorage.getItem('origem') || '{}');
      if (og.gclid || og.gbraid || og.wbraid) dados.gclid = og.gclid || og.gbraid || og.wbraid;
      if (Object.keys(og).length) dados.origem = JSON.stringify(og);
    } catch (e) {}
    function semAnexos(motivo) {
      if (!nomes.length || (motivo && motivo.codigo === 'dados')) throw motivo;
      if (window.console) console.error('envio com anexos falhou:', motivo && (motivo.codigo || motivo.message));
      var d2 = {}; Object.keys(dados).forEach(function (k) { if (k !== '_arquivos') d2[k] = dados[k]; });
      d2.anexos_pendentes = nomes.join('; ');
      return mandar(d2).then(function () { anexosPendentes = true; });
    }
    Promise.all(arquivos).then(function (lista) { dados._arquivos = lista; return mandar(dados); })
      .catch(semAnexos)
      .then(function () { ok(); })
      .catch(function (e) {
        var cod = (e && (e.codigo || e.message)) || 'rede';
        if (window.console) console.error('envio falhou:', cod);
        errBox.textContent = 'Não foi possível enviar agora. Verifique a conexão e tente de novo. Se o problema continuar, escreva para ' + (CFG.email || 'o e-mail da página de contato') + '. (código: ' + String(cod).slice(0, 40) + ')';
        errBox.hidden = false;
      }).then(function () { btn.disabled = false; btn.textContent = rotulo; });
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var bad = validate();
    if (bad) { bad.focus(); return; }
    var prot = caso ? caso.protocolo : protocolo();
    $('f-protocolo').value = prot;
    $('f-codigo').value = result ? result.cod : '';
    $('f-resultado').value = result ? result.titulo : '';
    $('f-respostas').value = visible().map(function (k) { return Q[k].t + ' ' + label(k, a[k]); }).join('\n');
    $('f-json').value = JSON.stringify(a);
    $('f-pontos').value = JSON.stringify(result ? result.atencao : []);
    var fd = new FormData(form);
    ['arquivo_certidao', 'arquivo_bens', 'arquivo_outro'].forEach(function (n) {
      var f = fd.get(n);
      if (f && typeof f === 'object' && !f.size) fd.delete(n);   // não envia campo de arquivo vazio
    });
    post(fd, $('enviar'), 'Enviar e ver a proposta', $('e-envio'), function () {
      caso = { protocolo: prot, nome: $('f-nome').value.trim(), email: $('f-email').value.trim() };
      setProt(prot);
      // O serviço completo só é oferecido quando o diagnóstico aponta a escritura e, se os honorários dependem do valor dos bens, quando ele foi informado
      valorBase = result && COM_VALOR[result.cod] && !$('f-valor-ns').checked ? num($('f-valor').value) : 0;
      // A condução do caso passou a ser proposta junto com a orientação da consulta (decisão de 07/10/2026).
      // Pelo site contrata-se a consulta; o serviço completo só aparece no link de retomada.
      var pode = false;
      $('offer-completo').hidden = !pode;
      $('nota-so-consulta').hidden = pode;
      if (pode) {
        var p = prod('completo');
        $('pc-nome').textContent = p.nome;
        $('pc-preco').textContent = brl(p.total);
        $('pc-detalhe').textContent = 'Entrada de ' + brl(p.entrada) + (p.abat ? ' (' + brl(p.abat) + ' já pagos na consulta; ' + brl(p.agora) + ' agora)' : ' agora') + ' e duas parcelas de ' + brl(p.parcela) + ': uma no envio da minuta ao tabelionato e outra na assinatura da escritura.' + (p.formula ? ' ' + p.formula : '');
      } else {
        $('nota-so-consulta').textContent = 'O atendimento começa pela consulta de viabilidade: o advogado analisa os documentos, assina a orientação e envia a proposta para a condução do caso.';
      }
      if (anexosPendentes && !$('aviso-anexos')) {
        var av = el('p', 'Seus dados foram recebidos, mas não foi possível receber os arquivos agora. Envie-os para ' + CFG.email + ' informando o protocolo ' + prot + '.', 'err');
        av.id = 'aviso-anexos'; av.setAttribute('role', 'status');
        $('offer-consulta').parentNode.parentNode.insertBefore(av, $('offer-consulta').parentNode);
      }
      humano();
      swap(pProposta, $('proposta-title'));
    });
  });

  // ---------- Passo 2: proposta ----------
  var valorBase = 0, retomada = false;
  var NOMES = { DIV_SEM_BENS: 'Divórcio ou dissolução em cartório, sem partilha', DIV_COM_BENS: 'Divórcio ou dissolução em cartório, com partilha', INV: 'Inventário e partilha em cartório', INV_PENDENCIAS: 'Inventário e partilha em cartório', INV_NEGATIVO: 'Inventário negativo em cartório' };
  function r2(v) { return Math.round(v * 100) / 100; }
  function prod(k) {
    if (k === 'consulta') return { nome: 'Consulta de viabilidade', total: CFG.preco_consulta, agora: CFG.preco_consulta, link: CFG.link_cartao_consulta };
    var c = result.cod, total, formula = '', V = valorBase;
    var TIPO = { DIV_SEM_BENS: 'divorcio_sem_bens', DIV_COM_BENS: 'divorcio_com_bens', INV: 'inventario', INV_PENDENCIAS: 'inventario', INV_NEGATIVO: 'inventario_negativo' }[c];
    var oque = c === 'DIV_COM_BENS' ? 'valor informado dos bens' : 'valor informado da herança';
    function texto(r) { return (r.fixo ? brl(r.fixo) + ' mais ' : '') + (r.pct ? String(r.pct).replace('.', ',') + '% sobre ' + brl(V) + ', ' + oque : '') + (r.minimo ? (r.pct ? ', com mínimo de ' : '') + brl(r.minimo) : '') + '.'; }
    function valor(r) { return Math.max(r.minimo || 0, (r.fixo || 0) + V * (r.pct || 0) / 100); }
    var RS = { divorcio_sem_bens: { fixo: CFG.preco_divorcio_sem_bens }, divorcio_com_bens: { fixo: CFG.preco_divorcio_com_bens_fixo, pct: CFG.preco_divorcio_com_bens_pct },
      inventario: { fixo: CFG.preco_inventario_fixo, pct: CFG.preco_inventario_pct }, inventario_negativo: { fixo: CFG.preco_inventario_negativo } }[TIPO];
    total = valor(RS);
    if (RS.pct) formula = texto(RS);
    // Estado informado pelo cliente: vale o maior entre o piso do RS e o da tabela da OAB daquele estado
    var uf = $('f-uf').value, T = (window.TABELAS_UF || {})[uf], ru = T && T[TIPO];
    if (ru && valor(ru) > total) { total = valor(ru); formula = 'Calculado pela tabela de honorários da OAB/' + uf + ': ' + texto(ru); }
    total = r2(total);
    var entrada = r2(total * CFG.entrada_pct / 100), parcela = r2((total - entrada) / 2), abat = retomada ? CFG.preco_consulta : 0;
    return { nome: NOMES[c], total: total, agora: r2(Math.max(0, entrada - abat)), entrada: entrada, abat: abat, parcela: parcela, formula: formula, link: CFG.link_cartao_completo, cod: c };
  }
  var OBJETO = {
    DIV_SEM_BENS: 'escritura pública de divórcio consensual ou de dissolução de união estável, sem partilha de bens',
    DIV_COM_BENS: 'escritura pública de divórcio consensual ou de dissolução de união estável, com partilha de bens',
    INV: 'escritura pública de inventário e partilha', INV_PENDENCIAS: 'escritura pública de inventário e partilha', INV_NEGATIVO: 'escritura pública de inventário negativo'
  };
  var produto = null;
  function brl(v) { return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }); }

  Array.prototype.forEach.call(pProposta.querySelectorAll('[data-produto]'), function (b) {
    b.addEventListener('click', function () {
      produto = b.getAttribute('data-produto');
      var p = prod(produto);
      $('ct-consulta').hidden = produto !== 'consulta';
      $('ct-completo').hidden = produto !== 'completo';
      if (produto === 'completo') {
        var set = function (c, t) { Array.prototype.forEach.call(document.querySelectorAll('.' + c), function (e) { e.textContent = t; }); };
        set('v-objeto', OBJETO[p.cod]); set('v-total', brl(p.total)); set('v-entrada', brl(p.entrada));
        set('v-abat', p.abat ? ' Da entrada são abatidos ' + brl(p.abat) + ' já pagos na consulta de viabilidade do mesmo protocolo, restando ' + brl(p.agora) + ' a pagar no aceite.' : ''); set('v-parcela', brl(p.parcela));
        set('v-formula', p.formula ? ' ' + (p.formula.indexOf('Calculado') === 0 ? p.formula : 'O valor corresponde a ' + p.formula) + ' Se a avaliação dos bens pela Fazenda estadual, ou o valor atribuído na escritura, for diferente do informado, o percentual é recalculado sobre o valor final e a diferença é acertada na última parcela.' : '');
      }
      $('k-resumo').textContent = brl(p.total) + (p.agora !== p.total ? ' (entrada de ' + brl(p.agora) + ' agora)' : '');
      $('k-aceite').checked = false; $('k-ia').checked = false;
      swap(pContrato, $('contrato-title'));
    });
  });
  $('voltar-proposta').addEventListener('click', function () { swap(pProposta, $('proposta-title')); });
  function humano() {
    var sp = $('selo-proposta'); if (sp) sp.hidden = !CFG.mercado_pago;
    var txt = encodeURIComponent('Protocolo ' + caso.protocolo + ' - quero falar com o advogado');
    var zap = CFG.whatsapp_e164 ? 'https://wa.me/' + CFG.whatsapp_e164.replace(/\D/g, '') + '?text=' + txt : '';
    Array.prototype.forEach.call(document.querySelectorAll('.humano-link'), function (l) {
      l.href = zap || 'mailto:' + CFG.email + '?subject=' + txt;
      l.textContent = zap ? 'Atendimento humano por WhatsApp' : 'Atendimento humano por e-mail';
      if (zap) { l.target = '_blank'; l.rel = 'noopener'; }
    });
  }
  $('abrir-falar').addEventListener('click', function () {
    var assunto = encodeURIComponent('Protocolo ' + caso.protocolo + ' - falar com o advogado');
    $('falar-email').href = 'mailto:' + CFG.email + '?subject=' + assunto;
    if (CFG.whatsapp_e164) {
      var w = $('falar-whats');
      w.href = 'https://wa.me/' + CFG.whatsapp_e164.replace(/\D/g, '') + '?text=' + encodeURIComponent('Protocolo ' + caso.protocolo);
      w.hidden = false;
    }
    swap(pFalar, $('falar-title'));
  });
  $('falar-voltar').addEventListener('click', function () { swap(pProposta, $('proposta-title')); });

  // ---------- Passo 3: contrato e aceite ----------
  function cpfOk(v) {
    var c = v.replace(/\D/g, '');
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
    function dv(n) { var s = 0; for (var i = 0; i < n; i++) s += +c[i] * (n + 1 - i); var r = (s * 10) % 11; return r === 10 ? 0 : r; }
    return dv(9) === +c[9] && dv(10) === +c[10];
  }
  $('k-cpf').addEventListener('input', function () {
    var c = this.value.replace(/\D/g, '').slice(0, 11);
    this.value = c.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2');
  });
  var kform = $('contratacao');
  kform.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var first = null;
    function chk(id, errId, bad) { if (setErr($(id), errId, bad) && !first) first = $(id); }
    if (retomada) {
      chk('k-nome-v', 'e-knome', $('k-nome-v').value.trim().split(/\s+/).length < 2);
      chk('k-email-v', 'e-kemail', !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($('k-email-v').value.trim()));
      caso.nome = $('k-nome-v').value.trim(); caso.email = $('k-email-v').value.trim();
    }
    chk('k-cpf', 'e-cpf', !cpfOk($('k-cpf').value));
    chk('k-end', 'e-end', $('k-end').value.trim().length < 10);
    chk('k-aceite', 'e-aceite', !$('k-aceite').checked);
    chk('k-ia', 'e-ia', !$('k-ia').checked);
    if (first) { first.focus(); return; }
    var p = prod(produto);
    $('k-base').value = produto === 'completo' ? valorBase : '';
    $('k-codigo').value = result ? result.cod : '';
    $('k-protocolo').value = caso.protocolo;
    $('k-produto').value = produto;
    $('k-total').value = p.total;
    $('k-agora').value = p.agora;
    $('k-versao').value = CFG.versao_contrato || '';
    $('k-nome').value = caso.nome;
    $('k-email').value = caso.email;
    $('k-quando').value = new Date().toISOString();
    // Grava o texto exato do contrato exibido e aceito: é ele que segue na cópia enviada por e-mail
    $('k-texto').value = $(produto === 'consulta' ? 'ct-consulta' : 'ct-completo').innerText.replace(/\n{3,}/g, '\n\n').trim();
    post(new FormData(kform), $('contratar'), 'Aceitar e ir para o pagamento', $('e-contratar'), function () { showPagamento(p); });
  });

  // ---------- Pagamento ----------
  function ascii(s, max) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]/g, '').toUpperCase().slice(0, max);
  }
  function crc16(s) {
    var crc = 0xFFFF;
    for (var i = 0; i < s.length; i++) {
      crc ^= s.charCodeAt(i) << 8;
      for (var j = 0; j < 8; j++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
    return ('0000' + crc.toString(16).toUpperCase()).slice(-4);
  }
  function pixCode(valor, txid) {   // BR Code estático (padrão EMV do Banco Central)
    function f(id, v) { return id + ('0' + v.length).slice(-2) + v; }
    var s = f('00', '01') + f('26', f('00', 'br.gov.bcb.pix') + f('01', CFG.pix_chave)) + f('52', '0000') + f('53', '986') +
      f('54', Number(valor).toFixed(2)) + f('58', 'BR') + f('59', ascii(CFG.pix_nome, 25)) + f('60', ascii(CFG.pix_cidade, 15)) +
      f('62', f('05', txid)) + '6304';
    return s + crc16(s);
  }

  function showPagamento(p) {
    $('pag-produto').textContent = p.nome;
    $('pag-valor').textContent = brl(p.agora);
    var temPix = !!(CFG.pix_chave && CFG.pix_nome), temCartao = !!p.link;
    if (temPix) $('pix-code').value = pixCode(p.agora, caso.protocolo.replace(/[^A-Za-z0-9]/g, '').slice(0, 25));
    // Mercado Pago: o servidor do escritório cria o link com o valor do contrato; o navegador não define preço
    var usaMP = !!CFG.mercado_pago && !!CFG.endpoint && produto === 'consulta';
    $('pag-mp').hidden = true; $('pag-mp-espera').hidden = !usaMP;
    if (usaMP) {
      temPix = false;
      fetch(CFG.endpoint, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ 'form-name': 'pagamento', protocolo: caso.protocolo, email: caso.email }) })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (!j.ok || !/^https:\/\/([a-z0-9-]+\.)*mercadopago\.com(\.br)?\//.test(j.url)) throw new Error('mp'); $('mp-link').href = j.url; $('pag-mp').hidden = false; })
        .catch(function () { var pix = !!(CFG.pix_chave && CFG.pix_nome); $('pag-pix').hidden = !pix; $('pag-email').hidden = pix; })
        .then(function () { $('pag-mp-espera').hidden = true; });
    }
    $('pag-pix').hidden = !temPix;
    if (temCartao) $('cartao-link').href = p.link;
    $('pag-cartao').hidden = !temCartao;
    $('pag-email').hidden = temPix || temCartao || usaMP;
    var passos = produto === 'consulta'
      ? [['Confirmação', 'Você recebe por e-mail a cópia do contrato e, identificado o pagamento, a confirmação.'],
         ['Análise', 'O advogado examina as suas respostas e os documentos. Se faltar algo essencial, ele avisa.'],
         ['Orientação e proposta', 'Em até ' + (CFG.prazo_consulta || '24 horas') + ' você recebe a orientação assinada e a proposta detalhada para a condução do caso.']]
      : [['Confirmação', 'Você recebe por e-mail a confirmação do pagamento e a cópia do contrato.'],
         ['Revisão do caso', 'O advogado revisa o caso e confirma a contratação. Se não confirmar, o valor pago é devolvido integralmente.'],
         ['Início', 'Confirmado, você recebe a lista de documentos e o termo sobre o uso de ferramentas de tecnologia. O trabalho começa.']];
    var ol = $('pag-passos'); ol.textContent = '';
    passos.forEach(function (x) { var li = el('li'); li.appendChild(el('strong', x[0])); li.appendChild(document.createTextNode(x[1])); ol.appendChild(li); });
    swap(pPag, $('pag-title'));
  }
  $('pix-copiar').addEventListener('click', function () {
    var b = this, t = $('pix-code');
    function ok() { b.textContent = 'Código copiado'; setTimeout(function () { b.textContent = 'Copiar código Pix'; }, 2500); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t.value).then(ok, function () { t.select(); });
    else { t.select(); document.execCommand('copy'); ok(); }
  });

  // Link enviado por e-mail a quem já fez a consulta: abre direto a proposta do serviço completo.
  // Os dados vêm no fragmento (#), que não é enviado ao servidor. Sem nome, e-mail ou documento no endereço.
  function retomar() {
    var h = {}; location.hash.replace(/^#/, '').split('&').forEach(function (kv) { var i = kv.indexOf('='); if (i > 0) h[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1)); });
    if (!/^DI-\d{6}-[A-Z0-9]{5}$/.test(h.retomar || '') || !COMPLETO[h.c]) return false;
    var v = parseFloat(h.v);
    if (COM_VALOR[h.c] && !(v > 0)) return false;
    retomada = true; result = { cod: h.c, titulo: NOMES[h.c], atencao: [] }; valorBase = COM_VALOR[h.c] ? v : 0;
    if (/^[A-Z]{2}$/.test(h.uf || '')) $('f-uf').value = h.uf;
    caso = { protocolo: h.retomar, nome: '', email: '' };
    setProt(h.retomar);
    var p = prod('completo');
    $('pc-nome').textContent = p.nome; $('pc-preco').textContent = brl(p.total);
    $('pc-detalhe').textContent = 'Entrada de ' + brl(p.entrada) + ' (' + brl(p.abat) + ' já pagos na consulta; ' + brl(p.agora) + ' agora) e duas parcelas de ' + brl(p.parcela) + ': uma no envio da minuta ao tabelionato e outra na assinatura da escritura.' + (p.formula ? ' ' + p.formula : '');
    $('offer-completo').hidden = false; $('offer-consulta').hidden = true; $('nota-so-consulta').hidden = true;
    $('proposta-intro').textContent = 'Proposta do serviço completo para o protocolo ' + h.retomar + ', com o valor da consulta abatido.';
    $('k-retomada').hidden = false;
    humano();
    swap(pProposta, $('proposta-title'));
    return true;
  }
  var pre = (location.search.match(/[?&]tipo=(divorcio|uniao|inventario)/) || [])[1];
  if (pre) a.tipo = pre;
  if (!retomar()) renderQuestion(nextKey());
})();
