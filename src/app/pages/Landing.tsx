import { Link } from "react-router";
import { useEffect, useState } from "react";
import { AUTH_STATE_CHANGED_EVENT, getAccessToken } from "../lib/auth-storage";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import Header from "../components/Header";
import { 
  Sparkles, 
  Target, 
  TrendingUp, 
  Shield, 
  CheckCircle2, 
  Building2, 
  Video,
  ArrowRight
} from "lucide-react";

export default function Landing() {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAccessToken()));
  const primaryStartPath = isAuthenticated ? "/dashboard" : "/signup";

  useEffect(() => {
    const syncAuth = () => setIsAuthenticated(Boolean(getAccessToken()));
    const onStorage = () => syncAuth();
    const onAuthStateChanged = () => syncAuth();
    const onWindowFocus = () => syncAuth();

    window.addEventListener("storage", onStorage);
    window.addEventListener(AUTH_STATE_CHANGED_EVENT, onAuthStateChanged);
    window.addEventListener("focus", onWindowFocus);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(AUTH_STATE_CHANGED_EVENT, onAuthStateChanged);
      window.removeEventListener("focus", onWindowFocus);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header />

      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#EFF6FF] text-[#3B82F6] px-4 py-2 rounded-full mb-6">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">AI-Powered Matching</span>
              </div>
              
              <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                AI-Powered Advertising Partner Matching
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                AdMarket intelligently connects companies with content creators using advanced AI analysis. 
                Get predicted performance metrics, audience insights, and risk classification before you commit.
              </p>

              <div className="flex gap-4">
                <Link to={primaryStartPath}>
                  <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 px-8 py-6 text-lg">
                    Start as Company
                  </Button>
                </Link>
                <Link to={primaryStartPath}>
                  <Button variant="outline" className="px-8 py-6 text-lg border-2 border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#EFF6FF]">
                    Join as Creator
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
                <img 
                  src="https://images.unsplash.com/photo-1575388902449-6bca946ad549?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkYXNoYm9hcmQlMjBhbmFseXRpY3MlMjBpbnRlcmZhY2V8ZW58MXx8fHwxNzcxMzY5MjYyfDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Dashboard Preview"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Three simple steps to find your perfect advertising partner</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 bg-white border border-gray-200 rounded-xl text-center">
              <div className="w-16 h-16 bg-[#EFF6FF] rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-8 h-8 text-[#3B82F6]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Upload Campaign or Profile</h3>
              <p className="text-gray-600">
                Companies upload campaign details and target audience. Creators build their profile with content samples and metrics.
              </p>
            </Card>

            <Card className="p-8 bg-white border border-gray-200 rounded-xl text-center">
              <div className="w-16 h-16 bg-[#EFF6FF] rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-[#3B82F6]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. AI Analyzes Content & Audience</h3>
              <p className="text-gray-600">
                Our AI engine analyzes topic similarity, audience overlap, engagement patterns, and historical performance data.
              </p>
            </Card>

            <Card className="p-8 bg-white border border-gray-200 rounded-xl text-center">
              <div className="w-16 h-16 bg-[#EFF6FF] rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-[#3B82F6]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Get Predicted Performance</h3>
              <p className="text-gray-600">
                Review match scores, predicted CTR/ROI, risk classification, and make informed decisions with confidence.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powered by Advanced AI</h2>
            <p className="text-xl text-gray-600">Data-driven insights for smarter advertising partnerships</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 bg-[#F9FAFB] border border-gray-200 rounded-xl">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Topic Similarity Analysis</h3>
              <p className="text-sm text-gray-600">
                AI analyzes content themes and brand alignment to ensure perfect topic match between companies and creators.
              </p>
            </Card>

            <Card className="p-6 bg-[#F9FAFB] border border-gray-200 rounded-xl">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Audience Overlap Scoring</h3>
              <p className="text-sm text-gray-600">
                Measure how well creator audiences align with your target demographics, interests, and behaviors.
              </p>
            </Card>

            <Card className="p-6 bg-[#F9FAFB] border border-gray-200 rounded-xl">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Predicted CTR / ROI</h3>
              <p className="text-sm text-gray-600">
                Get accurate performance predictions based on historical data, engagement patterns, and market trends.
              </p>
            </Card>

            <Card className="p-6 bg-[#F9FAFB] border border-gray-200 rounded-xl">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Risk Classification</h3>
              <p className="text-sm text-gray-600">
                Every partnership is rated LOW, MEDIUM, or HIGH risk based on brand safety and performance reliability.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Benefits for Everyone</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* For Companies */}
            <Card className="p-10 bg-white border border-gray-200 rounded-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">For Companies</h3>
              </div>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Find creators who perfectly match your brand and target audience</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Get predicted ROI and CTR before investing</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Reduce risk with AI-powered brand safety analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Save time with automated creator discovery and vetting</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Make data-driven decisions with comprehensive analytics</span>
                </li>
              </ul>
            </Card>

            {/* For Creators */}
            <Card className="p-10 bg-white border border-gray-200 rounded-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#3B82F6] rounded-lg flex items-center justify-center">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">For Creators</h3>
              </div>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Get matched with brands that align with your content and values</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Showcase your analytics and demonstrate your value</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Access premium partnership opportunities automatically</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Build credibility with verified performance metrics</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Streamline communication and campaign management</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="py-20 bg-[#1E3A8A]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Advertising Strategy?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join leading brands and creators using AI-powered matching
          </p>
          <div className="flex gap-4 justify-center">
            <Link to={primaryStartPath}>
              <Button className="bg-white text-[#1E3A8A] hover:bg-gray-100 px-8 py-6 text-lg">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button className="bg-white text-[#1E3A8A] hover:bg-gray-100 px-8 py-6 text-lg">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <span className="text-xl font-bold text-[#1E3A8A]">AdMarket</span>
              </div>
              <p className="text-sm text-gray-600">
                AI-powered marketplace for intelligent advertising partnerships.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-[#1E3A8A]">Features</a></li>
                <li><a href="#" className="hover:text-[#1E3A8A]">Pricing</a></li>
                <li><a href="#" className="hover:text-[#1E3A8A]">Case Studies</a></li>
                <li><a href="#" className="hover:text-[#1E3A8A]">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-[#1E3A8A]">About</a></li>
                <li><a href="#" className="hover:text-[#1E3A8A]">Blog</a></li>
                <li><a href="#" className="hover:text-[#1E3A8A]">Careers</a></li>
                <li><a href="#" className="hover:text-[#1E3A8A]">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-[#1E3A8A]">Privacy</a></li>
                <li><a href="#" className="hover:text-[#1E3A8A]">Terms</a></li>
                <li><a href="#" className="hover:text-[#1E3A8A]">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-12 pt-8 text-center text-sm text-gray-600">
            © 2026 AdMarket. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
