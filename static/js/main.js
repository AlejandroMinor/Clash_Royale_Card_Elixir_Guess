
document.addEventListener('DOMContentLoaded', function() {
    const inputField = document.getElementById('respuesta_input');
    if (inputField) {
        inputField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const cardName = document.querySelector('h2')?.textContent || '';
                answer(cardName);
            }
        });
    }
    
    updateStats();
});

function answer(card_name) {
    const card_cost = document.querySelector('input[name="card_cost"]').value;
    const respuesta = document.querySelector('input[name="respuesta"]').value;
    const alert_answer = document.getElementById('success_alert');
    const alert_error = document.getElementById('error_alert');

    if (!respuesta) {
        showError("Por favor ingresa un número");
        return;
    }

    if (parseInt(card_cost) === parseInt(respuesta)) {
        alert_answer.classList.remove('hidden_element');  
        let correctCards = JSON.parse(sessionStorage.getItem('correctCards')) || [];
        correctCards.push(card_name);
        sessionStorage.setItem('correctCards', JSON.stringify(correctCards));
        updateStats();

        setTimeout(function () {
            window.location.href = "/";
        }, 2000);
    } else {
        showError("¡Incorrecto! Inténtalo de nuevo.");
        const image = document.getElementById('image');
        if (image) {
            image.classList.add('shake_image');
            setTimeout(() => {
                image.classList.remove('shake_image');
            }, 500);
        }
        document.querySelector('input[name="respuesta"]').value = '';
        document.querySelector('input[name="respuesta"]').focus();
    }
}

function showError(message) {
    const alert_error = document.getElementById('error_alert');
    alert_error.textContent = message;
    alert_error.classList.remove('hidden_element');

    setTimeout(() => {
        alert_error.classList.add('hidden_element');
    }, 2000);
}

function updateStats() {
    const correctCards = JSON.parse(sessionStorage.getItem('correctCards')) || [];
    const number_of_cards = parseInt(sessionStorage.getItem('number_of_cards')) || 0;

    const progressText = document.getElementById('progress_text');

    if (progressText) progressText.textContent = correctCards.length + '/' + number_of_cards;
}

function loadCorrectCards(number_of_cards) {
    const correctCardsList = document.getElementById('correct_cards_list');
    const correctCards = JSON.parse(sessionStorage.getItem('correctCards')) || [];
    correctCardsList.innerHTML = '';

    if (correctCards.length > 0) {
        correctCards.forEach((card, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = card;
            listItem.style.animationDelay = (index * 0.1) + 's';
            correctCardsList.appendChild(listItem);
        });
    }
}

function verifyUniqueCard(cardName) {
    const correctCards = JSON.parse(sessionStorage.getItem('correctCards')) || [];
    return !correctCards.includes(cardName);
}

function validateGame(number_of_cards, card_name) {
    const correctCards = JSON.parse(sessionStorage.getItem('correctCards')) || [];
    const number_of_correct_cards = correctCards.length;
    
    if (number_of_correct_cards == parseInt(number_of_cards)) {
        setTimeout(() => {
            alert("Felicidades. Has adivinado todas las cartas.\n\nVuelve a intentarlo para mejorar tu puntuacion.");
            resetGame();
        }, 500);
    }
    else if (!verifyUniqueCard(card_name)) {
        window.location.href = "/";
    }
    
    loadCorrectCards(number_of_cards);
}

function resetGame() {
    sessionStorage.setItem('correctCards', JSON.stringify([]));
    window.location.href = "/";
}

function confirmReset() {
    if (confirm("¿Estás seguro de que quieres reiniciar el juego? Se perderá tu progreso actual.")) {
        resetGame();
    }
}