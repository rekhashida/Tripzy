import React, { useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiX, FiSend } from 'react-icons/fi';

export default function SupportChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hi there! I am your Tripzy Assistant 🤖. How can I help you today?'
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = (textToSend) => {
    if (!textToSend.trim()) return;

    const userMessage = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMessage]);

    setTimeout(() => {
      const botResponseText = getBotResponse(textToSend);
      setMessages((prev) => [...prev, { sender: 'bot', text: botResponseText }]);
    }, 600);

    setInput('');
  };

  const getBotResponse = (query) => {
    const q = query.toLowerCase();

    if (q.includes('surge') || q.includes('price') || q.includes('fare') || q.includes('cost')) {
      return '🔥 Tripzy uses smart dynamic pricing. Standard rates apply off-peak. During Peak Hours (8:30–10:00 AM & 6:00–8:30 PM), a 1.5x multiplier applies. Late Night rides (10:00 PM–6:00 AM) start with a 1.3x surge, which scales up to 1.6x if there is high demand!';
    }
    if (q.includes('luggage') || q.includes('bag') || q.includes('size') || q.includes('trunk')) {
      return '📦 Luggage size-based pricing is automatically calculated: \n• Small Luggage: 1.0x (No extra charge)\n• Medium Luggage: 1.5x (50% extra)\n• Large Luggage: 1.8x (80% extra)\nThis compensates drivers for carrying large packages.';
    }
    if (q.includes('wallet') || q.includes('pay') || q.includes('balance') || q.includes('card')) {
      return '💳 The Tripzy Digital Wallet allows you to add simulated funds (up to ₹10,000) and pay for your rides or parcel deliveries with one click. Simply click your wallet balance in the navbar to top up!';
    }
    if (q.includes('pool') || q.includes('share') || q.includes('co-passenger')) {
      return '👥 Ride Pooling matches passengers traveling in the same direction. It reduces road traffic and saves you between 30% to 50% on individual travel costs!';
    }
    if (q.includes('voice') || q.includes('mic') || q.includes('speak')) {
      return '🎙️ Our accessibility features include Voice Booking! Go to the Voice tab, click the microphone, and state your route (e.g. "Ahmedabad to Gandhinagar") to book a ride hands-free.';
    }
    if (q.includes('safety') || q.includes('sos') || q.includes('emergency') || q.includes('police')) {
      return '🛡️ Your safety is our priority. During active rides, a floating SOS button is available on your tracking screen. Clicking it instantly alerts the Admin and shares your details.';
    }

    return "I'm the Tripzy Assistant. You can ask me about fares, luggage fees, digital wallet, pooling, or safety. Click one of the quick options below for help!";
  };

  const quickReplies = [
    { label: '🔥 Surge Pricing info', value: 'Tell me about surge pricing' },
    { label: '📦 Luggage rules', value: 'What are the luggage pricing rules?' },
    { label: '🌿 Eco savings', value: 'What is eco savings?' },
    { label: '💳 Digital Wallet help', value: 'How does the digital wallet work?' }
  ];

  return (
    <div className="support-chatbot-container">
      {isOpen ? (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-title">Tripzy Assistant 🤖</div>
            <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}>
              <FiX />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((m, idx) => (
              <div key={idx} className={`chat-message ${m.sender === 'user' ? 'user-msg' : 'bot-msg'}`}>
                <div className="message-bubble">{m.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-quick-replies">
            {quickReplies.map((qr, idx) => (
              <button 
                key={idx} 
                className="quick-reply-chip"
                onClick={() => handleSendMessage(qr.value)}
              >
                {qr.label}
              </button>
            ))}
          </div>

          <form 
            className="chatbot-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="chatbot-input"
            />
            <button type="submit" className="chatbot-send-btn">
              <FiSend />
            </button>
          </form>
        </div>
      ) : (
        <button className="chatbot-trigger-btn" onClick={() => setIsOpen(true)}>
          <FiMessageSquare />
        </button>
      )}
    </div>
  );
}
