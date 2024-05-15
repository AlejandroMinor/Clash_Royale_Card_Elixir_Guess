function answer(card_name) {
    const card_cost = document.querySelector('input[name="card_cost"]').value;
    const respuesta = document.querySelector('input[name="respuesta"]').value;
    const alert_answer = document.getElementById('success_alert');
    const alert_error = document.getElementById('error_alert');

    if (card_cost == respuesta) {
        alert_answer.classList.remove('hidden_element');  
        let correctCards = JSON.parse(sessionStorage.getItem('correctCards')) || [];
        correctCards.push(card_name);
        sessionStorage.setItem('correctCards', JSON.stringify(correctCards));                

        setTimeout(function () {
            window.location.href = "/";
        }, 2000);
    } else {
        const image = document.getElementById('image');
        image.classList.add('shake_image');
        alert_error.classList.remove('hidden_element');

        setTimeout(() => {
            image.classList.remove('shake_image');
            alert_error.classList.add('hidden_element');
            document.querySelector('input[name="respuesta"]').value = '';
        }, 1000);
    }
}

function loadCorrectCards() {
    const correctCardsList = document.getElementById('correct_cards_list');
    const correctCards = JSON.parse(sessionStorage.getItem('correctCards')) || [];
    correctCardsList.innerHTML = '';
    correctCardsList.className = 'list-group list-group-flush';


    const title = document.createElement('h5');
    title.id = 'cards-title';
    title.textContent = 'Cartas Adivinadas:';
    title.className = 'list-group-item list-group-item-primary';

    if (correctCards.length > 0) {
        title.style.display = 'block';
    } else {
        title.style.display = 'none';
    }
    correctCardsList.appendChild(title);

    correctCards.forEach(card => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item';
        listItem.textContent = card;
        correctCardsList.appendChild(listItem);
    });
}

function verifyUniqueCard(cardName) {
    const correctCards = JSON.parse(sessionStorage.getItem('correctCards')) || [];
    return !correctCards.includes(cardName);
}

function validateGame(number_of_cards, card_name) {
    const number_of_correct_cards = JSON.parse(sessionStorage.getItem('correctCards')).length || 0;
    if (number_of_correct_cards == parseInt(number_of_cards)) {
        alert("¡Felicidades! Has adivinado todas las cartas. Vuelve a intentarlo.");
        resetGame();
    }
    else if (!verifyUniqueCard(card_name)) {
    window.location.href = "/";
    }
}

function resetGame() {
    sessionStorage.setItem('correctCards', JSON.stringify([]));
    loadCorrectCards();
}