import { expect, test } from "vitest";
import { getContextHelp } from "./help";
import { methods } from "./methods";

test("study help follows every method's actual step rather than its number", () => {
  for (const method of methods) for (const step of method.steps) {
    const help = getContextHelp("study", { studyPhase: "study", studyMethodName: method.short, studyStepDetails: step });
    expect(help.title).toContain(step.title);
    expect(help.summary).toBe(step.action);
    expect(help.tips).toContain(step.prompt);
  }
});
test("memory help distinguishes reading, partial recall, full recall, and completion", () => {
  const help = (level: number, done = false) => getContextHelp("memory", { memoryPracticing: true, memoryPracticeLevel: level, memoryPracticeAllCorrect: done });
  expect(help(1).summary).toContain("Read");
  expect(help(2).summary).toContain("alternating");
  expect(help(3).summary).toContain("every word");
  expect(help(2, true).title).toBe("Continue to step 3");
  expect(help(3, true).title).toBe("Finish this verse");
});
test("plan help follows the clicked section, not just whether a plan exists", () => {
  expect(getContextHelp("plans", { planView: "browse", planTitle: "John" }).title).toBe("Choose a reading plan");
  expect(getContextHelp("plans", { planView: "current", planTitle: "John" }).summary).toContain("John");
  expect(getContextHelp("plans", { planView: "current" }).summary).toContain("do not have a current plan");
});
test("review and saved study help override the active step", () => {
  expect(getContextHelp("study", { studyPhase: "review", studyStepDetails: methods[0].steps[0] }).title).toBe("Study review help");
  expect(getContextHelp("study", { studyPhase: "saved" }).title).toBe("Your saved study");
});
