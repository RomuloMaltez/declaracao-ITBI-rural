'use client';

import { useState, useCallback, useMemo, useRef } from 'react';

// ─── Dados das categorias de aptidão ─────────────────────────
const CATEGORIAS_APTIDAO = [
  { id: 'a1', icon: '🌱', label: 'I — Lavoura — Aptidão Boa', desc: 'Terra apta à cultura temporária ou permanente, sem limitações significativas para a produção sustentável, com nível mínimo de restrições que não reduzem a produtividade ou os benefícios expressivamente e não aumentam os insumos acima de um nível aceitável.' },
  { id: 'a2', icon: '🌿', label: 'II — Lavoura — Aptidão Regular', desc: 'Terra apta à cultura temporária ou permanente, que apresenta limitações moderadas para a produção sustentável, que reduzem a produtividade ou os benefícios e elevam a necessidade de insumos para garantir as vantagens globais a serem obtidas com o uso.' },
  { id: 'a3', icon: '⚠️', label: 'III — Lavoura — Aptidão Restrita', desc: 'Terra apta à cultura temporária ou permanente, que apresenta limitações fortes para a produção sustentável, que reduzem a produtividade ou os benefícios ou aumentam os insumos necessários, de tal maneira que os custos só seriam justificados marginalmente.' },
  { id: 'a4', icon: '🐄', label: 'IV — Pastagem Plantada', desc: 'Terra inapta à exploração de lavouras temporárias ou permanentes por possuir limitações fortes à produção vegetal sustentável, mas apta a formas menos intensivas de uso, inclusive sob a forma de pastagens plantadas.' },
  { id: 'a5', icon: '🌳', label: 'V — Silvicultura ou Pastagem Natural', desc: 'Terra inapta aos usos indicados nos incisos I a IV, mas apta a usos menos intensivos.' },
  { id: 'a6', icon: '🌊', label: 'VI — Preservação da Fauna ou Flora', desc: 'Terra inapta para os usos indicados nos incisos I a V, em decorrência de restrições ambientais, físicas, sociais ou jurídicas que impossibilitam o uso sustentável, e que, por isso, é indicada para a preservação da flora e da fauna ou para outros usos não agrários.' },
];

const LABELS_PREVIEW = [
  'Lavoura — Aptidão Boa',
  'Lavoura — Aptidão Regular',
  'Lavoura — Aptidão Restrita',
  'Pastagem Plantada/Cultivada',
  'Silvicultura ou Pastagem Natural',
  'Preservação de Fauna ou Flora',
];

// ─── Helpers ─────────────────────────────────────────────────
function formatarCPF(v) {
  v = v.replace(/\D/g, '').slice(0, 11);
  if (v.length <= 3) return v;
  if (v.length <= 6) return v.slice(0, 3) + '.' + v.slice(3);
  if (v.length <= 9) return v.slice(0, 3) + '.' + v.slice(3, 6) + '.' + v.slice(6);
  return v.slice(0, 3) + '.' + v.slice(3, 6) + '.' + v.slice(6, 9) + '-' + v.slice(9);
}

