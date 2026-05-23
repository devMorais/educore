"""
Kahoot exporter — produces JSON importable via Kahoot's quiz creator.
Reference format: https://create.kahoot.it (manual import via spreadsheet or API).
"""
from app.exporters.base import BaseExporter


class KahootExporter(BaseExporter):
    platform_name = "Kahoot!"
    platform_version = "2024"
    output_format = "json"

    def export_quiz(self, quiz: dict) -> dict:
        questions = []
        for q in quiz.get("questions", []):
            q_type = q.get("type", "multiple_choice")

            if q_type == "true_false":
                answers = [
                    {"answer": "Verdadeiro", "correct": q["correct_answer"] == "Verdadeiro"},
                    {"answer": "Falso", "correct": q["correct_answer"] == "Falso"},
                ]
                time_ms = 20000
            else:
                answers = [
                    {
                        "answer": opt,
                        "correct": opt == q["correct_answer"],
                    }
                    for opt in q.get("options", [])
                ]
                time_ms = 20000

            difficulty_time = {"easy": 20000, "medium": 30000, "hard": 45000}
            time_ms = difficulty_time.get(q.get("difficulty", "medium"), 20000)

            questions.append(
                {
                    "question": q["question"],
                    "questionFormat": 0,
                    "time": time_ms,
                    "pointsMultiplier": 1,
                    "type": "quiz",
                    "image": "",
                    "answers": answers,
                }
            )

        return {
            "kahoot": {
                "title": quiz.get("title", "Quiz EduCore"),
                "description": f"Gerado automaticamente pelo EduCore AI — {len(questions)} questões",
                "quizType": "quiz",
                "language": "Portuguese, Brazilian",
                "questions": questions,
            }
        }

    def export_xlsx_rows(self, quiz: dict) -> list[list]:
        """Return rows for Excel import (Kahoot spreadsheet format)."""
        header = [
            "Question - max 120 characters",
            "Answer 1 - max 75 characters",
            "Answer 2 - max 75 characters",
            "Answer 3 - max 75 characters",
            "Answer 4 - max 75 characters",
            "Time limit (sec) - 5, 10, 20, 30, 60, 90, 120, 240",
            "Correct answer(s) - Choose 1 or more answers",
        ]
        rows = [header]
        for q in quiz.get("questions", []):
            options = q.get("options", [])
            correct = q.get("correct_answer", "")
            correct_idx = None
            for i, opt in enumerate(options):
                if opt == correct:
                    correct_idx = i + 1
                    break

            row = [
                q["question"][:120],
                options[0][:75] if len(options) > 0 else "",
                options[1][:75] if len(options) > 1 else "",
                options[2][:75] if len(options) > 2 else "",
                options[3][:75] if len(options) > 3 else "",
                30,
                correct_idx or 1,
            ]
            rows.append(row)
        return rows
