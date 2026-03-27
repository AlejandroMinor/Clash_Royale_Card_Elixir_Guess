import json
import random
from pathlib import Path


class ElixirTrivia:
    def __init__(self):
        self.local_cards_path = Path(__file__).resolve().parent / 'data' / 'cards.json'
        self.cards = self.get_cards()

    def _normalize_cards_payload(self, payload):
        if not isinstance(payload, dict) or 'items' not in payload:
            return None

        items = [card for card in payload.get('items', []) if card.get('elixirCost') is not None]
        return {'items': items}

    def _read_local_cards(self):
        if not self.local_cards_path.exists():
            return None

        with self.local_cards_path.open('r', encoding='utf-8') as file:
            payload = json.load(file)

        return self._normalize_cards_payload(payload)

    def get_cards(self):
        local_cards = self._read_local_cards()
        if local_cards and local_cards.get('items'):
            return local_cards

        raise RuntimeError(
            'No se pudieron cargar cartas desde data/cards.json. Ejecuta update_cards_from_official.py para actualizar el dataset.'
        )

    def get_random_card(self):
        card = random.choice(self.cards['items'])
        return card

    def get_card_elixir_trivia(self):
        card = self.get_random_card()
        card_name = card['name']
        card_elixir_cost = card['elixirCost']
        card_img_url = card.get('iconUrls', {}).get('medium', '')
        return card_name, card_elixir_cost, card_img_url


    def launch_trivia(self):
        card_name, card_elixir_cost, _ = self.get_card_elixir_trivia()
        print(f'Card Name: {card_name}')
        while True:
            user_input = input('Guess the elixir cost: ')
            if user_input == str(card_elixir_cost):
                print('Correct!')
                break
            else:
                print('Incorrect! Try again.')

    def play_again(self):
        while True:
            user_input = input('Do you want to play again? (y/n): ')
            if user_input.lower() == 'y':
                self.launch_trivia()
            elif user_input.lower() == 'n':
                print('Thanks for playing!')
                break
            else:
                print('Invalid input! Try again.')



    