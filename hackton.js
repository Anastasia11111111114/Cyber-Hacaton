const apiKey = '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';

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('goal-form').addEventListener('submit', async function(event) {
      event.preventDefault();

      const userInput = document.getElementById('user-input').value;
      const responseDiv = document.getElementById('output');

      if (!userInput.trim()) {
        responseDiv.textContent = "Пожалуйста, введите текст.";
        return;
      }

      responseDiv.textContent = "🔄 Анализируем...";

      try {
        console.log(data);
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4', // или 'gpt-4' — если у тебя есть доступ
            messages: [
              { role: 'system', content: 'Ты помогаешь людям анализировать и структурировать их цели.' },
              { role: 'user', content: userInput }
            ],
            temperature: 0.7
          })
        });

        const data = await response.json();

        const reply = data.choices?.[0]?.message?.content || "Ошибка получения ответа.";
        responseDiv.textContent = reply;
      } catch (error) {
        responseDiv.textContent = "Произошла ошибка при подключении к AI.";
        console.error(error);
      }
    });
  });


  
