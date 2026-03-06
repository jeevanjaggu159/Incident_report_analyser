"""
Test with a very short incident report
Useful for quick testing when quota resets
"""
import requests
import json

API_URL = "http://localhost:8000"

# Very short incident report
short_incident = "Car accident on highway. Driver injured. Minor vehicle damage."

print("=" * 60)
print("  SHORT INCIDENT TEST")
print("=" * 60)
print(f"\nIncident: {short_incident}")
print(f"Length: {len(short_incident)} characters\n")

try:
    response = requests.post(
        f"{API_URL}/api/analyze",
        json={"report_text": short_incident},
        timeout=60
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✓ SUCCESS! Analysis completed:\n")
        print(json.dumps(result.get("analysis"), indent=2))
    else:
        print(f"✗ Error (Status {response.status_code}):")
        print(response.json())
        
except requests.exceptions.Timeout:
    print("✗ Request timed out")
except Exception as e:
    print(f"✗ Error: {str(e)}")

print("\n" + "=" * 60)
