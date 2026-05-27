const API_URL = 'http://localhost:8080';
let entidadeAtual = 'alunos';
let modoAtual = 'crud';

// ==========================================
// 1. DICIONÁRIOS DE CONFIGURAÇÃO DO BANCO
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
        camposForm: [{ id: 'nome', label: 'Nome da Disciplina', type: 'text' }, { id: 'cargaHoraria', label: 'Carga Horária', type: 'number' }, { id: 'professorId', label: 'Professor Responsável', type: 'select', endpointBusca: '/professores', chaveNinhada: 'professor' }]
    },
    matriculas: {
        titulo: 'Gestão de Matrículas', endpoint: '/matriculas',
        colunasTabela: ['ID', 'Aluno', 'Disciplina', 'Nota 1', 'Nota 2', 'Status', 'Ações'], atributos: ['id', 'aluno.nome', 'disciplina.nome', 'nota1', 'nota2', 'status'],
        camposForm: [{ id: 'alunoId', label: 'Selecione o Aluno', type: 'select', endpointBusca: '/alunos', chaveNinhada: 'aluno' }, { id: 'disciplinaId', label: 'Selecione a Disciplina', type: 'select', endpointBusca: '/disciplinas', chaveNinhada: 'disciplina' }]
    },
    boletins: {
        titulo: 'Tabela Física de Boletins (Alimentada via Trigger)', endpoint: '/boletins',
        colunasTabela: ['ID Matrícula', 'Nome do Aluno', 'Disciplina', 'Nota 1', 'Nota 2', 'Média Final', 'Situação'],
        atributos: ['matricula_id', 'nome_aluno', 'nome_disciplina', 'nota1', 'nota2', 'media_final', 'status'],
        readonly: true, camposForm: []
    }
};

const dicionarioTabelas = {
    aluno: ['id', 'nome', 'cpf', 'email'],
    professor: ['id', 'nome', 'cpf', 'email', 'formacao_academica'],
    disciplina: ['id', 'nome', 'carga_horaria', 'professor_id'],
    matricula_aluno: ['id', 'aluno_id', 'disciplina_id', 'nota1', 'nota2', 'status'],
    tabela_boletim: ['matricula_id', 'nome_aluno', 'nome_disciplina', 'nota1', 'nota2', 'media_final', 'status'],
    vw_boletim_consolidado: ['id', 'nome_aluno', 'nome_disciplina', 'nota1', 'nota2', 'media_final', 'status']
};

// ==========================================
// 2. CONTROLE DE NAVEGAÇÃO E REQUISIÇÕES
// ==========================================
function resetarBotoesMenu() {
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.className = 'menu-btn w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-slate-300 hover:bg-slate-800';
    });
}

function mudarEntidade(novaEntidade) {
    modoAtual = 'crud';
    entidadeAtual = novaEntidade;
    const config = configuracao[entidadeAtual];

    document.getElementById('tituloPagina').innerText = config.titulo;
    document.getElementById('telaCrud').classList.replace('hidden', 'block');
    document.getElementById('telaRelatorio').classList.replace('block', 'hidden');

        if (config.readonly) {
            document.getElementById('headerAcoesCrud').classList.add('hidden');
            document.getElementById('headerAcoesCrud').classList.remove('block');
        } else {
            document.getElementById('headerAcoesCrud').classList.add('block');
            document.getElementById('headerAcoesCrud').classList.remove('hidden');
        }

    resetarBotoesMenu();
    document.getElementById('menu-' + entidadeAtual).className = 'menu-btn w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors bg-blue-600 text-white';

    carregarTabela();
}

function extrairValor(objeto, caminho) {
    return caminho.split('.').reduce((acc, parte) => acc && acc[parte] !== undefined ? acc[parte] : '-', objeto);
}

async function carregarTabela() {
    const config = configuracao[entidadeAtual];
    const tHead = document.getElementById('tabelaHead');
    const tBody = document.getElementById('tabelaBody');

    let htmlCabecalho = '<tr>';
    for (const coluna of config.colunasTabela) {
        htmlCabecalho += `<th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">${coluna}</th>`;
    }
    htmlCabecalho += '</tr>';
    tHead.innerHTML = htmlCabecalho;

    tBody.innerHTML = `<tr><td colspan="100%" class="text-center py-8 text-blue-500 font-medium"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Buscando registros...</td></tr>`;

    try {
        const response = await fetch(API_URL + config.endpoint);
        const dados = await response.json();

        if (dados.length === 0) {
            tBody.innerHTML = `<tr><td colspan="100%" class="text-center py-8 text-gray-500 font-medium">Nenhum dado cadastrado nesta tabela ainda.</td></tr>`;
            return;
        }

        let htmlCorpo = '';
        for (const item of dados) {
            htmlCorpo += '<tr class="hover:bg-gray-50 transition border-b border-gray-100">';
            for (const attr of config.atributos) {
                let valor = extrairValor(item, attr);
                htmlCorpo += `<td class="px-6 py-4 text-sm text-gray-700">${valor !== null ? valor : '-'}</td>`;
            }

            if (!config.readonly) {
                htmlCorpo += '<td class="px-6 py-4 text-sm font-medium flex gap-2">';
                if (entidadeAtual === 'matriculas') {
                    htmlCorpo += `<button onclick="lancarNotas(${item.id})" class="text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded border border-blue-100" title="Lançar Notas"><i class="fa-solid fa-pen-to-square"></i></button>`;
                }
                htmlCorpo += `<button onclick="deletarRegistro(${item.id})" class="text-red-500 hover:text-red-700 bg-red-50 px-3 py-1 rounded border border-red-100" title="Excluir"><i class="fa-solid fa-trash"></i></button>`;
                htmlCorpo += '</td>';
            }
            htmlCorpo += '</tr>';
        }
        tBody.innerHTML = htmlCorpo;
    } catch (e) {
        tBody.innerHTML = `<tr><td colspan="100%" class="text-center text-red-500 py-8 font-medium">Falha na comunicação com o servidor Back-end.</td></tr>`;
    }
}

