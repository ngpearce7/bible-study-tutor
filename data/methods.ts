export type StudyStep = {
  title: string;
  action: string;
  prompt: string;
  checklist: string[];
  output: string;
  example: string;
  responseType: "none" | "text";
  nextLabel?: string;
};

export type StudyMethod = {
  id: string;
  short: string;
  name: string;
  tone: string;
  description: string;
  labels?: string[];
  detail?: {
    purpose: string;
    bestFor: string[];
    watchFor: string;
    examplePassage: string;
    exampleWalkthrough: string[];
  };
  steps: StudyStep[];
};

export const methods: StudyMethod[] = [
  {
    id: "oia",
    short: "OIA",
    name: "Observation, Interpretation, Application",
    tone: "Best starting point",
    description: "Read carefully, notice what is there, understand the meaning, then choose one response.",
    labels: ["Beginner", "Balanced", "Daily study"],
    steps: [
      {
        title: "Read Slowly",
        action: "Read the passage twice before writing anything.",
        prompt: "First read for the overall flow. Then read again and slow down over repeated words, people, actions, and images.",
        checklist: ["Read the whole passage once", "Read it a second time more slowly", "Notice one phrase that seems important"],
        output: "No writing yet. Click next when you have read it twice.",
        example: "You are preparing to observe. Do not explain the passage yet.",
        responseType: "none",
        nextLabel: "I read it twice"
      },
      {
        title: "Observe",
        action: "Write what you see in the passage.",
        prompt: "Do not explain or apply it yet. Just list details that are actually in the selected verses.",
        checklist: ["List repeated words or phrases", "Name who is speaking or acting", "Notice commands, promises, contrasts, emotions, or images"],
        output: "Write 3-5 observations. Start each one with “I notice...”",
        example: "I notice that God is the one leading, restoring, and guiding.",
        responseType: "text"
      },
      {
        title: "Interpret",
        action: "Write the main meaning of the passage.",
        prompt: "Use your observations to explain what the passage teaches. Keep your answer tied to the words in the passage.",
        checklist: ["Use at least one observation as evidence", "Say what this shows about God, people, faith, sin, wisdom, or obedience", "Avoid application until the next step"],
        output: "Write 1-2 sentences beginning with “This passage teaches...”",
        example: "This passage teaches that God guides and cares for his people even when the path is difficult.",
        responseType: "text"
      },
      {
        title: "Apply",
        action: "Choose one specific response for today.",
        prompt: "Move from meaning to a concrete act of trust, prayer, obedience, repentance, or encouragement.",
        checklist: ["Name the real situation where this matters", "Choose one response you can actually do", "Make it specific to the next 24 hours"],
        output: "Write one sentence beginning with “Today I will...”",
        example: "Today I will pray before making the decision I have been trying to control.",
        responseType: "text"
      }
    ]
  },
  {
    id: "soap",
    short: "SOAP",
    name: "Scripture, Observation, Application, Prayer",
    tone: "Devotional rhythm",
    description: "Read the Scripture, observe what it says, apply it personally, then pray it back to God.",
    labels: ["Devotional", "Prayer", "Journal"],
    steps: [
      {
        title: "Read Scripture",
        action: "Read the selected passage twice, slowly.",
        prompt: "On the first reading, take in the whole passage. On the second reading, slow down and listen for words, images, or phrases that stand out.",
        checklist: ["Read the passage once from beginning to end", "Read it a second time more slowly", "Choose one verse or phrase you want to focus on"],
        output: "No writing yet. Click next when you have read the passage twice.",
        example: "If a phrase stands out, hold it in mind for the next step.",
        responseType: "none",
        nextLabel: "I read it twice"
      },
      {
        title: "Observation",
        action: "Write your observations about the selected verse or passage.",
        prompt: "Describe what is happening in the Scripture. Stay with what the text says before thinking about your life.",
        checklist: ["What words or phrases stand out?", "Who is acting, speaking, receiving, or responding?", "Is there a promise, command, warning, prayer, image, or contrast?"],
        output: "Write 2-4 observations. You can start with “I notice...”",
        example: "I notice that the passage describes God as active, near, and personally involved.",
        responseType: "text"
      },
      {
        title: "Application",
        action: "Write how you will apply what you observed.",
        prompt: "Ask where this Scripture touches your actual life today: your thoughts, choices, habits, relationships, fears, or hopes.",
        checklist: ["Name one real-life situation", "Say what the passage invites you to believe or do", "Choose a response that is concrete and doable"],
        output: "Write 1-3 sentences beginning with “I can apply this by...”",
        example: "I can apply this by asking God for guidance before reacting in anxiety.",
        responseType: "text"
      },
      {
        title: "Prayer",
        action: "Write a prayer based on the passage and your application.",
        prompt: "Speak directly to God. Use your observations and application as the content of your prayer.",
        checklist: ["Thank God for something shown in the passage", "Ask for help with your application", "Be honest and specific"],
        output: "Write a short prayer of 2-5 sentences.",
        example: "Lord, help me trust your care today. Guide my next step and teach me to respond with faith instead of fear.",
        responseType: "text"
      }
    ]
  },
  {
    id: "inductive",
    short: "IND",
    name: "Inductive Study",
    tone: "Deeper investigation",
    description: "Read closely, map the passage, ask questions, then summarize what the text teaches.",
    labels: ["Deep study", "Analytical", "Teaching prep"],
    steps: [
      {
        title: "Read for Context",
        action: "Read the passage twice and identify the basic setting.",
        prompt: "Before analyzing details, get oriented. Notice the kind of writing, the people involved, and the basic flow.",
        checklist: ["Read the whole passage twice", "Identify the speaker or main person", "Notice whether this is story, poetry, teaching, law, prophecy, or letter"],
        output: "No writing yet. Click next when you are oriented.",
        example: "You are preparing to study the passage in context.",
        responseType: "none",
        nextLabel: "I am oriented"
      },
      {
        title: "Divide the Passage",
        action: "Break the passage into smaller sections.",
        prompt: "Find where the idea, scene, speaker, command, or image changes.",
        checklist: ["Create 2-4 sections", "Give each section a short label", "Include verse numbers when possible"],
        output: "Write section labels, such as “Verses 1-3: provision and guidance.”",
        example: "Verses 1-3: provision. Verse 4: presence in danger. Verses 5-6: abundance.",
        responseType: "text"
      },
      {
        title: "Mark Key Details",
        action: "List the details that carry the meaning.",
        prompt: "Look for repeated words, strong verbs, commands, promises, contrasts, images, and changes in tone.",
        checklist: ["List repeated words or images", "Note commands or promises", "Identify one detail that seems central"],
        output: "Write a short list of key details and why they matter.",
        example: "The passage shifts from talking about God to talking directly to God.",
        responseType: "text"
      },
      {
        title: "Ask Questions",
        action: "Ask questions raised by the passage.",
        prompt: "Good questions come from the text itself. Try to answer them using nearby clues before outside sources.",
        checklist: ["Ask at least two questions", "Include one “why” or “how” question", "Write a first-pass answer for each"],
        output: "Write 2 questions and a short answer for each.",
        example: "Why mention the valley? The passage acknowledges danger but emphasizes God's presence within it.",
        responseType: "text"
      },
      {
        title: "Summarize",
        action: "Write the main point of the passage.",
        prompt: "Use your sections, key details, and questions to explain the passage in plain language.",
        checklist: ["Name the main subject", "Name the main action or claim", "Use “because” or “therefore” if helpful"],
        output: "Write a 1-2 sentence summary of what the passage teaches.",
        example: "Because the Lord shepherds his people, they can trust him in need, danger, and uncertainty.",
        responseType: "text"
      }
    ]
  },
  {
    id: "lectio",
    short: "LECT",
    name: "Lectio Divina",
    tone: "Prayerful listening",
    description: "Read slowly, meditate on one phrase, pray honestly, then rest with one truth.",
    labels: ["Prayerful", "Reflective", "Slow reading"],
    steps: [
      {
        title: "Read",
        action: "Read the passage twice, slowly and prayerfully.",
        prompt: "Do not try to study every detail. Listen for the word or phrase that draws your attention.",
        checklist: ["Read once slowly", "Read a second time even slower", "Notice one word or phrase that stands out"],
        output: "No writing yet. Click next when you have read and noticed one phrase.",
        example: "You might notice a phrase like “still waters” or “you are with me.”",
        responseType: "none",
        nextLabel: "I noticed a phrase"
      },
      {
        title: "Meditate",
        action: "Stay with the phrase that stood out.",
        prompt: "Hold that phrase before God. Notice what it brings up in you: comfort, resistance, longing, confession, or hope.",
        checklist: ["Write the phrase", "Name what it stirs in you", "Do not rush to fix or explain it"],
        output: "Write 2-4 reflective sentences beginning with “This brings up...”",
        example: "This brings up how hurried I feel and how much I need God to lead me into rest.",
        responseType: "text"
      },
      {
        title: "Pray",
        action: "Turn the phrase into prayer.",
        prompt: "Speak directly to God from what surfaced during meditation.",
        checklist: ["Address God directly", "Use plain honest words", "Ask for the grace this passage invites"],
        output: "Write a short prayer.",
        example: "God, lead me beside still waters. Help me stop performing peace and receive it.",
        responseType: "text"
      },
      {
        title: "Rest",
        action: "Receive one truth to carry with you.",
        prompt: "Sit with the passage without adding more analysis. Name the simple truth you want to carry today.",
        checklist: ["Keep it to one sentence", "Make it memorable", "Let it be received, not forced"],
        output: "Write one sentence to carry through the day.",
        example: "I can be led by God without earning his care.",
        responseType: "text"
      }
    ]
  },
  {
    id: "read",
    short: "READ",
    name: "Read, Explore, Apply, Do",
    tone: "Simple daily study",
    description: "A clear four-step rhythm for reading a passage, exploring what stands out, applying one truth, and choosing one next action.",
    labels: ["Beginner", "Practical", "Quick study"],
    detail: {
      purpose: "READ is designed for people who want a simple, memorable path through Scripture without feeling like they need specialist study skills. It keeps the study practical while still slowing the reader down enough to notice the text.",
      bestFor: ["Beginners", "Daily quiet time", "Short passages", "People who want one clear action step"],
      watchFor: "Do not rush straight to the Do step. The strength of READ is that action grows out of careful reading and honest exploration.",
      examplePassage: "James 1:22",
      exampleWalkthrough: [
        "Read: The verse calls people to be doers of the word, not hearers only.",
        "Explore: The warning is self-deception. Hearing truth without response can feel spiritual while leaving life unchanged.",
        "Apply: I need to identify one command or invitation from today’s passage rather than only agreeing with it.",
        "Do: I will choose one concrete act of obedience before the day ends."
      ]
    },
    steps: [
      {
        title: "Read",
        action: "Read the passage slowly and notice the basic flow.",
        prompt: "Read once for the whole thought. Then read again and listen for a word, phrase, command, promise, warning, or image that seems important.",
        checklist: ["Read the passage twice", "Notice one word or phrase that stands out", "Name the main movement of the passage"],
        output: "No writing yet. Click next when you have read slowly.",
        example: "You might notice a command, promise, image, or repeated word.",
        responseType: "none",
        nextLabel: "I read it slowly"
      },
      {
        title: "Explore",
        action: "Explore what stands out and why it matters.",
        prompt: "Write what you noticed. Stay close to the passage before moving to personal application.",
        checklist: ["Write the word or phrase that stood out", "Explain what is happening around it", "Name what it reveals about God, people, wisdom, or faith"],
        output: "Write 2-4 sentences beginning with “I noticed...” or “This stands out because...”",
        example: "I noticed that the passage warns against hearing without doing.",
        responseType: "text"
      },
      {
        title: "Apply",
        action: "Connect the passage to one real area of life.",
        prompt: "Ask where this passage touches your thoughts, choices, relationships, habits, or fears today.",
        checklist: ["Name one real situation", "Say what the passage invites you to believe or change", "Keep it personal and specific"],
        output: "Write 1-3 sentences beginning with “This applies to...”",
        example: "This applies to the way I listen to sermons but delay obedience.",
        responseType: "text"
      },
      {
        title: "Do",
        action: "Choose one concrete response.",
        prompt: "Turn your application into a small act of trust, obedience, repentance, prayer, or encouragement.",
        checklist: ["Choose one action", "Make it doable today", "Use plain concrete language"],
        output: "Write one sentence beginning with “Today I will...”",
        example: "Today I will send the apology I have been avoiding.",
        responseType: "text"
      }
    ]
  },
  {
    id: "hear",
    short: "HEAR",
    name: "Highlight, Explain, Apply, Respond",
    tone: "Reflective and personal",
    description: "A devotional method that helps users highlight a key phrase, explain it in their own words, apply it personally, and respond to God.",
    labels: ["Reflective", "Highlighting", "Devotional"],
    detail: {
      purpose: "HEAR helps a reader move from attention to response. It is especially good when a passage has one phrase that seems to press gently on the heart.",
      bestFor: ["Devotional reading", "Journaling", "Prayerful reflection", "Users who like highlighting text"],
      watchFor: "The Explain step should use the passage itself, not just a personal feeling. The feeling matters, but the text leads.",
      examplePassage: "Psalm 23:1",
      exampleWalkthrough: [
        "Highlight: 'I shall not want.'",
        "Explain: David connects the Lord’s shepherding care with deep provision.",
        "Apply: I often act as though I must secure everything myself.",
        "Respond: Lord, teach me to receive your care before I grasp for control."
      ]
    },
    steps: [
      {
        title: "Highlight",
        action: "Choose one word or phrase from the passage.",
        prompt: "Read slowly and choose the phrase that carries weight for you today. It may comfort, challenge, puzzle, or invite you.",
        checklist: ["Read the passage twice", "Choose one phrase", "Notice why it drew your attention"],
        output: "No writing yet. Click next when you have chosen a phrase.",
        example: "A phrase like “the Lord is my shepherd” may become your focus.",
        responseType: "none",
        nextLabel: "I chose a phrase"
      },
      {
        title: "Explain",
        action: "Explain the phrase in your own words.",
        prompt: "Use the surrounding passage to explain what the phrase means. Keep it simple and grounded.",
        checklist: ["Write the phrase", "Explain it in plain language", "Use one clue from the passage"],
        output: "Write 2-3 sentences beginning with “This means...”",
        example: "This means God personally cares for and guides his people.",
        responseType: "text"
      },
      {
        title: "Apply",
        action: "Apply the phrase to your current life.",
        prompt: "Ask how this phrase speaks to your day, relationships, decisions, fears, habits, or hopes.",
        checklist: ["Name one real area of life", "Say what the phrase challenges or comforts", "Make the application specific"],
        output: "Write 1-3 sentences beginning with “This speaks to...”",
        example: "This speaks to my anxiety about provision and control.",
        responseType: "text"
      },
      {
        title: "Respond",
        action: "Respond to God in prayer or obedience.",
        prompt: "Turn your application into a short prayer, confession, thanksgiving, or action.",
        checklist: ["Address God honestly", "Name the help you need", "Choose one response if action is needed"],
        output: "Write a short response to God.",
        example: "Lord, help me trust your shepherding care before I try to control everything.",
        responseType: "text"
      }
    ]
  },
  {
    id: "coma",
    short: "COMA",
    name: "Context, Observation, Meaning, Application",
    tone: "Structured study",
    description: "A steady method for reading a passage in context, observing details, finding the main meaning, and applying it wisely.",
    labels: ["Structured", "Group friendly", "Meaning"],
    detail: {
      purpose: "COMA gives structure without becoming too technical. It is a helpful bridge between devotional reading and deeper inductive study because it forces the reader to consider context before meaning and application.",
      bestFor: ["Small groups", "Teaching preparation", "Letters and teaching passages", "Users ready for a little more structure"],
      watchFor: "The biggest risk is skipping Context. A strong application should grow from what the passage meant in its setting.",
      examplePassage: "Philippians 4:6-7",
      exampleWalkthrough: [
        "Context: Paul writes about steady joy and peace in the Lord.",
        "Observation: The passage contrasts anxiety with prayer, petition, thanksgiving, and peace.",
        "Meaning: God invites anxious believers to bring their needs to him, and his peace guards them.",
        "Application: I can turn a specific worry into prayer with thanksgiving instead of rehearsing it alone."
      ]
    },
    steps: [
      {
        title: "Context",
        action: "Notice where the passage sits and what is happening around it.",
        prompt: "Read the selected passage and look briefly at the verses before and after if available. Identify the speaker, audience, situation, or flow.",
        checklist: ["Read the passage twice", "Identify the kind of writing", "Notice the nearby theme or situation"],
        output: "Write 1-2 sentences beginning with “In context...”",
        example: "In context, Paul is encouraging believers toward joy, steadiness, and prayer.",
        responseType: "text"
      },
      {
        title: "Observation",
        action: "List what the passage says.",
        prompt: "Observe repeated words, commands, promises, contrasts, reasons, images, and connecting words.",
        checklist: ["List repeated or important words", "Notice commands or promises", "Identify contrasts or causes"],
        output: "Write 3-5 observations.",
        example: "I notice that prayer is described with thanksgiving, not only requests.",
        responseType: "text"
      },
      {
        title: "Meaning",
        action: "Summarize what the passage teaches.",
        prompt: "Use the context and observations to state the main meaning. Focus on what the passage teaches before deciding what you will do.",
        checklist: ["Use at least one observation", "Name the main claim or invitation", "Keep it tied to the passage"],
        output: "Write 1-2 sentences beginning with “This passage means...”",
        example: "This passage means believers can bring anxiety to God in prayer and receive his guarding peace.",
        responseType: "text"
      },
      {
        title: "Application",
        action: "Choose a wise response.",
        prompt: "Apply the meaning to your actual life with humility and specificity.",
        checklist: ["Name the situation", "Choose one response", "Make it concrete for today or this week"],
        output: "Write one response beginning with “Because of this...”",
        example: "Because of this, I will pray through one specific worry tonight with thanksgiving.",
        responseType: "text"
      }
    ]
  }
];
