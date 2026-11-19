const studyMethodInstructions: Record<string, string> = {
  Observation: "Read the passage again and write down its repeated words, speakers, actions, and contrasts before deciding what it means.",
  OIA: "Note what the passage says, explain its meaning in context, then choose one response that follows from it.",
  COMA: "Consider the context, observe the details, explain the main point, and choose a fitting application.",
  Inductive: "Mark repeated words and contrasts, follow the passage's argument, and check your conclusion against its context.",
  SOAP: "Choose a verse, write what it says in context, name one response, and turn that response into a prayer.",
  Meditation: "Read slowly again, linger over a phrase in its context, and respond to God in prayer.",
  "Lectio Divina": "Read slowly, notice a phrase in context, respond in prayer, and sit with what you have read.",
  "Word study": "Choose a key word and compare how it is used here and in nearby verses before looking elsewhere.",
  "Biblical theology": "Trace a theme through the wider story of Scripture while keeping this passage's original setting in view."
};

export function planStudyMethodGuidance(method: string): string {
  return studyMethodInstructions[method] || method;
}
