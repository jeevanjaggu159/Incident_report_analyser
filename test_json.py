import json
raw_json = """{
  "category": "Vehicle Collision",
  "root_cause": "The driver was texting.
He didn't see the car.",
  "severity": "High"
}"""

try:
    print("Default:")
    print(json.loads(raw_json))
except Exception as e:
    print(repr(e))

try:
    print("\nStrict=False:")
    print(json.loads(raw_json, strict=False))
except Exception as e:
    print(repr(e))
