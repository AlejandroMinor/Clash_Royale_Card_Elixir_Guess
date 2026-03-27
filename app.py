import random

from flask import Flask, jsonify, render_template, request
import elixir_trivia

app = Flask(__name__)
trivia = elixir_trivia.ElixirTrivia()


@app.route('/')
def index():
    number_of_cards = len(trivia.cards['items'])
    card_name, card_cost, card_img_url = trivia.get_card_elixir_trivia()
    return render_template('show_card.html', 
                         card_name=card_name, 
                         card_cost=card_cost, 
                         card_img_url=card_img_url, 
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
        'number_of_cards': len(trivia.cards['items']),
    })


if __name__ == '__main__':
    app.run()