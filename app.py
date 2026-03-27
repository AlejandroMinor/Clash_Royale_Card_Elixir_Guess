import random
import time

from flask import Flask, jsonify, render_template, request
import elixir_trivia

app = Flask(__name__)
trivia = elixir_trivia.ElixirTrivia()


@app.route('/')
def index():
    number_of_cards = len(trivia.cards['items'])
    card = trivia.get_random_card()
    icon_urls = card.get('iconUrls') or {}
    card_name = card.get('name')
    card_cost = card.get('elixirCost')
    card_img_url = icon_urls.get('medium')
    card_rarity = card.get('rarity')
    return render_template('show_card.html', 
                         card_name=card_name, 
                         card_cost=card_cost, 
                         card_img_url=card_img_url, 
                         card_rarity=card_rarity,
                         asset_version=int(time.time()),
                         number_of_cards=number_of_cards)

@app.route('/respuesta', methods=['POST'])
def respuesta():
    respuesta = str(request.form['respuesta'])
    card_cost = str(request.form['card_cost'])

    if respuesta == card_cost:
        alert_message = 'Respuesta correcta'
        alert_class = 'alert-success'
    else:
        alert_message = f'Respuesta incorrecta'
        alert_class = 'alert-danger'

    return render_template('response.html', alert_message=alert_message, alert_class=alert_class)


@app.route('/api/next-card')
def next_card():
    excluded = set(request.args.getlist('exclude'))
    available_cards = [card for card in trivia.cards['items'] if card.get('name') not in excluded]

    if not available_cards:
        return jsonify({'done': True, 'number_of_cards': len(trivia.cards['items'])})

    card = random.choice(available_cards)
    icon_urls = card.get('iconUrls') or {}
    return jsonify({
        'done': False,
        'card_name': card.get('name'),
        'card_cost': card.get('elixirCost'),
        'card_img_url': icon_urls.get('medium'),
        'card_rarity': card.get('rarity'),
        'number_of_cards': len(trivia.cards['items']),
    })


@app.route('/api/cards-metadata')
def cards_metadata():
    return jsonify({
        'items': [
            {
                'name': card.get('name'),
                'rarity': card.get('rarity'),
            }
            for card in trivia.cards['items']
            if card.get('name')
        ]
    })


if __name__ == '__main__':
    app.run()