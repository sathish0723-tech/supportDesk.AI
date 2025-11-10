"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Skip Notification Component
 * Shows notification when user skips onboarding or payment
 * 
 * @returns {JSX.Element} Skip notification UI
 */
export function SkipNotification() {
  const searchParams = useSearchParams();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState("");

  useEffect(() => {
    const onboarding = searchParams.get("onboarding");
    const payment = searchParams.get("payment");

    if (onboarding === "skipped" || payment === "skipped") {
      setShowNotification(true);
      setNotificationType(onboarding === "skipped" ? "onboarding" : "payment");
    }
  }, [searchParams]);

  if (!showNotification) {
    return null;
  }

  const handleCompleteSetup = () => {
    setShowNotification(false);
    window.location.href = "/onboarding";
  };

  const handleUpgrade = () => {
    setShowNotification(false);
    window.location.href = "/billing";
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center">
            ⚡
          </div>
          {notificationType === "onboarding" ? "Onboarding Skipped" : "Payment Skipped"}
        </CardTitle>
        <CardDescription className="text-yellow-700 dark:text-yellow-300">
          {notificationType === "onboarding" 
            ? "You can complete your company setup anytime to unlock more features."
            : "You're currently on a free plan. Upgrade anytime to unlock premium features."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          {notificationType === "onboarding" ? (
            <Button onClick={handleCompleteSetup} size="sm">
              Complete Setup
            </Button>
          ) : (
            <Button onClick={handleUpgrade} size="sm">
              Upgrade Now
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => setShowNotification(false)} 
            size="sm"
          >
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

