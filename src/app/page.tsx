"use client";
import { Button } from "@/components/ui/button";
import { SignedIn } from "@clerk/clerk-react";
import { SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import {
  Bot,
  Brain,
  Sparkles,
  ArrowRight,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">AIDev</span>
          </div>
          <SignedOut>
            <SignInButton
              fallbackRedirectUrl={"/dashboard"}
              forceRedirectUrl={"/dashboard"}
            >
              <Button variant="default">Sign In</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Button
              onClick={() => {
                router.push("/dashboard");
              }}
              variant="secondary"
            >
              Dashboard
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SignedIn>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center space-y-10">
            <div className="inline-flex items-center rounded-lg bg-muted px-4 py-1.5 text-sm font-medium">
              🚀 Revolutionizing Development
              <span className="ml-2 rounded-md bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                New
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl">
              Your AI-Powered
              <span className="text-primary relative inline-flex ml-3">
                Development Partner
                <Sparkles className="w-6 h-6 absolute -top-4 -right-6 text-yellow-500" />
              </span>
            </h1>
            <p className="max-w-2xl leading-normal text-muted-foreground sm:text-xl sm:leading-8 mx-auto">
              Transform your development workflow with our intelligent AI
              assistant. Code smarter, build faster, and ship with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 min-[400px]:flex-row justify-center pt-4">
            <SignedOut>
            <SignUpButton>
              <Button size="lg" className="gap-2 px-8">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
              </SignUpButton>
              </SignedOut>
              <Button size="lg" variant="outline" className="gap-2 px-8">
                Live Demo <Brain className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-24">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="group relative rounded-xl border p-8 hover:shadow-lg transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-full bg-primary/10">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Smart Coding</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Advanced AI that understands your code context and provides
                intelligent suggestions.
              </p>
            </div>
            <div className="group relative rounded-xl border p-8 hover:shadow-lg transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-full bg-primary/10">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Natural Interaction</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Chat naturally with your AI assistant to solve complex
                programming challenges.
              </p>
            </div>
            <div className="group relative rounded-xl border p-8 hover:shadow-lg transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-full bg-primary/10">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Magic Solutions</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Get instant solutions and optimizations for your code with
                AI-powered recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-primary p-8 md:p-12 text-primary-foreground">
            <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-6 text-center">
              <h2 className="text-3xl md:text-4xl font-bold">
                Start Building Better Today
              </h2>
              <p className="text-lg leading-relaxed opacity-90 max-w-2xl">
                Join thousands of developers who are already using AIDev to
                supercharge their development workflow.
              </p>
              <SignUpButton>
                <Button size="lg" variant="secondary" className="mt-4 px-8">
                  Get Started for Free
                </Button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center justify-between gap-6 md:h-24 md:flex-row md:py-0">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">AIDev</span>
            </div>
            <p className="text-center text-sm leading-loose md:text-left text-muted-foreground">
              Built with ❤️ for developers. © 2024 AIDev. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
