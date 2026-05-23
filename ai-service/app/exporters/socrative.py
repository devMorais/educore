"""
Socrative exporter — produces JSON importable via Socrative quiz import.
"""
from app.exporters.base import BaseExporter


class SocrativeExporter(BaseExporter):
    platform_name = "Socrative"
    platform_version = "2024"
    output_format = "json"

    def export_quiz(self, quiz: dict) -> dict:
        questions = []
        for q in quiz.get("questions", []):
            q_type = q.get("type", "multiple_choice")

            if q_type == "true_false":
                choices = ["Verdadeiro", "Falso"]
                correct_index = 0 if q["correct_answer"] == "Verdadeiro" else 1
                so_type = "TF"
            else:
                choices = q.get("options", [])
                correct = q.get("correct_answer", "")
                correct_index = 0
                for i, opt in enumerate(choices):
                    if opt == correct:
                        correct_index = i
                        break
                so_type = "MC"

            questions.append(
                {
                    "type": so_type,
                    "stem": q["question"],
                    "choices": choices,
                    "correct": correct_index,
                    "explanation": q.get("explanation", ""),
                    "difficulty": q.get("difficulty", "medium"),
                }
            )

        return {
            "quiz": {
                "name": quiz.get("title", "Quiz EduCore"),
                "description": "Gerado pelo EduCore AI",
                "language": "pt-BR",
                "questions": questions,
            }
        }
