from fastapi import FastAPI, HTTPException
import httpx
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

class PromptRequest(BaseModel):
    prompt: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = "http://localhost:11434/api/generate"

def format_response(text: str) -> str:
    """Просто возвращает ответ без лишней обработки (можно добавить strip и т.п.)"""
    return text.strip()

@app.post("/generate")
async def generate_tasks(request: PromptRequest):
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            system_prompt = """<|system|>
Ты — помощник по планированию задач. Пользователь даст тебе тему (например: "рабочий день", "учеба", "отдых" и т.п.).
Сгенерируй задачи на день в формате ЧЁТКОГО HTML для фронтенда.

🔧 Формат:
<ul class="schedule">
        <li class="time-block"> 
        <div>
    <h2>Понедельник</h2> 
        <div>
        </li>   
    <li class="time-block"> 
        <h3>Утро</h3>
    <ul>
      <li>
        <input type="checkbox" id="task1">
        <label for="task1">...(07:00–07:15)</label>
      </li>
      <li>
        <input type="checkbox" id="task2">
        <label for="task2">... (07:30–08:00)</label>
      </li>
    </ul>
  </li>
  <li class="time-block">
    <h3>День</h3>
    <ul>
      <li>
        <input type="checkbox" id="task3">
        <label for="task3">... (13:00–14:00)</label>
      </li>
    </ul>
  </li>
  <li class="time-block">
    <h3>Вечер</h3>
    <ul>
      <li>
        <input type="checkbox" id="task4">
        <label for="task4">Прогулка (19:00–19:30)</label>
      </li>
    </ul>
  </li>
</ul>

📌 Строгие требования:
- Используй ровно такую структуру с `<ul class="schedule">` как корнем.
- Внутри каждого `li.time-block` должен быть `<h3>` и внутренний `<ul>`.
- Каждая задача должна быть внутри `<li>`, с `<input type="checkbox" id="taskN">` и `<label for="taskN">...`.
- ID задач должны быть уникальны (`task1`, `task2`, и т.д.).
- Время выполнения задачи указывается в скобках после названия.
- Не добавляй ничего вне `<ul class="schedule">`.
- Не добавляй лишних пустых строк или `<br>`.

Твоя задача — вернуть только HTML согласно этому шаблону.
<|end|>
"""
            user_prompt = f"<|user|>Тема: {request.prompt}<|end|>\n<|assistant|>"

            response = await client.post(
                OLLAMA_URL,
                json={
                    "model": "phi3",
                    "prompt": system_prompt + user_prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "num_predict": 500,
                        "stop": ["<|end|>"]
                    }
                }
            )

            if response.status_code != 200:
                raise HTTPException(status_code=502, detail="Ошибка модели")

            # Get raw response from model
            raw_response = response.json().get("response", "")

            # Remove common markdown fences
            raw_response = raw_response.replace("```html", "")
            raw_response = raw_response.replace("```", "")
            raw_response = raw_response.replace("~~~html", "")
            raw_response = raw_response.replace("~~~", "")

            return {"tasks": format_response(raw_response)}

    except httpx.TimeoutException:
        raise HTTPException(504, "Сервер модели не отвечает")
    except Exception as e:
        raise HTTPException(500, f"Ошибка: {str(e)}")
