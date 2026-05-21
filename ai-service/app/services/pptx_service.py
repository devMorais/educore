import subprocess
import json
import os
import tempfile
import logging
from typing import List

logger = logging.getLogger(__name__)

SCRIPT_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'generate_pptx.js')


class PptxService:
    def generate(self, title: str, slides: List[dict], output_path: str) -> str:
        """Gera um .pptx profissional usando PptxGenJS."""

        # Salva os dados em arquivo temporário
        with tempfile.NamedTemporaryFile(
            mode='w', suffix='.json', delete=False, encoding='utf-8'
        ) as f:
            json.dump({"title": title, "slides": slides}, f, ensure_ascii=False)
            temp_json = f.name

        try:
            result = subprocess.run(
                ['node', SCRIPT_PATH, temp_json, output_path],
                capture_output=True, text=True, timeout=60
            )

            if result.returncode != 0:
                logger.error(f"Erro PptxGenJS: {result.stderr}")
                raise Exception(f"Erro ao gerar PPTX: {result.stderr}")

            logger.info(f"PPTX gerado: {output_path}")
            return output_path

        finally:
            os.unlink(temp_json)


pptx_service = PptxService()