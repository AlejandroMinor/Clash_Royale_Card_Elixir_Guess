
document.addEventListener('DOMContentLoaded', function() {
    const inputField = document.getElementById('respuesta_input');
    if (inputField) {
        inputField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                answer();
            }
        });
    }
    
    updateStats();
});

function preloadImage(url, timeoutMs = 2500) {
    if (!url) {
        return Promise.resolve(false);
    }

    return new Promise((resolve) => {
        const img = new Image();
        let settled = false;

        const finish = (ok) => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timer);
            resolve(ok);
        };

        const timer = setTimeout(() => finish(false), timeoutMs);
        img.onload = () => finish(true);
        img.onerror = () => finish(false);
        img.src = url;
    });
}

function transitionCardImage(imageEl, nextImageUrl, nextCardName, imageIsReady) {
    if (!imageEl) {
        return;
    }

    if (!nextImageUrl) {
        imageEl.style.display = 'none';
        return;
    }

    imageEl.style.display = 'inline-block';

    if (!imageIsReady || imageEl.src === nextImageUrl) {
        imageEl.src = nextImageUrl;
        imageEl.alt = nextCardName || 'Carta';
        return;
    }

    const overlay = imageEl.cloneNode(false);
    overlay.removeAttribute('id');
    overlay.classList.remove('image-fade-in');
    overlay.classList.add('card-image-overlay');
    overlay.src = nextImageUrl;
    overlay.alt = nextCardName || 'Carta';

    const parent = imageEl.parentElement;
    if (!parent) {
        imageEl.src = nextImageUrl;
        imageEl.alt = nextCardName || 'Carta';
        return;
    }

    parent.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));

    setTimeout(() => {
        imageEl.src = nextImageUrl;
        imageEl.alt = nextCardName || 'Carta';
        overlay.remove();
    }, 190);
}

function getCorrectCards() {
    const raw = JSON.parse(sessionStorage.getItem('correctCards')) || [];
    const cleaned = Array.from(new Set(
        (Array.isArray(raw) ? raw : [])
            .map((card) => (typeof card === 'string' ? card.trim() : ''))
            .filter(Boolean)
    ));

    sessionStorage.setItem('correctCards', JSON.stringify(cleaned));
    return cleaned;
}

function answer() {
    const card_name = (
        document.querySelector('input[name="card_name"]')?.value
        || document.getElementById('card_name')?.textContent
        || ''
    ).trim();
    const card_cost = document.querySelector('input[name="card_cost"]').value;
    const respuesta = document.querySelector('input[name="respuesta"]').value;
    const alert_answer = document.getElementById('success_alert');
    const alert_error = document.getElementById('error_alert');

    if (!respuesta) {
        showError("Por favor ingresa un número");
        return;
    }

    if (!card_name) {
        showError("No se pudo leer la carta actual.");
        return;
    }

    if (parseInt(card_cost) === parseInt(respuesta)) {
        alert_answer.classList.remove('hidden_element');  
        let correctCards = getCorrectCards();
        if (!correctCards.includes(card_name)) {
            correctCards.push(card_name);
        }
        sessionStorage.setItem('correctCards', JSON.stringify(correctCards));
        updateStats();
        loadCorrectCards(parseInt(sessionStorage.getItem('number_of_cards')) || 0);

        const image = document.getElementById('image');
        if (image) {
            image.classList.add('correct_image');
            setTimeout(() => image.classList.remove('correct_image'), 300);
        }

        setTimeout(function () {
            loadNextCard();
        }, 500);
    } else {
        showError("¡Incorrecto! Inténtalo de nuevo.");
        const image = document.getElementById('image');
        if (image) {
            image.classList.add('shake_image');
            setTimeout(() => {
                image.classList.remove('shake_image');
            }, 220);
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
    }, 1200);
}

function updateStats() {
    const correctCards = getCorrectCards();
    const number_of_cards = parseInt(sessionStorage.getItem('number_of_cards')) || 0;

    const progressText = document.getElementById('progress_text');

    if (progressText) progressText.textContent = correctCards.length + '/' + number_of_cards;
}

function loadCorrectCards(number_of_cards) {
    const correctCardsList = document.getElementById('correct_cards_list');
    const correctCards = getCorrectCards();
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
    const correctCards = getCorrectCards();
    return !correctCards.includes(cardName);
}

function validateGame(number_of_cards, card_name) {
    const correctCards = getCorrectCards();
    const number_of_correct_cards = correctCards.length;
    
    if (number_of_correct_cards == parseInt(number_of_cards)) {
        setTimeout(() => {
            alert("Felicidades. Has adivinado todas las cartas.\n\nVuelve a intentarlo para mejorar tu puntuacion.");
            resetGame();
        }, 500);
    }
    else if (!verifyUniqueCard(card_name)) {
        loadNextCard();
        return;
    }
    
    loadCorrectCards(number_of_cards);
}

function resetGame() {
    sessionStorage.setItem('correctCards', JSON.stringify([]));
    updateStats();
    loadCorrectCards(parseInt(sessionStorage.getItem('number_of_cards')) || 0);
    loadNextCard();
}

function confirmReset() {
    if (confirm("¿Estás seguro de que quieres reiniciar el juego? Se perderá tu progreso actual.")) {
        resetGame();
    }
}

async function loadNextCard() {
    const correctCards = getCorrectCards();
    const params = new URLSearchParams();
    correctCards.forEach((card) => params.append('exclude', card));

    try {
        const response = await fetch('/api/next-card?' + params.toString(), {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
            throw new Error('No se pudo cargar la siguiente carta.');
        }

        const data = await response.json();

        if (data.done) {
            alert('Felicidades. Has adivinado todas las cartas.\n\nVuelve a intentarlo para mejorar tu puntuacion.');
            sessionStorage.setItem('correctCards', JSON.stringify([]));
            updateStats();
            loadCorrectCards(data.number_of_cards || 0);
            return;
        }

        const cardNameEl = document.getElementById('card_name');
        const cardNameHiddenEl = document.querySelector('input[name="card_name"]');
        const cardCostEl = document.querySelector('input[name="card_cost"]');
        const inputEl = document.querySelector('input[name="respuesta"]');
        const imageContainerEl = document.querySelector('.card-image-container');
        let imageEl = document.getElementById('image');
        const successEl = document.getElementById('success_alert');
        const errorEl = document.getElementById('error_alert');
        const nextImageUrl = data.card_img_url || '';

        const imageIsReady = await preloadImage(nextImageUrl);

        if (cardNameEl) {
            cardNameEl.textContent = data.card_name || '';
        }
        if (cardNameHiddenEl) {
            cardNameHiddenEl.value = data.card_name || '';
        }
        if (cardCostEl) {
            cardCostEl.value = data.card_cost ?? '';
        }
        if (inputEl) {
            inputEl.value = '';
            inputEl.focus();
        }
        if (!imageEl && imageContainerEl && nextImageUrl) {
            imageEl = document.createElement('img');
            imageEl.id = 'image';
            imageEl.className = 'card-image';
            imageContainerEl.appendChild(imageEl);
        }

        transitionCardImage(imageEl, nextImageUrl, data.card_name, imageIsReady);

        successEl?.classList.add('hidden_element');
        errorEl?.classList.add('hidden_element');
        if (data.number_of_cards) {
            sessionStorage.setItem('number_of_cards', String(data.number_of_cards));
        }
        updateStats();
    } catch (error) {
        showError('Error al cargar la siguiente carta.');
    }
}