"""
Test script to run a real incident analysis via the API
"""
import requests
import json
from datetime import datetime

# Sample incident report
SAMPLE_INCIDENT = """
INCIDENT REPORT - TRANSPORTATION ACCIDENT
Date: March 5, 2026
Location: Highway 101, Mile Marker 42, Near San Francisco, CA
Time: 14:45 PST

SUMMARY:
A multi-vehicle collision occurred on Highway 101 northbound involving 3 vehicles.
The accident resulted in 2 minor injuries and significant traffic delays.

DETAILED DESCRIPTION:
A silver Honda Civic (Vehicle 1) was traveling northbound on Highway 101 at approximately 
65 mph in the middle lane. Traffic was moderate with several vehicles ahead. The driver 
reported that they were checking their GPS for an upcoming exit and briefly looked down 
at the device for approximately 3-4 seconds.

During this time, the vehicle ahead (white Ford F-150, Vehicle 2) suddenly braked due to 
heavy traffic congestion. The Honda driver did not notice the brake lights immediately and 
failed to brake in time, resulting in a rear-end collision. The impact caused the Honda to 
swerve into the right lane, striking a black Toyota Camry (Vehicle 3) that was traveling 
in that lane.

All three vehicles collided. The Honda driver (23-year-old male) suffered minor whiplash, 
and a passenger in the Toyota (45-year-old female) sustained minor neck strain. Both were 
treated at the scene by paramedics.

ENVIRONMENTAL FACTORS:
- Weather: Clear, sunny conditions
- Road conditions: Dry asphalt, recently resurfaced
- Visibility: Excellent (10+ miles)
- Traffic: Heavy congestion, moving at 40-50 mph average

VEHICLE CONDITIONS:
- Vehicle 1 (Honda): No mechanical issues reported, airbags deployed
- Vehicle 2 (Ford): Normal braking, no mechanical issues
- Vehicle 3 (Toyota): Hit from side, moderate damage

DRIVER FACTORS:
- Honda driver: Distracted by GPS device, failed to maintain safe following distance
- Ford driver: Appropriate braking for conditions, no violation
- Toyota driver: No contributing factors

WITNESS STATEMENTS:
A truck driver (witness) stated: "The silver car wasn't paying attention. They just plowed 
right into the truck. There was plenty of time to brake if they were watching the road."

INITIAL ASSESSMENT:
- Primary cause appears to be driver distraction and inattention
- Failure to maintain safe following distance evident
- All vehicles operating normally before collision
- Speed was within legal limits but excessive for congestion
"""

def test_api():
    """Test the incident analysis API"""
    
    # API endpoint
    api_url = "http://127.0.0.1:8000/analyze"
    
    # Prepare request payload
    payload = {
        "report_text": SAMPLE_INCIDENT
    }
    
    print("=" * 70)
    print("INCIDENT REPORT ANALYZER - TEST")
    print("=" * 70)
    print("\n📋 SUBMITTING INCIDENT REPORT...\n")
    print(f"Report Length: {len(SAMPLE_INCIDENT)} characters")
    print(f"API Endpoint: {api_url}")
    print("\n" + "-" * 70)
    
    try:
        # Send request to API
        response = requests.post(api_url, json=payload)
        
        # Check response status
        if response.status_code == 200:
            result = response.json()
            
            print("\n✅ ANALYSIS SUCCESSFUL\n")
            print("=" * 70)
            print("ANALYSIS RESULTS:")
            print("=" * 70)
            
            # Display results
            print(f"\n🔴 SEVERITY: {result.get('severity', 'N/A')}")
            
            print(f"\n📌 ROOT CAUSE:")
            print(f"   {result.get('root_cause', 'N/A')}")
            
            print(f"\n⚠️  CONTRIBUTING FACTORS:")
            factors = result.get('contributing_factors', [])
            for i, factor in enumerate(factors, 1):
                print(f"   {i}. {factor}")
            
            print(f"\n🛡️  PREVENTION MEASURES:")
            measures = result.get('prevention_measures', [])
            for i, measure in enumerate(measures, 1):
                print(f"   {i}. {measure}")
            
            print("\n" + "=" * 70)
            print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print("=" * 70)
            
            # Print full response for reference
            print("\n\n📊 FULL JSON RESPONSE:")
            print(json.dumps(result, indent=2))
            
        else:
            print(f"\n❌ ERROR: API returned status code {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to API")
        print("Make sure the backend is running on http://127.0.0.1:8000")
        print("\nTo start the backend, run:")
        print("cd c:\\Users\\incharas\\Downloads\\W3\\backend")
        print("python -m uvicorn main:app --host 127.0.0.1 --port 8000")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")

if __name__ == "__main__":
    test_api()
