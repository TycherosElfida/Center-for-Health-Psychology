/**
 * Score Interpretation — Maps total/dimension scores to human-readable labels.
 *
 * This module is a plain TS file (no framework directives) so it can be
 * imported by both Server and Client Components.
 *
 * Each test has its own interpretation table based on published clinical
 * norms. The function returns a severity label, colour, description, and
 * an optional recommendation string.
 */

export interface ScoreInterpretation {
  label: string;
  color: string;
  description: string;
  severity: "low" | "moderate" | "high";
}

const INTERPRETATIONS: Record<string, (score: number, maxScore: number) => ScoreInterpretation> = {
  pss10: (score, max) => {
    const pct = (score / max) * 100;
    if (pct <= 33)
      return {
        label: "Low Stress",
        color: "#2ecc71",
        description:
          "Your stress levels appear low. You seem to be managing life's demands well. Keep maintaining healthy habits and self-care routines.",
        severity: "low",
      };
    if (pct <= 66)
      return {
        label: "Moderate Stress",
        color: "#f39c12",
        description:
          "You're experiencing a moderate level of perceived stress. Consider incorporating stress-reduction techniques like mindfulness or regular exercise.",
        severity: "moderate",
      };
    return {
      label: "High Stress",
      color: "#e74c3c",
      description:
        "Your score indicates elevated stress levels. It may be beneficial to speak with a mental health professional to develop effective coping strategies.",
      severity: "high",
    };
  },

  srq29: (score, max) => {
    const pct = (score / max) * 100;
    if (pct <= 30)
      return {
        label: "No Significant Concerns",
        color: "#2ecc71",
        description:
          "Your responses do not indicate significant mental health symptoms at this time. Continue prioritizing your well-being.",
        severity: "low",
      };
    if (pct <= 60)
      return {
        label: "Mild Symptoms",
        color: "#f39c12",
        description:
          "You may be experiencing some mild symptoms. Consider speaking with a healthcare professional for further evaluation.",
        severity: "moderate",
      };
    return {
      label: "Possible Mental Health Concern",
      color: "#e74c3c",
      description:
        "Your responses suggest you may be experiencing significant symptoms. We recommend consulting with a mental health professional.",
      severity: "high",
    };
  },

  gpius2: (score) => {
    if (score <= 34)
      return {
        label: "Normal Internet Use",
        color: "#2ecc71",
        description:
          "Your internet usage patterns appear healthy and well-managed. No significant indicators of problematic use were detected.",
        severity: "low",
      };
    if (score <= 52)
      return {
        label: "Mild Problematic Use",
        color: "#f39c12",
        description:
          "Your score indicates mild patterns of problematic internet use. Consider monitoring your online habits and setting healthy boundaries.",
        severity: "moderate",
      };
    return {
      label: "Severe Problematic Use",
      color: "#e74c3c",
      description:
        "Your results suggest significant problematic internet use patterns. We recommend speaking with a professional about developing healthier digital habits.",
      severity: "high",
    };
  },

  srs: (score) => {
    if (score <= 33)
      return {
        label: "Low Resilience",
        color: "#e74c3c",
        description:
          "Your score suggests lower resilience capacity. Building coping skills, social support, and self-efficacy through professional guidance may be beneficial.",
        severity: "high",
      };
    if (score <= 50)
      return {
        label: "Moderate Resilience",
        color: "#f39c12",
        description:
          "You demonstrate moderate resilience. Strengthening specific areas like self-efficacy or perceived control could further enhance your capacity to cope.",
        severity: "moderate",
      };
    return {
      label: "High Resilience",
      color: "#2ecc71",
      description:
        "You demonstrate strong resilience capacity. You appear well-equipped to handle adversity and recover from challenges.",
      severity: "low",
    };
  },

  mbti: (score) => {
    if (score >= 60)
      return {
        label: "ENFJ — The Protagonist",
        color: "#6BA3BE",
        description:
          "You're a natural leader, full of passion and charisma. You're driven by a deep sense of altruism and a desire to make a difference.",
        severity: "low",
      };
    if (score >= 40)
      return {
        label: "INFP — The Mediator",
        color: "#9B8FC4",
        description:
          "You're idealistic and deeply empathetic. You're guided by your values and always looking for the good in people and the world around you.",
        severity: "low",
      };
    return {
      label: "ISTJ — The Logistician",
      color: "#4DB6AC",
      description:
        "You're practical, fact-minded, and dependable. You take responsibility for your actions and take pride in the work you do.",
      severity: "low",
    };
  },
};

/**
 * Get the interpretation for a given test and score.
 * Falls back to a generic interpretation if the test slug is not recognized.
 */
export function getScoreInterpretation(
  testSlug: string,
  totalScore: number,
  maxScore = 100
): ScoreInterpretation {
  const interpreter = INTERPRETATIONS[testSlug];
  if (interpreter) return interpreter(totalScore, maxScore);

  // Generic fallback
  const pct = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  if (pct <= 33)
    return {
      label: "Low",
      color: "#2ecc71",
      description: "Your assessment score falls within the low range.",
      severity: "low",
    };
  if (pct <= 66)
    return {
      label: "Moderate",
      color: "#f39c12",
      description: "Your assessment score falls within the moderate range.",
      severity: "moderate",
    };
  return {
    label: "High",
    color: "#e74c3c",
    description: "Your assessment score falls within the high range.",
    severity: "high",
  };
}
