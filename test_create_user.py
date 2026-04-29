import requests
r_login = requests.post('http://localhost:8000/api/auth/token', data={'username':'manager1', 'password':'password123'})
token = r_login.json().get('access_token')

data = {"username":"testuser2", "password":"password123"}
r = requests.post('http://localhost:8000/api/users/create', json=data, headers={"Authorization": f"Bearer {token}"})
print("Create User:", r.status_code, r.text)
