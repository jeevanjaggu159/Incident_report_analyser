"""
Mock LLM Service for DEMO MODE
Provides simulated incident analysis without API calls.
Perfect for testing and demonstrations.
"""
import logging
import json
import time
from typing import Dict, List, Optional
import random

logger = logging.getLogger(__name__)


class MockLLMService:
    """Mock service that returns realistic incident analysis without API calls."""
    
    # Simulated analysis templates
    ROOT_CAUSES = [
        "Driver fatigue and reduced alertness",
        "Vehicle mechanical failure in braking system",
        "Poor road conditions and inadequate visibility",
        "Human error in vehicle operation",
        "Inadequate vehicle maintenance",
        "Equipment malfunction",
        "Operator inexperience or lack of training",
    ]
    
    CONTRIBUTING_FACTORS_POOL = [
        "Poor visibility",
        "Wet road conditions",
        "Excessive speed",
        "Driver distraction",
        "Mechanical wear",
        "Inadequate signage",
        "Heavy traffic",
        "Vehicle overload",
        "Brake system failure",
        "Tire degradation",
        "Driver fatigue",
        "Weather conditions",
    ]
    
    SEVERITIES = ["Critical", "High", "Medium", "Low"]
    
    PREVENTION_MEASURES_POOL = [
        "Implement regular vehicle maintenance schedule",
        "Provide driver safety training programs",
        "Install advanced braking systems",
        "Improve road signage and markings",
        "Reduce speed limits in high-risk areas",
        "Implement fatigue management protocols",
        "Use real-time vehicle monitoring systems",
        "Conduct regular safety audits",
        "Install weather monitoring systems",
        "Improve vehicle lighting systems",
    ]
    
    def __init__(self):
        """Initialize the mock LLM service."""
        logger.info("Initialized Mock LLM service (DEMO MODE - No API calls)")
    
    def analyze_incident(
        self, 
        report_text: str, 
        context_reports: Optional[List[Dict]] = None
    ) -> Dict:
        """
        Simulate incident analysis with realistic responses.
        
        Args:
            report_text: The incident report to analyze
            context_reports: Optional list of similar past incidents for context
            
        Returns:
            Dictionary with simulated analysis results
        """
        logger.info("Analyzing incident in DEMO MODE")
        
        # Add a small delay to simulate API call
        time.sleep(0.5)
        
        # Determine severity based on keywords in report
        severity = self._determine_severity(report_text)
        
        # Generate analysis
        analysis = {
            "root_cause": random.choice(self.ROOT_CAUSES),
            "contributing_factors": random.sample(self.CONTRIBUTING_FACTORS_POOL, k=3),
            "severity": severity,
            "prevention_measures": random.sample(self.PREVENTION_MEASURES_POOL, k=3),
        }
        
        logger.info(f"Generated mock analysis with severity: {severity}")
        return analysis
    
    def _determine_severity(self, report_text: str) -> str:
        """
        Determine severity level based on keywords in report.
        
        Args:
            report_text: The incident report text
            
        Returns:
            Severity level (Critical/High/Medium/Low)
        """
        text_lower = report_text.lower()
        
        critical_keywords = ["fatality", "fatal", "death", "died", "multiple injuries", "serious injuries"]
        high_keywords = ["injury", "injured", "hospital", "serious", "critical"]
        medium_keywords = ["damage", "collision", "crash", "property", "hurt"]
        
        if any(kw in text_lower for kw in critical_keywords):
            return "Critical"
        elif any(kw in text_lower for kw in high_keywords):
            return "High"
        elif any(kw in text_lower for kw in medium_keywords):
            return "Medium"
        else:
            return "Low"
            
    def answer_question_with_context(self, question: str, context_incidents: List[Dict]) -> str:
        """
        Mock answering a user question.
        
        Args:
            question: The user's natural language question.
            context_incidents: A list of relevant past incidents from FAISS.
            
        Returns:
            A string containing a mock AI answer.
        """
        logger.info("Answering question in DEMO MODE")
        time.sleep(0.5)  # Simulate network latency
        
        return "This is a simulated AI response. To get real answers about high heat and fan speeds, please configure your `GROQ_API_KEY` or `OPENAI_API_KEY` in the `.env` file and turn off `DEMO_MODE`."
    
    def validate_analysis_output(self, analysis: Dict) -> bool:
        """
        Validate that analysis output has required fields.
        
        Args:
            analysis: Analysis dictionary to validate
            
        Returns:
            True if valid, False otherwise
        """
        required_fields = {
            "root_cause": str,
            "contributing_factors": list,
            "severity": str,
            "prevention_measures": list
        }
        
        for field, expected_type in required_fields.items():
            if field not in analysis:
                logger.warning(f"Missing field in analysis: {field}")
                return False
            
            if not isinstance(analysis[field], expected_type):
                logger.warning(f"Invalid type for {field}: expected {expected_type}")
                return False
        
        # Validate severity value
        valid_severities = ["Critical", "High", "Medium", "Low"]
        if analysis["severity"] not in valid_severities:
            logger.warning(f"Invalid severity: {analysis['severity']}")
            return False
        
        return True


# Global service instance
mock_llm_service = MockLLMService()
