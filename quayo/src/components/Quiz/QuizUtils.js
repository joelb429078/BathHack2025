// src/components/Quiz/quizUtils.js

// Helper function to get shuffled order
export function getShuffledOrder(n) {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Check if answer is correct based on question type
export function checkScorableCorrectness(component, userAnswer) {
  switch (component.type) {
    case "true_false":
      return String(userAnswer).toLowerCase() === String(component.value).toLowerCase()
        ? "correct"
        : "incorrect";
    case "multiple_choice_single":
      return String(userAnswer) === String(component.correctIndex) ? "correct" : "incorrect";
    case "multiple_choice_multi": {
      if (!Array.isArray(component.correctAnswers)) return "incorrect";
      if (!Array.isArray(userAnswer)) return "incorrect";
      if (component.correctAnswers.length !== userAnswer.length) return "incorrect";
      const sortedCorrect = [...component.correctAnswers].map(String).sort();
      const sortedUser = [...userAnswer].map(String).sort();
      return sortedCorrect.every((val, i) => val === sortedUser[i]) ? "correct" : "incorrect";
    }
    case "custom_component": {
      if (!userAnswer) return "incorrect";
      const subItems = component.subItems || [];
      for (const sub of subItems) {
        if (sub.type === "checkbox") {
          const correctBool = sub.value === true || sub.value === "true";
          const userBool = !!userAnswer[sub.id];
          if (userBool !== correctBool) return "incorrect";
        }
      }
      return "correct";
    }
    case "short_text_answer":
      if (typeof userAnswer !== "string") return "incorrect";
      return userAnswer.trim() === (component.correctAnswer || "").trim() ? "correct" : "incorrect";
    case "single_checkbox": {
      let correctVal = component.correctValue;
      if (typeof correctVal === "string") {
        correctVal = correctVal === "true";
      }
      const userVal = userAnswer === undefined ? false : userAnswer;
      return userVal === correctVal ? "correct" : "incorrect";
    }
    case "toggle_button": {
      let correctVal = component.toggled;
      if (typeof correctVal === "string") {
        correctVal = correctVal === "true";
      }
      const userVal = userAnswer === undefined ? false : userAnswer;
      return userVal === correctVal ? "correct" : "incorrect";
    }
    case "numeric_slider": {
      if (typeof userAnswer !== "number") return "incorrect";
      if (component.targetValue !== undefined && component.targetValue !== null) {
        const target = Number(component.targetValue);
        return userAnswer === target ? "correct" : "incorrect";
      } else {
        return userAnswer >= component.minValue && userAnswer <= component.maxValue
          ? "correct"
          : "incorrect";
      }
    }
    case "discrete_slider": {
      if (typeof userAnswer !== "number") return "incorrect";
      return userAnswer === component.selectedIndex ? "correct" : "incorrect";
    }
    case "ranking": {
      if (!Array.isArray(userAnswer) || !Array.isArray(component.correctOrder)) {
        console.warn("Invalid ranking data:", { userAnswer, correctOrder: component.correctOrder });
        return "incorrect";
      }
      // Ensure items array exists
      const itemsLength = component.items?.length || userAnswer.length;
      // If correctOrder is shorter than items, extend it with remaining indices
      let adjustedCorrectOrder = [...component.correctOrder];
      if (adjustedCorrectOrder.length < itemsLength) {
        console.warn(
          `correctOrder length (${adjustedCorrectOrder.length}) is less than items length (${itemsLength}). Extending correctOrder.`
        );
        for (let i = adjustedCorrectOrder.length; i < itemsLength; i++) {
          adjustedCorrectOrder.push(i);
        }
      } else if (adjustedCorrectOrder.length > itemsLength) {
        console.warn(
          `correctOrder length (${adjustedCorrectOrder.length}) is greater than items length (${itemsLength}). Truncating correctOrder.`
        );
        adjustedCorrectOrder = adjustedCorrectOrder.slice(0, itemsLength);
      }
      // Compare userAnswer with adjustedCorrectOrder
      const userStr = userAnswer.map(String).join(",");
      const correctStr = adjustedCorrectOrder.map(String).join(",");
      console.log("Ranking comparison:", { userAnswer: userStr, correctOrder: correctStr });
      return userStr === correctStr ? "correct" : "incorrect";
    }
    case "matching_pairs": {
      if (!Array.isArray(userAnswer)) return "incorrect";
      const normalizeMatches = (matches) =>
        matches.map((m) => `${m.left}-${m.right}`).sort().join(",");
      const correctMatches = component.pairs.map((_, idx) => ({ left: idx, right: idx }));
      return normalizeMatches(userAnswer) === normalizeMatches(correctMatches)
        ? "correct"
        : "incorrect";
    }
    default:
      return null;
  }
}

// Check if a component is of a scorable type
export function isScorableType(type) {
  return [
    "true_false",
    "multiple_choice_single",
    "multiple_choice_multi",
    "custom_component",
    "short_text_answer",
    "single_checkbox",
    "toggle_button",
    "numeric_slider",
    "discrete_slider",
    "ranking",
    "matching_pairs",
    "shape",
  ].includes(type);
}

// Check if a required question is unanswered
export function isRequiredAndUnanswered(questionId, comp, answers) {
  if (["true_false", "multiple_choice_single", "short_text_answer", "matching_pairs"].includes(comp.type)) {
    const userAnswer = answers[questionId]?.[comp.id];
    if (comp.type === "short_text_answer") {
      return !userAnswer || userAnswer.trim() === "";
    } else if (comp.type === "matching_pairs") {
      if (!Array.isArray(userAnswer) || userAnswer.length === 0) return true;
      const expectedPairs = comp.pairs.length;
      const validMatches = userAnswer.filter(m => m.right !== undefined && m.right !== null && m.right !== "").length;
      return validMatches < expectedPairs;
    }
    return userAnswer === undefined || userAnswer === null;
  }
  return false;
}

// Calculate total possible score
export function calculateTotalPossibleScore(questions) {
  return questions.reduce((total, question) => total + (question.points || 0), 0);
}

// Check quiz status
export async function checkQuizStatus(sessionId, navigate) {
  const quizStatus = sessionStorage.getItem(`quizStatus_${sessionId}`);
  const verifiedResponseId = sessionStorage.getItem(`responseVerified_${sessionId}`);

  if (quizStatus === "completed" && verifiedResponseId) {
    const shouldVerify = window.confirm(
      "You have already completed this quiz. Would you like to verify your submission?"
    );

    if (shouldVerify) {
      navigate(`/quiz/${sessionId}/complete`);
    } else {
      sessionStorage.removeItem(`quizStatus_${sessionId}`);
      sessionStorage.removeItem(`responseVerified_${sessionId}`);
      sessionStorage.removeItem(`formId_${sessionId}`);
      sessionStorage.removeItem(`respondentId_${sessionId}`);
      sessionStorage.removeItem(`formAccess_${sessionId}`);
      navigate(`/form-entrance/${sessionId}`);
    }
    return false;
  }
  return true;
}