export type ContextHelp = {
  title: string;
  icon: string;
  summary: string;
  tips: string[];
};

export function getContextHelp(tab: string): ContextHelp {
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
      tips: ["Type a full reference or a shortcut like 1 thes 1:1, then press Use.", "Select verses to highlight, note, save to Memory, or print a worksheet.", "Use Focus mode or collapse side panels when you want fewer distractions."]
    },
    bible: {
      title: "Bible help",
      icon: "reader-outline",
      summary: "Bible lets you read by book and chapter, search Scripture, select verses, add notes, bookmark passages, and launch a study.",
      tips: ["Use Search Scripture to find exact words, phrases, themes, or questions.", "On mobile, tap Search criteria to choose All, Old Testament, New Testament, match type, or a book.", "Tap Read on a search result to open that chapter with the verse selected."]
    },
    plans: {
      title: "Plans help",
      icon: "calendar-outline",
      summary: "Plans give you short guided paths. Each day opens a passage and method, then saving the study marks that day complete.",
      tips: ["Choose a plan that matches your current season.", "Press Continue to open the next unfinished day.", "Reset a plan if you want to start it again."]
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
      summary: "Memory helps you keep saved verses through a simple three-step practice flow.",
      tips: ["Save verses from Bible or Study first.", "Due for Review brings verses back by date, and Reviewed shows what you have completed.", "Open History to see recent activity, milestones, and memory encouragement."]
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
      tips: ["Use List for a simple view, Calendar for date review, and Scripture for book/chapter browsing.", "Expand an entry to read or edit it.", "Schedule reviews to bring important studies back later."]
    },
    account: {
      title: "Account help",
      icon: "person-circle-outline",
      summary: "Account manages your name, sign-in, Bible translation, privacy notes, and future access choices.",
      tips: ["Add your name so the app can speak more personally.", "Create a free account with either an email address or a unique username.", "Choose BSB, WEB, or KJV as your preferred Bible translation."]
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
