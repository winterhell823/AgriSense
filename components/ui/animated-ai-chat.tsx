"use client";

import { useEffect, useRef, useCallback, useTransition } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    ImageIcon,
    MonitorIcon,
    Paperclip,
    SendIcon,
    XIcon,
    LoaderIcon,
    Sparkles,
    Command,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react"

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            textarea.style.height = `${minHeight}px`;
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

interface CommandSuggestion {
    icon: React.ReactNode;
    label: string;
    description: string;
    prefix: string;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: SourceSnippet[];
    sourceCount?: number;
    analysis?: ImageAnalysisResponse;
    timestamp: number;
}

interface ChatResponse {
    answer: string;
    sources: SourceSnippet[];
    source_count: number;
    session_id?: string;
}

interface SourceSnippet {
    source: string;
    page?: number;
    excerpt: string;
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

async function readErrorMessage(response: Response): Promise<string> {
    try {
        const data = await response.json();
        if (typeof data?.detail === 'string' && data.detail.trim()) {
            return data.detail;
        }
        if (typeof data?.error === 'string' && data.error.trim()) {
            return data.error;
        }
    } catch {
        // Ignore JSON parsing errors and fallback to status text.
    }

    return response.statusText || `Request failed with status ${response.status}`;
}

const commandSuggestions: CommandSuggestion[] = [
    {
        icon: <ImageIcon className="w-4 h-4" />,
        label: "Detect Disease",
        description: "Analyze crop disease from photo",
        prefix: "/detect"
    },
    {
        icon: <Sparkles className="w-4 h-4" />,
        label: "Farm Tips",
        description: "Get farming best practices",
        prefix: "/tips"
    },
    {
        icon: <MonitorIcon className="w-4 h-4" />,
        label: "Weather Info",
        description: "Get weather forecast",
        prefix: "/weather"
    },
    {
        icon: <Sparkles className="w-4 h-4" />,
        label: "Field Guide",
        description: "Agronomy field guide",
        prefix: "/guide"
    },
];

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  showRing?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    
    return (
      <div className={cn(
        "relative",
        containerClassName
      )}>
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showRing ? "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0" : "",
            className
          )}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {showRing && isFocused && (
          <motion.span 
            className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-offset-0 ring-primary/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}

        {props.onChange && (
          <div 
            className="absolute bottom-2 right-2 opacity-0 w-2 h-2 bg-primary rounded-full"
            style={{
              animation: 'none',
            }}
            id="textarea-ripple"
          />
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export function AnimatedAIChat() {
    const [value, setValue] = useState("");
    const [attachments, setAttachments] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [selectedImagePreview, setSelectedImagePreview] = useState<string>("");
    const [isTyping, setIsTyping] = useState(false);
    const [, startTransition] = useTransition();
    const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [error, setError] = useState<string>("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });
    const [inputFocused, setInputFocused] = useState(false);
    const commandPaletteRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const storeMessage = useCallback(async (userMessage: string, aiResponse: string, sources: SourceSnippet[], sourceCount: number) => {
        try {
            // Store user message
            await fetch('/api/chat-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: 'default-user',
                    message: userMessage,
                    attachments: [],
                }),
            });

            // Store assistant response
            await fetch('/api/chat-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: 'default-user',
                    message: aiResponse,
                    attachments: [],
                    isAssistant: true,
                    sources,
                    sourceCount,
                }),
            });
        } catch (error) {
            console.error('Failed to store chat history', error);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (selectedImagePreview) {
                URL.revokeObjectURL(selectedImagePreview);
            }
        };
    }, [selectedImagePreview]);

    const clearSelectedImage = useCallback(() => {
        if (selectedImagePreview) {
            URL.revokeObjectURL(selectedImagePreview);
        }
        setSelectedImage(null);
        setSelectedImagePreview("");
        setAttachments([]);
    }, [selectedImagePreview]);

    const formatImageAnalysis = useCallback((data: ImageAnalysisResponse) => {
        const joinItems = (items: string[]) => items.map((item) => `- ${item}`).join("\n");

        return [
            `${data.crop} - ${data.disease}`,
            `Confidence: ${data.confidence}%`,
            `Severity: ${data.severity}`,
            "",
            `Explanation: ${data.disease_explanation}`,
            `Cause: ${data.cause}`,
            "",
            `Treatment:\n${joinItems(data.treatment)}`,
            `Prevention:\n${joinItems(data.prevention)}`,
            `Organic solution:\n${joinItems(data.organic_solution)}`,
        ].join("\n");
    }, []);

    const validateAndSelectImage = useCallback((file: File) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!allowedTypes.includes(file.type) || !["jpg", "jpeg", "png"].includes(extension || "")) {
            setError("Please upload a JPG, JPEG, or PNG image.");
            return;
        }

        if (selectedImagePreview) {
            URL.revokeObjectURL(selectedImagePreview);
        }

        setError("");
        setSelectedImage(file);
        setSelectedImagePreview(URL.createObjectURL(file));
        setAttachments([file.name]);
    }, [selectedImagePreview]);

    const handleSendMessage = () => {
        const message = (textareaRef.current?.value ?? value).trim();
        if (!message && !selectedImage) {
            return;
        }

        // Add user message to conversation
        const userMessageId = `msg-${Date.now()}`;
        const userChatMessage: ChatMessage = {
            id: userMessageId,
            role: 'user',
            content: selectedImage
                ? (message || `Uploaded image: ${selectedImage.name}`)
                : message,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, userChatMessage]);
        setValue("");
        adjustHeight(true);
        setError("");

        // Start typing indicator
        setIsTyping(true);

        startTransition(async () => {
            try {
                if (selectedImage) {
                    const formData = new FormData();
                    formData.append('file', selectedImage);

                    const response = await fetch('/api/backend/analyze-image', {
                        method: 'POST',
                        body: formData,
                    });

                    if (!response.ok) {
                        const detail = await readErrorMessage(response);
                        throw new Error(`Backend error: ${response.status} ${detail}`);
                    }

                    const data: ImageAnalysisResponse = await response.json();
                    const assistantMessage: ChatMessage = {
                        id: `msg-${Date.now()}-assist`,
                        role: 'assistant',
                        content: formatImageAnalysis(data),
                        analysis: data,
                        timestamp: Date.now(),
                    };

                    setMessages(prev => [...prev, assistantMessage]);
                    await storeMessage(userChatMessage.content, assistantMessage.content, [], 0);
                    clearSelectedImage();
                    setIsTyping(false);
                    return;
                }

                // Call backend RAG endpoint for text chat
                const response = await fetch('/api/backend/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        question: message,
                        session_id: 'default-user',
                    }),
                });

                if (!response.ok) {
                    const detail = await readErrorMessage(response);
                    throw new Error(`Backend error: ${response.status} ${detail}`);
                }

                const data: ChatResponse = await response.json();

                const assistantMessageId = `msg-${Date.now()}-assist`;
                const assistantMessage: ChatMessage = {
                    id: assistantMessageId,
                    role: 'assistant',
                    content: data.answer,
                    sources: data.sources,
                    sourceCount: data.source_count,
                    timestamp: Date.now(),
                };
                
                setMessages(prev => [...prev, assistantMessage]);
                await storeMessage(message, data.answer, data.sources, data.source_count);
                setIsTyping(false);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
                setError(`Failed to get response: ${errorMessage}`);
                setIsTyping(false);
                
                // Remove the typing indicator
                setMessages(prev => prev.filter(m => m.id !== userMessageId || m.role === 'user'));
            }
        });
    };

    const handleAttachFile = () => {
        fileInputRef.current?.click();
    };

    const removeAttachment = (index: number) => {
        if (index === 0) {
            clearSelectedImage();
        } else {
            setAttachments(prev => prev.filter((_, i) => i !== index));
        }
    };

    const selectCommandSuggestion = (index: number) => {
        const selectedCommand = commandSuggestions[index];
        setValue(selectedCommand.prefix + ' ');
        setShowCommandPalette(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showCommandPalette) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestion(prev => 
                    prev < commandSuggestions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestion(prev => 
                    prev > 0 ? prev - 1 : commandSuggestions.length - 1
                );
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault();
                if (activeSuggestion >= 0) {
                    const selectedCommand = commandSuggestions[activeSuggestion];
                    setValue(selectedCommand.prefix + ' ');
                    setShowCommandPalette(false);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowCommandPalette(false);
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    useEffect(() => {
        if (value.startsWith('/') && !value.includes(' ')) {
            setShowCommandPalette(true);
            
            const matchingSuggestionIndex = commandSuggestions.findIndex(
                (cmd) => cmd.prefix.startsWith(value)
            );
            
            if (matchingSuggestionIndex >= 0) {
                setActiveSuggestion(matchingSuggestionIndex);
            } else {
                setActiveSuggestion(-1);
            }
        } else {
            setShowCommandPalette(false);
        }
    }, [value]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const commandButton = document.querySelector('[data-command-button]');
            
            if (commandPaletteRef.current && 
                !commandPaletteRef.current.contains(target) && 
                !commandButton?.contains(target)) {
                setShowCommandPalette(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <main className="flex flex-col w-full min-h-screen bg-transparent text-white relative overflow-hidden pb-24 pt-28 md:pt-32">
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-farm-500/8 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-farm-400/8 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
                <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-farm-600/8 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
            </div>
            
            <div className="w-full max-w-3xl mx-auto relative flex flex-col flex-1 px-6">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        className="hidden"
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                                validateAndSelectImage(file);
                            }
                            event.target.value = '';
                        }}
                    />

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto relative z-10 mb-8 rounded-lg">
                    {messages.length === 0 && !error && (
                        <motion.div 
                            className="flex flex-col items-center justify-center h-full space-y-12"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                            <div className="text-center space-y-3">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2, duration: 0.5 }}
                                    className="inline-block"
                                >
                                    <h1 className="text-3xl font-medium tracking-tight text-white/90 pb-1">
                                        How can I help with your farm today?
                                    </h1>
                                    <motion.div 
                                        className="h-px bg-gradient-to-r from-transparent via-farm-500/30 to-transparent"
                                        initial={{ width: 0, opacity: 0 }}
                                        animate={{ width: "100%", opacity: 1 }}
                                        transition={{ delay: 0.5, duration: 0.8 }}
                                    />
                                </motion.div>
                                <motion.p 
                                    className="text-sm text-white/40"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    Ask about crop health, weather, farming tips, or field guidance
                                </motion.p>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-2">
                                {commandSuggestions.map((suggestion, index) => (
                                    <motion.button
                                        key={suggestion.prefix}
                                        onClick={() => selectCommandSuggestion(index)}
                                        className="flex items-center gap-2 px-3 py-2 bg-farm-500/5 hover:bg-farm-500/10 rounded-lg text-sm text-white/60 hover:text-farm-300 transition-all relative group border border-farm-500/10"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        {suggestion.icon}
                                        <span>{suggestion.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Messages List */}
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={cn(
                                "mb-6 flex gap-4",
                                msg.role === 'user' ? "justify-end" : "justify-start"
                            )}
                        >
                            {msg.role === 'assistant' && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-farm-500/20 flex items-center justify-center text-xs font-medium text-farm-300 border border-farm-500/30">
                                    AI
                                </div>
                            )}
                            
                            <div className={cn(
                                "max-w-lg backdrop-blur-xl rounded-2xl px-4 py-3 text-sm",
                                msg.role === 'user'
                                    ? "bg-farm-500/20 text-white border border-farm-500/30"
                                    : "bg-white/[0.03] text-white/90 border border-farm-500/10"
                            )}>
                                {msg.analysis ? (
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-sm font-semibold text-farm-300">{msg.analysis.crop} - {msg.analysis.disease}</div>
                                            <div className="mt-1 text-xs text-white/60">Confidence: {msg.analysis.confidence}% | Severity: {msg.analysis.severity}</div>
                                        </div>
                                        <div className="text-sm leading-relaxed whitespace-pre-wrap text-white/90">{msg.analysis.disease_explanation}</div>
                                        <div className="space-y-1 text-xs text-white/75">
                                            <div><span className="font-semibold text-farm-300">Cause:</span> {msg.analysis.cause}</div>
                                            <div>
                                                <span className="font-semibold text-farm-300">Treatment:</span>
                                                <ul className="mt-1 list-disc space-y-1 pl-4">
                                                    {msg.analysis.treatment.map((item) => <li key={item}>{item}</li>)}
                                                </ul>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-farm-300">Prevention:</span>
                                                <ul className="mt-1 list-disc space-y-1 pl-4">
                                                    {msg.analysis.prevention.map((item) => <li key={item}>{item}</li>)}
                                                </ul>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-farm-300">Organic solution:</span>
                                                <ul className="mt-1 list-disc space-y-1 pl-4">
                                                    {msg.analysis.organic_solution.map((item) => <li key={item}>{item}</li>)}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                )}
                            </div>

                            {msg.role === 'user' && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-farm-600/30 flex items-center justify-center text-xs font-medium text-farm-200 border border-farm-500/30">
                                    U
                                </div>
                            )}
                        </motion.div>
                    ))}
                    
                    <div ref={messagesEndRef} />
                </div>

                {/* Error Message */}
                {error && (
                    <motion.div 
                        className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {error}
                    </motion.div>
                )}

                {/* Input Area */}
                <motion.div 
                    className="relative backdrop-blur-2xl bg-white/[0.02] rounded-2xl border border-farm-500/20 shadow-2xl relative z-10"
                    initial={{ scale: 0.98 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Attachments Display */}
                    <AnimatePresence mode="popLayout">
                        {(attachments.length > 0 || selectedImagePreview) && (
                            <motion.div 
                                className="px-4 pt-4 pb-0 flex flex-wrap gap-2 border-b border-farm-500/10"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                {selectedImagePreview && (
                                    <motion.div 
                                        key={selectedImage?.name || 'selected-image'}
                                        className="inline-flex items-center gap-2 px-3 py-2 bg-farm-500/10 border border-farm-500/20 rounded-lg text-xs text-white/70"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                    >
                                        <Paperclip className="w-3 h-3" />
                                        <span className="truncate max-w-[200px]">{selectedImage?.name}</span>
                                        <button
                                            onClick={() => clearSelectedImage()}
                                            className="ml-1 hover:text-white transition-colors"
                                        >
                                            <XIcon className="w-3 h-3" />
                                        </button>
                                    </motion.div>
                                )}
                                {attachments.map((file, idx) => (
                                    <motion.div 
                                        key={`${file}-${idx}`}
                                        className="inline-flex items-center gap-2 px-3 py-2 bg-farm-500/10 border border-farm-500/20 rounded-lg text-xs text-white/70"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                    >
                                        <Paperclip className="w-3 h-3" />
                                        <span className="truncate max-w-[200px]">{file}</span>
                                        <button
                                            onClick={() => removeAttachment(idx)}
                                            className="ml-1 hover:text-white transition-colors"
                                        >
                                            <XIcon className="w-3 h-3" />
                                        </button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleSendMessage();
                        }}
                    >
                        {/* Textarea */}
                        <div className="p-4">
                            <Textarea
                                ref={textareaRef}
                                value={value}
                                onChange={(e) => {
                                    setValue(e.target.value);
                                    adjustHeight();
                                }}
                                onInput={(e) => {
                                    setValue(e.currentTarget.value);
                                    adjustHeight();
                                }}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setInputFocused(true)}
                                onBlur={() => setInputFocused(false)}
                                placeholder={selectedImage ? "Add an optional note, then send the image..." : "Type your farming question... (Use / for commands)"}
                                className="bg-farm-500/5 border border-farm-500/20 text-white placeholder:text-white/30 resize-none focus:bg-farm-500/10 focus:border-farm-500/40"
                                disabled={isTyping}
                            />
                        </div>

                    {/* Command Palette */}
                    {showCommandPalette && (
                        <motion.div
                            ref={commandPaletteRef}
                            className="absolute bottom-full mb-2 left-0 right-0 mx-4 backdrop-blur-xl bg-white/[0.02] border border-farm-500/20 rounded-lg shadow-lg p-2 z-50"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                        >
                            {commandSuggestions.map((suggestion, index) => (
                                <motion.button
                                    key={suggestion.prefix}
                                    onClick={() => {
                                        setValue(suggestion.prefix + ' ');
                                        setShowCommandPalette(false);
                                    }}
                                    className={cn(
                                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-start gap-3",
                                        activeSuggestion === index
                                            ? "bg-farm-500/20 text-farm-300"
                                            : "text-white/60 hover:text-white"
                                    )}
                                >
                                    <span className="mt-0.5">{suggestion.icon}</span>
                                    <div>
                                        <div className="font-medium">{suggestion.label}</div>
                                        <div className="text-xs text-white/40">{suggestion.description}</div>
                                    </div>
                                </motion.button>
                            ))}
                        </motion.div>
                    )}

                    {/* Buttons */}
                    <div className="p-4 border-t border-farm-500/10 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <motion.button
                                type="button"
                                onClick={handleAttachFile}
                                whileTap={{ scale: 0.94 }}
                                disabled={isTyping}
                                className="p-2 text-white/40 hover:text-farm-400 disabled:text-white/20 rounded-lg transition-colors relative group"
                                aria-label="Upload crop image"
                            >
                                <Paperclip className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                                type="button"
                                data-command-button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowCommandPalette(prev => !prev);
                                }}
                                disabled={isTyping}
                                whileTap={{ scale: 0.94 }}
                                className={cn(
                                    "p-2 text-white/40 hover:text-farm-400 disabled:text-white/20 rounded-lg transition-colors relative group",
                                    showCommandPalette && "bg-farm-500/20 text-farm-400"
                                )}
                            >
                                <Command className="w-4 h-4" />
                            </motion.button>
                        </div>
                        
                        <motion.button
                            type="submit"
                            onClick={handleSendMessage}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isTyping}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                "flex items-center gap-2",
                                isTyping
                                    ? "bg-farm-500/10 text-white/40"
                                    : "bg-farm-500 text-white shadow-lg shadow-farm-500/20 hover:bg-farm-600"
                            )}
                        >
                            {isTyping ? (
                                <LoaderIcon className="w-4 h-4 animate-[spin_2s_linear_infinite]" />
                            ) : (
                                <SendIcon className="w-4 h-4" />
                            )}
                            <span>{selectedImage ? 'Analyze' : 'Send'}</span>
                        </motion.button>
                    </div>
                    </form>
                </motion.div>
            </div>

            {inputFocused && (
                <motion.div 
                    className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none z-0 opacity-[0.03] bg-gradient-to-r from-farm-400 via-farm-500 to-farm-600 blur-[96px]"
                    animate={{
                        x: mousePosition.x - 400,
                        y: mousePosition.y - 400,
                    }}
                    transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 150,
                        mass: 0.5,
                    }}
                />
            )}
        </main>
    );
}
