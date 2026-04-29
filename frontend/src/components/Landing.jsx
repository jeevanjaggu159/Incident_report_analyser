import React, { useEffect, useState } from 'react';

const Landing = ({ onGetStarted }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden selection:bg-blue-200">

      {/* Navbar Minimal */}
      <nav className="fixed w-full top-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">🚗</span>
            <span className="font-bold text-slate-800 tracking-tight">Incident Report Analyzer</span>
          </a>

        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-24 pb-12 sm:pt-32 sm:pb-16 px-4 max-w-7xl mx-auto text-center flex flex-col items-center">

        {/* Decorative Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none transform translate-x-1/2 translate-y-1/2"></div>

        <div className={`transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Now with Conversational AI
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl leading-[1.1]">
            Turn Transportation Incidents into
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mt-2">
              Actionable Intelligence.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 font-medium mb-8 max-w-2xl mx-auto leading-relaxed">
            Stop digging through filing cabinets. Our AI instantly analyzes incident reports, extracts root causes, suggests prevention measures, and learns from your historical data.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-lg transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 w-full sm:w-auto"
            >
              Launch Analyzer
            </button>
            <a
              href="#features"
              className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl text-lg transition-all shadow-sm border border-slate-200 w-full sm:w-auto text-center"
            >
              See Features
            </a>
          </div>
        </div>
      </div>

      {/* Mockup Preview */}
      <div className={`max-w-6xl mx-auto px-4 mt-4 mb-24 transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'}`}>
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-4">
          <div className="absolute top-0 left-0 w-full h-12 bg-slate-100/80 border-b border-slate-200 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          {/* Abstract representation of the dashboard */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
            <div className="md:col-span-2 space-y-6">
              <div className="h-64 bg-slate-100 rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <div className="w-32 h-6 bg-slate-200 rounded-lg"></div>
                  <div className="w-16 h-8 bg-blue-100 rounded-xl"></div>
                </div>
                <div className="space-y-3">
                  <div className="w-full h-3 bg-slate-200 rounded-full"></div>
                  <div className="w-5/6 h-3 bg-slate-200 rounded-full"></div>
                  <div className="w-4/6 h-3 bg-slate-200 rounded-full"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-40 bg-purple-50 rounded-2xl border border-purple-100"></div>
                <div className="h-40 bg-blue-50 rounded-2xl border border-blue-100"></div>
              </div>
            </div>
            <div className="h-full min-h-[400px] bg-slate-100 rounded-2xl border border-slate-200 p-4">
              <div className="w-1/2 h-5 bg-slate-200 rounded-lg mb-6"></div>
              <div className="space-y-4">
                <div className="flex justify-end"><div className="w-3/4 h-12 bg-blue-200 rounded-2xl rounded-br-none"></div></div>
                <div className="flex justify-start"><div className="w-5/6 h-24 bg-white rounded-2xl rounded-bl-none shadow-sm"></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="bg-white py-32 border-t border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to improve safety culture</h2>
            <p className="text-slate-600 text-lg">Powerful AI modeling paired with an intuitive interface designed specifically for transportation and logistics incident tracking.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm">
                ⚙️
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Instant Analysis</h3>
              <p className="text-slate-600 leading-relaxed">
                Paste your raw incident report text and instantly receive a structured breakdown of root causes, severity, and contributing factors automatically generated by Gemini AI.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm">
                📚
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Searchable Database</h3>
              <p className="text-slate-600 leading-relaxed">
                Every analyzed report is saved to a secure database. Easily filter by date or perform full-text searches to find historical precedents and generate downloadable PDF reports.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-lg transition-shadow mt-0 md:-translate-y-4">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm">
                🤖
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Conversational AI Chat</h3>
              <p className="text-slate-600 leading-relaxed">
                Need specific data? Chat seamlessly with your historical records. Our context-aware RAG architecture retrieves exact incident details and remembers your follow-up questions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-slate-900 py-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 w-full h-full bg-blue-500/10 blur-3xl transform -translate-x-1/2 rounded-full"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to streamline your reporting?</h2>
          <p className="text-slate-300 text-xl mb-10 mb-10 max-w-2xl mx-auto">
            Join safety professionals who use AI to turn chaotic narrative reports into actionable prevention strategies.
          </p>
          <button
            onClick={onGetStarted}
            className="px-10 py-5 bg-white text-slate-900 font-bold rounded-2xl text-xl hover:bg-slate-50 transition-all shadow-xl hover:-translate-y-1"
          >
            Start Analyzing Free
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-sm font-medium">
          © 2026 Incident Report Analyzer. Built for transportation safety professionals.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
