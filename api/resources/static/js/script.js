const API_URL = 'http://localhost:8080';
let entidadeAtual = 'alunos';
let modoAtual = 'crud';

// ==========================================
// 1. CONFIGURAÇÕES DAS TELAS
// ==========================================
const configuracao = {
    alunos: {
        titulo: 'Gestão de Alunos', endpoint: '/alunos',
        colunasTabela: ['ID', 'Nome', 'CPF', 'E-mail', 'Ações'], atributos: ['id', 'nome', 'cpf', 'email'],
        camposForm: [{ id: 'nome', label: 'Nome Completo', type: 'text' }, { id: 'cpf', label: 'CPF', type: 'text' }, { id: 'email', label: 'E-mail', type: 'email' }]
    },
    professores: {
        titulo: 'Gestão de Professores', endpoint: '/professores',
        colunasTabela: ['ID', 'Nome', 'E-mail', 'Formação', 'Ações'], atributos: ['id', 'nome', 'email', 'formacaoAcademica'],
        camposForm: [{ id: 'nome', label: 'Nome Completo', type: 'text' }, { id: 'cpf', label: 'CPF', type: 'text' }, { id: 'email', label: 'E-mail', type: 'email' }, { id: 'formacaoAcademica', label: 'Formação', type: 'text' }]
    },
    disciplinas: {
        titulo: 'Gestão de Disciplinas', endpoint: '/disciplinas',
        colunasTabela: ['ID', 'Disciplina', 'Carga Horária', 'Professor', 'Ações'], atributos: ['id', 'nome', 'cargaHoraria', 'professor.nome'],
        camposForm: [{ id: 'nome', label: 'Disciplina', type: 'text' }, { id: 'cargaHoraria', label: 'Carga Horária', type: 'number' }, { id: 'professorId', label: 'Professor Responsável', type: 'select', endpointBusca: '/professores', chaveNinhada: 'professor' }]
    },
    matriculas: {
        titulo: 'Gestão de Matrículas', endpoint: '/matriculas',
        colunasTabela: ['ID', 'Aluno', 'Disciplina', 'Nota 1', 'Nota 2', 'Status', 'Ações'], atributos: ['id', 'aluno.nome', 'disciplina.nome', 'nota1', 'nota2', 'status'],
        camposForm: [{ id: 'alunoId', label: 'Selecione o Aluno', type: 'select', endpointBusca: '/alunos', chaveNinhada: 'aluno' }, { id: 'disciplinaId', label: 'Selecione a Disciplina', type: 'select', endpointBusca: '/disciplinas', chaveNinhada: 'disciplina' }]
    },
    boletins: {
        titulo: 'Boletim Escolar Geral (Visão do Banco)', endpoint: '/boletins',
        colunasTabela: ['RA Aluno', 'Nome do Aluno', 'Disciplina', 'Nota 1', 'Nota 2', 'Média Final', 'Situação'],
        atributos: ['aluno_id', 'nome_aluno', 'nome_disciplina', 'nota1', 'nota2', 'media_final', 'status'],
        readonly: true, camposForm: []
    }
};

const dicionarioTabelas = {
    aluno: ['id', 'nome', 'cpf', 'email'],
    professor: ['id', 'nome', 'cpf', 'email', 'formacao_academica'],
    disciplina: ['id', 'nome', 'carga_horaria', 'professor_id'],
    matricula_aluno: ['id', 'aluno_id', 'disciplina_id', 'nota1', 'nota2', 'status'],
    vw_boletim_aluno: ['aluno_id', 'nome_aluno', 'nome_disciplina', 'nota1', 'nota2', 'media_final', 'status']
};

// ==========================================
// 2. NAVEGAÇÃO E CRUD
// ==========================================
function resetarBotoesMenu() {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.className = 'menu-btn w-full flex items-center space-x-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors text-slate-300');
}

function mudarEntidade(novaEntidade) {
    modoAtual = 'crud';
    entidadeAtual = novaEntidade;
    const config = configuracao[entidadeAtual];

    document.getElementById('tituloPagina').innerText = config.titulo;
    document.getElementById('telaCrud').classList.replace('hidden', 'block');
    document.getElementById('telaRelatorio').classList.replace('block', 'hidden');

    if (config.readonly) {
        document.getElementById('headerAcoesCrud').classList.replace('block', 'hidden');
    } else {
        document.getElementById('headerAcoesCrud').classList.replace('hidden', 'block');
    }
    document.getElementById('headerAcoesRelatorio').classList.replace('block', 'hidden');

    resetarBotoesMenu();
    document.getElementById('menu-' + entidadeAtual).classList.add('bg-blue-600', 'text-white');
    document.getElementById('menu-' + entidadeAtual).classList.remove('hover:bg-slate-800', 'text-slate-300');

    carregarTabela();
}

function extrairValor(objeto, caminho) { return caminho.split('.').reduce((acc, parte) => acc && acc[parte] !== undefined ? acc[parte] : '-', objeto); }

