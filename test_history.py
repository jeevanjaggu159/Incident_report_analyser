import requests
import json
import io

r = requests.post('http://localhost:8000/api/auth/token', data={'username':'manager1', 'password':'password123'})
t = r.json()['access_token']
r2 = requests.get('http://localhost:8000/api/history', headers={'Authorization': 'Bearer '+t})
with io.open('test_history.json', 'w', encoding='utf-8') as f:
    json.dump(r2.json(), f, indent=2)
