import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AssistantBotIcon, SecureShieldIcon, UserIcon } from './assets/MedicalIcons';
import { useAuth } from './context/AuthContext';
import { useAssessment } from './context/AssessmentContext';
import { API_BASE_URL } from './config/api';
import './styles/DashboardPage.css';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  sources?: string[];
  grounded?: boolean;
}

interface AIAssistantPageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({
  onNavigate,
  onLogout,
}) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { state: assessmentState, pastAssessments, isFemale } = useAssessment();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: t('aiAssistant.welcomeMessage', "Hello! I'm your OncoGuards AI Clinical Assistant. I can help answer questions about cancer screening guidelines, explain medical terminology, or guide you through your risk assessment report. How can I assist you today?")
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Helper to build a concise, privacy-safe context summary from existing assessment state
  const buildContextSummary = (): string | null => {
    const parts: string[] = [];
    const age = assessmentState.basicInfo?.age;
    const sex = isFemale ? 'female' : 'male';
    if (age) parts.push(`Age: ${age}`);
    if (sex) parts.push(`Biological sex: ${sex}`);

    if (assessmentState.backendResult?.cancerResults && assessmentState.backendResult.cancerResults.length > 0) {
      const summary = assessmentState.backendResult.cancerResults
        .filter((r) => r.isApplicable !== false)
        .map((r) => `${r.displayName || r.cancerType}: ${r.riskTier || 'Assessed'}`)
        .join(', ');
      if (summary) parts.push(`Latest screening risk tiers: ${summary}`);
    } else if (pastAssessments && pastAssessments.length > 0 && pastAssessments[0].cancerAssessments) {
      const summary = pastAssessments[0].cancerAssessments
        .map((r) => `${r.displayName || r.cancerType}: ${r.riskTier || 'Assessed'}`)
        .join(', ');
      if (summary) parts.push(`Past screening risk tiers: ${summary}`);
    }

    const selectedSymptoms = assessmentState.symptoms?.selectedSymptoms || [];
    if (selectedSymptoms.length > 0) {
      parts.push(`Reported symptoms count: ${selectedSymptoms.length}`);
    }

    return parts.length > 0 ? parts.join(' | ') : null;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Build conversation history (excluding initial static greeting)
      const conversationHistory = [
        ...messages
          .filter(m => m.id !== '1')
          .map(m => ({
            role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
            content: m.text
          })),
        { role: 'user' as const, content: userText }
      ];

      const resp = await fetch(`${API_BASE_URL}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationHistory,
          cancer_type: null,
          context_summary: buildContextSummary(),
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned ${resp.status}`);
      }

      const data: { reply: string; retrieved_sources?: string[]; grounded?: boolean } = await resp.json();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.reply || t('aiAssistant.defaultReply', "I'm here to help with your health and screening questions."),
        sources: data.retrieved_sources && data.retrieved_sources.length > 0 ? data.retrieved_sources : undefined,
        grounded: data.grounded,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: "I'm having trouble connecting to the OncoGuards clinical AI assistant right now. Please ensure the backend server is running and try again."
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="dashboard-layout-root">
      <Sidebar
        activeItem="ai-assistant"
        onNavigate={(item) => onNavigate(item as string)}
        onLogout={onLogout}
        unreadAlertsCount={0}
      />

      <main className="dashboard-main-area" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 0 }}>
        {/* Top Header */}
        <header className="dashboard-top-bar" style={{ flexShrink: 0, padding: '20px 32px' }}>
          <div className="top-bar-left">
            <h1 className="main-heading" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AssistantBotIcon size={28} /> {t('aiAssistant.title', 'OncoGuards AI Assistant')}
            </h1>
            <p className="main-subtext">{t('aiAssistant.subtitle', 'Evidence-Based Oncology Information & Screening Guidance')}</p>
          </div>
          
          <div className="top-bar-right">
             <div className="patient-user-pill" style={{ cursor: 'default' }}>
              <div className="patient-avatar">
                <UserIcon size={14} color="#FFFFFF" />
              </div>
              <span className="patient-name">{assessmentState.basicInfo.fullName?.trim() || currentUser?.displayName || 'User'}</span>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', backgroundColor: '#F8FAFC' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Disclaimer */}
            <div style={{ backgroundColor: '#EFF6FF', padding: '12px 16px', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', border: '1px solid #BFDBFE' }}>
              <SecureShieldIcon size={20} color="#3B82F6" />
              <p style={{ margin: 0, fontSize: '13px', color: '#1E3A8A' }}>
                <strong>{t('dashboard.clinicalDisclaimerTitle', 'Clinical Notice')}:</strong> {t('aiAssistant.disclaimer', 'This AI provides educational screening guidance based on established medical protocols. It does not provide medical diagnoses. Always consult your oncologist or primary care provider.')}
              </p>
            </div>

            {/* Messages */}
            {messages.map((msg) => (
              <div key={msg.id} style={{ 
                display: 'flex', 
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end',
                gap: '8px'
              }}>
                {msg.sender === 'ai' && (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AssistantBotIcon size={16} color="#FFFFFF" />
                  </div>
                )}
                
                <div style={{
                  maxWidth: '75%',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  borderBottomLeftRadius: msg.sender === 'ai' ? '4px' : '16px',
                  borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px',
                  backgroundColor: msg.sender === 'user' ? '#2563EB' : '#FFFFFF',
                  color: msg.sender === 'user' ? '#FFFFFF' : '#334155',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  border: msg.sender === 'ai' ? '1px solid #E2E8F0' : 'none',
                  fontSize: '15px',
                  lineHeight: '1.5'
                }}>
                  <div>{msg.text}</div>

                  {msg.sender === 'ai' && msg.grounded && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '12px', color: '#16A34A', fontWeight: 500 }}>
                      <SecureShieldIcon size={14} color="#16A34A" />
                      <span>{t('aiAssistant.groundedBadge', 'ICMR / WHO Clinical Protocol Grounded')}</span>
                    </div>
                  )}

                  {msg.sender === 'ai' && msg.sources && msg.sources.length > 0 && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', width: '100%', fontWeight: 600 }}>
                        {t('aiAssistant.sourcesTitle', 'Clinical References:')}
                      </span>
                      {msg.sources.map((src, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            backgroundColor: '#EFF6FF',
                            color: '#1D4ED8',
                            borderRadius: '12px',
                            border: '1px solid #BFDBFE'
                          }}
                        >
                          {src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: '8px' }}>
                 <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AssistantBotIcon size={16} color="#FFFFFF" />
                  </div>
                 <div style={{ padding: '12px 16px', borderRadius: '16px', borderBottomLeftRadius: '4px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', gap: '4px' }}>
                    <span className="typing-dot" style={{ width: '6px', height: '6px', backgroundColor: '#94A3B8', borderRadius: '50%', animation: 'blink 1.4s infinite both' }}></span>
                    <span className="typing-dot" style={{ width: '6px', height: '6px', backgroundColor: '#94A3B8', borderRadius: '50%', animation: 'blink 1.4s infinite both 0.2s' }}></span>
                    <span className="typing-dot" style={{ width: '6px', height: '6px', backgroundColor: '#94A3B8', borderRadius: '50%', animation: 'blink 1.4s infinite both 0.4s' }}></span>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div style={{ flexShrink: 0, padding: '20px 32px', backgroundColor: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
          <form onSubmit={handleSendMessage} style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('aiAssistant.inputPlaceholder', 'Type your medical question here...')}
              style={{
                flex: 1,
                padding: '14px 20px',
                borderRadius: '999px',
                border: '1px solid #CBD5E1',
                outline: 'none',
                fontSize: '15px',
                backgroundColor: '#F8FAFC'
              }}
              disabled={isTyping}
            />
            <button 
              type="submit" 
              disabled={!inputValue.trim() || isTyping}
              style={{
                padding: '0 24px',
                borderRadius: '999px',
                backgroundColor: inputValue.trim() && !isTyping ? '#2563EB' : '#94A3B8',
                color: '#FFF',
                border: 'none',
                cursor: inputValue.trim() && !isTyping ? 'pointer' : 'not-allowed',
                fontWeight: 600,
                transition: 'background-color 0.2s'
              }}
            >
              {t('aiAssistant.sendBtn', 'Send')}
            </button>
          </form>
          <style>{`
            @keyframes blink {
              0% { opacity: 0.2; }
              20% { opacity: 1; }
              100% { opacity: 0.2; }
            }
          `}</style>
        </div>
      </main>
      
      <MobileBottomNav activeItem="ai-assistant" onNavigate={onNavigate} />
    </div>
  );
};

export default AIAssistantPage;
