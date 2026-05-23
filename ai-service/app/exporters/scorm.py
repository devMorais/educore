"""
SCORM 1.2 exporter — produces a ZIP package compatible with Moodle, Canvas, Blackboard.
"""
import io
import json
import zipfile
from app.exporters.base import BaseExporter

_MANIFEST_TEMPLATE = """<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="educore_quiz_{quiz_id}" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="educore_org">
    <organization identifier="educore_org">
      <title>{title}</title>
      <item identifier="item_quiz" identifierref="quiz_resource">
        <title>{title}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="quiz_resource" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <file href="quiz_data.json"/>
    </resource>
  </resources>
</manifest>
"""

_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<style>
  body {{ font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 2rem auto; padding: 1rem; }}
  h1 {{ color: #065A82; }}
  .question {{ background: #f0f8ff; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0; border-left: 4px solid #00B4D8; }}
  .question h3 {{ margin: 0 0 1rem; color: #0D1B2A; }}
  .option {{ padding: 0.5rem 1rem; margin: 0.3rem 0; border-radius: 4px; cursor: pointer; border: 2px solid #e0e0e0; }}
  .option:hover {{ background: #e8f4fd; border-color: #00B4D8; }}
  .option.correct {{ background: #d4edda; border-color: #28a745; }}
  .option.wrong {{ background: #f8d7da; border-color: #dc3545; }}
  .explanation {{ background: #fff3cd; padding: 1rem; border-radius: 4px; margin-top: 1rem; display:none; }}
  .badge {{ display: inline-block; padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }}
  .badge-easy {{ background: #d4edda; color: #155724; }}
  .badge-medium {{ background: #fff3cd; color: #856404; }}
  .badge-hard {{ background: #f8d7da; color: #721c24; }}
  #score-panel {{ display:none; text-align:center; padding:2rem; background:#065A82; color:#fff; border-radius:12px; }}
  #submit-btn {{ background:#065A82; color:#fff; border:none; padding:1rem 2rem; border-radius:8px; font-size:1rem; cursor:pointer; margin-top:1rem; }}
</style>
</head>
<body>
<h1>{title}</h1>
<p>{total_questions} questões &bull; Gerado pelo EduCore AI</p>
<div id="quiz-container"></div>
<button id="submit-btn" onclick="submitQuiz()">Finalizar Quiz</button>
<div id="score-panel"><h2 id="score-text"></h2><p>Quiz EduCore</p></div>
<script>
const quizData = {quiz_json};
let answers = {{}};

function renderQuiz() {{
  const container = document.getElementById('quiz-container');
  quizData.questions.forEach((q, idx) => {{
    const div = document.createElement('div');
    div.className = 'question';
    div.id = 'q-' + idx;
    const diff = q.difficulty || 'medium';
    div.innerHTML = '<h3>' + (idx+1) + '. ' + q.question + ' <span class="badge badge-' + diff + '">' + diff + '</span></h3>';
    q.options.forEach(opt => {{
      const btn = document.createElement('div');
      btn.className = 'option';
      btn.textContent = opt;
      btn.onclick = function() {{ selectAnswer(idx, opt, q.correct_answer, q.explanation, div); }};
      div.appendChild(btn);
    }});
    const exp = document.createElement('div');
    exp.className = 'explanation';
    exp.id = 'exp-' + idx;
    div.appendChild(exp);
    container.appendChild(div);
  }});
}}

function selectAnswer(idx, opt, correct, explanation, qDiv) {{
  if (answers[idx] !== undefined) return;
  answers[idx] = opt;
  const btns = qDiv.querySelectorAll('.option');
  btns.forEach(btn => {{
    btn.onclick = null;
    if (btn.textContent === correct) btn.classList.add('correct');
    else if (btn.textContent === opt) btn.classList.add('wrong');
  }});
  const exp = document.getElementById('exp-' + idx);
  exp.textContent = explanation || '';
  exp.style.display = 'block';
}}

function submitQuiz() {{
  const total = quizData.questions.length;
  let correct = 0;
  quizData.questions.forEach((q, idx) => {{
    if (answers[idx] === q.correct_answer) correct++;
  }});
  const pct = Math.round((correct / total) * 100);
  document.getElementById('score-text').textContent = correct + ' / ' + total + ' corretas (' + pct + '%)';
  document.getElementById('score-panel').style.display = 'block';
  document.getElementById('submit-btn').style.display = 'none';
  if (typeof API !== 'undefined') {{
    API.LMSInitialize('');
    API.LMSSetValue('cmi.core.score.raw', pct);
    API.LMSSetValue('cmi.core.lesson_status', pct >= 60 ? 'passed' : 'failed');
    API.LMSFinish('');
  }}
}}

renderQuiz();
</script>
</body>
</html>
"""


class ScormExporter(BaseExporter):
    platform_name = "SCORM 1.2"
    platform_version = "1.2"
    output_format = "zip"

    def export_quiz(self, quiz: dict) -> bytes:
        """Return ZIP bytes of a SCORM 1.2 package."""
        title = quiz.get("title", "Quiz EduCore")
        quiz_id = quiz.get("document_id", "1")
        total = len(quiz.get("questions", []))

        manifest = _MANIFEST_TEMPLATE.format(quiz_id=quiz_id, title=title)
        html = _HTML_TEMPLATE.format(
            title=title,
            total_questions=total,
            quiz_json=json.dumps(quiz, ensure_ascii=False),
        )

        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("imsmanifest.xml", manifest)
            zf.writestr("index.html", html)
            zf.writestr("quiz_data.json", json.dumps(quiz, ensure_ascii=False, indent=2))
        return buf.getvalue()
