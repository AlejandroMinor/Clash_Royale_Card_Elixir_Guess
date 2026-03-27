import json
import os
from pathlib import Path

import requests

OFFICIAL_API_URL = 'https://api.clashroyale.com/v1/cards'
OUTPUT_PATH = Path(__file__).resolve().parent / 'data' / 'cards.json'


def fetch_official_cards(api_key):
    headers = {'Authorization': f'Bearer {api_key}'}
    response = requests.get(OFFICIAL_API_URL, headers=headers, timeout=20)
    response.raise_for_status()
    return response.json()


def save_cards(cards):
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open('w', encoding='utf-8') as f:
        json.dump(cards, f, ensure_ascii=False, indent=2)


def main():
    api_key = os.getenv('CR_API_KEY')
    if not api_key:
        raise RuntimeError('Falta CR_API_KEY en variables de entorno.')

    raw_cards = fetch_official_cards(api_key)
    save_cards(raw_cards)

    print(f'Cartas guardadas en: {OUTPUT_PATH}')
    print(f'Total cartas en respuesta oficial: {len(raw_cards.get("items", []))}')


if __name__ == '__main__':
    main()
