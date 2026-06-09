"""
Serviço de LIBRAS para o conteúdo PCD (BS-015).

⚠️ Realidade técnica (importante): tanto o VLibras (gratuito, gov.br) quanto o
Hand Talk (pago) renderizam o intérprete de LIBRAS como um avatar 3D NO NAVEGADOR
(WebGL). Nenhum dos dois entrega, de graça, um "texto → arquivo de vídeo MP4".

Portanto, o papel do BACKEND aqui é o correto e honesto:
  1. Curar QUAIS textos do material PCD merecem tradução em LIBRAS
     (título, cada termo do vocabulário-chave e os momentos sugeridos);
  2. Entregar, por trecho, a configuração de EMBED do provedor ativo
     (com abstração + fallback), para o FRONTEND renderizar o avatar.

Padrão: Strategy (um provider por serviço de LIBRAS), configurável via .env
(LIBRAS_PROVIDER=vlibras|handtalk) e resiliente (cai para o VLibras gratuito se
o Hand Talk não estiver configurado). Nunca quebra a geração do PCD.
"""

import logging
import re
from app.core.config import settings

logger = logging.getLogger(__name__)


def _limpar_texto(texto: str, limite: int) -> str:
    """Normaliza o texto a ser sinalizado e respeita o limite do provedor."""
    if not texto:
        return ""
    limpo = re.sub(r"\s+", " ", str(texto)).strip()
    return limpo[:limite]


# ─────────────────────────────────────────── Providers (Strategy)
class _LibrasProvider:
    """Contrato comum: dado um texto, devolve a config de embed do avatar."""
    name: str = "base"

    def embed(self, text: str) -> dict:
        raise NotImplementedError

    def player_url(self) -> str:
        raise NotImplementedError


class _VLibrasProvider(_LibrasProvider):
    """VLibras (gratuito, oficial gov.br) — widget JS com o avatar Ícaro."""
    name = "vlibras"

    def __init__(self, app_url: str, plugin_url: str):
        self.app_url = app_url
        self.plugin_url = plugin_url

    def embed(self, text: str) -> dict:
        # O widget VLibras traduz o texto e anima o avatar no próprio navegador.
        return {
            "embed_type": "widget",
            "provider": self.name,
            "plugin_url": self.plugin_url,
            "app_url": self.app_url,
        }

    def player_url(self) -> str:
        return self.app_url


class _HandTalkProvider(_LibrasProvider):
    """Hand Talk (pago) — SDK web com o avatar Hugo (Libras/ASL)."""
    name = "handtalk"

    def __init__(self, token: str, plugin_url: str):
        self.token = token
        self.plugin_url = plugin_url

    def embed(self, text: str) -> dict:
        # O SDK Hugo é inicializado no front com o token e traduz o texto.
        return {
            "embed_type": "sdk",
            "provider": self.name,
            "plugin_url": self.plugin_url,
            "token": self.token,
        }

    def player_url(self) -> str:
        return self.plugin_url


class LibrasService:
    """Fachada usada pelo restante do app (instância: libras_service)."""

    def _provider(self) -> _LibrasProvider:
        """Escolhe o provedor pelo .env, com fallback seguro para o VLibras."""
        escolhido = (settings.libras_provider or "vlibras").strip().lower()
        if escolhido == "handtalk":
            if settings.hand_talk_api_key:
                return _HandTalkProvider(
                    settings.hand_talk_api_key, settings.hand_talk_plugin_url
                )
            logger.warning(
                "LIBRAS_PROVIDER=handtalk, mas HAND_TALK_API_KEY não foi definido; "
                "usando VLibras (gratuito) como fallback."
            )
        return _VLibrasProvider(settings.vlibras_app_url, settings.vlibras_plugin_url)

    def generate_libras_url(self, text: str) -> str:
        """
        Contrato da BS-015: retorna a URL base do player/widget do provedor ativo.
        Observação honesta: o avatar é renderizado no FRONT a partir do `text`
        (não existe URL de vídeo MP4 por trecho de graça); esta URL é o ponto de
        carga do widget/SDK que fará a tradução em LIBRAS no navegador.
        """
        return self._provider().player_url()

    def build_libras_videos(self, items: list[dict]) -> list[dict]:
        """
        Recebe trechos [{term, text, source}] e devolve, por trecho, o objeto
        de vídeo LIBRAS com a config de embed do provedor ativo.
        """
        provider = self._provider()
        limite = settings.libras_max_chars
        videos: list[dict] = []
        for item in items:
            texto = _limpar_texto(item.get("text", ""), limite)
            if not texto:
                continue
            emb = provider.embed(texto)
            videos.append({
                "term": item.get("term", ""),
                "text": texto,
                "provider": emb["provider"],
                "embed_type": emb["embed_type"],
                "source": item.get("source"),
                # tudo que o front precisa para montar o avatar deste trecho
                "config": {k: v for k, v in emb.items()
                           if k not in ("provider", "embed_type")},
            })
        return videos

    def build_videos_from_pcd(self, pcd: dict) -> list[dict]:
        """
        A partir do resultado PCD, monta os vídeos LIBRAS dos pontos-chave:
        título + cada termo do vocabulário + cada momento sugerido.
        Best-effort: qualquer falha aqui NÃO derruba a geração do PCD.
        """
        if not settings.libras_enabled:
            return []

        items: list[dict] = []

        titulo = (pcd.get("title") or "").strip()
        if titulo:
            items.append({"term": "Título", "text": titulo, "source": "title"})

        for entry in (pcd.get("key_vocabulary") or []):
            termo = (entry.get("term") or "").strip()
            definicao = (entry.get("definition") or "").strip()
            if termo:
                texto = f"{termo}. {definicao}".strip(". ")
                items.append({"term": termo, "text": texto, "source": "vocabulary"})

        for i, momento in enumerate((pcd.get("libras_suggestions") or []), start=1):
            momento = (momento or "").strip()
            if momento:
                items.append({"term": f"Momento {i}", "text": momento, "source": "moment"})

        try:
            videos = self.build_libras_videos(items)
            logger.info(
                f"LIBRAS: {len(videos)} vídeos gerados via '{self._provider().name}'."
            )
            return videos
        except Exception as e:
            logger.warning(f"Falha ao montar vídeos LIBRAS (seguindo sem eles): {e}")
            return []


libras_service = LibrasService()
