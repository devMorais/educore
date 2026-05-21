import logging
import os
from typing import List
from google.oauth2 import service_account
from googleapiclient.discovery import build

logger = logging.getLogger(__name__)

SCOPES = [
    'https://www.googleapis.com/auth/presentations',
    'https://www.googleapis.com/auth/drive'
]

CREDENTIALS_FILE = os.path.join(
    os.path.dirname(__file__), '..', '..', 'google-credentials.json'
)

# Cores do EduCore
COLORS = {
    'primary': {'red': 0.122, 'green': 0.467, 'blue': 0.706},
    'secondary': {'red': 0.173, 'green': 0.243, 'blue': 0.314},
    'white': {'red': 1.0, 'green': 1.0, 'blue': 1.0},
    'light': {'red': 0.945, 'green': 0.969, 'blue': 0.988},
    'accent': {'red': 0.0, 'green': 0.749, 'blue': 0.847},
}


class SlidesService:
    def __init__(self):
        credentials = service_account.Credentials.from_service_account_file(
            CREDENTIALS_FILE, scopes=SCOPES
        )
        self.slides = build('slides', 'v1', credentials=credentials)
        self.drive = build('drive', 'v3', credentials=credentials)

    def create_presentation(self, title: str, slides_data: List[dict], user_email: str = None) -> dict:
        """Cria uma apresentação profissional no Google Slides."""

        # Cria a apresentação
        presentation = self.slides.presentations().create(
            body={'title': title}
        ).execute()

        presentation_id = presentation['presentationId']
        logger.info(f"Apresentação criada: {presentation_id}")

        # Compartilha com o usuário se email fornecido
        if user_email:
            self.drive.permissions().create(
                fileId=presentation_id,
                body={
                    'type': 'user',
                    'role': 'writer',
                    'emailAddress': user_email
                }
            ).execute()

        # Cria os slides
        requests = []

        # Remove o slide padrão vazio
        first_slide_id = presentation['slides'][0]['objectId']

        # Adiciona slide de capa
        requests += self._create_cover_slide(title)

        # Adiciona slides de conteúdo
        for idx, slide in enumerate(slides_data):
            requests += self._create_content_slide(slide, idx)

        # Deleta o slide padrão
        requests.append({'deleteObject': {'objectId': first_slide_id}})

        # Executa todas as alterações
        self.slides.presentations().batchUpdate(
            presentationId=presentation_id,
            body={'requests': requests}
        ).execute()

        # Retorna o link
        return {
            'presentation_id': presentation_id,
            'url': f'https://docs.google.com/presentation/d/{presentation_id}/edit',
            'title': title,
            'total_slides': len(slides_data) + 1
        }

    def _create_cover_slide(self, title: str) -> list:
        """Cria o slide de capa com design profissional."""
        slide_id = 'cover_slide'
        title_id = 'cover_title'
        subtitle_id = 'cover_subtitle'
        bg_id = 'cover_bg'

        return [
            # Adiciona slide
            {
                'insertSlide': {
                    'insertionIndex': 0,
                    'objectId': slide_id,
                    'slideLayoutReference': {'predefinedLayout': 'BLANK'}
                }
            },
            # Fundo azul escuro
            {
                'createShape': {
                    'objectId': bg_id,
                    'shapeType': 'RECTANGLE',
                    'elementProperties': {
                        'pageObjectId': slide_id,
                        'size': {'width': {'magnitude': 9144000, 'unit': 'EMU'},
                                 'height': {'magnitude': 5143500, 'unit': 'EMU'}},
                        'transform': {'scaleX': 1, 'scaleY': 1,
                                      'translateX': 0, 'translateY': 0, 'unit': 'EMU'}
                    }
                }
            },
            {
                'updateShapeProperties': {
                    'objectId': bg_id,
                    'shapeProperties': {
                        'shapeBackgroundFill': {
                            'solidFill': {'color': {'rgbColor': COLORS['secondary']}}
                        },
                        'outline': {'outlineFill': {'solidFill': {'color': {'rgbColor': COLORS['secondary']}}}}
                    },
                    'fields': 'shapeBackgroundFill,outline'
                }
            },
            # Título
            {
                'createShape': {
                    'objectId': title_id,
                    'shapeType': 'TEXT_BOX',
                    'elementProperties': {
                        'pageObjectId': slide_id,
                        'size': {'width': {'magnitude': 7000000, 'unit': 'EMU'},
                                 'height': {'magnitude': 1500000, 'unit': 'EMU'}},
                        'transform': {'scaleX': 1, 'scaleY': 1,
                                      'translateX': 1072000, 'translateY': 1800000, 'unit': 'EMU'}
                    }
                }
            },
            {
                'insertText': {
                    'objectId': title_id,
                    'text': title
                }
            },
            {
                'updateTextStyle': {
                    'objectId': title_id,
                    'textRange': {'type': 'ALL'},
                    'style': {
                        'fontSize': {'magnitude': 36, 'unit': 'PT'},
                        'bold': True,
                        'foregroundColor': {'opaqueColor': {'rgbColor': COLORS['white']}},
                        'fontFamily': 'Montserrat'
                    },
                    'fields': 'fontSize,bold,foregroundColor,fontFamily'
                }
            },
            {
                'updateParagraphStyle': {
                    'objectId': title_id,
                    'textRange': {'type': 'ALL'},
                    'style': {'alignment': 'CENTER'},
                    'fields': 'alignment'
                }
            },
            # Subtítulo
            {
                'createShape': {
                    'objectId': subtitle_id,
                    'shapeType': 'TEXT_BOX',
                    'elementProperties': {
                        'pageObjectId': slide_id,
                        'size': {'width': {'magnitude': 7000000, 'unit': 'EMU'},
                                 'height': {'magnitude': 500000, 'unit': 'EMU'}},
                        'transform': {'scaleX': 1, 'scaleY': 1,
                                      'translateX': 1072000, 'translateY': 3400000, 'unit': 'EMU'}
                    }
                }
            },
            {
                'insertText': {
                    'objectId': subtitle_id,
                    'text': 'Gerado pelo EduCore • IA Educacional'
                }
            },
            {
                'updateTextStyle': {
                    'objectId': subtitle_id,
                    'textRange': {'type': 'ALL'},
                    'style': {
                        'fontSize': {'magnitude': 16, 'unit': 'PT'},
                        'foregroundColor': {'opaqueColor': {'rgbColor': COLORS['accent']}},
                        'fontFamily': 'Montserrat'
                    },
                    'fields': 'fontSize,foregroundColor,fontFamily'
                }
            },
            {
                'updateParagraphStyle': {
                    'objectId': subtitle_id,
                    'textRange': {'type': 'ALL'},
                    'style': {'alignment': 'CENTER'},
                    'fields': 'alignment'
                }
            },
        ]

    def _create_content_slide(self, slide_data: dict, idx: int) -> list:
        """Cria um slide de conteúdo profissional."""
        slide_id = f'slide_{idx}'
        header_id = f'header_{idx}'
        title_id = f'title_{idx}'
        content_id = f'content_{idx}'

        content_text = '\n'.join([f'• {item}' for item in slide_data.get('content', [])])

        return [
            {
                'insertSlide': {
                    'insertionIndex': idx + 1,
                    'objectId': slide_id,
                    'slideLayoutReference': {'predefinedLayout': 'BLANK'}
                }
            },
            # Header azul
            {
                'createShape': {
                    'objectId': header_id,
                    'shapeType': 'RECTANGLE',
                    'elementProperties': {
                        'pageObjectId': slide_id,
                        'size': {'width': {'magnitude': 9144000, 'unit': 'EMU'},
                                 'height': {'magnitude': 900000, 'unit': 'EMU'}},
                        'transform': {'scaleX': 1, 'scaleY': 1,
                                      'translateX': 0, 'translateY': 0, 'unit': 'EMU'}
                    }
                }
            },
            {
                'updateShapeProperties': {
                    'objectId': header_id,
                    'shapeProperties': {
                        'shapeBackgroundFill': {
                            'solidFill': {'color': {'rgbColor': COLORS['primary']}}
                        },
                        'outline': {'outlineFill': {'solidFill': {'color': {'rgbColor': COLORS['primary']}}}}
                    },
                    'fields': 'shapeBackgroundFill,outline'
                }
            },
            # Título no header
            {
                'createShape': {
                    'objectId': title_id,
                    'shapeType': 'TEXT_BOX',
                    'elementProperties': {
                        'pageObjectId': slide_id,
                        'size': {'width': {'magnitude': 8500000, 'unit': 'EMU'},
                                 'height': {'magnitude': 800000, 'unit': 'EMU'}},
                        'transform': {'scaleX': 1, 'scaleY': 1,
                                      'translateX': 300000, 'translateY': 80000, 'unit': 'EMU'}
                    }
                }
            },
            {
                'insertText': {
                    'objectId': title_id,
                    'text': slide_data.get('title', '')
                }
            },
            {
                'updateTextStyle': {
                    'objectId': title_id,
                    'textRange': {'type': 'ALL'},
                    'style': {
                        'fontSize': {'magnitude': 24, 'unit': 'PT'},
                        'bold': True,
                        'foregroundColor': {'opaqueColor': {'rgbColor': COLORS['white']}},
                        'fontFamily': 'Montserrat'
                    },
                    'fields': 'fontSize,bold,foregroundColor,fontFamily'
                }
            },
            # Conteúdo
            {
                'createShape': {
                    'objectId': content_id,
                    'shapeType': 'TEXT_BOX',
                    'elementProperties': {
                        'pageObjectId': slide_id,
                        'size': {'width': {'magnitude': 8500000, 'unit': 'EMU'},
                                 'height': {'magnitude': 3800000, 'unit': 'EMU'}},
                        'transform': {'scaleX': 1, 'scaleY': 1,
                                      'translateX': 300000, 'translateY': 1000000, 'unit': 'EMU'}
                    }
                }
            },
            {
                'insertText': {
                    'objectId': content_id,
                    'text': content_text
                }
            },
            {
                'updateTextStyle': {
                    'objectId': content_id,
                    'textRange': {'type': 'ALL'},
                    'style': {
                        'fontSize': {'magnitude': 18, 'unit': 'PT'},
                        'foregroundColor': {'opaqueColor': {'rgbColor': COLORS['secondary']}},
                        'fontFamily': 'Montserrat'
                    },
                    'fields': 'fontSize,foregroundColor,fontFamily'
                }
            },
        ]


slides_service = SlidesService()