async function carregarTabela() {
    const config = configuracao[entidadeAtual];
    const tHead = document.getElementById('tabelaHead');
    const tBody = document.getElementById('tabelaBody');
    tHead.innerHTML = `<tr>${config.colunasTabela.map(c => `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${c}</th>`).join('')}</tr>`;
    tBody.innerHTML = `<tr><td colspan="100%" class="text-center py-8 text-blue-500"><i class="fa-solid fa-spinner fa-spin"></i> Carregando...</td></tr>`;

    try {
        const response = await fetch(API_URL + config.endpoint);
        const dados = await response.json();
        if (dados.length === 0) { tBody.innerHTML = `<tr><td colspan="100%" class="text-center py-8 text-gray-500">Vazio.</td></tr>`; return; }

        tBody.innerHTML = dados.map(item => `
            <tr class="hover:bg-gray-50 transition">
                ${config.atributos.map(attr => {
                    let valor = extrairValor(item, attr);
                    return `<td class="px-6 py-4 text-sm text-gray-700">${valor !== null ? valor : '-'}</td>`;
                }).join('')}

                ${!config.readonly ? `
                <td class="px-6 py-4 text-sm font-medium flex gap-2">
                    ${entidadeAtual === 'matriculas' ? `<button onclick="lancarNotas(${item.id})" class="text-blue-500 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded border border-blue-100" title="Lançar Notas"><i class="fa-solid fa-pen-to-square"></i></button>` : ''}
                    <button onclick="deletarRegistro(${item.id})" class="text-red-500 hover:text-red-700 bg-red-50 px-3 py-1 rounded border border-red-100" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                </td>` : ''}
            </tr>
        `).join('');
    } catch (e) { tBody.innerHTML = `<tr><td colspan="100%" class="text-center text-red-500 py-8">Erro na conexão</td></tr>`; }
}

async function deletarRegistro(id) { if(confirm('Excluir este registro?')){ await fetch(`${API_URL}${configuracao[entidadeAtual].endpoint}/${id}`, { method: 'DELETE' }); carregarTabela(); } }

// ==========================================
// 3. CONSTRUTOR DE FORMULÁRIOS
// ==========================================
async function abrirModal() {
    const config = configuracao[entidadeAtual];
    document.getElementById('modalTitulo').innerText = `Cadastrar Novo`;

    let htmlCampos = '';
    for (const campo of config.camposForm) {
        if (campo.type === 'select') {
            htmlCampos += `<div><label class="block text-sm font-semibold text-gray-700 mb-1">${campo.label}</label><select id="${campo.id}" required class="w-full bg-gray-50 border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 outline-none"><option value="">Carregando opções...</option></select></div>`;
            fetch(API_URL + campo.endpointBusca).then(res => res.json()).then(dados => {
                document.getElementById(campo.id).innerHTML = '<option value="">-- Selecione --</option>' + dados.map(d => `<option value="${d.id}">${d.nome}</option>`).join('');
            });
        } else {
            htmlCampos += `<div><label class="block text-sm font-semibold text-gray-700 mb-1">${campo.label}</label><input type="${campo.type}" id="${campo.id}" required class="w-full bg-gray-50 border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 outline-none"></div>`;
        }
    }

    document.getElementById('camposFormulario').innerHTML = htmlCampos;
    document.getElementById('mensagemAlerta').classList.add('hidden');
    document.getElementById('modalForm').classList.remove('hidden'); document.getElementById('modalForm').classList.add('flex');
}

function fecharModal() { document.getElementById('modalForm').classList.add('hidden'); document.getElementById('modalForm').classList.remove('flex'); document.getElementById('formularioDinamico').reset(); }

