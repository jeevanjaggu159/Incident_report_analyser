import React, { useState, useRef, useEffect } from 'react';
import { askQuestion } from '../services/api';
import ReactMarkdown from 'react-markdown';

const QAChat = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I am your AI Safety Data Analyst. You can ask me questions about your past incidents, safety trends, or root causes. What would you like to know?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userQuery = input.trim();

        // Add user message to UI
        setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await askQuestion(userQuery);

            // Build assistant response with sources if available
            let answerText = response.answer;
            if (response.sources && response.sources.length > 0) {
                answerText += `\n\n*Sources:* ${response.sources.map(s => `Incident #${s.id}`).join(', ')}`;
            }

            setMessages(prev => [...prev, { role: 'assistant', content: answerText }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: `❌ Sorry, I encountered an error: ${typeof error === 'string' ? error : error.detail || 'Failed to connect to AI.'}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg flex flex-col h-[600px] border border-gray-100">

            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <span className="text-2xl mr-2">🤖</span> Ask the Database
                </h2>
                <p className="text-sm text-gray-500 mt-1">Get AI-generated answers based on your historical incident reports.</p>
            </div>

            {/* Messages Window */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-none'
                            }`}>
                            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white text-gray-800 border border-gray-200 shadow-sm rounded-lg rounded-bl-none p-4 w-24 flex justify-center items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="E.g., What are the most common causes of worker injuries?"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default QAChat;
