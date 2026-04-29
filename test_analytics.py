import requests

def test_analytics():
    # Login first
    login_response = requests.post(
        "http://localhost:8000/api/auth/token",
        data={"username": "manager1", "password": "password123"}
    )
    if not login_response.ok:
        print("Login failed:", login_response.text)
        return
    
    token = login_response.json()["access_token"]
    
    # Fetch analytics
    response = requests.get(
        "http://localhost:8000/api/analytics",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    print("Status Code:", response.status_code)
    import json
    try:
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))
    except:
        print("Response Text:", response.text)

if __name__ == "__main__":
    test_analytics()
