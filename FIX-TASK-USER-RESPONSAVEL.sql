-- ============================================================
-- Fix: popular task_user (pivot que a UI do Avante usa pra exibir "Responsável")
-- Deriva direto do assigned_to que já está correto em tasks (25 Fernando / 24 Claudia)
-- ============================================================

INSERT INTO task_user (task_id, user_id, created_at, updated_at)
SELECT id, assigned_to, NOW(), NOW()
FROM tasks
WHERE board_id = 7
  AND deleted_at IS NULL
  AND assigned_to IS NOT NULL;

-- Verificação: deve retornar 49 (task_id, user_id) únicos
SELECT COUNT(*) AS total_vinculos_responsavel
FROM task_user tu
JOIN tasks t ON t.id = tu.task_id
WHERE t.board_id = 7;

-- Conferência por pessoa (deve bater com 25/24)
SELECT u.name, COUNT(*) AS total
FROM task_user tu
JOIN tasks t ON t.id = tu.task_id
JOIN users u ON u.id = tu.user_id
WHERE t.board_id = 7
GROUP BY u.name;