async function deletarRegistro(id) {
    if(confirm('Deseja realmente remover este registro de forma permanente?')){
        await fetch(`${API_URL}${configuracao[entidadeAtual].endpoint}/${id}`, { method: 'DELETE' });
        carregarTabela();
    }
}

// ==========================================
// 3. ENGENHARIA DE FORMULÁRIOS
// ==========================================
async function abrirModal() {
    const config = configuracao[entidadeAtual];
    document.getElementById('modalTitulo').innerText = `Cadastrar em ${config.titulo}`;

    let htmlCampos = '';
    for (const campo of config.camposForm) {
        if (campo.type === 'select') {
            htmlCampos += `
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">${campo.label}</label>
                    <select id="${campo.id}" required class="w-full bg-gray-50 border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="">Buscando dados das chaves...</option>
                    </select>
                </div>`;

            fetch(API_URL + campo.endpointBusca)
                .then(res => res.json())
                .then(dados => {
                    let opcoes = '<option value="">-- Selecione uma opção --</option>';
                    for (const d of dados) {
                        opcoes += `<option value="${d.id}">${d.nome}</option>`;
                    }
                    document.getElementById(campo.id).innerHTML = opcoes;
                });
        } else {
            htmlCampos += `
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">${campo.label}</label>
                    <input type="${campo.type}" id="${campo.id}" required class="w-full bg-gray-50 border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 outline-none">
                </div>`;
        }
    }

    document.getElementById('camposFormulario').innerHTML = htmlCampos;
    document.getElementById('mensagemAlerta').classList.add('hidden');
    document.getElementById('modalForm').classList.replace('hidden', 'flex');
}

function fecharModal() {
    document.getElementById('modalForm').classList.replace('flex', 'hidden');
    document.getElementById('formularioDinamico').reset();
}

document.getElementById('formularioDinamico').addEventListener('submit', async function(e) {
    e.preventDefault();
    const config = configuracao[entidadeAtual];
    const btn = document.getElementById('btnSalvar');
    const alerta = document.getElementById('mensagemAlerta');

    const payload = {};
    for (const c of config.camposForm) {
        const valor = document.getElementById(c.id).value;
        if (c.chaveNinhada) {
            payload[c.chaveNinhada] = { id: parseInt(valor) };
        } else {
            payload[c.id] = c.type === 'number' ? parseFloat(valor) : valor;
        }
    }

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Salvando...';
    btn.disabled = true;

    try {
        const response = await fetch(API_URL + config.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            fecharModal();
            carregarTabela();
        } else {
            throw new Error('O servidor recusou a requisição (Erro 400/500).');
        }
    } catch (error) {
        alerta.className = 'block rounded-md p-2 text-sm font-medium bg-red-100 text-red-800 text-center';
        alerta.innerHTML = '<i class="fa-solid fa-triangle-exclamation mr-2"></i>' + error.message;
        alerta.classList.remove('hidden');
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-save mr-2"></i>Salvar';
        btn.disabled = false;
    }
});

