const fs = require('fs');
const path = require('path');

const demandas = require('../demandas-educore-comercial-tasks.json');

const BOARD_ID = 7;
const STATUS_ID_EM_FILA = 25;
const FERNANDO_ID = 1;
const CLAUDIA_ID = 2;

const sprints = [
  { key: 1, name: 'Sprint 1 - Corrigir Fachada Critica e Seguranca Inicial (06-12/07)', start: '2026-07-06', end: '2026-07-12' },
  { key: 2, name: 'Sprint 2 - Finalizar Fachada e Seguranca IA (13-19/07)', start: '2026-07-13', end: '2026-07-19' },
  { key: 3, name: 'Sprint 3 - Seguranca e Infraestrutura (20-26/07)', start: '2026-07-20', end: '2026-07-26' },
  { key: 4, name: 'Sprint 4 - Config e Inicio do Billing (27/07-02/08)', start: '2026-07-27', end: '2026-08-02' },
  { key: 5, name: 'Sprint 5 - LGPD e Cobranca Ativa (03-09/08)', start: '2026-08-03', end: '2026-08-09' },
  { key: 6, name: 'Sprint 6 - Billing Frontend e Backlog IA (10-16/08)', start: '2026-08-10', end: '2026-08-16' },
  { key: 7, name: 'Sprint 7 - Backlog Funcional e Observabilidade (17-23/08)', start: '2026-08-17', end: '2026-08-23' },
  { key: 8, name: 'Sprint 8 - Performance e Lancamento Comercial (24-30/08)', start: '2026-08-24', end: '2026-08-30' },
];

const tags = [
  'Laravel', 'Angular', 'AI-Service', 'Seguranca', 'LGPD', 'Billing',
  'Infraestrutura', 'Performance', 'Testes', 'Correcao-Fachada', 'Marketing',
];
const tagColors = {
  'Laravel': '#FF2D20', 'Angular': '#DD0031', 'AI-Service': '#7C3AED',
  'Seguranca': '#DC2626', 'LGPD': '#0891B2', 'Billing': '#059669',
  'Infraestrutura': '#D97706', 'Performance': '#4F46E5', 'Testes': '#16A34A',
  'Correcao-Fachada': '#EA580C', 'Marketing': '#DB2777',
};

