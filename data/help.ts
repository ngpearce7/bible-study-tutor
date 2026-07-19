export type ContextHelp = {
  title: string;
  icon: string;
  summary: string;
  tips: string[];
};

export type ContextHelpContext = {
  studyPhase?: string;
  studyStep?: number;
  bibleSearchOpen?: boolean;
  bibleSearchResultCount?: number;
  selectedBibleVerseCount?: number;
  memoryView?: string;
  memoryPracticing?: boolean;
  memoryMeditating?: boolean;
  journalView?: string;
  journalFilter?: string;
  communityView?: string;
  signedIn?: boolean;
  adminProfileSelected?: boolean;
};

export function getContextHelp(tab: string, context: ContextHelpContext = {}): ContextHelp {
  if (tab === "study" && context.studyPhase === "review") {
    return {
      title: "Study review help",
      icon: "checkmark-circle-outline",
      summary: "You are at the final review stage. This is where your study becomes something useful to keep, revisit, print, or share.",
      tips: ["Read your answers once more before saving.", "Use the shareable insight area for one clear takeaway.", "Choose a friend or circle only if you want to post the insight privately."]
    };
  }

  if (tab === "study" && typeof context.studyStep === "number") {
    return {
      title: `Study step ${context.studyStep} help`,
      icon: "book-outline",
      summary: "The current step panel tells you what to do next. Keep your answer simple, honest, and grounded in the passage.",
      tips: ["Use note starters if you feel stuck.", "Select passage text to highlight, save to Memory, or print a worksheet.", "Use Focus mode if the side panels are distracting."]
    };
  }

  if (tab === "bible" && context.selectedBibleVerseCount) {
    return {
      title: "Selected verses help",
      icon: "checkbox-outline",
      summary: `${context.selectedBibleVerseCount} verse${context.selectedBibleVerseCount === 1 ? " is" : "s are"} selected. Use the floating action bar to decide what to do with the selection.`,
      tips: [
        "Tap Study to open the selected verses in Guided Study.",
        "Tap Memory to save the selection for review.",
        "Tap Print to make a worksheet for pen-and-paper study.",
        "Use Note for your own comment, or Bookmark when you simply want to return to the passage.",
        "Tap Clear or the close icon when you are finished selecting."
      ]
    };
  }

  if (tab === "bible" && context.bibleSearchOpen) {
    return {
      title: "Scripture search help",
      icon: "search-outline",
      summary: context.bibleSearchResultCount
        ? "Search results are grouped by Testament so you can scan the whole Bible without losing your place."
        : "Use Scripture search for exact words, broad matches, themes, or questions.",
      tips: [
        "Use Word for exact whole-word searching.",
        "Use Exact phrase when the order of words matters.",
        "Use Any words or Theme when you want broader results.",
        "Tap Read to open the verse in context, or Study to begin a guided study.",
        "Use Clear when you want the passage view back without search results taking space."
      ]
    };
  }

  if (tab === "memory" && context.memoryMeditating) {
    return {
      title: "Meditation help",
      icon: "sparkles-outline",
      summary: "Meditate mode slows one memory verse down so you can notice, reflect, pray, and carry it with you.",
      tips: ["Keep each response short if that helps you focus.", "Save the meditation to Journal when you want to revisit it.", "Close the focus panel when you are ready to return to Memory."]
    };
  }

  if (tab === "memory" && context.memoryPracticing) {
    return {
      title: "Memory practice help",
      icon: "create-outline",
      summary: "Practice uses three steps: read the verse, fill some blanks, then fill the whole verse from memory.",
      tips: [
        "Step 1 is just reading; Step 2 hides alternating words; Step 3 asks for the whole verse.",
        "Hints reveal more of a word when you need help.",
        "A word shows feedback once your answer is long enough to check.",
        "Press Enter or Return when the Finish Verse button is focused.",
        "When reviewing due verses, the next due verse can open automatically."
      ]
    };
  }

  if (tab === "memory" && context.memoryView === "browse") {
    return {
      title: "Memory browse help",
      icon: "albums-outline",
      summary: "Browse helps you find saved verses by collection, Testament, book, chapter, and review status.",
      tips: ["Use collections for themes like Identity, Prayer, or Promises.", "Filter first, then use bulk review options if you want to change several review dates.", "Use the menu beside the view tabs to print memory cards."]
    };
  }

  if (tab === "memory" && context.memoryView === "history") {
    return {
      title: "Memory history help",
      icon: "time-outline",
      summary: "History shows your recent memory activity, milestones, and encouragement from your review rhythm.",
      tips: ["Use milestones to choose what you want to track.", "Open verse history when you want to see progress for one verse.", "Recent activity shows the newest memory events first."]
    };
  }

  if (tab === "journal" && context.journalView === "calendar") {
    return {
      title: "Journal calendar help",
      icon: "calendar-outline",
      summary: "Calendar view helps you return to entries by the day they were created.",
      tips: ["Tap a day to filter the journal.", "Use Clear date to return to all entries.", "Switch back to List when you want the simplest reading view."]
    };
  }

  if (tab === "journal" && context.journalView === "scripture") {
    return {
      title: "Journal Scripture help",
      icon: "book-outline",
      summary: "Scripture view groups your journal by Bible book and chapter.",
      tips: ["Open a book to see chapters with saved entries.", "Tap a chapter to filter the journal.", "Use this when you remember the passage but not the date."]
    };
  }

  if (tab === "journal" && context.journalFilter && context.journalFilter !== "all") {
    return {
      title: "Journal filter help",
      icon: "funnel-outline",
      summary: "The Journal filter narrows your saved work without deleting or changing anything.",
      tips: ["Use Pinned for important entries.", "Use Meditation, Studies, Highlights, or Encouragements when you want one kind of entry.", "Clear the filter to return to everything."]
    };
  }

  if (tab === "accountability" && context.communityView === "history") {
    return {
      title: "Encouragement history help",
      icon: "time-outline",
      summary: "History is where you manage encouragements you have posted or saved.",
      tips: ["Filter by private or circle posts.", "Tap your own post to reveal edit, copy, and delete actions.", "Amen and prayer reactions are saved with the post."]
    };
  }

  if (tab === "account" && !context.signedIn) {
    return {
      title: "Free account help",
      icon: "person-add-outline",
      summary: "You can use Bible Study Tutor locally, or create a free account to keep your work across devices.",
      tips: ["Create an account with an email address or a unique username.", "Your name helps the app feel more personal.", "Read the Privacy Policy from Account if you want to see what is saved."]
    };
  }

  if (tab === "admin" && context.adminProfileSelected) {
    return {
      title: "User review help",
      icon: "shield-checkmark-outline",
      summary: "You are viewing one user's admin profile context. This is for safety, support, and privacy-aware review.",
      tips: ["Use activity counts and security events together.", "Avoid acting on raw profile count alone.", "Use suspension only for clear abuse or suspicious behaviour."]
    };
  }

  const help: Record<string, ContextHelp> = {
    home: {
      title: "Home help",
      icon: "home-outline",
      summary: "Home gathers the next useful steps so you can move into reading, study, memory, or review without hunting around.",
      tips: ["Use Today’s path when you are unsure what to do next.", "At a glance shows memory reviews and study reviews that need attention.", "Start with Read Scripture or Start a study if you are new."]
    },
    study: {
      title: "Study help",
      icon: "book-outline",
      summary: "Study walks you through one method step at a time, with passage text, notes, highlighting, memory saving, and journal saving.",
      tips: ["Type a full reference or a shortcut like 1 thes 1:1, then press Use.", "Select verses to highlight, note, save to Memory, or print a worksheet.", "Use the editor settings gear to adjust Scripture insert options."]
    },
    bible: {
      title: "Bible help",
      icon: "reader-outline",
      summary: "Bible lets you read by book and chapter, follow today’s reading plan passage, search Scripture, select verses, add notes, bookmark passages, and launch a study.",
      tips: [
        "Choose a book and chapter from the reader panel; it collapses after selection so the passage has room.",
        "Use Mark Chapter Read for normal chapter tracking.",
        "If the passage belongs to your active reading plan, use Mark Today’s Plan Reading Complete for plan progress.",
        "Use Search Scripture to find exact words, phrases, themes, or questions.",
        "Select verses when you want to Study, Memory, Print, Note, or Bookmark them."
      ]
    },
    plans: {
      title: "Plans help",
      icon: "calendar-outline",
      summary: "Plans is the main place to choose and manage Bible reading plans. The Bible reader only shows the current plan status.",
      tips: [
        "Choose Follow on a plan to make it your current reading plan.",
        "Use the horizontal day tiles to select a day and see its passage.",
        "Dates are counted from the day you started following the plan.",
        "Use Catch up dates if you miss days and want the next incomplete reading to become today.",
        "Stopping a plan removes it as current without deleting previous progress."
      ]
    },
    methods: {
      title: "Methods help",
      icon: "layers-outline",
      summary: "Methods explain different ways to study Scripture, from quick reflection to deeper observation and application.",
      tips: ["Use filters to narrow the method list.", "Tap the info button for details and examples.", "Press Practice to start Study with that method."]
    },
    memory: {
      title: "Memory help",
      icon: "sparkles-outline",
      summary: "Memory helps you keep saved verses through review, meditation, history, and printable verse cards.",
      tips: [
        "Save verses from Bible or Study first.",
        "Use Due for Review when you want today’s practice list.",
        "Use Browse to filter by collection, Testament, book, chapter, status, or review rhythm.",
        "Use Practice for the three-step review flow, or Meditate to slow down with one verse.",
        "Use Print cards to download editable cards for carrying, sharing, or placing around the house."
      ]
    },
    accountability: {
      title: "Community help",
      icon: "people-outline",
      summary: "Community is intentionally private: share encouragements only with accepted friends or invite-only circles.",
      tips: ["Add a friend by code or email, or join a private circle by invite code.", "Choose a connection before posting so the encouragement goes to the right place.", "Use History to review, edit, copy, or remove your encouragements."]
    },
    journal: {
      title: "Journal help",
      icon: "journal-outline",
      summary: "Journal is where saved studies, drafts, highlights, reflections, encouragements, and reviews come back together.",
      tips: [
        "Use List for quick scanning and expand only the entry you need.",
        "Use Calendar when you remember the date.",
        "Use Scripture view when you remember the book or chapter.",
        "Filter by Study, Meditation, Highlight, Encouragement, Draft, Completed, or Pinned.",
        "Expand an entry to read, revisit, schedule, edit, pin, or delete it."
      ]
    },
    account: {
      title: "Account help",
      icon: "person-circle-outline",
      summary: "Account manages your name, sign-in, Bible translation, privacy notes, and future access choices.",
      tips: [
        "Add your name so the app can speak more personally.",
        "Create a free account with either an email address or a unique username.",
        "Signing in helps your saved work follow you across devices.",
        "Change Bible translation and appearance from Account.",
        "Read Privacy and Terms to understand what is saved and how deletion requests work."
      ]
    },
    admin: {
      title: "Admin help",
      icon: "analytics-outline",
      summary: "Admin insights shows feedback, activity, popular passages, profile health, and security review signals.",
      tips: ["Use User directory to inspect signed-in, active, suspended, or local/test profiles.", "Use Security watch to review blocked activity and mark profiles reviewed.", "Signed-in and active profiles are more useful than raw profile count while testing."]
    },
    help: {
      title: "Help screen",
      icon: "help-circle-outline",
      summary: "This screen is the full user guide. It is designed for quick orientation before launch and for users who need a refresher.",
      tips: ["Start with the three quick steps near the top.", "Use the visual walkthroughs for the main app areas.", "Check Common questions for the most frequent actions."]
    }
  };

  return help[tab] || help.help;
}