// ==========================================
// 4. LANÇAMENTO DE NOTAS (INTEGRAÇÃO JAVA-DB)
// ==========================================
async function lancarNotas(id) {
    const nota1 = prompt("Digite a Nota 1 (Exemplo: 7.5):");
    if (nota1 === null) return;

    const nota2 = prompt("Digite a Nota 2 (Exemplo: 8.0):");
    if (nota2 === null) return;

    try {
        const response = await fetch(`${API_URL}/matriculas/notas/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nota1: parseFloat(nota1),
                nota2: parseFloat(nota2)
            })
        });

        if (response.ok) {
            alert("Notas salvas via Java! O trigger do PostgreSQL atualizou a tabela física de boletins.");
            carregarTabela();
        } else {
            alert("Erro ao salvar notas. Verifique as restrições.");
        }
    } catch (e) {
        alert("Erro de conexão com o servidor.");
    }
}

// ==========================================
// 5. MÓDULO DE RELATÓRIOS PERSONALIZADOS E EXCEL
// ==========================================
function abrirTelaRelatorios() {
    modoAtual = 'relatorio';
    document.getElementById('tituloPagina').innerText = 'Filtros e Relatórios Personalizados';
    document.getElementById('telaCrud').classList.replace('block', 'hidden');
    document.getElementById('telaRelatorio').classList.replace('hidden', 'block');
    document.getElementById('headerAcoesCrud').classList.replace('block', 'hidden');
    document.getElementById('headerAcoesRelatorio').classList.replace('hidden', 'block');

    resetarBotoesMenu();
    document.getElementById('menu-relatorios').className = 'menu-btn w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors bg-blue-600 text-white';
}

function carregarCamposRelatorio() {
    const tabela = document.getElementById('selectTabela').value;
    const container = document.getElementById('containerCheckboxes');

    if (!tabela) {
        container.innerHTML = '<span class="text-gray-400 text-sm italic font-medium">Selecione uma tabela...</span>';
        return;
    }

    let htmlCampos = '';
    for (const campo of dicionarioTabelas[tabela]) {
        htmlCampos += `
            <label class="inline-flex items-center bg-white border border-gray-300 rounded-md px-3 py-1.5 cursor-pointer hover:bg-blue-50 transition select-none shadow-sm">
                <input type="checkbox" name="camposRelatorio" value="${campo}" class="rounded text-blue-600 focus:ring-blue-500 mr-2 w-4 h-4" checked>
                <span class="text-sm font-semibold text-gray-700">${campo}</span>
            </label>`;
    }
    container.innerHTML = htmlCampos;
}

async function gerarRelatorio() {
    const tabela = document.getElementById('selectTabela').value;
    if(!tabela) return alert("Por favor, selecione uma tabela de origem.");

    const checkboxes = document.querySelectorAll('input[name="camposRelatorio"]:checked');
    const camposSelecionados = Array.from(checkboxes).map(cb => cb.value);

    if(camposSelecionados.length === 0) return alert("Selecione pelo menos um campo para exibição.");

    const tHead = document.getElementById('relatorioHead');
    const tBody = document.getElementById('relatorioBody');

    let htmlCabecalho = '<tr>';
    for (const c of camposSelecionados) {
        htmlCabecalho += `<th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">${c}</th>`;
    }
    htmlCabecalho += '</tr>';
    tHead.innerHTML = htmlCabecalho;

    tBody.innerHTML = `<tr><td colspan="100%" class="text-center py-10 text-blue-500 font-medium"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Executando a query estruturada...</td></tr>`;

    try {
        const response = await fetch(`${API_URL}/relatorios/visualizar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tabela: tabela, campos: camposSelecionados })
        });

        const dados = await response.json();

        if (dados.length === 0) {
            tBody.innerHTML = `<tr><td colspan="100%" class="text-center py-10 text-gray-500 font-medium">Nenhum registro retornado para os critérios definidos.</td></tr>`;
            return;
        }

        let htmlCorpo = '';
        for (const linha of dados) {
            htmlCorpo += '<tr class="hover:bg-blue-50/50 transition border-b border-gray-100">';
            for (const campo of camposSelecionados) {
                const valor = linha[campo] !== null ? linha[campo] : '-';
                htmlCorpo += `<td class="px-6 py-4 text-sm text-gray-700 font-medium">${valor}</td>`;
            }
            htmlCorpo += '</tr>';
        }
        tBody.innerHTML = htmlCorpo;
    } catch (e) {
        tBody.innerHTML = `<tr><td colspan="100%" class="text-center py-10 text-red-500 font-medium">Erro ao compilar relatório dinâmico.</td></tr>`;
    }
}

// ==========================================
// 6. ENGINE EXPORTADORA DE ARQUIVOS (EXCEL COM BOM)
// ==========================================
function exportarCSV() {
    const tabelaHTML = modoAtual === 'relatorio' ? document.getElementById('tabelaRelatorioExport') : document.getElementById('tabelaCrudExport');
    let csv = [];

    for (let i = 0; i < tabelaHTML.rows.length; i++) {
        let row = [];
        let cols = tabelaHTML.rows[i].querySelectorAll('td, th');

        for (let j = 0; j < cols.length; j++) {
            let texto = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, "");
            // Ignora colunas vazias ou de ações puras
            if(texto !== 'AÇÕES' && texto !== '') {
                // Escapa aspas para evitar bugs estruturais no Excel
                row.push('"' + texto.replace(/"/g, '""') + '"');
            }
        }
        if(row.length > 0) csv.push(row.join(';')); // Usa ponto e vírgula como padrão do Excel latino
    }

    if(csv.length <= 1) return alert('Nenhum dado localizado para exportação em planilha.');

    let downloadLink = document.createElement('a');
    downloadLink.download = `relatorio_${entidadeAtual}_${modoAtual}.csv`;

    // Injeta a marcação de Byte Order Mark (\uFEFF) para forçar o Excel a renderizar acentuações UTF-8
    let arquivoVirtual = new Blob(["\uFEFF" + csv.join('\n')], {type: 'text/csv;charset=utf-8;'});
    downloadLink.href = window.URL.createObjectURL(arquivoVirtual);
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => mudarEntidade('alunos'));