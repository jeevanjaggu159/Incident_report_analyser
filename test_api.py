#!/usr/bin/env python
"""
Test script for Incident Report Analyzer API
Tests all endpoints
"""
import requests
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

class APITester:
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
    
    def log_result(self, test_name: str, success: bool, message: str = ""):
        """Log test result"""
        status = "✓ PASS" if success else "✗ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"       {message}")
        self.test_results.append((test_name, success, message))
    
    def test_health_check(self) -> bool:
        """Test health check endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_result("Health Check", True, f"Status: {data.get('service')}")
                    return True
            self.log_result("Health Check", False, f"Status code: {response.status_code}")
            return False
        except Exception as e:
            self.log_result("Health Check", False, str(e))
            return False
    
    def test_analyze_endpoint(self) -> bool:
        """Test analyze endpoint"""
        try:
            test_report = "There was a major traffic incident on the highway near Exit 42. A truck carrying hazardous materials lost control and collided with a passenger vehicle. Multiple emergency services responded to the scene. We need to analyze what went wrong and prevent similar incidents."
            
            payload = {"report_text": test_report}
            response = self.session.post(
                f"{self.base_url}/api/analyze",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if "analysis" in data and "severity" in data["analysis"]:
                    self.log_result(
                        "Analyze Endpoint", 
                        True, 
                        f"Severity: {data['analysis'].get('severity')}"
                    )
                    return True
            
            self.log_result("Analyze Endpoint", False, f"Status code: {response.status_code}")
            if response.text:
                print(f"       Response: {response.text[:200]}")
            return False
            
        except requests.Timeout:
            self.log_result("Analyze Endpoint", False, "Request timed out (30s)")
            return False
        except Exception as e:
            self.log_result("Analyze Endpoint", False, str(e))
            return False
    
    def test_history_endpoint(self) -> bool:
        """Test history endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/history")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("History Endpoint", True, f"Retrieved {len(data)} incidents")
                    return True
            
            self.log_result("History Endpoint", False, f"Status code: {response.status_code}")
            return False
            
        except Exception as e:
            self.log_result("History Endpoint", False, str(e))
            return False
    
    def test_analytics_endpoint(self) -> bool:
        """Test analytics endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/analytics")
            if response.status_code == 200:
                data = response.json()
                if "total_incidents" in data:
                    self.log_result(
                        "Analytics Endpoint", 
                        True, 
                        f"Total incidents: {data.get('total_incidents')}"
                    )
                    return True
            
            self.log_result("Analytics Endpoint", False, f"Status code: {response.status_code}")
            return False
            
        except Exception as e:
            self.log_result("Analytics Endpoint", False, str(e))
            return False
    
    def run_all_tests(self):
        """Run all tests"""
        print("\n" + "="*60)
        print("  INCIDENT REPORT ANALYZER - API TEST SUITE")
        print("="*60 + "\n")
        
        tests = [
            self.test_health_check,
            self.test_analyze_endpoint,
            self.test_history_endpoint,
            self.test_analytics_endpoint,
        ]
        
        results = []
        for test in tests:
            results.append(test())
        
        print("\n" + "="*60)
        print("  TEST SUMMARY")
        print("="*60)
        
        passed = sum(results)
        total = len(results)
        
        print(f"\nTotal: {passed}/{total} tests passed")
        
        if passed == total:
            print("\n✓ All tests passed! Application is working correctly.")
        else:
            print(f"\n✗ {total - passed} test(s) failed. Check the details above.")
        
        print("="*60 + "\n")
        
        return passed == total

if __name__ == "__main__":
    tester = APITester()
    tester.run_all_tests()
