"use client"

import { useUser } from "@clerk/nextjs"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Building2, Loader2, CheckCircle2, Sparkles, Zap, Shield, TrendingUp, Search, Link2 } from "lucide-react"

export default function OnboardingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetchingCompany, setIsFetchingCompany] = useState(false)
  const [companyData, setCompanyData] = useState(null)
  const [companyLogo, setCompanyLogo] = useState(null)
  const [domain, setDomain] = useState("")
  const [formData, setFormData] = useState({
    companyName: "",
    totalEmployees: "",
    industry: "",
    phoneNumber: "",
    address: "",
    website: "",
  })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const hasFetched = useRef(false)
  const hasRedirected = useRef(false)
  const companyNameTimeout = useRef(null)

  useEffect(() => {
    if (!isLoaded) return
    
    const timer = setTimeout(() => {
      // Only redirect if user is definitely not authenticated and not in auth flow
      if (!user && !hasRedirected.current) {
        hasRedirected.current = true
        router.push("/auth")
        return
      }
    }, 2000) // Increased timeout to allow email verification and session establishment
    
    if (user && !hasFetched.current) {
      hasFetched.current = true
      fetchCompanyData()
    }
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id])

  const fetchCompanyData = async () => {
    try {
      await fetch("/api/users/sync", { method: "POST" })
      
      const response = await fetch("/api/companies/me")
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setCompanyData(data.data)
          setFormData({
            companyName: data.data.companyName || "",
            totalEmployees: data.data.totalEmployees || "",
            industry: data.data.industry || "",
            phoneNumber: data.data.phoneNumber || "",
            address: data.data.address || "",
            website: data.data.website || "",
          })
          
          // Set domain and logo if website exists
          if (data.data.website) {
            const websiteDomain = data.data.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
            setDomain(websiteDomain)
            fetchLogoFromDomain(websiteDomain)
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch company data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCompanyFromGemini = async (companyName, domainInput) => {
    // Need at least one: company name OR domain
    const hasCompanyName = companyName && companyName.length >= 3
    const hasDomain = domainInput && domainInput.length >= 3
    
    if (!hasCompanyName && !hasDomain) {
      return
    }

    setIsFetchingCompany(true)
    try {
      const response = await fetch("/api/companies/fetch-gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: hasCompanyName ? companyName : null,
          domain: hasDomain ? domainInput : null,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success && data.data) {
        // Auto-fill form with Gemini data
        setFormData((prev) => ({
          ...prev,
          companyName: data.data.companyName || prev.companyName || companyName,
          industry: data.data.industry || prev.industry,
          website: data.data.website || prev.website,
          address: data.data.address || prev.address,
          totalEmployees: data.data.totalEmployees || prev.totalEmployees,
        }))
        
        // Set company logo if available
        if (data.data.logo) {
          setCompanyLogo(data.data.logo)
        }
        
        // Update domain if we got it from website and don't have one
        if (data.data.domain && !hasDomain) {
          setDomain(data.data.domain)
          // Also fetch logo for the new domain
          fetchLogoFromDomain(data.data.domain)
        }
      } else if (!response.ok) {
        // Log error but don't show to user (silent failure)
        console.error("Gemini API error:", data.error, data.details)
      }
    } catch (error) {
      // Log error but don't show to user (silent failure)
      console.error("Failed to fetch company data from Gemini:", error)
    } finally {
      setIsFetchingCompany(false)
    }
  }
  
  // Fetch logo directly from domain
  const fetchLogoFromDomain = (domainInput) => {
    if (!domainInput) {
      setCompanyLogo(null)
      return
    }
    
    const cleanDomain = domainInput.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim()
    if (cleanDomain) {
      const logoUrl = `https://logo.clearbit.com/${cleanDomain}`
      setCompanyLogo(logoUrl)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }

    // Auto-fetch company data when company name is entered (even without domain)
    if (name === "companyName" && value.length >= 3) {
      if (companyNameTimeout.current) {
        clearTimeout(companyNameTimeout.current)
      }
      
      companyNameTimeout.current = setTimeout(() => {
        // Fetch data using company name (domain is optional)
        fetchCompanyFromGemini(value, domain || null)
      }, 1000)
    }
  }
  
  const handleDomainChange = (e) => {
    const value = e.target.value
    setDomain(value)
    
    // Immediately fetch logo from domain if domain is provided
    if (value.length >= 3) {
      fetchLogoFromDomain(value)
      
      // Also fetch full company data if we have domain
      if (companyNameTimeout.current) {
        clearTimeout(companyNameTimeout.current)
      }
      
      companyNameTimeout.current = setTimeout(() => {
        // Use domain for fetching, or company name if available
        fetchCompanyFromGemini(formData.companyName || null, value)
      }, 1000)
    } else {
      setCompanyLogo(null)
    }
  }

  const handleManualFetch = () => {
    // Fetch data if we have either company name OR domain
    if (formData.companyName.length >= 3 || domain.length >= 3) {
      fetchCompanyFromGemini(
        formData.companyName.length >= 3 ? formData.companyName : null,
        domain.length >= 3 ? domain : null
      )
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSuccess(false)

    try {
      const response = await fetch("/api/companies/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        setErrors({ submit: data.error || "Failed to save company data" })
      }
    } catch (error) {
      console.error("Error saving company data:", error)
      setErrors({ submit: "An error occurred. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-green-800 dark:text-green-200">
              Company Setup Complete!
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              {formData.companyName ? (
                <>
                  <span className="font-semibold">{formData.companyName}</span> has been set up successfully. Redirecting to dashboard...
                </>
              ) : (
                "Your company information has been saved successfully. Redirecting to dashboard..."
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Side - Product Information */}
          <div className="hidden lg:flex flex-col justify-center space-y-8 p-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                  Welcome to Support Desk
                </h1>
              </div>
              
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                Streamline your IT support operations with our powerful ticket management system. 
                Get started by setting up your company profile.
              </p>

              <div className="space-y-4 pt-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      AI-Powered Automation
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Automatically fetch company information using Gemini AI to save time
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Efficient Ticket Management
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Organize and track support tickets with ease
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Secure & Reliable
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Your data is protected with enterprise-grade security
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Company Form */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-lg shadow-xl bg-white dark:bg-gray-800">
              <CardHeader className="space-y-4 pb-6">
                <div className="flex items-center space-x-3">
                  {companyLogo ? (
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600 flex-shrink-0">
                      <img
                        src={companyLogo}
                        alt="Company Logo"
                        className="w-full h-full object-contain p-1.5"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          setCompanyLogo(null)
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600 flex-shrink-0">
                      <Building2 className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                  <CardTitle className="text-2xl">
                    {formData.companyName || 'Company Setup'}
                  </CardTitle>
                </div>
                <CardDescription>
                  {companyData
                    ? "Update your company information"
                    : "Let's get started by setting up your company profile"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Domain/Website Input */}
                  <div>
                    <label
                      htmlFor="domain"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Enter Domain <span className="text-gray-400 text-xs font-normal">(e.g., example.com)</span>
                    </label>
                    <div className="relative">
                      <Input
                        id="domain"
                        name="domain"
                        type="text"
                        value={domain}
                        onChange={handleDomainChange}
                        placeholder="Enter Domain (e.g., example.com)"
                        className={errors.domain ? "border-red-500" : ""}
                      />
                      {domain.length >= 3 && (
                        <button
                          type="button"
                          onClick={handleManualFetch}
                          disabled={isFetchingCompany}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 hover:text-blue-700 disabled:opacity-50"
                          title="Fetch company data"
                        >
                          {isFetchingCompany ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                    {errors.domain && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.domain}
                      </p>
                    )}
                  </div>

                  {/* Company Name Input */}
                  <div>
                    <label
                      htmlFor="companyName"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        id="companyName"
                        name="companyName"
                        type="text"
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="Enter your company name"
                        required
                        className={`${formData.companyName.length >= 3 ? 'pr-10' : ''} ${errors.companyName ? "border-red-500" : ""}`}
                      />
                      {formData.companyName.length >= 3 && (
                        <button
                          type="button"
                          onClick={handleManualFetch}
                          disabled={isFetchingCompany}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 hover:text-blue-700 disabled:opacity-50"
                          title="Fetch company data"
                        >
                          {isFetchingCompany ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                    {isFetchingCompany && (
                      <p className="mt-1 text-xs text-blue-600 dark:text-blue-400 flex items-center">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Fetching company data...
                      </p>
                    )}
                    {errors.companyName && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.companyName}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="industry"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Industry
                      </label>
                      <Input
                        id="industry"
                        name="industry"
                        type="text"
                        value={formData.industry}
                        onChange={handleChange}
                        placeholder="e.g., Technology"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="totalEmployees"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Employees
                      </label>
                      <Input
                        id="totalEmployees"
                        name="totalEmployees"
                        type="text"
                        value={formData.totalEmployees}
                        onChange={handleChange}
                        placeholder="e.g., 1-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="website"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Website
                    </label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://www.example.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Address
                    </label>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Company address"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phoneNumber"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Phone Number
                    </label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  {errors.submit && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {errors.submit}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save & Continue"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/dashboard")}
                      disabled={isSubmitting}
                    >
                      Skip
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
