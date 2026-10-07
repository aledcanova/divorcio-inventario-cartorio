// Estimativa de ITCMD. Mesmo cálculo de backoffice/escritorio.py. Roda só no navegador.
(function () {
  var D = window.ITCMD_DATA.ufs, f = document.getElementById('f-itcmd'), out = document.getElementById('r-itcmd'), sel = document.getElementById('uf');
  sel.add(new Option('Selecione', ''));
  Object.keys(D).sort(function (a, b) { return D[a].nome.localeCompare(D[b].nome, 'pt-BR'); }).forEach(function (k) { sel.add(new Option(D[k].nome, k)); });

  function brl(v) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function num(s) { s = String(s).trim().replace(/[R$\s]/g, ''); if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.'); else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); return parseFloat(s); }
  function calc(faixas, base, modo) {
    var i, piso = 0, imp = 0, teto;
    if (modo === 'marginal') {
      for (i = 0; i < faixas.length; i++) { teto = faixas[i].ate === null ? Infinity : faixas[i].ate; if (base > piso) imp += (Math.min(base, teto) - piso) * faixas[i].pct / 100; piso = teto; }
      return imp;
    }
    for (i = 0; i < faixas.length; i++) if (faixas[i].ate === null || base <= faixas[i].ate) return base * faixas[i].pct / 100;
  }
  function tabela(faixas) {
    var piso = 0, h = '<div class="table-wrap"><table><thead><tr><th>Faixa de valor</th><th class="num">Alíquota</th></tr></thead><tbody>';
    faixas.forEach(function (x) {
      h += '<tr><td>' + (x.ate === null ? 'Acima de ' + brl(piso) : (piso ? 'De ' + brl(piso) + ' a ' : 'Até ') + brl(x.ate)) + '</td><td class="num">' + String(x.pct).replace('.', ',') + '%</td></tr>'; piso = x.ate;
    });
    return h + '</tbody></table></div>';
  }
  var CONF = { alta: ['Conferido na lei estadual', 'ok'], media: ['Conferido em fonte legal, sem segunda verificação', 'warn'], baixa: ['Ainda não conferido na lei', 'bad'] };

  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = D[sel.value], valor = num(f.valor.value), n = Math.max(1, parseInt(f.n.value, 10) || 1), tipo = f.querySelector('[name=tipo]:checked').value, h = '';
    if (!d) { out.innerHTML = '<div class="note warn"><p>Selecione o estado.</p></div>'; out.hidden = false; return; }
    var conf = CONF[d.conf];
    h += '<h2>' + d.nome + '</h2><p><span class="pill ' + conf[1] + '">' + conf[0] + '</span></p>';
    if (!d.modo) {
      h += '<div class="note warn"><p>Para este estado, a ferramenta ainda não faz o cálculo. Alíquotas indicativas: <strong>' + d.faixa_texto + '</strong>.</p><p>' + d.nota + '</p></div>';
    } else if (!(valor > 0)) {
      h += '<div class="note warn"><p>Informe o valor dos bens para ver a estimativa. Abaixo, a tabela do estado.</p></div>' + tabela(d[tipo]);
    } else {
      var k = d.por === 'quinhao' ? n : 1, base = valor / k, modos = d.modo === 'incerto' ? ['marginal', 'total'] : [d.modo];
      var vals = modos.map(function (m) { return calc(d[tipo], base, m) * k; }), lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
      h += '<p class="muted">Imposto estimado sobre ' + brl(valor) + (k > 1 ? ', dividido igualmente entre ' + k + ' pessoas (' + brl(base) + ' para cada)' : '') + '</p>';
      h += '<p class="big-number">' + (hi - lo < 0.01 ? brl(lo) : 'entre ' + brl(lo) + ' e ' + brl(hi)) + '</p>';
      h += '<p class="muted">Equivale a ' + (hi - lo < 0.01 ? (lo / valor * 100).toFixed(2).replace('.', ',') + '%' : (lo / valor * 100).toFixed(2).replace('.', ',') + '% a ' + (hi / valor * 100).toFixed(2).replace('.', ',') + '%') + ' do valor informado.</p>';
      h += '<p>' + d.nota + '</p>';
      h += '<p>' + (d.modo === 'marginal' ? 'Neste estado, cada alíquota incide só sobre a parte do valor que está dentro da faixa.' : d.modo === 'total' && d[tipo].length > 1 ? 'Neste estado, a alíquota da faixa incide sobre todo o valor.' : '') + (d.por === 'total' && n > 1 ? ' As faixas consideram o total transmitido, não a parte de cada herdeiro.' : '') + '</p>';
      h += '<h3>Tabela usada</h3>' + tabela(d[tipo]);
    }
    h += '<p class="muted">Base legal: ' + d.lei + '. Confirme o valor na Secretaria da Fazenda do estado antes de qualquer decisão.</p>';
    out.innerHTML = h; out.hidden = false;
  });
})();