function formatarData() {
  return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ─── Componente Principal ────────────────────────────────────
export default function DeclaracaoITBI() {
  const [passoAtual, setPassoAtual] = useState(1);
  const [erros, setErros] = useState({});
  const [aceite, setAceite] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [protocolo, setProtocolo] = useState('');

  // Form data
  const [form, setForm] = useState({
    nome: '', cpf: '', rg: '', estadoCivil: '', profissao: '', email: '', endereco: '',
    nomeConjuge: '', cpfConjuge: '', rgConjuge: '',
    matricula: '', cartorio: '', nomeImovel: '', locImovel: '', areaTotal: '', ccir: '', nirf: '', procItbi: '',
    a1: '', a2: '', a3: '', a4: '', a5: '', a6: '',
    obs: '',
  });

  const handleChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErros(prev => ({ ...prev, [field]: false }));
  }, []);

  const handleCPF = useCallback((field, value) => {
    handleChange(field, formatarCPF(value));
  }, [handleChange]);

  // ─── Cônjuge visível ───
  const mostrarConjuge = form.estadoCivil === 'Casado(a)' || form.estadoCivil === 'União estável';

  // ─── Totalizador ───
  const areaTotal = parseFloat(form.areaTotal) || 0;
  const somaAptidao = useMemo(() => {
    let soma = 0;
    for (let i = 1; i <= 6; i++) soma += parseFloat(form['a' + i]) || 0;
    return Math.round(soma * 10000) / 10000;
  }, [form.a1, form.a2, form.a3, form.a4, form.a5, form.a6]);

  const diff = Math.round((somaAptidao - areaTotal) * 10000) / 10000;
  const areaIgual = Math.abs(diff) < 0.0001;

  // ─── Validação ───
  const validarPasso = useCallback((n) => {
    let novosErros = {};
    let ok = true;

    if (n === 1) {
      ['nome', 'cpf', 'rg', 'estadoCivil', 'profissao', 'endereco'].forEach(c => {
        if (!form[c].trim()) { novosErros[c] = true; ok = false; }
      });
      if (mostrarConjuge) {
        ['nomeConjuge', 'cpfConjuge', 'rgConjuge'].forEach(c => {
          if (!form[c].trim()) { novosErros[c] = true; ok = false; }
        });
      }
    }
    if (n === 2) {
      ['matricula', 'cartorio', 'locImovel'].forEach(c => {
        if (!form[c].trim()) { novosErros[c] = true; ok = false; }
      });
      if (!form.areaTotal.trim() || parseFloat(form.areaTotal) <= 0) {
        novosErros.areaTotal = true; ok = false;
      }
    }
    if (n === 3) {
      if (somaAptidao === 0) { novosErros.aptidaoVazia = true; ok = false; }
      else if (!areaIgual) { novosErros.aptidaoDiff = true; ok = false; }
    }

    setErros(prev => ({ ...prev, ...novosErros }));
    return ok;
  }, [form, mostrarConjuge, somaAptidao, areaIgual]);

  // ─── Navegação ───
  const irPara = useCallback((n) => {
    if (n > passoAtual && !validarPasso(passoAtual)) return;
    setPassoAtual(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [passoAtual, validarPasso]);

  const progressWidth = ((passoAtual - 1) / 3) * 100;

  // ─── Geração de PDF Profissional ───
  const [gerandoPDF, setGerandoPDF] = useState(false);

  const gerarPDF = async (visualizar = false) => {
    setGerandoPDF(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;

      // Gerar número de protocolo (mantemos internamente para o sistema, se necessário)
      const prot = 'ITBI-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 99999 + 1)).padStart(5, '0');
      setProtocolo(prot);

      // Linhas da tabela de aptidão
      let linhasAptidao = '';
      let somaTotal = 0;
      LABELS_PREVIEW.forEach((label, i) => {
        const val = parseFloat(form['a' + (i + 1)]) || 0;
        somaTotal += val;
        if (val > 0) {
          linhasAptidao += `<tr><td style="padding:10px 14px;border:1px solid #d6d6ce;font-size:13px;">${label}</td><td style="padding:10px 14px;border:1px solid #d6d6ce;text-align:right;font-size:13px;font-weight:600;">${val.toFixed(4)} ha</td></tr>`;
        }
      });
      linhasAptidao += `<tr style="background:#e8f5ee;"><td style="padding:10px 14px;border:1px solid #d6d6ce;font-size:13px;font-weight:700;">TOTAL DECLARADO</td><td style="padding:10px 14px;border:1px solid #d6d6ce;text-align:right;font-size:13px;font-weight:700;">${somaTotal.toFixed(4)} ha</td></tr>`;

      // Linhas opcionais do imóvel
      const linhaDenominacao = form.nomeImovel ? `<tr><td style="padding:10px 14px;border:1px solid #d6d6ce;font-weight:600;color:#1a4731;font-size:13px;">Denominação</td><td style="padding:10px 14px;border:1px solid #d6d6ce;font-size:13px;">${form.nomeImovel}</td></tr>` : '';
      const linhaCCIR = form.ccir ? `<tr><td style="padding:10px 14px;border:1px solid #d6d6ce;font-weight:600;color:#1a4731;font-size:13px;">CCIR</td><td style="padding:10px 14px;border:1px solid #d6d6ce;font-size:13px;">${form.ccir}</td></tr>` : '';
      const linhaNIRF = form.nirf ? `<tr><td style="padding:10px 14px;border:1px solid #d6d6ce;font-weight:600;color:#1a4731;font-size:13px;">NIRF / CAFIR</td><td style="padding:10px 14px;border:1px solid #d6d6ce;font-size:13px;">${form.nirf}</td></tr>` : '';
      const linhaObs = form.obs ? `<div style="margin-top:20px;padding:14px 18px;background:#f5f5f3;border:1px solid #d6d6ce;border-left:4px solid #1a4731;border-radius:4px;font-size:13px;line-height:1.7;"><strong style="color:#1a4731;">Observações:</strong> ${form.obs}</div>` : '';

      const pdfHTML = `
        <div id="pdf-content" style="font-family:'Source Sans 3',Arial,Helvetica,sans-serif;color:#1c1c1c;padding:0;line-height:1.6;">
          <!-- CABEÇALHO OFICIAL -->
          <div style="background:linear-gradient(135deg,#1a4731 0%,#2d6a4f 100%);color:white;padding:28px 36px;border-radius:6px 6px 0 0;text-align:center;position:relative;">
            <div style="font-size:40px;margin-bottom:6px;">🌿</div>
            <div style="font-size:10px;letter-spacing:2.5px;text-transform:uppercase;opacity:0.8;margin-bottom:6px;">Prefeitura Municipal de Porto Velho · Secretaria Municipal de Economia</div>
            <div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.65;">Secretaria Executiva da Receita Municipal — SERM</div>
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:700;margin:10px 0 4px;letter-spacing:0.5px;">DECLARAÇÃO DE APTIDÃO AGRÍCOLA</div>
            <div style="font-size:12px;opacity:0.7;">ITBI — Imóvel Rural | Porto Velho / RO</div>
          </div>

          <!-- BARRA DOURADA -->
          <div style="height:4px;background:linear-gradient(90deg,#c9973a,#e0b864,#c9973a);"></div>

          <!-- CORPO DO DOCUMENTO -->
          <div style="padding:30px 36px;">

            <!-- DECLARAÇÃO -->
            <p style="font-size:14px;line-height:1.8;text-align:justify;margin-bottom:20px;">
              <strong style="color:#1a4731;">${form.nome}</strong>, ${form.profissao}, ${form.estadoCivil.toLowerCase()}, inscrito(a) no RG sob o nº <strong>${form.rg}</strong> e CPF sob o nº <strong>${form.cpf}</strong>${conjugeTexto}, residente e domiciliado(a) à <strong>${form.endereco}</strong>, Município de Porto Velho/RO, na qualidade de proprietário(a) do imóvel rural apresentado para emissão de ITBI,
            </p>

            <p style="font-size:14px;line-height:1.8;text-align:justify;margin-bottom:24px;">
              <strong style="color:#1a4731;font-size:15px;">DECLARA</strong>, sob as penas da lei, a aptidão agrícola do imóvel de sua titularidade, caracterizado nos termos seguintes:
            </p>

            <!-- TABELA — DADOS DO IMÓVEL -->
            <div style="margin-bottom:24px;">
              <div style="background:#1a4731;color:white;padding:10px 16px;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;border-radius:4px 4px 0 0;">Dados Cadastrais do Imóvel</div>
              <table style="width:100%;border-collapse:collapse;">
                <tbody>
                  <tr><td style="padding:10px 14px;border:1px solid #d6d6ce;font-weight:600;color:#1a4731;font-size:13px;width:40%;">Matrícula</td><td style="padding:10px 14px;border:1px solid #d6d6ce;font-size:13px;">${form.matricula} — ${form.cartorio}</td></tr>
                  ${linhaDenominacao}
                  <tr><td style="padding:10px 14px;border:1px solid #d6d6ce;font-weight:600;color:#1a4731;font-size:13px;">Localização</td><td style="padding:10px 14px;border:1px solid #d6d6ce;font-size:13px;">${form.locImovel}</td></tr>
                  <tr style="background:#e8f5ee;"><td style="padding:10px 14px;border:1px solid #d6d6ce;font-weight:600;color:#1a4731;font-size:13px;">Área Total Registrada</td><td style="padding:10px 14px;border:1px solid #d6d6ce;font-size:14px;font-weight:700;color:#1a4731;">${areaTotal.toFixed(4)} ha</td></tr>
                  ${linhaCCIR}
                  ${linhaNIRF}
                </tbody>
              </table>
            </div>

            <!-- TABELA — APTIDÃO AGRÍCOLA -->
            <div style="margin-bottom:24px;">
              <div style="background:#1a4731;color:white;padding:10px 16px;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;border-radius:4px 4px 0 0;">Aptidão Agrícola Declarada — Uso e Cobertura do Solo</div>
              <table style="width:100%;border-collapse:collapse;">
                <thead>
                  <tr style="background:#f5f5f3;"><th style="padding:10px 14px;border:1px solid #d6d6ce;text-align:left;font-size:12px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;color:#4a4a4a;">Descrição da Aptidão</th><th style="padding:10px 14px;border:1px solid #d6d6ce;text-align:right;font-size:12px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;color:#4a4a4a;">Área (ha)</th></tr>
                </thead>
                <tbody>
                  ${linhasAptidao}
                </tbody>
              </table>
            </div>

            ${linhaObs}

            <!-- DECLARAÇÃO LEGAL -->
            <div style="margin-top:28px;padding:16px 20px;background:#f9efd7;border-left:4px solid #c9973a;border-radius:4px;font-size:13px;line-height:1.6;color:#4a4a4a;">
              <strong style="color:#1c1c1c;">Declaro, sob as penas da lei</strong>, que as informações prestadas neste formulário são verdadeiras e que a aptidão agrícola descrita corresponde à real condição do imóvel. Estou ciente de que a prestação de informações falsas configura infração punível na forma da lei.
            </div>

            <!-- ASSINATURAS -->
            <div style="margin-top:50px;display:flex;justify-content:space-between;gap:60px;">
              <div style="flex:1;text-align:center;">
                <div style="border-top:1.5px solid #4a4a4a;padding-top:10px;margin-top:60px;">
                  <strong style="font-size:14px;color:#1a4731;">${form.nome}</strong><br/>
                  <span style="font-size:12px;color:#4a4a4a;">CPF: ${form.cpf}</span><br/>
                  <span style="font-size:11px;color:#4a4a4a;letter-spacing:0.5px;text-transform:uppercase;">Declarante</span>
                </div>
              </div>
              <div style="flex:1;text-align:center;">
                <div style="border-top:1.5px solid #4a4a4a;padding-top:10px;margin-top:60px;">
                  <strong style="font-size:14px;color:#1a4731;">Porto Velho/RO, ${hoje}</strong><br/>
                  <span style="font-size:11px;color:#4a4a4a;letter-spacing:0.5px;text-transform:uppercase;">Local e Data</span>
                </div>
              </div>
            </div>

            <!-- RODAPÉ LEGAL -->
            <div style="margin-top:36px;padding-top:14px;border-top:1px solid #d6d6ce;font-size:11px;color:#4a4a4a;line-height:1.6;">
              <strong>Responsabilidade civil e penal:</strong> O declarante assume inteira responsabilidade pelas informações prestadas neste documento, submetendo-se às sanções previstas no art. 299 do Código Penal Brasileiro (falsidade ideológica), bem como às penalidades administrativas estipuladas na Lei Complementar Municipal nº 878/2021 (Código Tributário Municipal de Porto Velho).
            </div>

            <!-- INFORMAÇÕES DO DOCUMENTO -->
            <div style="margin-top:16px;padding:10px 14px;background:#f5f5f3;border:1px solid #d6d6ce;border-radius:4px;font-size:11px;color:#4a4a4a;text-align:center;">
              📅 Emissão: ${hoje} &nbsp;|&nbsp; 🌐 Portal SEMEC / Porto Velho-RO
            </div>
          </div>
        </div>
      `;

      const container = document.createElement('div');
      container.innerHTML = pdfHTML;
      document.body.appendChild(container);

      const nomeArquivo = `Declaracao_Aptidao_Agricola_${form.nome.replace(/\s+/g, '_').substring(0, 30)}_${new Date().toISOString().slice(0, 10)}.pdf`;

      const opt = {
        margin: [10, 10, 10, 10],
        filename: nomeArquivo,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      if (visualizar) {
        const pdf = html2pdf().set(opt).from(container.firstElementChild);
        const pdfBlobUrl = await pdf.outputPdf('bloburl');
        window.open(pdfBlobUrl, '_blank');
      } else {
        await html2pdf().set(opt).from(container.firstElementChild).save();
        setSucesso(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      document.body.removeChild(container);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      setGerandoPDF(false);
    }
  };


  // ─── Preview Data ───
  const hoje = formatarData();

  const conjugeTexto = mostrarConjuge
    ? `, e seu cônjuge ${form.nomeConjuge || '___'}, CPF ${form.cpfConjuge || '___'}, RG ${form.rgConjuge || '___'}`
    : '';

  // ─── Tab classes ───
  const tabClass = (n) => {
    if (sucesso) return 'step-tab done';
    if (n === passoAtual) return 'step-tab active';
    if (n < passoAtual) return 'step-tab done';
    return 'step-tab';
  };

  return (
    <>
      {/* ═══ CABEÇALHO ═══ */}
      <header>
        <div className="header-inner">
          <div className="brasao-placeholder">🌿</div>
          <div className="header-texto">
            <div className="header-orgao">Prefeitura Municipal de Porto Velho · Secretaria Municipal de Economia</div>
            <div className="header-titulo">Declaração de Aptidão Agrícola</div>
            <div className="header-subtitulo">ITBI — Imóvel Rural · Secretaria Executiva da Receita Municipal</div>
          </div>
          <div className="header-badge">ITBI Rural</div>
        </div>

        {/* PROGRESSO */}
        <div className="progress-bar-wrap">
          <div className="progress-bar" style={{ width: sucesso ? '100%' : `${progressWidth}%` }} />
        </div>

        {/* PASSOS */}
        <div className="steps-nav">
          <div className="steps-inner">
            <div className={tabClass(1)}><span className="step-num">1</span>Declarante</div>
            <div className={tabClass(2)}><span className="step-num">2</span>Imóvel</div>
            <div className={tabClass(3)}><span className="step-num">3</span>Aptidão</div>
            <div className={tabClass(4)}><span className="step-num">4</span>Revisão</div>
          </div>
        </div>
      </header>

      <main>
        {/* ═══════════════════════════════════════════════════ */}
        {/* STEP 1 — DADOS DO DECLARANTE                       */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className={`step-content ${passoAtual === 1 ? 'active' : ''}`}>
          <div className="aviso-legal">
            <strong>Atenção:</strong> Esta declaração será utilizada para fins de apuração do ITBI sobre imóvel rural. O declarante é responsável pelas informações prestadas, sujeitando-se às sanções previstas no art. 299 do Código Penal e nas disposições da Lei Complementar Municipal nº 878/2021.
          </div>

          <div className="section-card">
            <div className="section-header"><span className="icon">👤</span> Dados do Declarante (Transmitente / Proprietário)</div>
            <div className="section-body">
              <div className="form-grid cols-2">
                <div className="field-group full">
                  <label>Nome completo <span className="req">*</span></label>
                  <input type="text" value={form.nome} onChange={e => handleChange('nome', e.target.value)} placeholder="Nome completo do proprietário" className={erros.nome ? 'invalid' : ''} />
                  <span className={`field-error ${erros.nome ? 'show' : ''}`}>Informe o nome completo.</span>
                </div>
                <div className="field-group">
                  <label>CPF <span className="req">*</span></label>
                  <input type="text" value={form.cpf} onChange={e => handleCPF('cpf', e.target.value)} placeholder="000.000.000-00" maxLength={14} className={erros.cpf ? 'invalid' : ''} />
                  <span className={`field-error ${erros.cpf ? 'show' : ''}`}>CPF inválido.</span>
                </div>
                <div className="field-group">
                  <label>RG <span className="req">*</span></label>
                  <input type="text" value={form.rg} onChange={e => handleChange('rg', e.target.value)} placeholder="Número e órgão emissor" className={erros.rg ? 'invalid' : ''} />
                  <span className={`field-error ${erros.rg ? 'show' : ''}`}>Informe o RG.</span>
                </div>
                <div className="field-group">
                  <label>Estado civil <span className="req">*</span></label>
                  <select value={form.estadoCivil} onChange={e => handleChange('estadoCivil', e.target.value)} className={erros.estadoCivil ? 'invalid' : ''}>
                    <option value="">Selecione...</option>
                    <option>Solteiro(a)</option>
                    <option>Casado(a)</option>
                    <option>Divorciado(a)</option>
                    <option>Viúvo(a)</option>
                    <option>União estável</option>
                  </select>
                  <span className={`field-error ${erros.estadoCivil ? 'show' : ''}`}>Selecione o estado civil.</span>
                </div>
                <div className="field-group">
                  <label>Profissão / Atividade <span className="req">*</span></label>
                  <input type="text" value={form.profissao} onChange={e => handleChange('profissao', e.target.value)} placeholder="Ex.: agricultor, empresário..." className={erros.profissao ? 'invalid' : ''} />
                  <span className={`field-error ${erros.profissao ? 'show' : ''}`}>Informe a profissão.</span>
                </div>
                <div className="field-group">
                  <label>E-mail <span className="opcional">(opcional)</span></label>
                  <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="contato@exemplo.com" />
                </div>
                <div className="field-group full">
                  <label>Endereço residencial <span className="req">*</span></label>
                  <input type="text" value={form.endereco} onChange={e => handleChange('endereco', e.target.value)} placeholder="Logradouro, número, bairro, CEP" className={erros.endereco ? 'invalid' : ''} />
                  <span className={`field-error ${erros.endereco ? 'show' : ''}`}>Informe o endereço.</span>
                </div>
              </div>

              {/* CÔNJUGE */}
              {mostrarConjuge && (
                <div className="secao-conjuge">
                  <div className="secao-conjuge-titulo">📎 Dados do Cônjuge / Companheiro(a)</div>
                  <div className="form-grid cols-2">
                    <div className="field-group full">
                      <label>Nome do cônjuge <span className="req">*</span></label>
                      <input type="text" value={form.nomeConjuge} onChange={e => handleChange('nomeConjuge', e.target.value)} placeholder="Nome completo do cônjuge" style={erros.nomeConjuge ? { borderColor: 'var(--erro)' } : {}} />
                    </div>
                    <div className="field-group">
                      <label>CPF do cônjuge <span className="req">*</span></label>
                      <input type="text" value={form.cpfConjuge} onChange={e => handleCPF('cpfConjuge', e.target.value)} placeholder="000.000.000-00" maxLength={14} style={erros.cpfConjuge ? { borderColor: 'var(--erro)' } : {}} />
                    </div>
                    <div className="field-group">
                      <label>RG do cônjuge <span className="req">*</span></label>
                      <input type="text" value={form.rgConjuge} onChange={e => handleChange('rgConjuge', e.target.value)} placeholder="Número e órgão emissor" style={erros.rgConjuge ? { borderColor: 'var(--erro)' } : {}} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="nav-buttons">
            <div style={{ fontSize: '13px', color: 'var(--cinza-meio)' }}>Etapa 1 de 4</div>
            <button className="btn btn-primary" onClick={() => irPara(2)}>Próximo →</button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* STEP 2 — DADOS DO IMÓVEL                           */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className={`step-content ${passoAtual === 2 ? 'active' : ''}`}>
          <div className="section-card">
            <div className="section-header"><span className="icon">📋</span> Identificação do Imóvel Rural</div>
            <div className="section-body">
              <div className="form-grid cols-2">
                <div className="field-group">
                  <label>
                    Matrícula nº <span className="req">*</span>
                    <span className="tooltip-wrap"><span className="tooltip-icon">?</span><span className="tooltip-text">Número da matrícula no Cartório de Registro de Imóveis.</span></span>
                  </label>
                  <input type="text" value={form.matricula} onChange={e => handleChange('matricula', e.target.value)} placeholder="Ex.: 45.678" className={erros.matricula ? 'invalid' : ''} />
                  <span className={`field-error ${erros.matricula ? 'show' : ''}`}>Informe o número da matrícula.</span>
                </div>
                <div className="field-group">
                  <label>Cartório (Ofício de RI) <span className="req">*</span></label>
                  <select value={form.cartorio} onChange={e => handleChange('cartorio', e.target.value)} className={erros.cartorio ? 'invalid' : ''}>
                    <option value="">Selecione...</option>
                    <option>1º Ofício de Registro de Imóveis</option>
                    <option>2º Ofício de Registro de Imóveis</option>
                    <option>3º Ofício de Registro de Imóveis</option>
                  </select>
                  <span className={`field-error ${erros.cartorio ? 'show' : ''}`}>Selecione o cartório.</span>
                </div>
                <div className="field-group full">
                  <label>Denominação / Nome da propriedade <span className="opcional">(opcional)</span></label>
                  <input type="text" value={form.nomeImovel} onChange={e => handleChange('nomeImovel', e.target.value)} placeholder="Ex.: Fazenda Bela Vista, Sítio Esperança..." />
                </div>
                <div className="field-group full">
                  <label>Localização / Endereço rural <span className="req">*</span></label>
                  <input type="text" value={form.locImovel} onChange={e => handleChange('locImovel', e.target.value)} placeholder="Rodovia, linha, zona, comunidade — Município/UF" className={erros.locImovel ? 'invalid' : ''} />
                  <span className={`field-error ${erros.locImovel ? 'show' : ''}`}>Informe a localização do imóvel.</span>
                </div>
                <div className="field-group">
                  <label>
                    Área total registrada (ha) <span className="req">*</span>
                    <span className="tooltip-wrap"><span className="tooltip-icon">?</span><span className="tooltip-text">Use o ponto como separador decimal. Ex.: 125.5000</span></span>
                  </label>
                  <input type="number" value={form.areaTotal} onChange={e => handleChange('areaTotal', e.target.value)} placeholder="0.0000" step="0.0001" min="0.0001" className={erros.areaTotal ? 'invalid' : ''} />
                  <span className={`field-error ${erros.areaTotal ? 'show' : ''}`}>Informe a área total válida.</span>
                </div>
                <div className="field-group">
                  <label>Número do CCIR <span className="opcional">(opcional)</span></label>
                  <input type="text" value={form.ccir} onChange={e => handleChange('ccir', e.target.value)} placeholder="Certificado de Cadastro de Imóvel Rural" />
                </div>
                <div className="field-group">
                  <label>Número do NIRF / CAFIR <span className="opcional">(opcional)</span></label>
                  <input type="text" value={form.nirf} onChange={e => handleChange('nirf', e.target.value)} placeholder="Cadastro na Receita Federal" />
                </div>
                <div className="field-group">
                  <label>Processo ITBI nº <span className="opcional">(opcional)</span></label>
                  <input type="text" value={form.procItbi} onChange={e => handleChange('procItbi', e.target.value)} placeholder="Número do processo administrativo" />
                </div>
              </div>
            </div>
          </div>

          <div className="nav-buttons">
            <button className="btn btn-secondary" onClick={() => irPara(1)}>← Anterior</button>
            <button className="btn btn-primary" onClick={() => irPara(3)}>Próximo →</button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* STEP 3 — APTIDÃO AGRÍCOLA                          */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className={`step-content ${passoAtual === 3 ? 'active' : ''}`}>
          <div className="section-card">
            <div className="section-header"><span className="icon">🌾</span> Declaração de Aptidão Agrícola — Uso e Cobertura do Solo</div>
            <div className="section-body">
              <div className="aviso-legal" style={{ marginBottom: '20px' }}>
                Informe a área, em hectares (ha), correspondente a cada categoria de uso do solo. A <strong>soma das áreas por aptidão deve ser exatamente igual à área total registrada</strong> do imóvel. Campos não utilizados deixe em branco ou com zero.
              </div>

              <table className="aptidao-table">
                <thead>
                  <tr>
                    <th>Categoria de Aptidão</th>
                    <th style={{ textAlign: 'right' }}>Área utilizada (ha)</th>
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIAS_APTIDAO.map((cat) => (
                    <tr key={cat.id}>
                      <td>
                        <div className="cat-label">{cat.icon} {cat.label}</div>
                        <div className="cat-desc">{cat.desc}</div>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="area-input"
                          value={form[cat.id]}
                          onChange={e => handleChange(cat.id, e.target.value)}
                          placeholder="0.0000"
                          step="0.0001"
                          min="0"
                        />
                        <span className="area-unit">ha</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* TOTALIZADOR */}
              <div className="totalizador">
                <div className="total-item">
                  <div className="total-label">Soma Declarada</div>
                  <div className="total-valor">{somaAptidao.toFixed(4)} ha</div>
                </div>
                <div className="total-item">
                  <div className="total-label">Área Total do Imóvel</div>
                  <div className="total-valor">{areaTotal > 0 ? `${areaTotal.toFixed(4)} ha` : '— ha'}</div>
                </div>
                <div className="total-item">
                  <div className="total-label">Diferença</div>
                  <div className={`total-valor ${areaTotal > 0 && !areaIgual ? 'erro-valor' : ''}`} style={areaTotal > 0 && areaIgual ? { color: 'var(--sucesso)' } : {}}>
                    {areaTotal > 0 ? `${diff >= 0 ? '+' : ''}${diff.toFixed(4)} ha` : '— ha'}
                  </div>
                  <div className="total-saldo">
                    {areaTotal > 0 ? `${(somaAptidao / areaTotal * 100).toFixed(1)}% declarado` : ''}
                  </div>
                </div>
              </div>

              {/* ALERTAS */}
              {areaTotal > 0 && somaAptidao === 0 && (
                <div className="alerta-area show" style={{ borderColor: '#e67e22', background: '#fdf6ec', color: '#a04000' }}>
                  ℹ️ Nenhuma área foi informada. Preencha ao menos uma categoria de aptidão.
                </div>
              )}
              {areaTotal > 0 && diff > 0.0001 && (
                <div className="alerta-area show">
                  ⚠️ A soma das áreas declaradas ({somaAptidao.toFixed(4)} ha) <strong>excede</strong> a área total do imóvel ({areaTotal.toFixed(4)} ha). A declaração deve cobrir exatamente a área registrada.
                </div>
              )}
              {areaTotal > 0 && somaAptidao > 0 && diff < -0.0001 && (
                <div className="alerta-area show" style={{ borderColor: '#e67e22', background: '#fdf6ec', color: '#a04000' }}>
                  ℹ️ A soma das áreas ({somaAptidao.toFixed(4)} ha) é <strong>inferior</strong> à área total do imóvel ({areaTotal.toFixed(4)} ha). Toda a área deve ser declarada por aptidão antes de prosseguir.
                </div>
              )}
              {areaTotal > 0 && areaIgual && somaAptidao > 0 && (
                <div style={{ display: 'block', background: '#e8f5ee', border: '1.5px solid var(--sucesso)', borderRadius: '4px', padding: '10px 16px', fontSize: '13px', color: '#1a5c38', marginTop: '10px' }}>
                  ✅ Área totalmente declarada. A soma corresponde exatamente à área total do imóvel.
                </div>
              )}

              {/* OBSERVAÇÕES */}
              <div style={{ marginTop: '22px' }}>
                <div className="field-group">
                  <label>Observações adicionais <span className="opcional">(opcional)</span></label>
                  <textarea value={form.obs} onChange={e => handleChange('obs', e.target.value)} rows={3} placeholder="Descreva particularidades da terra, restrições ambientais, benfeitorias relevantes, etc." style={{ resize: 'vertical' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="nav-buttons">
            <button className="btn btn-secondary" onClick={() => irPara(2)}>← Anterior</button>
            <button className="btn btn-primary" onClick={() => irPara(4)}>Revisar e Assinar →</button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* STEP 4 — REVISÃO E ASSINATURA                      */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className={`step-content ${passoAtual === 4 ? 'active' : ''}`}>

          {/* Sucesso */}
          {sucesso && (
            <div className="sucesso-banner show">
              <div className="sucesso-icon">✅</div>
              <div className="sucesso-titulo">Declaração Gerada com Sucesso!</div>
              <div className="sucesso-desc">Sua declaração de aptidão agrícola foi concluída e o download foi iniciado.</div>
            </div>
          )}

          {/* Preview da declaração */}
          {passoAtual === 4 && (
            <div className="preview-section show">
              <div className="preview-header">
                <div className="preview-brasao">🌿</div>
                <div className="preview-orgao">Prefeitura Municipal de Porto Velho · Secretaria Municipal de Economia · SERM</div>
                <div className="preview-titulo">DECLARAÇÃO DE APTIDÃO AGRÍCOLA</div>
                <div className="preview-subtitulo">ITBI — Imóvel Rural | Porto Velho / RO</div>
              </div>
              <div className="preview-body">
                <p>
                  <strong>{form.nome}</strong>, {form.profissao}, {form.estadoCivil.toLowerCase()}, inscrito no RG sob o nº <strong>{form.rg}</strong> e CPF sob o nº <strong>{form.cpf}</strong>{conjugeTexto}, residente e domiciliado à <strong>{form.endereco}</strong>, Município de Porto Velho/RO, na qualidade de proprietário do imóvel rural apresentado para emissão de ITBI,
                </p>
                <p style={{ marginTop: '14px' }}>
                  <strong>DECLARA</strong>, sob as penas da lei, a aptidão agrícola do imóvel de sua titularidade, caracterizado nos termos seguintes:
                </p>

                <table className="preview-table" style={{ margin: '20px 0' }}>
                  <thead><tr><th>Dados Cadastrais do Imóvel</th><th>Informação</th></tr></thead>
                  <tbody>
                    <tr><td>Matrícula</td><td>{form.matricula} — {form.cartorio}</td></tr>
                    {form.nomeImovel && <tr><td>Denominação</td><td>{form.nomeImovel}</td></tr>}
                    <tr><td>Localização</td><td>{form.locImovel}</td></tr>
                    <tr><td>Área Total Registrada</td><td><strong>{areaTotal.toFixed(4)} ha</strong></td></tr>
                    {form.ccir && <tr><td>CCIR</td><td>{form.ccir}</td></tr>}
                    {form.nirf && <tr><td>NIRF/CAFIR</td><td>{form.nirf}</td></tr>}
                  </tbody>
                </table>

                <p><strong>Aptidão Agrícola Declarada (uso e cobertura do solo):</strong></p>
                <table className="preview-table">
                  <thead><tr><th>Descrição da Aptidão</th><th style={{ textAlign: 'right' }}>Área utilizada (ha)</th></tr></thead>
                  <tbody>
                    {LABELS_PREVIEW.map((label, i) => {
                      const val = parseFloat(form['a' + (i + 1)]) || 0;
                      if (val <= 0) return null;
                      return <tr key={i}><td>{label}</td><td style={{ textAlign: 'right' }}>{val.toFixed(4)}</td></tr>;
                    })}
                    <tr style={{ fontWeight: 700, background: '#e8f5ee' }}>
                      <td>TOTAL DECLARADO</td>
                      <td style={{ textAlign: 'right' }}>{somaAptidao.toFixed(4)}</td>
                    </tr>
                  </tbody>
                </table>

                {form.obs && <p><strong>Observações:</strong> {form.obs}</p>}

                <div className="preview-footer">
                  <div className="assinatura-box">
                    <div style={{ height: '50px' }} />
                    <strong>{form.nome}</strong><br />CPF {form.cpf}<br />Declarante
                  </div>
                  <div className="assinatura-box">
                    <div style={{ height: '50px' }} />
                    Porto Velho/RO, {hoje}<br />Local e Data
                  </div>
                </div>
              </div>
              <div className="preview-penas">
                <strong>Responsabilidade civil e penal:</strong> O declarante assume inteira responsabilidade pelas informações prestadas neste documento, submetendo-se às sanções previstas no art. 299 do Código Penal Brasileiro (falsidade ideológica), bem como às penalidades administrativas estipuladas na Lei Complementar Municipal nº 878/2021 (Código Tributário Municipal de Porto Velho).
              </div>
            </div>
          )}

          {/* Card de revisão */}
          {!sucesso && (
            <div className="section-card">
              <div className="section-header"><span className="icon">📄</span> Revisão e Assinatura da Declaração</div>
              <div className="section-body">
                <div className="declaracao-texto">
                  <strong>{form.nome}</strong>, {form.profissao}, {form.estadoCivil.toLowerCase()}, CPF {form.cpf}, RG {form.rg}{conjugeTexto}, residente à {form.endereco}, Porto Velho/RO — responsável pelo imóvel rural objeto da Matrícula nº <strong>{form.matricula}</strong>, {form.cartorio}, medindo <strong>{areaTotal.toFixed(4)} ha</strong>, localizado em {form.locImovel}, <strong>declara, sob as penas da lei</strong>, a aptidão agrícola do imóvel conforme tabela preenchida.
                </div>

                <label className="checkbox-wrap" htmlFor="aceite">
                  <input type="checkbox" id="aceite" checked={aceite} onChange={e => setAceite(e.target.checked)} />
                  <span className="checkbox-label">
                    <strong>Declaro, sob as penas da lei</strong>, que as informações prestadas neste formulário são verdadeiras e que a aptidão agrícola descrita corresponde à real condição do imóvel. Estou ciente de que a prestação de informações falsas configura infração punível na forma da lei.
                  </span>
                </label>

                <div className="info-data">
                  📅 Data da declaração: <strong>{hoje}</strong> &nbsp;|&nbsp; 🌐 Origem: Portal SEMEC / Porto Velho-RO
                </div>
              </div>
            </div>
          )}

          {!sucesso && (
            <div className="nav-buttons">
              <button className="btn btn-secondary" onClick={() => irPara(3)}>← Anterior</button>
              <button className="btn btn-preview" onClick={() => gerarPDF(true)} disabled={!aceite || gerandoPDF}>
                {gerandoPDF ? '⏳ Processando...' : '👁 Visualizar PDF'}
              </button>
              <button className="btn btn-print" onClick={() => gerarPDF(false)} disabled={!aceite || gerandoPDF}>
                {gerandoPDF ? '⏳ Gerando...' : '🖨 Gerar PDF'}
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