// Mapa D-XX -> { sprint, assignee, tags[] }
const plano = {
  'D-01': { sprint: 1, user: CLAUDIA_ID, tags: ['Laravel', 'Angular', 'Correcao-Fachada'] },
  'D-02': { sprint: 1, user: CLAUDIA_ID, tags: ['Laravel', 'Angular', 'Correcao-Fachada', 'Seguranca'] },
  'D-03': { sprint: 1, user: CLAUDIA_ID, tags: ['Laravel', 'Angular', 'Correcao-Fachada'] },
  'D-04': { sprint: 1, user: FERNANDO_ID, tags: ['Laravel', 'Angular', 'AI-Service', 'Correcao-Fachada'] },
  'D-09': { sprint: 1, user: FERNANDO_ID, tags: ['Laravel', 'Seguranca'] },
  'D-15': { sprint: 1, user: FERNANDO_ID, tags: ['AI-Service', 'Seguranca'] },

  'D-05': { sprint: 2, user: CLAUDIA_ID, tags: ['Laravel', 'Angular', 'Correcao-Fachada'] },
  'D-06': { sprint: 2, user: CLAUDIA_ID, tags: ['Angular', 'Correcao-Fachada'] },
  'D-07': { sprint: 2, user: CLAUDIA_ID, tags: ['Angular', 'Correcao-Fachada'] },
  'D-16': { sprint: 2, user: FERNANDO_ID, tags: ['AI-Service', 'Seguranca'] },
  'D-17': { sprint: 2, user: FERNANDO_ID, tags: ['AI-Service', 'Seguranca'] },
  'D-21': { sprint: 2, user: FERNANDO_ID, tags: ['Laravel', 'AI-Service', 'LGPD'] },

  'D-08': { sprint: 3, user: CLAUDIA_ID, tags: ['Angular', 'Correcao-Fachada'] },
  'D-10': { sprint: 3, user: CLAUDIA_ID, tags: ['Laravel', 'Seguranca'] },
  'D-11': { sprint: 3, user: CLAUDIA_ID, tags: ['Laravel', 'Seguranca'] },
  'D-22': { sprint: 3, user: FERNANDO_ID, tags: ['AI-Service', 'Infraestrutura'] },
  'D-23': { sprint: 3, user: FERNANDO_ID, tags: ['AI-Service', 'Infraestrutura'] },
  'D-24': { sprint: 3, user: FERNANDO_ID, tags: ['AI-Service', 'Infraestrutura', 'Performance'] },

  'D-12': { sprint: 4, user: CLAUDIA_ID, tags: ['Laravel', 'Seguranca'] },
  'D-13': { sprint: 4, user: CLAUDIA_ID, tags: ['Laravel'] },
  'D-14': { sprint: 4, user: CLAUDIA_ID, tags: ['Angular', 'Seguranca'] },
  'D-25': { sprint: 4, user: FERNANDO_ID, tags: ['Infraestrutura'] },
  'D-26': { sprint: 4, user: FERNANDO_ID, tags: ['AI-Service', 'Infraestrutura'] },
  'D-27': { sprint: 4, user: FERNANDO_ID, tags: ['Laravel', 'AI-Service', 'Billing'] },

  'D-18': { sprint: 5, user: CLAUDIA_ID, tags: ['Laravel', 'Seguranca'] },
  'D-19': { sprint: 5, user: CLAUDIA_ID, tags: ['Laravel', 'Angular', 'LGPD'] },
  'D-20': { sprint: 5, user: CLAUDIA_ID, tags: ['Angular', 'LGPD'] },
  'D-28': { sprint: 5, user: FERNANDO_ID, tags: ['Laravel', 'Angular', 'Billing'] },
  'D-32': { sprint: 5, user: FERNANDO_ID, tags: ['AI-Service', 'Performance'] },

  'D-29': { sprint: 6, user: CLAUDIA_ID, tags: ['Laravel', 'Angular', 'Billing'] },
  'D-30': { sprint: 6, user: CLAUDIA_ID, tags: ['Laravel', 'Angular', 'Billing'] },
  'D-31': { sprint: 6, user: CLAUDIA_ID, tags: ['Laravel', 'Angular'] },
  'D-33': { sprint: 6, user: FERNANDO_ID, tags: ['AI-Service', 'Angular'] },
  'D-34': { sprint: 6, user: FERNANDO_ID, tags: ['AI-Service', 'Performance'] },
  'D-35': { sprint: 6, user: FERNANDO_ID, tags: ['AI-Service', 'Angular'] },

  'D-36': { sprint: 7, user: CLAUDIA_ID, tags: ['Angular'] },
  'D-37': { sprint: 7, user: CLAUDIA_ID, tags: ['Laravel', 'Angular'] },
  'D-38': { sprint: 7, user: CLAUDIA_ID, tags: ['Laravel', 'Angular'] },
  'D-40': { sprint: 7, user: FERNANDO_ID, tags: ['Laravel', 'Angular', 'AI-Service', 'Infraestrutura'] },
  'D-41': { sprint: 7, user: FERNANDO_ID, tags: ['Laravel', 'Angular', 'AI-Service', 'Testes'] },
  'D-43': { sprint: 7, user: FERNANDO_ID, tags: ['Angular'] },

  'D-39': { sprint: 8, user: CLAUDIA_ID, tags: ['Angular'] },
  'D-42': { sprint: 8, user: CLAUDIA_ID, tags: ['Angular', 'Performance'] },
  'D-44': { sprint: 8, user: CLAUDIA_ID, tags: ['Angular'] },
  'D-45': { sprint: 8, user: FERNANDO_ID, tags: ['Marketing'] },
  'D-46': { sprint: 8, user: FERNANDO_ID, tags: ['Marketing'] },
  'D-47': { sprint: 8, user: FERNANDO_ID, tags: ['Marketing'] },
  'D-48': { sprint: 8, user: FERNANDO_ID, tags: ['Marketing', 'Angular'] },
  'D-49': { sprint: 8, user: FERNANDO_ID, tags: ['Marketing'] },
};

