document.addEventListener('DOMContentLoaded', function () {
    
    const slider = document.getElementById('slider');
    const sliderValue = document.getElementById('sliderValue');
    const goalForm = document.getElementById('goal-form');
    const toggleFormButton = document.getElementById('toggle-form-button');
    const voiceButton = document.getElementById('voice-button');
    const voiceOutput = document.getElementById('voice-output');
    const userInput = document.getElementById('user-input');
    const outputElement = document.getElementById('output'); // Добавляем получение элемента output

   
    if (!outputElement) {
        console.error('Элемент с id="output" не найден!');
        return;
    }

    
    slider.addEventListener('input', function () {
        sliderValue.textContent = this.value;
    });

    
    toggleFormButton.addEventListener('click', function() {
        goalForm.style.display = goalForm.style.display === 'block' ? 'none' : 'block   ';
    });
    
   
    voiceButton.addEventListener('click', function () {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Ваш браузер не поддерживает голосовой ввод.');
            return;
        }

        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'ru-RU';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.start();

        recognition.onresult = function (event) {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
            voiceOutput.textContent = `Распознанный текст: ${transcript}`;
        };

        recognition.onerror = function (event) {
            voiceOutput.textContent = `Ошибка распознавания: ${event.error}`;
            voiceOutput.style.color = 'red';
        };

        recognition.onend = function () {
            voiceOutput.textContent += ' (распознавание завершено)';
        };
    });

    
    goalForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const userInputValue = userInput.value;
        
        outputElement.innerHTML = '';
        outputElement.style.color = '';

        if (!userInputValue.trim()) {
            outputElement.textContent = '❌ Введите описание целей!';
            outputElement.style.color = 'red';
            return;
        }

        outputElement.textContent = '⏳ Генерирую задачи...';

        try {
            const response = await fetch('http://localhost:8000/generate', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ 
                    prompt: userInputValue  
                })
            });

            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.tasks) {
                outputElement.innerHTML = data.tasks;
                // Если нужно подсветить HTML:
                if (typeof Prism !== 'undefined') {
                    Prism.highlightAllUnder(outputElement);
                }
            } else {
                throw new Error(data.error || 'Неизвестная ошибка');
            }
        } catch (error) {
            outputElement.innerHTML = `<div class="error">❌ ${error.message}</div>`;
            outputElement.style.color = 'red';
            console.error('Ошибка:', error);
        }
    });
});
