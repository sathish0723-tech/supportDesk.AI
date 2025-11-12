"use client"

import { SignIn, SignUp } from "@clerk/nextjs"
import { useSearchParams } from "next/navigation"
import { Ticket, Shield, Zap, Users, TrendingUp, CheckCircle2 } from "lucide-react"

export default function AuthPage() {
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode")
  const isSignIn = mode !== "sign-up"

  const features = [
    {
      icon: Ticket,
      title: "Ticket Management",
      description: "Streamline your IT support tickets with our powerful management system"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security to protect your sensitive data"
    },
    {
      icon: Zap,
      title: "Fast Response",
      description: "Get instant notifications and quick resolution times"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work together seamlessly with your IT team"
    },
    {
      icon: TrendingUp,
      title: "Analytics & Reports",
      description: "Track performance and make data-driven decisions"
    },
    {
      icon: CheckCircle2,
      title: "Easy Integration",
      description: "Connect with your existing tools and workflows"
    }
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              IT Industry Ticket Rising System
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isSignIn ? "Welcome back! Sign in to continue" : "Create your account to get started"}
            </p>
          </div>

          <div className="mb-6">
            {isSignIn ? (
              <SignIn 
                appearance={{
                  elements: {
                    rootBox: "mx-auto",
                    card: "shadow-lg",
                  }
                }}
                routing="path"
                path="/auth"
                signUpUrl="/auth?mode=sign-up"
                afterSignInUrl="/dashboard"
                fallbackRedirectUrl="/dashboard"
              />
            ) : (
              <SignUp 
                appearance={{
                  elements: {
                    rootBox: "mx-auto",
                    card: "shadow-lg",
                  }
                }}
                routing="path"
                path="/auth"
                signInUrl="/auth?mode=sign-in"
                afterSignUpUrl="/onboarding"
                fallbackRedirectUrl="/onboarding"
              />
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Features Showcase */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-center">
        <div className="max-w-lg mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Streamline Your IT Support
            </h2>
            <p className="text-xl text-blue-100">
              Manage tickets, track progress, and deliver exceptional IT support with our comprehensive platform.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300"
                >
                  <div className="flex-shrink-0 mt-1">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-blue-100 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
            <p className="text-white text-sm text-center">
              Trusted by IT teams worldwide to manage their support operations efficiently
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

