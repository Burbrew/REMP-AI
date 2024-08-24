'use client';

import { useState, FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'user' | 'system' | 'assistant';
  content: string;
};

export default function Home() {
  const [prompt, setPrompt] = useState<string>('');
  const [link, setLink] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your AI assistant. You can ask me about professors, and I will help you choose the best one based on their reviews.',
    },
  ]);
  const [loading, setLoading] = useState<boolean>(false); // New loading state for the submit button

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const userMessage: Message = { role: 'user', content: prompt };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setPrompt('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      const aiMessage: Message = { role: 'assistant', content: data.message || 'Sorry, something went wrong.' };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      const aiMessage: Message = { role: 'assistant', content: 'Error: Could not fetch response' };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    }
  };

  const handleLinkSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true); // Disable the button after clicking

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ link }),
      });

      const data = await res.json();

      if (data.error) {
        alert(`Error: ${data.error}`);
      } else {
        alert('Professor data successfully added to Pinecone!');
      }

      setLink(''); // Clear the link input
    } catch (error) {
      alert('Error: Could not submit the link');
    } finally {
      setLoading(false); // Re-enable the button after processing
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <h1 className="text-center text-4xl font-extrabold text-gray-900">Rate My Professor AI Assistant</h1>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-4 h-96 overflow-y-scroll">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`p-3 rounded-lg ${
                    message.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  ) : (
                    <span>{message.content}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
            <div className="flex">
              <textarea
                id="prompt"
                name="prompt"
                rows={1}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your message..."
              />
              <button
                type="submit"
                className="ml-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Send
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 bg-white shadow-md rounded-lg p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Submit Professor Link</h2>
          <form onSubmit={handleLinkSubmit}>
            <div className="flex">
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter the professor's page URL"
                required
              />
              <button
                type="submit"
                className="ml-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={loading} // Disable the button when loading
              >
                {loading ? 'Processing...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
