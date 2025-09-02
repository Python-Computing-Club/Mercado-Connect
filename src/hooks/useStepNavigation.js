import { useState } from "react";

export default function useStepNavigation(initialStep = 1, options = {}) {
  const [step, setStep] = useState(initialStep);
  const { customBack, validateStep } = options;

  const handleBack = () => {
    if (customBack) {
      const newStep = customBack(step);
      if (newStep != null && newStep !== step) {
        setStep(newStep);
        return;
      }
    }

    if (step > 1) setStep((s) => s - 1);
  };

  const handleContinue = (form) => {
    if (validateStep && !validateStep(step, form)) {
      return;
    }
    setStep((s) => s + 1);
  };

  return { step, setStep, handleBack, handleContinue };
}
