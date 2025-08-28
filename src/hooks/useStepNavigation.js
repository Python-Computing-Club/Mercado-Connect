import { useState } from "react";

export default function useStepNavigation(initialStep = 1) {
  const [step, setStep] = useState(initialStep);

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleContinue = () => {
    setStep((s) => s + 1);
  };

  return { step, setStep, handleBack, handleContinue };
}