from flask import Flask, render_template, request
import elixir_trivia

app = Flask(__name__)
trivia = elixir_trivia.ElixirTrivia()


@app.route('/')
def index():
    card_name, card_cost, card_img_url = trivia.get_card_elixir_trivia()
    return render_template('show_card.html', card_name=card_name, card_cost=card_cost, card_img_url=card_img_url)

@app.route('/respuesta', methods=['POST'])
def respuesta():
    respuesta = str(request.form['respuesta'])
    card_cost = str(request.form['card_cost'])
    print(respuesta)
    print(type(respuesta))
    print(card_cost)
    print(type(card_cost))
    if respuesta == str(card_cost):
        alert_message = 'Respuesta correcta'
        alert_class = 'alert-success'
    else:
        alert_message = 'Respuesta incorrecta'
        alert_class = 'alert-danger'

    return render_template('responce.html', alert_message=alert_message, alert_class=alert_class)

        
if __name__ == '__main__':
    app.run()