"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Onboarding Complete Component
 * Shows welcome message and company info after successful onboarding
 * 
 * @returns {JSX.Element} Onboarding complete UI
 */
export function OnboardingComplete() {
  const { user, isLoaded } = useUser();
  const [companyData, setCompanyData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      fetchCompanyData();
    }
  }, [isLoaded, user]);

  /**
   * Fetch company data from API
   */
  const fetchCompanyData = async () => {
    try {
      const response = await fetch("/api/companies");
      if (response.ok) {
        const data = await response.json();
        setCompanyData(data);
      }
    } catch (error) {
      console.error("Failed to fetch company data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!companyData) {
    return null;
  }

  return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
            ✓
          </div>
          Welcome to SupportDesk.Ai!
        </CardTitle>
        <CardDescription className="text-green-700 dark:text-green-300">
          Your company profile has been set up successfully
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <span className="font-medium text-green-800 dark:text-green-200">Company:</span>
            <span className="ml-2 text-green-700 dark:text-green-300">{companyData.companyName}</span>
          </div>
          <div>
            <span className="font-medium text-green-800 dark:text-green-200">Plan:</span>
            <span className="ml-2 text-green-700 dark:text-green-300 capitalize">
              {companyData.subscriptionPlan} Plan
            </span>
          </div>
          <div>
            <span className="font-medium text-green-800 dark:text-green-200">Status:</span>
            <span className="ml-2 text-green-700 dark:text-green-300 capitalize">
              {companyData.subscriptionStatus}
            </span>
          </div>
          {companyData.subscriptionStatus === "active" && (
            <div className="pt-3">
              <Button variant="outline" size="sm">
                View Subscription Details
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

