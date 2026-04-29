import React, { useState, useRef, useEffect } from 'react';
import { askQuestion } from '../services/api';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

        // Prepare history payload, omitting the first welcome message to save tokens if desired, 
        // or just keeping it all. Let's send everything except the very first welcome message.
        const historyPayload = messages.slice(1).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));

        // Add user message to UI
        setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await askQuestion(userQuery, historyPayload);

            // Build assistant response with sources if available
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.answer,
                sources: response.sources || []
            }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: `❌ Sorry, I encountered an error: ${typeof error === 'string' ? error : error.detail || 'Failed to connect to AI.'}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadPDF = (source) => {
        try {
            const doc = new jsPDF();

            // Title
            doc.setFontSize(22);
            doc.setTextColor(40, 40, 40);
            doc.text(`Incident Report #${source.id}`, 14, 20);

            // Meta data
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

            // Original Report Section
            doc.setFontSize(14);
            doc.setTextColor(40, 40, 40);
            doc.text('Original Report', 14, 40);

            doc.setFontSize(11);
            doc.setTextColor(60, 60, 60);
            const reportText = source.report_text || 'No report text available.';
            const splitReport = doc.splitTextToSize(reportText, 180);
            doc.text(splitReport, 14, 48);

            let currentY = 48 + (splitReport.length * 5) + 10;

            if (source.analysis) {
                // Analysis Section
                doc.setFontSize(14);
                doc.setTextColor(40, 40, 40);
                doc.text('AI Analysis Summary', 14, currentY);

                const analysisInfo = [
                    ['Category', source.analysis.category || source.category || 'Uncategorized'],
                    ['Severity', source.analysis.severity || 'Unknown'],
                    ['Root Cause', source.analysis.root_cause || 'Unknown']
                ];

                autoTable(doc, {
                    startY: currentY + 5,
                    head: [['Attribute', 'Details']],
                    body: analysisInfo,
                    theme: 'grid',
                    headStyles: { fillColor: [66, 135, 245] }
                });

                currentY = doc.lastAutoTable.finalY + 15;

                // Contributing Factors
                if (source.analysis.contributing_factors?.length) {
                    doc.setFontSize(14);
                    doc.text('Contributing Factors', 14, currentY);
                    const factors = source.analysis.contributing_factors.map(f => [f]);

                    autoTable(doc, {
                        startY: currentY + 5,
                        body: factors,
                        theme: 'plain',
                        styles: { cellPadding: 2, fontSize: 11, textColor: [80, 80, 80] }
                    });
                    currentY = doc.lastAutoTable.finalY + 10;
                }

                // Prevention Measures
                if (source.analysis.prevention_measures?.length) {
                    doc.setFontSize(14);
                    doc.text('Prevention Measures', 14, currentY);
                    const measures = source.analysis.prevention_measures.map(m => [m]);

                    autoTable(doc, {
                        startY: currentY + 5,
                        body: measures,
                        theme: 'plain',
                        styles: { cellPadding: 2, fontSize: 11, textColor: [20, 120, 40] }
                    });
                }
            }

            // Save PDF
            doc.save(`incident_${source.id}_report.pdf`);
        } catch (err) {
            console.error("PDF Generate Error:", err);
            alert("Failed to generate PDF: " + err.message);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm flex flex-col h-[650px] border border-slate-100 overflow-hidden">

            {/* Chat Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm z-10">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="text-2xl">🤖</span> Ask the Database
                </h2>
                <p className="text-sm text-slate-500 mt-1.5 font-medium ml-8">Get AI-generated answers based on your historical incident reports.</p>
            </div>

            {/* Messages Window */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50/30 space-y-6">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 text-[15px] ${msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm shadow-md shadow-blue-500/10'
                            : 'bg-white text-slate-800 border border-slate-100 shadow-sm rounded-2xl rounded-bl-sm'
                            }`}>
                            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed">
                                <ReactMarkdown
                                    components={{
                                        a: ({ node, ...props }) => {
                                            if (props.href?.startsWith('download:')) {
                                                const incidentId = parseInt(props.href.split(':')[1]);
                                                // Find the source matching this ID to download
                                                const sourceToDownload = msg.sources?.find(s => s.id === incidentId);

                                                return (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (sourceToDownload) {
                                                                downloadPDF(sourceToDownload);
                                                            } else {
                                                                // Fallback if the AI mentioned an ID that wasn't strictly in the sources subset
                                                                alert(`Could not find full report details for Incident #${incidentId} to download.`);
                                                            }
                                                        }}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded transition-colors"
                                                        title={`Download PDF for Incident #${incidentId}`}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                        </svg>
                                                        {props.children}
                                                    </button>
                                                );
                                            }
                                            return <a {...props} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" />;
                                        }
                                    }}
                                >
                                    {/* Pre-process the content to convert 'Incident #X' or 'Incident X' into markdown links */}
                                    {msg.content.replace(/(?:[Ii]ncident\s*#?\s*(\d+))|(?:[Rr]eport\s*#?\s*(\d+))/g, (match, id1, id2) => {
                                        const id = id1 || id2;
                                        // Only link it if we actually have the source in the context (optional, but good for UX)
                                        const hasSource = msg.sources?.some(s => s.id === parseInt(id));
                                        if (hasSource) {
                                            return `[${match}](download:${id})`;
                                        }
                                        return match;
                                    })}
                                </ReactMarkdown>
                            </div>
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-3 border-t border-gray-200 pt-3 flex flex-col gap-2">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Source Incidents:</p>
                                    <div className="flex flex-col gap-2">
                                        {msg.sources.map(source => (
                                            <div key={source.id} className="flex flex-col bg-gray-50 rounded-lg p-3 border border-gray-200 shadow-sm text-sm w-full transition-shadow hover:shadow-md">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-semibold text-gray-800">Incident #{source.id} <span className="font-normal text-gray-500">- {source.category || 'Uncategorized'}</span></span>
                                                    <button
                                                        onClick={() => downloadPDF(source)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white text-xs font-medium rounded-md transition-colors"
                                                        title="Download detailed report"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                        </svg>
                                                        Download PDF
                                                    </button>
                                                </div>
                                                {source.report_text && (
                                                    <p className="text-gray-600 text-xs italic bg-white p-2 border border-gray-100 rounded">"{source.report_text}"</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white text-slate-400 border border-slate-100 shadow-sm rounded-2xl rounded-bl-sm px-5 py-4 w-20 flex justify-center items-center gap-1.5 h-[52px]">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="E.g., What are the most common causes of worker injuries?"
                        className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-slate-700 transition-all placeholder:text-slate-400"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="px-8 py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20 disabled:shadow-none translate-y-0 active:translate-y-0 hover:-translate-y-0.5"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default QAChat;
