export type StudyPlanDay = {
  day: number;
  title: string;
  passage: string;
  methodId: string;
};

export type StudyPlan = {
  id: string;
  title: string;
  description: string;
  days: StudyPlanDay[];
};

export const studyPlans: StudyPlan[] = [
  {
    id: "peace",
    title: "Peace in Pressure",
    description: "Seven short studies for anxiety, hurry, and trust.",
    days: [
      { day: 1, title: "A shepherd in the valley", passage: "Psalm 23", methodId: "soap" },
      { day: 2, title: "Do not be anxious", passage: "Philippians 4:4-9", methodId: "oia" },
      { day: 3, title: "Come and rest", passage: "Matthew 11:28-30", methodId: "lectio" },
      { day: 4, title: "God is refuge", passage: "Psalm 46:1-11", methodId: "lectio" },
      { day: 5, title: "Cast your cares", passage: "1 Peter 5:6-11", methodId: "soap" },
      { day: 6, title: "Not condemned", passage: "Romans 8:1-4", methodId: "oia" },
      { day: 7, title: "Kept in peace", passage: "Isaiah 26:3-4", methodId: "soap" }
    ]
  },
  {
    id: "prayer",
    title: "Learning to Pray",
    description: "A week of honest prayer shaped by Scripture.",
    days: [
      { day: 1, title: "Teach us to pray", passage: "Luke 11:1-4", methodId: "oia" },
      { day: 2, title: "Ask, seek, knock", passage: "Matthew 7:7-11", methodId: "soap" },
      { day: 3, title: "Search me", passage: "Psalm 139:23-24", methodId: "lectio" },
      { day: 4, title: "Pray without performance", passage: "Matthew 6:5-13", methodId: "inductive" },
      { day: 5, title: "Honest lament", passage: "Psalm 13", methodId: "soap" },
      { day: 6, title: "Abide in Christ", passage: "John 15:4-8", methodId: "lectio" },
      { day: 7, title: "Peace through prayer", passage: "Philippians 4:6-7", methodId: "soap" }
    ]
  },
  {
    id: "gospel",
    title: "Gospel Foundations",
    description: "Core passages for grace, faith, and new life.",
    days: [
      { day: 1, title: "God loved", passage: "John 3:16-18", methodId: "oia" },
      { day: 2, title: "Saved by grace", passage: "Ephesians 2:1-10", methodId: "inductive" },
      { day: 3, title: "Peace with God", passage: "Romans 5:1-8", methodId: "soap" },
      { day: 4, title: "Christ died and rose", passage: "1 Corinthians 15:1-8", methodId: "inductive" },
      { day: 5, title: "New creation", passage: "2 Corinthians 5:17-21", methodId: "oia" },
      { day: 6, title: "No condemnation", passage: "Romans 8:1-4", methodId: "soap" },
      { day: 7, title: "Life in the Son", passage: "1 John 5:11-13", methodId: "oia" }
    ]
  }
];
