"""
EduCore Google Slides Service (BS-013).

Loads service account credentials from GOOGLE_SERVICE_ACCOUNT_JSON env var (JSON string).
Falls back to google-credentials.json file if env var is not set.
Gracefully unavailable if neither is configured — callers check .available before use.
"""

import json
import logging
import os
from typing import List

from app.core.config import settings

logger = logging.getLogger(__name__)

SCOPES = [
    'https://www.googleapis.com/auth/presentations',
    'https://www.googleapis.com/auth/drive',
]

CREDENTIALS_FILE = os.path.join(
    os.path.dirname(__file__), '..', '..', 'google-credentials.json'
)

# EduCore palette for Google Slides API (RGB 0-1 float)
_COLORS = {
    'blue':       {'red': 0.102, 'green': 0.451, 'blue': 0.910},
    'blue_dark':  {'red': 0.051, 'green': 0.278, 'blue': 0.631},
    'orange':     {'red': 1.000, 'green': 0.549, 'blue': 0.000},
    'dark':       {'red': 0.129, 'green': 0.129, 'blue': 0.129},
    'white':      {'red': 1.000, 'green': 1.000, 'blue': 1.000},
    'light':      {'red': 0.980, 'green': 0.980, 'blue': 0.980},
}


class SlidesService:
    """
    Wrapper around Google Slides API.
    Use .available to check if credentials were loaded successfully.
    """

    def __init__(self):
        self.available = False
        self._slides = None
        self._drive  = None
        self._init()

    def _init(self):
        try:
            from google.oauth2 import service_account
            from googleapiclient.discovery import build

            if settings.google_service_account_json:
                info = json.loads(settings.google_service_account_json)
                creds = service_account.Credentials.from_service_account_info(
                    info, scopes=SCOPES
                )
                logger.info("Google Slides: credenciais carregadas da variável de ambiente")
            elif os.path.exists(CREDENTIALS_FILE):
                creds = service_account.Credentials.from_service_account_file(
                    CREDENTIALS_FILE, scopes=SCOPES
                )
                logger.info("Google Slides: credenciais carregadas do arquivo %s", CREDENTIALS_FILE)
            else:
                logger.info(
                    "Google Slides: não configurado "
                    "(defina GOOGLE_SERVICE_ACCOUNT_JSON para ativar)"
                )
                return

            self._slides   = build('slides', 'v1', credentials=creds)
            self._drive    = build('drive',  'v3', credentials=creds)
            self.available = True

        except Exception as exc:
            logger.warning("Google Slides API indisponível: %s", exc)

    # ── Public API ────────────────────────────────────────────────────────────

    def create_presentation(
        self, title: str, slides_data: List[dict], user_email: str | None = None
    ) -> dict | None:
        """
        Creates a Google Slides presentation from slides_data.
        Returns dict with 'url', 'presentation_id', 'total_slides' or None on failure.
        """
        if not self.available:
            return None

        try:
            presentation = self._slides.presentations().create(
                body={'title': title}
            ).execute()
            pid = presentation['presentationId']
            logger.info("Google Slides: apresentação criada — %s", pid)

            # Share with user
            if user_email:
                self._drive.permissions().create(
                    fileId=pid,
                    body={'type': 'user', 'role': 'writer', 'emailAddress': user_email},
                ).execute()

            requests = []
            first_slide_id = presentation['slides'][0]['objectId']

            # Cover slide (index 0)
            requests += self._cover_requests(title)

            # Content slides
            for idx, slide in enumerate(slides_data):
                requests += self._content_requests(slide, idx)

            # Remove default blank slide
            requests.append({'deleteObject': {'objectId': first_slide_id}})

            self._slides.presentations().batchUpdate(
                presentationId=pid,
                body={'requests': requests},
            ).execute()

            return {
                'presentation_id': pid,
                'url': f'https://docs.google.com/presentation/d/{pid}/edit',
                'title': title,
                'total_slides': len(slides_data) + 1,
            }

        except Exception as exc:
            logger.error("Erro ao criar Google Slides: %s", exc)
            return None

    # ── Slide request builders ─────────────────────────────────────────────────

    def _cover_requests(self, title: str) -> list:
        sid   = 'cover_slide'
        bg_id = 'cover_bg'
        t_id  = 'cover_title'
        s_id  = 'cover_subtitle'
        return [
            {'insertSlide': {
                'insertionIndex': 0,
                'objectId': sid,
                'slideLayoutReference': {'predefinedLayout': 'BLANK'},
            }},
            {'createShape': {
                'objectId': bg_id, 'shapeType': 'RECTANGLE',
                'elementProperties': {
                    'pageObjectId': sid,
                    'size':      {'width': {'magnitude': 9144000, 'unit': 'EMU'},
                                  'height': {'magnitude': 5143500, 'unit': 'EMU'}},
                    'transform': {'scaleX': 1, 'scaleY': 1,
                                  'translateX': 0, 'translateY': 0, 'unit': 'EMU'},
                },
            }},
            {'updateShapeProperties': {
                'objectId': bg_id,
                'shapeProperties': {
                    'shapeBackgroundFill': {'solidFill': {'color': {'rgbColor': _COLORS['blue_dark']}}},
                    'outline': {'outlineFill': {'solidFill': {'color': {'rgbColor': _COLORS['blue_dark']}}}},
                },
                'fields': 'shapeBackgroundFill,outline',
            }},
            {'createShape': {
                'objectId': t_id, 'shapeType': 'TEXT_BOX',
                'elementProperties': {
                    'pageObjectId': sid,
                    'size':      {'width': {'magnitude': 7200000, 'unit': 'EMU'},
                                  'height': {'magnitude': 1600000, 'unit': 'EMU'}},
                    'transform': {'scaleX': 1, 'scaleY': 1,
                                  'translateX': 960000, 'translateY': 1700000, 'unit': 'EMU'},
                },
            }},
            {'insertText':   {'objectId': t_id, 'text': title}},
            {'updateTextStyle': {
                'objectId': t_id, 'textRange': {'type': 'ALL'},
                'style': {
                    'fontSize':        {'magnitude': 36, 'unit': 'PT'},
                    'bold':            True,
                    'foregroundColor': {'opaqueColor': {'rgbColor': _COLORS['white']}},
                    'fontFamily':      'Calibri',
                },
                'fields': 'fontSize,bold,foregroundColor,fontFamily',
            }},
            {'updateParagraphStyle': {
                'objectId': t_id, 'textRange': {'type': 'ALL'},
                'style': {'alignment': 'CENTER'}, 'fields': 'alignment',
            }},
            {'createShape': {
                'objectId': s_id, 'shapeType': 'TEXT_BOX',
                'elementProperties': {
                    'pageObjectId': sid,
                    'size':      {'width': {'magnitude': 7200000, 'unit': 'EMU'},
                                  'height': {'magnitude': 500000,  'unit': 'EMU'}},
                    'transform': {'scaleX': 1, 'scaleY': 1,
                                  'translateX': 960000, 'translateY': 3500000, 'unit': 'EMU'},
                },
            }},
            {'insertText': {'objectId': s_id, 'text': 'Gerado pelo EduCore • IA Educacional'}},
            {'updateTextStyle': {
                'objectId': s_id, 'textRange': {'type': 'ALL'},
                'style': {
                    'fontSize':        {'magnitude': 16, 'unit': 'PT'},
                    'foregroundColor': {'opaqueColor': {'rgbColor': _COLORS['orange']}},
                    'fontFamily':      'Calibri',
                },
                'fields': 'fontSize,foregroundColor,fontFamily',
            }},
            {'updateParagraphStyle': {
                'objectId': s_id, 'textRange': {'type': 'ALL'},
                'style': {'alignment': 'CENTER'}, 'fields': 'alignment',
            }},
        ]

    def _content_requests(self, slide_data: dict, idx: int) -> list:
        sid      = f'slide_{idx}'
        hdr_id   = f'header_{idx}'
        title_id = f'title_{idx}'
        body_id  = f'body_{idx}'

        content_text = '\n'.join(f'• {item}' for item in slide_data.get('content', []))

        return [
            {'insertSlide': {
                'insertionIndex': idx + 1,
                'objectId': sid,
                'slideLayoutReference': {'predefinedLayout': 'BLANK'},
            }},
            {'createShape': {
                'objectId': hdr_id, 'shapeType': 'RECTANGLE',
                'elementProperties': {
                    'pageObjectId': sid,
                    'size':      {'width': {'magnitude': 9144000, 'unit': 'EMU'},
                                  'height': {'magnitude': 914400,  'unit': 'EMU'}},
                    'transform': {'scaleX': 1, 'scaleY': 1,
                                  'translateX': 0, 'translateY': 0, 'unit': 'EMU'},
                },
            }},
            {'updateShapeProperties': {
                'objectId': hdr_id,
                'shapeProperties': {
                    'shapeBackgroundFill': {'solidFill': {'color': {'rgbColor': _COLORS['blue']}}},
                    'outline': {'outlineFill': {'solidFill': {'color': {'rgbColor': _COLORS['blue']}}}},
                },
                'fields': 'shapeBackgroundFill,outline',
            }},
            {'createShape': {
                'objectId': title_id, 'shapeType': 'TEXT_BOX',
                'elementProperties': {
                    'pageObjectId': sid,
                    'size':      {'width': {'magnitude': 8700000, 'unit': 'EMU'},
                                  'height': {'magnitude': 800000,  'unit': 'EMU'}},
                    'transform': {'scaleX': 1, 'scaleY': 1,
                                  'translateX': 228000, 'translateY': 70000, 'unit': 'EMU'},
                },
            }},
            {'insertText': {'objectId': title_id, 'text': slide_data.get('title', '')}},
            {'updateTextStyle': {
                'objectId': title_id, 'textRange': {'type': 'ALL'},
                'style': {
                    'fontSize':        {'magnitude': 24, 'unit': 'PT'},
                    'bold':            True,
                    'foregroundColor': {'opaqueColor': {'rgbColor': _COLORS['white']}},
                    'fontFamily':      'Calibri',
                },
                'fields': 'fontSize,bold,foregroundColor,fontFamily',
            }},
            {'createShape': {
                'objectId': body_id, 'shapeType': 'TEXT_BOX',
                'elementProperties': {
                    'pageObjectId': sid,
                    'size':      {'width': {'magnitude': 8700000, 'unit': 'EMU'},
                                  'height': {'magnitude': 3800000, 'unit': 'EMU'}},
                    'transform': {'scaleX': 1, 'scaleY': 1,
                                  'translateX': 228000, 'translateY': 990000, 'unit': 'EMU'},
                },
            }},
            {'insertText': {'objectId': body_id, 'text': content_text}},
            {'updateTextStyle': {
                'objectId': body_id, 'textRange': {'type': 'ALL'},
                'style': {
                    'fontSize':        {'magnitude': 18, 'unit': 'PT'},
                    'foregroundColor': {'opaqueColor': {'rgbColor': _COLORS['dark']}},
                    'fontFamily':      'Calibri',
                },
                'fields': 'fontSize,foregroundColor,fontFamily',
            }},
        ]


slides_service = SlidesService()
