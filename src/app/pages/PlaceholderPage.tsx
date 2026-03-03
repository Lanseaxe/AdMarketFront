import { Link } from "react-router";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ArrowLeft, Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <Link to="/dashboard">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <Card className="p-12 bg-white border border-gray-200 rounded-xl text-center">
            <div className="w-16 h-16 bg-[#EFF6FF] rounded-full flex items-center justify-center mx-auto mb-6">
              <Construction className="w-8 h-8 text-[#3B82F6]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">{description}</p>
            <Link to="/dashboard">
              <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
                Go to Dashboard
              </Button>
            </Link>
          </Card>
        </div>
      </main>
    </div>
  );
}
