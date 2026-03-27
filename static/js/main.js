
document.addEventListener('DOMContentLoaded', function() {
    const inputField = document.getElementById('respuesta_input');
    const stepDownBtn = document.getElementById('step_down');
    const stepUpBtn = document.getElementById('step_up');

    const clampAnswerValue = (nextValue) => {
        const min = Number.parseInt(inputField?.min ?? '0', 10);
        const max = Number.parseInt(inputField?.max ?? '10', 10);
        const normalized = Number.isFinite(nextValue) ? nextValue : 0;
        return Math.max(min, Math.min(max, normalized));
    };

    const setAnswerValue = (nextValue) => {
        if (!inputField) {
            return;
        }

        inputField.value = String(clampAnswerValue(nextValue));
    };

    const bumpAnswerValue = (delta) => {
        const current = Number.parseInt(inputField?.value || '0', 10);
        setAnswerValue((Number.isFinite(current) ? current : 0) + delta);
    };

    if (inputField) {
        setAnswerValue(Number.parseInt(inputField.value || '0', 10));
        inputField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                answer();
            }
        });

        inputField.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                bumpAnswerValue(1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                bumpAnswerValue(-1);
            }
        });
    }

    if (stepDownBtn) {
        stepDownBtn.addEventListener('click', function() {
            bumpAnswerValue(-1);
        });
    }

    if (stepUpBtn) {
        stepUpBtn.addEventListener('click', function() {
            bumpAnswerValue(1);
        });
    }
    
    updateStats();
    hydrateRarityForStoredCards();
});

const RARITY_LABELS = {
    common: 'Comun',
    rare: 'Especial',
    epic: 'Epica',
    legendary: 'Legendaria',
    champion: 'Campeon',
};

function normalizeRarity(value) {
    if (typeof value !== 'string') {
        return null;
    }

    const key = value.trim().toLowerCase();
    return RARITY_LABELS[key] ? key : null;
}

function rarityLabel(value) {
    return RARITY_LABELS[value] || 'Sin rareza';
}

function normalizeCardNameKey(name) {
    if (typeof name !== 'string') {
        return '';
    }

    return name
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '');
}

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

function normalizeCorrectCard(card) {
    if (typeof card === 'string') {
        const name = card.trim();
        return name ? { name, cost: null, image: null, rarity: null } : null;
    }

    if (!card || typeof card !== 'object') {
        return null;
    }

    const name = typeof card.name === 'string' ? card.name.trim() : '';
    if (!name) {
        return null;
    }

    const parsedCost = Number.parseInt(card.cost, 10);
    const cost = Number.isFinite(parsedCost) ? parsedCost : null;
    const image = typeof card.image === 'string' && card.image.trim() ? card.image.trim() : null;
    const rarity = normalizeRarity(card.rarity);

    return { name, cost, image, rarity };
}

function getCorrectCards() {
    const raw = JSON.parse(sessionStorage.getItem('correctCards')) || [];
    const uniqueByName = new Map();

    (Array.isArray(raw) ? raw : []).forEach((card) => {
        const normalized = normalizeCorrectCard(card);
        if (!normalized) {
            return;
        }

        const existing = uniqueByName.get(normalized.name);
        if (!existing) {
            uniqueByName.set(normalized.name, normalized);
            return;
        }

        uniqueByName.set(normalized.name, {
            name: existing.name,
            cost: existing.cost ?? normalized.cost,
            image: existing.image || normalized.image,
            rarity: existing.rarity ?? normalized.rarity,
        });
    });

    const cleaned = Array.from(uniqueByName.values());
    sessionStorage.setItem('correctCards', JSON.stringify(cleaned));
    return cleaned;
}

function getCorrectCardNames() {
    return getCorrectCards().map((card) => card.name);
}

function answer() {
    const card_name = (
        document.querySelector('input[name="card_name"]')?.value
        || document.getElementById('card_name')?.textContent
        || ''
    ).trim();
    const card_cost = document.querySelector('input[name="card_cost"]').value;
    const respuesta = document.querySelector('input[name="respuesta"]').value;
    const card_image = document.getElementById('image')?.getAttribute('src') || null;
    const card_rarity = normalizeRarity(document.querySelector('input[name="card_rarity"]')?.value);
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
        if (!correctCards.some((card) => card.name === card_name)) {
            correctCards.push({
                name: card_name,
                cost: Number.parseInt(card_cost, 10),
                image: card_image,
                rarity: card_rarity,
            });
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
        document.querySelector('input[name="respuesta"]').value = '0';
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
            listItem.className = 'correct-card-item';

            const infoWrapper = document.createElement('div');
            infoWrapper.className = 'correct-card-info';

            if (card.image) {
                const thumb = document.createElement('img');
                thumb.src = card.image;
                thumb.alt = card.name;
                thumb.className = 'correct-card-thumb';
                thumb.loading = 'lazy';
                infoWrapper.appendChild(thumb);
            }

            const textWrapper = document.createElement('div');
            textWrapper.className = 'correct-card-text';

            const nameEl = document.createElement('span');
            nameEl.className = 'correct-card-name';
            nameEl.textContent = card.name;

            const costEl = document.createElement('span');
            costEl.className = 'correct-card-cost';
            costEl.textContent = rarityLabel(card.rarity);

            const badgeEl = document.createElement('span');
            badgeEl.className = 'correct-card-badge';
            badgeEl.textContent = card.cost !== null ? `${card.cost}` : '?';
            badgeEl.title = card.cost !== null ? `Costo de elixir: ${card.cost}` : 'Costo de elixir desconocido';

            textWrapper.appendChild(nameEl);
            textWrapper.appendChild(costEl);
            infoWrapper.appendChild(textWrapper);
            listItem.appendChild(infoWrapper);
            listItem.appendChild(badgeEl);

            listItem.style.animationDelay = (index * 0.1) + 's';
            correctCardsList.appendChild(listItem);
        });
    }
}

function verifyUniqueCard(cardName) {
    return !getCorrectCardNames().includes(cardName);
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
    correctCards.forEach((card) => params.append('exclude', card.name));

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
        const cardRarityEl = document.querySelector('input[name="card_rarity"]');
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
        if (cardRarityEl) {
            cardRarityEl.value = data.card_rarity || '';
        }
        if (inputEl) {
            inputEl.value = '0';
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

async function hydrateRarityForStoredCards() {
    const cards = getCorrectCards();
    if (!cards.some((card) => !card.rarity)) {
        return;
    }

    try {
        const response = await fetch('/api/cards-metadata', {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
            return;
        }

        const data = await response.json();
        const lookup = {};

        (Array.isArray(data.items) ? data.items : []).forEach((item) => {
            const key = normalizeCardNameKey(item?.name);
            const rarity = normalizeRarity(item?.rarity);
            if (key && rarity) {
                lookup[key] = rarity;
            }
        });

        let changed = false;
        const hydrated = cards.map((card) => {
            if (card.rarity) {
                return card;
            }

            const rarity = lookup[normalizeCardNameKey(card.name)] || null;
            if (!rarity) {
                return card;
            }

            changed = true;
            return { ...card, rarity };
        });

        if (changed) {
            sessionStorage.setItem('correctCards', JSON.stringify(hydrated));
            updateStats();
            loadCorrectCards(parseInt(sessionStorage.getItem('number_of_cards')) || 0);
        }
    } catch (error) {
        // Ignore hydration failures to avoid blocking gameplay.
    }
}