import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { 
  Send,
  Paperclip,
  MoreVertical,
  Search,
  CheckCheck
} from "lucide-react";

const conversations = [
  {
    id: 1,
    name: "Sarah Johnson",
    image: "https://images.unsplash.com/photo-1581065178047-8ee15951ede6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMHdvbWFuJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcxNDY0OTM0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    lastMessage: "That sounds perfect! I'd love to discuss the campaign details.",
    time: "2m ago",
    unread: 2,
    campaign: "Enterprise SaaS Launch Q1 2026",
    matchScore: 94
  },
  {
    id: 2,
    name: "Marcus Chen",
    image: "https://images.unsplash.com/photo-1556557286-bf3be5fd9d06?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGNvbnRlbnQlMjBjcmVhdG9yJTIwbWFsZXxlbnwxfHx8fDE3NzE0Njc1MTF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    lastMessage: "Thanks for reaching out. When would you like to schedule a call?",
    time: "1h ago",
    unread: 0,
    campaign: "Tech Product Review Series",
    matchScore: 89
  },
  {
    id: 3,
    name: "Emma Davis",
    image: "https://images.unsplash.com/photo-1602566356438-dd36d35e989c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBkaWdpdGFsJTIwY3JlYXRvciUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MTQ2NzUxNHww&ixlib=rb-4.1.0&q=80&w=1080",
    lastMessage: "I've sent over my media kit. Let me know if you need anything else!",
    time: "3h ago",
    unread: 0,
    campaign: "Marketing Automation Campaign",
    matchScore: 87
  },
  {
    id: 4,
    name: "Alex Rivera",
    image: "https://images.unsplash.com/photo-1531539648265-33e27dc578c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNoJTIwc3RhcnR1cCUyMGVudHJlcHJlbmV1cnxlbnwxfHx8fDE3NzE0Njc1MTJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    lastMessage: "Looking forward to working together on this project.",
    time: "1d ago",
    unread: 0,
    campaign: "B2B Growth Campaign",
    matchScore: 82
  }
];

const messages = [
  {
    id: 1,
    sender: "company",
    text: "Hi Sarah! We came across your profile through our AI matching system, and we think you'd be a perfect fit for our Enterprise SaaS launch campaign.",
    time: "10:24 AM",
    read: true
  },
  {
    id: 2,
    sender: "creator",
    text: "Hi! Thank you for reaching out. I'm excited to learn more about your campaign. I've been focusing a lot on enterprise software content lately.",
    time: "10:28 AM",
    read: true
  },
  {
    id: 3,
    sender: "company",
    text: "That's great! Our AI analysis shows a 94% match score between your audience and our target market. We're launching a new project management platform aimed at enterprise teams.",
    time: "10:30 AM",
    read: true
  },
  {
    id: 4,
    sender: "creator",
    text: "A 94% match score is impressive! I'd love to see more details about the product and campaign objectives. What kind of content are you envisioning?",
    time: "10:32 AM",
    read: true
  },
  {
    id: 5,
    sender: "company",
    text: "We're thinking a mix of in-depth product review, workflow demonstrations, and perhaps a case study format. The predicted CTR for this collaboration is 4.8%, which is well above industry average.",
    time: "10:35 AM",
    read: true
  },
  {
    id: 6,
    sender: "creator",
    text: "That sounds perfect! I'd love to discuss the campaign details. Would you be available for a call this week to go over the specifics?",
    time: "10:38 AM",
    read: true
  },
  {
    id: 7,
    sender: "company",
    text: "Absolutely! How about Thursday at 2 PM EST? I'll send you a calendar invite along with our campaign brief and partnership proposal.",
    time: "10:40 AM",
    read: false
  }
];

export default function Conversations() {
  const [activeConversation, setActiveConversation] = useState(conversations[0]);
  const [messageText, setMessageText] = useState("");

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <Sidebar />
      
      <main className="flex-1 flex">
        {/* Conversations List */}
        <div className="w-96 bg-white border-r border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Conversations</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search conversations..." 
                className="pl-10 bg-[#F9FAFB] border-gray-200"
              />
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="p-3">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setActiveConversation(conversation)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors mb-2 ${
                    activeConversation.id === conversation.id
                      ? "bg-[#EFF6FF] border border-[#3B82F6]"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <div className="flex gap-3">
                    <img
                      src={conversation.image}
                      alt={conversation.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{conversation.name}</h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{conversation.time}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate mb-2">{conversation.lastMessage}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="bg-[#EFF6FF] text-[#3B82F6] text-xs">
                          Match: {conversation.matchScore}%
                        </Badge>
                        {conversation.unread > 0 && (
                          <div className="w-5 h-5 bg-[#3B82F6] rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-medium">{conversation.unread}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={activeConversation.image}
                  alt={activeConversation.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{activeConversation.name}</h2>
                  <p className="text-sm text-gray-600">Online • Typically replies in 30 min</p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </Button>
            </div>
          </div>

          {/* Campaign Summary Card */}
          <div className="bg-white border-b border-gray-200 p-4">
            <Card className="p-4 bg-gradient-to-r from-[#EFF6FF] to-white border border-[#3B82F6]/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Campaign</p>
                  <h3 className="font-semibold text-gray-900">{activeConversation.campaign}</h3>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Match Score</p>
                    <p className="text-2xl font-bold text-[#3B82F6]">{activeConversation.matchScore}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Predicted CTR</p>
                    <p className="text-2xl font-bold text-[#3B82F6]">4.8%</p>
                  </div>
                  <Button size="sm" variant="outline" className="border-[#3B82F6] text-[#3B82F6]">
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-6 bg-[#F9FAFB]">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "company" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-md p-4 rounded-2xl ${
                      message.sender === "company"
                        ? "bg-[#1E3A8A] text-white rounded-tr-sm"
                        : "bg-white text-gray-900 border border-gray-200 rounded-tl-sm"
                    }`}
                  >
                    <p className="text-sm leading-relaxed mb-1">{message.text}</p>
                    <div className="flex items-center gap-2 justify-end">
                      <span className={`text-xs ${
                        message.sender === "company" ? "text-blue-200" : "text-gray-500"
                      }`}>
                        {message.time}
                      </span>
                      {message.sender === "company" && (
                        <CheckCheck className={`w-3 h-3 ${
                          message.read ? "text-blue-200" : "text-blue-400"
                        }`} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3">
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </Button>
                <Input
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 bg-[#F9FAFB] border-gray-200"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      setMessageText("");
                    }
                  }}
                />
                <Button 
                  className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 flex-shrink-0"
                  onClick={() => setMessageText("")}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
