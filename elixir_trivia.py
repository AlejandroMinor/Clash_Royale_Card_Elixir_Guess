import requests
import random

YOUR_API_KEY = ''
class ElixirTrivia:
    def __init__(self):
        self.url = 'https://api.clashroyale.com/v1/cards'
        self.headers = {
            'Authorization': 'Bearer '+ YOUR_API_KEY
        }
        self.cards = self.get_cards()

    def get_cards(self):
        response = requests.get(self.url, headers=self.headers)
        if response.status_code == 200:
            cards = response.json()
            return cards
        else:
            return None
    
    def get_random_card(self):
        card = random.choice(self.cards['items'])
        return card

    def get_card_elixir_trivia(self):
        card = self.get_random_card()
        card_name = card['name']
        card_elixir_cost = card['elixirCost']
        card_img_url = card['iconUrls']['medium']
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



    