function esc(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

let sql = [];
sql.push('-- ============================================================');
sql.push('-- EduCore — Recriacao completa do backlog comercial (board Educore, board_id=7)');
sql.push('-- Gerado automaticamente a partir de demandas-educore-comercial-tasks.json');
sql.push('-- Executar em uma unica sessao, na ordem: tags -> sprints -> tasks -> task_tag');
sql.push('-- ============================================================');
sql.push('');
sql.push('-- 1) TAGS');
sql.push('INSERT INTO tags (board_id, name, color, created_at, updated_at) VALUES');
sql.push(tags.map(t => `(${BOARD_ID}, ${esc(t)}, ${esc(tagColors[t])}, NOW(), NOW())`).join(',\n') + ';');
sql.push('');
sql.push('-- 2) SPRINTS');
sql.push('INSERT INTO sprints (board_id, name, start_date, end_date, created_at, updated_at) VALUES');
sql.push(sprints.map(s => `(${BOARD_ID}, ${esc(s.name)}, ${esc(s.start)}, ${esc(s.end)}, NOW(), NOW())`).join(',\n') + ';');
sql.push('');
sql.push('-- 3) TASKS (49 demandas)');
sql.push('INSERT INTO tasks (board_id, sprint_id, status_id, assigned_to, description, priority, epic, sort_order, created_at, updated_at) VALUES');

const taskRows = [];
const sortCounters = {}; // por sprint+assignee

demandas.forEach((d) => {
  const match = d.description.match(/^\[D-(\d+)\]/);
  if (!match) { console.error('Sem codigo D-XX:', d.description.slice(0, 40)); return; }
  const codigo = 'D-' + match[1];
  const info = plano[codigo];
  if (!info) { console.error('Sem mapeamento de sprint/responsavel:', codigo); return; }

  const sprintObj = sprints.find(s => s.key === info.sprint);
  const counterKey = `${info.sprint}-${info.user}`;
  sortCounters[counterKey] = (sortCounters[counterKey] || 0) + 1;

  const sprintSubquery = `(SELECT id FROM sprints WHERE board_id = ${BOARD_ID} AND name = ${esc(sprintObj.name)} LIMIT 1)`;

  taskRows.push({
    row: `(${BOARD_ID}, ${sprintSubquery}, ${STATUS_ID_EM_FILA}, ${info.user}, ${esc(d.description)}, ${esc(d.priority)}, ${esc(d.epic)}, ${sortCounters[counterKey] - 1}, NOW(), NOW())`,
    codigo,
    tags: info.tags,
  });
});

sql.push(taskRows.map(r => r.row).join(',\n') + ';');
sql.push('');
sql.push('-- 4) TASK_TAG (vincula cada demanda as suas tags)');
sql.push('INSERT INTO task_tag (task_id, tag_id)');
sql.push('SELECT t.id, tg.id');
sql.push('FROM tasks t');
sql.push('JOIN tags tg ON tg.board_id = ' + BOARD_ID);
sql.push('WHERE t.board_id = ' + BOARD_ID + ' AND (');

const casesPorCodigo = taskRows.map(r => {
  const tagList = r.tags.map(esc).join(', ');
  return `  (t.description LIKE ${esc('[' + r.codigo + ']%')} AND tg.name IN (${tagList}))`;
});
sql.push(casesPorCodigo.join('\n  OR\n'));
sql.push(');');
sql.push('');
sql.push('-- 5) Verificacao final');
sql.push(`SELECT COUNT(*) AS total_tasks FROM tasks WHERE board_id = ${BOARD_ID} AND deleted_at IS NULL;`);
sql.push(`SELECT COUNT(*) AS total_sprints FROM sprints WHERE board_id = ${BOARD_ID} AND deleted_at IS NULL;`);
sql.push(`SELECT COUNT(*) AS total_tags FROM tags WHERE board_id = ${BOARD_ID} AND deleted_at IS NULL;`);
sql.push(`SELECT COUNT(*) AS total_vinculos_tag FROM task_tag tt JOIN tasks t ON t.id = tt.task_id WHERE t.board_id = ${BOARD_ID};`);
sql.push(`SELECT assigned_to, COUNT(*) AS total FROM tasks WHERE board_id = ${BOARD_ID} AND deleted_at IS NULL GROUP BY assigned_to;`);

const output = sql.join('\n');
const outPath = path.join(__dirname, '..', 'SQL-RECRIACAO-BOARD-EDUCORE.sql');
fs.writeFileSync(outPath, output, 'utf8');
console.log('Gerado:', outPath);
console.log('Total tasks geradas:', taskRows.length);