document.getElementById('formularioDinamico').addEventListener('submit', async function(e) {
    e.preventDefault();
    const config = configuracao[entidadeAtual];
    const btn = document.getElementById('btnSalvar');
    const alerta = document.getElementById('mensagemAlerta');

    const payload = {};
    config.camposForm.forEach(c => {
        const valor = document.getElementById(c.id).value;
        if (c.chaveNinhada) payload[c.chaveNinhada] = { id: parseInt(valor) };
        else payload[c.id] = c.type === 'number' ? parseFloat(valor) : valor;
    });

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...'; btn.disabled = true;

    try {
        const response = await fetch(API_URL + config.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (response.ok) { fecharModal(); carregarTabela(); } else throw new Error('Falha ao cadastrar no servidor.');
    } catch (error) {
        alerta.className = 'block rounded-md p-2 text-sm font-medium bg-red-100 text-red-800';
        alerta.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> ' + error.message; alerta.classList.remove('hidden');
    } finally { btn.innerHTML = '<i class="fa-solid fa-save"></i> Salvar'; btn.disabled = false; }
});

// ==========================================
// 4. LANÇAMENTO DE NOTAS (TRIGGER MÁGICA)
// ==========================================
async function lancarNotas(id) {
    const nota1 = prompt("Digite a Nota 1:");
    if (nota1 === null) return;
    const nota2 = prompt("Digite a Nota 2:");
    if (nota2 === null) return;

    try {
        const response = await fetch(`${API_URL}/matriculas/notas/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nota1: parseFloat(nota1), nota2: parseFloat(nota2) })
        });
        if (response.ok) { alert("Notas enviadas! O Banco de Dados fará o cálculo do Status."); carregarTabela(); }
        else { alert("Erro ao lançar notas."); }
    } catch (e) { alert("Erro de conexão."); }
}

// ==========================================
// 5. MÓDULO DE RELATÓRIOS E EXPORTAÇÃO
// ==========================================
function abrirTelaRelatorios() {
    modoAtual = 'relatorio'; document.getElementById('tituloPagina').innerText = 'Relatórios Dinâmicos';
    document.getElementById('telaCrud').classList.replace('block', 'hidden'); document.getElementById('telaRelatorio').classList.replace('hidden', 'block');
    document.getElementById('headerAcoesCrud').classList.replace('block', 'hidden'); document.getElementById('headerAcoesRelatorio').classList.replace('hidden', 'block');
    resetarBotoesMenu(); document.getElementById('menu-relatorios').classList.add('bg-blue-600', 'text-white'); document.getElementById('menu-relatorios').classList.remove('hover:bg-slate-800', 'text-slate-300');
}

function carregarCamposRelatorio() {
    const tabela = document.getElementById('selectTabela').value;
    const container = document.getElementById('containerCheckboxes');
    if (!tabela) { container.innerHTML = '<span class="text-gray-400 text-sm italic">Selecione uma tabela...</span>'; return; }
    container.innerHTML = dicionarioTabelas[tabela].map(campo => `<label class="inline-flex items-center bg-white border border-gray-300 rounded-md px-3 py-1 cursor-pointer hover:bg-blue-50 transition"><input type="checkbox" name="camposRelatorio" value="${campo}" class="rounded text-blue-600 mr-2" checked><span class="text-sm text-gray-700">${campo}</span></label>`).join('');
}

async function gerarRelatorio() {
    const tabela = document.getElementById('selectTabela').value;
    if(!tabela) return alert("Selecione uma tabela!");
    const camposSelecionados = Array.from(document.querySelectorAll('input[name="camposRelatorio"]:checked')).map(cb => cb.value);
    if(camposSelecionados.length === 0) return alert("Selecione pelo menos um campo!");

    const tHead = document.getElementById('relatorioHead'); const tBody = document.getElementById('relatorioBody');
    tHead.innerHTML = `<tr>${camposSelecionados.map(c => `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${c}</th>`).join('')}</tr>`;
    tBody.innerHTML = `<tr><td colspan="100%" class="text-center py-10 text-blue-500"><i class="fa-solid fa-spinner fa-spin"></i> Processando...</td></tr>`;

    try {
        const response = await fetch(`${API_URL}/relatorios/visualizar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tabela: tabela, campos: camposSelecionados }) });
        const dados = await response.json();
        if (dados.length === 0) { tBody.innerHTML = `<tr><td colspan="100%" class="text-center py-10 text-gray-500">Nenhum dado encontrado.</td></tr>`; return; }
        tBody.innerHTML = dados.map(linha => `<tr class="hover:bg-blue-50">${camposSelecionados.map(campo => `<td class="px-6 py-4 text-sm text-gray-700">${linha[campo] !== null ? linha[campo] : '-'}</td>`).join('')}</tr>`).join('');
    } catch (e) { tBody.innerHTML = `<tr><td colspan="100%" class="text-center py-10 text-red-500">Erro ao gerar relatório.</td></tr>`; }
}

function exportarCSV() {
    const tabelaHTML = modoAtual === 'relatorio' ? document.getElementById('tabelaRelatorioExport') : document.getElementById('tabelaCrudExport');
    let csv = [];
    for (let i = 0; i < tabelaHTML.rows.length; i++) {
        let row = [], cols = tabelaHTML.rows[i].querySelectorAll('td, th');
        for (let j = 0; j < cols.length; j++) {
            let texto = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, "");
            if(texto !== 'AÇÕES' && texto !== '') row.push('"' + texto + '"');
        }
        if(row.length > 0) csv.push(row.join(','));
    }
    if(csv.length <= 1) return alert('Não há dados para exportar!');
    let downloadLink = document.createElement('a');
    downloadLink.download = `${modoAtual}_exportado.csv`;
    downloadLink.href = window.URL.createObjectURL(new Blob(["\uFEFF"+csv.join('\n')], {type: 'text/csv;charset=utf-8;'}));
    downloadLink.click();
}

// Inicia a aplicação
document.addEventListener('DOMContentLoaded', () => mudarEntidade('alunos'));