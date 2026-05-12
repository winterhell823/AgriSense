"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Paperclip, Send, Moon, Sun, X, FileText, Image, Video, Music, Archive, MessageCircle, Bot, User } from 'lucide-react';

interface UploadedFile {
  id: number;
  name: string;
  size: number;
  type: string;
  file: File;
}

interface Message {
  id: number;
  type: 'ai' | 'user' | 'system';
  content: string;
  files?: UploadedFile[];
  analysis?: ImageAnalysisResponse;
  timestamp: Date;
}

interface ImageAnalysisResponse {
  crop: string;
  disease: string;
  confidence: number;
  severity: string;
  disease_explanation: string;
  cause: string;
  treatment: string[];
  prevention: string[];
  organic_solution: string[];
}

const AIModelChat = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'ai',
      content: 'Welcome to AgriSense AI Model! 🌱 I\'m here to help you analyze crop diseases and provide farming insights. Upload crop or leaf images and I\'ll provide detailed analysis with treatment recommendations.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return <Image className="w-4 h-4" aria-label="image file" />;
    if (['mp4', 'avi', 'mkv', 'mov', 'webm'].includes(ext)) return <Video className="w-4 h-4" aria-label="video file" />;
    if (['mp3', 'wav', 'flac', 'ogg', 'aac'].includes(ext)) return <Music className="w-4 h-4" aria-label="audio file" />;
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <Archive className="w-4 h-4" aria-label="archive file" />;
    return <FileText className="w-4 h-4" aria-label="document file" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (files: FileList) => {
    const newFiles = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Add system message about file upload
    const fileNames = newFiles.map(f => f.name).join(', ');
    const systemMessage: Message = {
      id: Date.now(),
      type: 'system',
      content: `📎 Added ${newFiles.length} file(s): ${fileNames}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = (fileId: number) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatImageAnalysis = (data: ImageAnalysisResponse) => {
    const joinItems = (items: string[]) => items.map(item => `- ${item}`).join('\n');

    return [
      `${data.crop} - ${data.disease}`,
      `Confidence: ${data.confidence}%`,
      `Severity: ${data.severity}`,
      '',
      `Explanation: ${data.disease_explanation}`,
      `Cause: ${data.cause}`,
      '',
      `Treatment:\n${joinItems(data.treatment)}`,
      `Prevention:\n${joinItems(data.prevention)}`,
      `Organic solution:\n${joinItems(data.organic_solution)}`,
    ].join('\n');
  };

  const sendMessage = async () => {
    const imageFile = uploadedFiles.find(file => file.type.startsWith('image/'));

    if (!inputValue.trim() && !imageFile) {
      return;
    }

    if (uploadedFiles.length > 0 && !imageFile) {
      const warningMessage: Message = {
        id: Date.now(),
        type: 'system',
        content: 'Please upload a JPG or PNG image for crop disease analysis.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, warningMessage]);
      return;
    }

      const newMessage: Message = {
        id: Date.now(),
        type: 'user',
        content: inputValue.trim() || `Uploaded image: ${imageFile?.name ?? 'crop image'}`,
        files: [...uploadedFiles],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);

      setInputValue('');
      setUploadedFiles([]);
      setIsTyping(true);

      try {
        const formData = new FormData();
        formData.append('file', imageFile!.file, imageFile!.name);

        const response = await fetch('http://localhost:8000/analyze-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Backend error: ${response.status} ${response.statusText}`);
        }

        const data: ImageAnalysisResponse = await response.json();
        const aiResponse: Message = {
          id: Date.now() + 1,
          type: 'ai',
          content: formatImageAnalysis(data),
          analysis: data,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
      } catch (error) {
        const errorMessage: Message = {
          id: Date.now() + 1,
          type: 'system',
          content: error instanceof Error ? error.message : 'Failed to analyze image.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const themeClasses = {
    background: 'bg-[#0a1f12]',
    cardBg: 'bg-[#0d2817]',
    text: 'text-white',
    textSecondary: 'text-emerald-200/60',
    border: 'border-farm-500/20',
    inputBg: 'bg-farm-500/10',
    uploadArea: isDragOver 
      ? 'bg-farm-500/20 border-farm-500/60'
      : 'bg-farm-500/10 border-farm-500/30',
    userMessage: 'bg-farm-500',
    aiMessage: 'bg-farm-500/15',
    systemMessage: 'bg-farm-500/20 text-farm-300'
  };

  return (
    <div className={`w-full min-h-screen transition-colors duration-300 ${themeClasses.background}`}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className={`rounded-2xl shadow-xl border ${themeClasses.cardBg} ${themeClasses.border} mb-6`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-farm-500 to-emerald-600 rounded-2xl shadow-lg">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className={`text-3xl font-bold ${themeClasses.text}`}>AgriSense AI Model</h1>
                  <p className={`mt-1 ${themeClasses.textSecondary}`}>Crop disease detection & farming insights</p>
                </div>
              </div>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-3 rounded-xl border transition-all duration-200 hover:scale-105 hover:shadow-lg ${themeClasses.border} ${themeClasses.inputBg} ${themeClasses.text}`}
              >
                {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
              </button>
            </div>

            {/* Quick Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${themeClasses.uploadArea}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                multiple
                className="hidden"
              />
              <div className="flex items-center justify-center gap-4">
                <Upload className={`w-8 h-8 ${themeClasses.textSecondary}`} />
                <div>
                  <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                    {isDragOver ? 'Drop crop images here!' : 'Upload Crop Images'}
                  </h3>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>
                    Drag images here or{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-farm-400 hover:text-farm-300 underline font-medium"
                    >
                      browse
                    </button>
                  </p>
                </div>
              </div>
            </div>

            {/* Files Ready to Send */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`text-sm font-medium ${themeClasses.text}`}>
                    Images ready to analyze ({uploadedFiles.length})
                  </h4>
                  <button
                    onClick={() => setUploadedFiles([])}
                    className={`text-xs px-3 py-1 rounded-full ${themeClasses.textSecondary} hover:text-red-400 transition-colors`}
                  >
                    Clear all
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className={`flex items-center gap-3 p-3 rounded-lg border ${themeClasses.border} ${themeClasses.inputBg}`}>
                      {getFileIcon(file.name)}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${themeClasses.text}`}>{file.name}</p>
                        <p className={`text-xs ${themeClasses.textSecondary}`}>{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className={`p-1 rounded-full hover:bg-red-500/20 ${themeClasses.textSecondary} hover:text-red-400 transition-colors`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`rounded-2xl shadow-xl border ${themeClasses.cardBg} ${themeClasses.border}`}>
          {/* Chat Header */}
          <div className={`px-6 py-4 border-b ${themeClasses.border}`}>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-farm-500 rounded-full animate-pulse"></div>
              <h3 className={`font-semibold ${themeClasses.text}`}>AI Disease Analysis</h3>
              <span className={`text-sm ${themeClasses.textSecondary}`}>Ready</span>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map(message => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : message.type === 'system' ? 'justify-center' : 'justify-start'}`}>
                {message.type !== 'system' && message.type === 'ai' && (
                  <div className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center ${themeClasses.inputBg}`}>
                    <Bot className="w-5 h-5 text-farm-400" />
                  </div>
                )}
                
                <div className={`max-w-xs lg:max-w-md ${
                  message.type === 'user' ? `${themeClasses.userMessage} text-white ml-3` :
                  message.type === 'ai' ? `${themeClasses.aiMessage} ${themeClasses.text}` :
                  `${themeClasses.systemMessage} text-xs`
                } px-4 py-3 rounded-2xl ${message.type === 'user' ? 'rounded-br-md' : message.type === 'ai' ? 'rounded-bl-md' : 'rounded-lg'}`}>
                  {message.content && <p className="break-words">{message.content}</p>}
                      {message.analysis && (
                        <div className="mt-3 space-y-2 text-sm leading-6">
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="rounded-lg bg-black/20 px-3 py-2">
                              <div className="text-xs uppercase tracking-wide text-white/60">Crop</div>
                              <div className="font-medium">{message.analysis.crop}</div>
                            </div>
                            <div className="rounded-lg bg-black/20 px-3 py-2">
                              <div className="text-xs uppercase tracking-wide text-white/60">Disease</div>
                              <div className="font-medium">{message.analysis.disease}</div>
                            </div>
                            <div className="rounded-lg bg-black/20 px-3 py-2">
                              <div className="text-xs uppercase tracking-wide text-white/60">Confidence</div>
                              <div className="font-medium">{message.analysis.confidence}%</div>
                            </div>
                            <div className="rounded-lg bg-black/20 px-3 py-2">
                              <div className="text-xs uppercase tracking-wide text-white/60">Severity</div>
                              <div className="font-medium">{message.analysis.severity}</div>
                            </div>
                          </div>
                          <p>{message.analysis.disease_explanation}</p>
                          <p><span className="font-semibold">Cause:</span> {message.analysis.cause}</p>
                          <div>
                            <div className="font-semibold">Treatment</div>
                            <ul className="ml-4 list-disc">
                              {message.analysis.treatment.map(item => <li key={item}>{item}</li>)}
                            </ul>
                          </div>
                          <div>
                            <div className="font-semibold">Prevention</div>
                            <ul className="ml-4 list-disc">
                              {message.analysis.prevention.map(item => <li key={item}>{item}</li>)}
                            </ul>
                          </div>
                          <div>
                            <div className="font-semibold">Organic solution</div>
                            <ul className="ml-4 list-disc">
                              {message.analysis.organic_solution.map(item => <li key={item}>{item}</li>)}
                            </ul>
                          </div>
                        </div>
                      )}

                      {message.files && message.files.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.files.map(file => (
                        <div key={file.id} className="flex items-center gap-2 text-sm opacity-90 bg-black/20 rounded px-2 py-1">
                          {getFileIcon(file.name)}
                          <span className="truncate">{file.name}</span>
                          <span className="text-xs">({formatFileSize(file.size)})</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {message.type === 'user' && (
                  <div className={`w-8 h-8 rounded-full ml-3 flex items-center justify-center ${themeClasses.userMessage}`}>
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center ${themeClasses.inputBg}`}>
                  <Bot className="w-5 h-5 text-farm-400" />
                </div>
                <div className={`px-4 py-3 rounded-2xl rounded-bl-md ${themeClasses.aiMessage}`}>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-farm-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-farm-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-farm-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className={`border-t p-4 ${themeClasses.border}`}>
            <div className="flex gap-3 items-end">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 rounded-xl border transition-all duration-200 hover:scale-105 hover:shadow-lg ${themeClasses.border} ${themeClasses.inputBg} ${themeClasses.text}`}
                title="Attach images"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about crop diseases, treatment, or farming tips..."
                  rows={1}
                  className={`w-full px-4 py-3 rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-farm-500 transition-all duration-200 max-h-32 ${themeClasses.inputBg} ${themeClasses.border} ${themeClasses.text} placeholder-emerald-300/40`}
                  style={{ minHeight: '48px' }}
                />
                
                {/* Character count */}
                {inputValue.length > 0 && (
                  <div className={`absolute bottom-1 right-3 text-xs ${themeClasses.textSecondary}`}>
                    {inputValue.length}
                  </div>
                )}
              </div>
              
              <button
                onClick={sendMessage}
                disabled={uploadedFiles.length === 0 && !inputValue.trim()}
                className="p-3 bg-gradient-to-r from-farm-500 to-emerald-600 text-white rounded-xl hover:from-farm-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:hover:scale-100 shadow-lg"
                title="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            {/* Quick Actions */}
            {uploadedFiles.length === 0 && inputValue.length === 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setInputValue('How do I detect crop diseases?')}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors hover:bg-farm-500 hover:text-white hover:border-farm-500 ${themeClasses.border} ${themeClasses.textSecondary}`}
                >
                  Detect diseases
                </button>
                <button
                  onClick={() => setInputValue('What are treatment options?')}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors hover:bg-farm-500 hover:text-white hover:border-farm-500 ${themeClasses.border} ${themeClasses.textSecondary}`}
                >
                  Treatment tips
                </button>
                <button
                  onClick={() => setInputValue('How can I prevent crop diseases?')}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors hover:bg-farm-500 hover:text-white hover:border-farm-500 ${themeClasses.border} ${themeClasses.textSecondary}`}
                >
                  Prevention guide
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIModelChat;
