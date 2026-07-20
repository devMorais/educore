"""
D-15: valida que o upload de documento checa o CONTEÚDO real do arquivo
(magic bytes do PDF), não só a extensão do nome.
"""
import os
from unittest.mock import MagicMock, AsyncMock, patch

from app.routers import documents


def test_upload_rejects_txt_file_renamed_to_pdf(client):
    """
    Um .txt renomeado pra .pdf tem extensão válida mas conteúdo inválido —
    tem que ser rejeitado com 400 ANTES de tocar no banco ou no pipeline de
    IA (sem custo de LlamaParse/Gemini pra processar lixo).
    """
    fake_txt = b"Isso aqui e so um texto qualquer, nao um PDF de verdade."

    with patch.object(documents, "get_connection") as mock_get_connection, \
         patch.object(documents.rag_service, "process_document", new=AsyncMock()) as mock_process:
        response = client.post(
            "/documents/upload",
            files={"file": ("documento.pdf", fake_txt, "application/pdf")},
        )

    assert response.status_code == 400
    assert "PDF" in response.json()["detail"]

    # Nunca deve ter chegado a bater no banco nem agendar o processamento.
    mock_get_connection.assert_not_called()
    mock_process.assert_not_called()


def test_upload_accepts_real_pdf(client):
    """Um PDF de verdade (começa com %PDF-) continua funcionando normalmente."""
    fake_pdf = b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\nconteudo qualquer de pdf de teste"

    mock_cursor = MagicMock()
    # 1a chamada (SELECT de deduplicacao) -> None = nao deduplicado
    # 2a chamada (INSERT ... RETURNING id) -> (42,)
    mock_cursor.fetchone.side_effect = [None, (42,)]
    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cursor

    written_file_path = None
    try:
        with patch.object(documents, "get_connection", return_value=mock_conn), \
             patch.object(documents.rag_service, "process_document", new=AsyncMock()) as mock_process:
            response = client.post(
                "/documents/upload",
                files={"file": ("documento.pdf", fake_pdf, "application/pdf")},
            )

        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "processing"
        assert body["document_id"] == 42

        # O pipeline É chamado pra um PDF de verdade (o oposto do teste acima).
        mock_process.assert_called_once()

        # Confirma que o arquivo INTEIRO foi salvo em disco, não só o resto após
        # o file.read(5) do header — sem o file.seek(0), o arquivo gravado
        # ficaria faltando os 5 primeiros bytes ("%PDF-").
        insert_call = mock_cursor.execute.call_args_list[1]
        written_file_path = insert_call.args[1][2]  # (safe_name, original_name, file_path, ...)
        with open(written_file_path, "rb") as fh:
            saved_content = fh.read()
        assert saved_content == fake_pdf
    finally:
        if written_file_path and os.path.exists(written_file_path):
            os.remove(written_file_path)
