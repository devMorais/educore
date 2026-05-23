from app.exporters.kahoot import KahootExporter
from app.exporters.socrative import SocrativeExporter
from app.exporters.scorm import ScormExporter

EXPORTERS = {
    "kahoot": KahootExporter(),
    "socrative": SocrativeExporter(),
    "scorm": ScormExporter(),
}

__all__ = ["KahootExporter", "SocrativeExporter", "ScormExporter", "EXPORTERS"]
