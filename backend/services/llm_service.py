"""
LLM service for interacting with Gemini for incident analysis.
Handles prompt construction and structured output generation.
Uses Gemini API with JSON mode for structured responses.
Includes caching and retry logic to handle rate limits gracefully.
"""
import logging
import json
import hashlib
import time
from typing import Dict, List, Optional
import google.generativeai as genai
from google.generativeai.types import generation_types
from config import settings

logger = logging.getLogger(__name__)


class LLMService:
    """Service for interacting with Gemini models for incident analysis."""
    
    # Cache for analysis results to avoid duplicate API calls
    _analysis_cache: Dict[str, Dict] = {}
    _cache_ttl = settings.CACHE_TTL_SECONDS  # Use config TTL
    _cache_timestamps: Dict[str, float] = {}
    _max_cache_size = settings.MAX_CACHE_SIZE
    
    # Retry configuration for rate limit handling
    MAX_RETRIES = settings.FREE_TIER_MAX_RETRIES
    INITIAL_RETRY_DELAY = settings.FREE_TIER_INITIAL_RETRY_DELAY
    
    # Request rate limiting to prevent hitting per-minute quotas
    _last_request_time: float = 0
    _min_request_interval = settings.MIN_REQUEST_INTERVAL_SECONDS if settings.ENABLE_RATE_LIMITING else 0
    
    def __init__(self):
        """Initialize the LLM service with Gemini client."""
        api_key = settings.GEMINI_API_KEY
        
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set in environment variables")
        
        genai.configure(api_key=api_key)
        self.model_name = settings.GEMINI_MODEL
        logger.info(f"Initialized LLM service with Gemini model: {self.model_name}")
    
    def analyze_incident(
        self, 
        report_text: str, 
        context_reports: Optional[List[Dict]] = None
    ) -> Dict:
        """
        Analyze incident report and return structured output using Gemini.
        Implements caching to avoid duplicate API calls and retry logic for rate limits.
        
        Args:
            report_text: The incident report to analyze
            context_reports: Optional list of similar past incidents for context
            
        Returns:
            Dictionary with analysis results containing:
                - root_cause: Primary cause of the incident
                - contributing_factors: List of contributing factors
                - severity: Incident severity (Critical/High/Medium/Low)
                - prevention_measures: Recommended prevention measures
            
        Raises:
            ValueError: If response is not valid JSON or max retries exceeded
            Exception: If Gemini API call fails
        """
        # Check cache first
        cache_key = self._generate_cache_key(report_text, context_reports)
        cached_result = self._get_cached_analysis(cache_key)
        if cached_result is not None:
            logger.info("Returning cached analysis result")
            return cached_result
        
        logger.info("Starting incident analysis with retry logic")
        
        system_prompt = self._get_system_prompt()
        model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction=system_prompt
        )
        
        # Implement retry logic with exponential backoff
        for attempt in range(self.MAX_RETRIES):
            try:
                # Apply rate limiting to prevent quota exhaustion
                if self._min_request_interval > 0:
                    time_since_last_request = time.time() - self._last_request_time
                    if time_since_last_request < self._min_request_interval:
                        wait_time = self._min_request_interval - time_since_last_request
                        logger.info(f"Rate limiting: waiting {wait_time:.2f}s before next API call")
                        time.sleep(wait_time)
                
                # Construct prompt with context if available
                user_prompt = self._build_prompt(report_text, context_reports)
                
                # Record request time for rate limiting
                self._last_request_time = time.time()
                
                # Call Gemini API
                response = model.generate_content(
                    user_prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=settings.LLM_TEMPERATURE,
                        max_output_tokens=settings.LLM_MAX_TOKENS,
                        response_mime_type="application/json"
                    )
                )
                
                # Extract response
                content = response.text
                logger.debug(f"LLM response: {content[:200]}...")
                
                # Clean up potential markdown formatting
                clean_content = content.strip()
                if clean_content.startswith("```json"):
                    clean_content = clean_content[7:]
                elif clean_content.startswith("```"):
                    clean_content = clean_content[3:]
                if clean_content.endswith("```"):
                    clean_content = clean_content[:-3]
                clean_content = clean_content.strip()
                
                # Parse JSON response
                try:
                    analysis = json.loads(clean_content, strict=False)
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON. Error: {e}")
                    logger.error(f"Raw output causing error:\n{clean_content}")
                    # Try a simple repair for truncated JSON
                    if "Unterminated string" in str(e) or "Expecting" in str(e):
                        try:
                            logger.info("Attempting to repair truncated JSON...")
                            analysis = json.loads(clean_content + '"]}', strict=False)
                        except Exception:
                            try:
                                analysis = json.loads(clean_content + '"}', strict=False)
                            except Exception:
                                raise ValueError(f"LLM produced invalid JSON: {e} (Truncated?)")
                        logger.info("Successfully repaired truncated JSON")
                    else:
                        raise ValueError(f"LLM produced invalid JSON: {e}")
                
                # Validate before caching
                if self.validate_analysis_output(analysis):
                    # Cache the result
                    self._cache_analysis(cache_key, analysis)
                    logger.info("Incident analysis completed successfully")
                    return analysis
                else:
                    raise ValueError("Invalid analysis output structure")
                    
            except Exception as e:
                error_str = str(e)
                # Check if it's a rate limit error (429)
                if "429" in error_str or "quota" in error_str.lower() or "rate limit" in error_str.lower():
                    if attempt < self.MAX_RETRIES - 1:
                        # Calculate exponential backoff delay
                        delay = self.INITIAL_RETRY_DELAY * (2 ** attempt)
                        logger.warning(
                            f"Rate limit hit. Retrying in {delay}s "
                            f"(attempt {attempt + 1}/{self.MAX_RETRIES})"
                        )
                        time.sleep(delay)
                        continue
                    else:
                        logger.error(
                            "Max retries exceeded for rate limit. "
                        )
                        raise ValueError(
                            f"API quota exceeded. Max retries ({self.MAX_RETRIES}) reached."
                        )
                else:
                    # Exception might be a validation error or other issue, raise it
                    if isinstance(e, ValueError) and "Invalid analysis output structure" in str(e):
                        logger.error(f"Validation error: {str(e)}")
                        raise
                    
                    if attempt < self.MAX_RETRIES - 1:
                        delay = self.INITIAL_RETRY_DELAY * (2 ** attempt)
                        logger.warning(
                            f"API error: {error_str}. Retrying in {delay}s "
                            f"(attempt {attempt + 1}/{self.MAX_RETRIES})"
                        )
                        time.sleep(delay)
                        continue
                    else:
                        logger.error(f"Gemini API error: {error_str}")
                        raise
        
        raise ValueError("Failed to complete analysis after maximum retries")

    
    def _get_system_prompt(self) -> str:
        """Get system prompt for incident analysis."""
        return """You are an expert incident analyst specializing in transportation safety.
        
Your task is to analyze incident and accident reports and provide structured analysis.

Always respond with ONLY valid JSON in this exact format:
{
    "category": "string representing the type of incident (e.g., Vehicle Collision, Traffic Violation (No Helmet), Traffic Violation (No Seatbelt), Equipment Failure, Worker Injury, Environmental)",
    "root_cause": "string describing the primary root cause",
    "contributing_factors": ["factor1", "factor2", "factor3"],
    "severity": "one of: Critical, High, Medium, Low",
    "prevention_measures": ["measure1", "measure2", "measure3"],
    "incident_date": "string representing the actual date of the incident (e.g., 'YYYY-MM-DD' or 'Unknown' if not specified)",
    "incident_location": "string representing where the incident occurred (e.g., 'Intersection of Main and Oak', 'Warehouse A', or 'Unknown')",
    "latitude": 0.0,
    "longitude": 0.0
}

Guidelines:
- Estimate the approximate latitude and longitude coordinates based on the incident report. Provide as floats. If unknown, return null.
- Severity levels: Critical (fatalities/major injuries), High (injuries present), 
  Medium (property damage, minor injuries), Low (near-miss, no injuries)
- Be concise but comprehensive
- Keep all text fields brief, under 3 sentences each, to avoid truncation
- Focus on transportation industry terminology
- Consider environmental, human, and mechanical factors
- Return ONLY the JSON object, no additional text before or after it
"""
    
    def _build_prompt(
        self, 
        report_text: str, 
        context_reports: Optional[List[Dict]] = None
    ) -> str:
        """
        Build the analysis prompt with RAG context.
        
        Args:
            report_text: Current report to analyze
            context_reports: Similar past incidents for context
            
        Returns:
            Formatted prompt string
        """
        prompt = f"Analyze this incident report:\n\n{report_text}\n\n"
        
        if context_reports:
            prompt += "For reference, here are similar past incidents:\n\n"
            for i, report in enumerate(context_reports, 1):
                prompt += f"{i}. {report.get('report_text', '')}\n"
                if 'analysis' in report:
                    prompt += f"   Previous Analysis: {report['analysis'].get('root_cause', '')}\n\n"
        
        prompt += "\nProvide a detailed structured analysis for the current incident."
        return prompt
    
    
    def _generate_cache_key(self, report_text: str, context_reports: Optional[List[Dict]] = None) -> str:
        """
        Generate a cache key based on the report text and context.
        
        Args:
            report_text: The incident report text
            context_reports: Optional context reports
            
        Returns:
            Hash-based cache key
        """
        # Create a hashable representation of the input
        cache_input = report_text
        if context_reports:
            # Include context in cache key to differentiate analyses with different context
            for report in context_reports:
                cache_input += str(report.get('report_text', ''))
        
        # Generate hash
        return hashlib.md5(cache_input.encode()).hexdigest()
    
    def _get_cached_analysis(self, cache_key: str) -> Optional[Dict]:
        """
        Retrieve cached analysis if available and not expired.
        
        Args:
            cache_key: The cache key
            
        Returns:
            Cached analysis dict or None if not found/expired
        """
        if cache_key in self._analysis_cache:
            timestamp = self._cache_timestamps.get(cache_key, 0)
            if time.time() - timestamp < self._cache_ttl:
                return self._analysis_cache[cache_key]
            else:
                # Cache expired, remove it
                del self._analysis_cache[cache_key]
                del self._cache_timestamps[cache_key]
        
        return None
    
    def _cache_analysis(self, cache_key: str, analysis: Dict) -> None:
        """
        Cache an analysis result with size limit enforcement.
        
        Args:
            cache_key: The cache key
            analysis: The analysis result to cache
        """
        # Enforce max cache size - remove oldest entry if at limit
        if len(self._analysis_cache) >= self._max_cache_size:
            # Find and remove oldest cache entry
            oldest_key = min(
                self._cache_timestamps.keys(),
                key=lambda k: self._cache_timestamps[k]
            )
            del self._analysis_cache[oldest_key]
            del self._cache_timestamps[oldest_key]
            logger.debug(f"Evicted oldest cache entry to maintain size limit")
        
        self._analysis_cache[cache_key] = analysis
        self._cache_timestamps[cache_key] = time.time()
        logger.debug(f"Cached analysis result ({len(self._analysis_cache)}/{self._max_cache_size})")
    
    def answer_question_with_context(self, question: str, context_incidents: List[Dict], history: List[Dict] = None) -> str:
        """
        Answer a user question based strictly on the provided context incidents,
        incorporating previous conversation history if available.
        
        Args:
            question: The user's natural language question.
            context_incidents: A list of relevant past incidents from FAISS.
            history: Optional list of previous chat messages.
            
        Returns:
            A string containing the AI's answer.
        """
        try:
            # Format context
            context_text = ""
            for idx, incident in enumerate(context_incidents):
                incident_id = incident.get('incident_id', 'Unknown')
                context_text += f"\n--- Incident #{incident_id} ---"
                context_text += f"\nReport: {incident.get('report_text', 'N/A')}"
                analysis = incident.get('analysis', {})
                context_text += f"\nSeverity: {analysis.get('severity', 'Unknown')}"
                context_text += f"\nCategory: {analysis.get('category', 'Unknown')}"
                context_text += f"\nRoot Cause: {analysis.get('root_cause', 'Unknown')}\n"

            system_prompt = f"""You are a specialized Safety Data Analyst API.
Your job is to answer the user's question.

Here is the context (past incident reports matching their query):
{context_text}

Rules:
1. If the user's question is a greeting (e.g., "Hello", "Hi") or completely unrelated to transportation safety or incident reports, answer them politely and generally. Example: "Hello! I am the Incident Report Analyzer AI. How can I help you regarding safety data today?"
2. If the user is asking about incident data, base your answer STRICTLY on the provided context. If it's a follow-up question, use the conversation history to understand what the user is referring to.
3. If the user asks about incidents but the context does not contain enough information, say so politely. Do not make up answers or use outside knowledge.
4. Be concise, analytical, and professional.
5. If the user asks to download, export, or view a PDF of an incident report, simply generate a brief response confirming the incident was found, and tell them they can click the 'Download PDF' button attached to the relevant incident source card below. Do NOT apologize or say you cannot generate files.
6. CRITICAL: If the user's question was completely unrelated to the incidents (like a greeting), you MUST begin your response with the exact string `[IRRELEVANT]`.
7. CRITICAL: At the very end of your response, on a new line, you MUST output a list of the incident IDs that you used to formulate your answer, in this exact format: `SOURCES: [1, 5, 12]`. If you did not use any specific incidents, output `SOURCES: []`.
"""
            
            # Format history for Gemini API
            messages = []
            if history:
                import copy
                for msg in history:
                    # Map 'assistant' to 'model' for Gemini
                    role = 'model' if msg.get('role') == 'assistant' else 'user'
                    messages.append({"role": role, "parts": [msg.get('content', '')]})

            # Add the current question to the messages array
            messages.append({"role": "user", "parts": [question]})

            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_prompt
            )

            logger.info("Sending RAG question (with history) to LLM...")

            # Instead of passing just the string question, start a chat session if we have history
            # or just generate_content with the messages array
            response = model.generate_content(
                messages,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3, # Low temp for factual RAG
                    max_output_tokens=settings.LLM_MAX_TOKENS
                )
            )
            answer = response.text.strip()
            
            return answer

        except Exception as e:
            logger.error(f"Error generating RAG answer: {str(e)}")
            return "I'm sorry, I encountered an error while trying to process your question."

    def validate_analysis_output(self, analysis: Dict) -> bool:
        """
        Validate that analysis output has required fields.
        
        Args:
            analysis: Analysis dictionary to validate
            
        Returns:
            True if valid, False otherwise
        """
        required_fields = {
            "category": str,
            "root_cause": str,
            "contributing_factors": list,
            "severity": str,
            "prevention_measures": list,
            "incident_date": str,
            "incident_location": str,
            "latitude": (float, type(None)),
            "longitude": (float, type(None))
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


# Global service instance - created with error handling
try:
    llm_service = LLMService()
except ValueError as e:
    logger.warning(f"LLM service not initialized: {e}")
    llm_service = None
