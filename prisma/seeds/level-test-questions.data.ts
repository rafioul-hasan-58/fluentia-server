import { DifficultyType, EnglishLevel, TestQuestionSection } from '@prisma/client';

export interface QuestionOptionSeed {
  content: string;
  isCorrect: boolean;
}

export interface LevelTestQuestionSeed {
  question: string;
  passage: string | null;
  sectionType: TestQuestionSection;
  level: EnglishLevel;
  difficulty: DifficultyType;
  answer: string;
  explanation: string;
  options: [
    QuestionOptionSeed,
    QuestionOptionSeed,
    QuestionOptionSeed,
    QuestionOptionSeed,
  ];
}

export const levelTestQuestionsData: LevelTestQuestionSeed[] = [
  // 1. A1 - GRAMMAR (EASY)
  {
    question: 'She ___ from Spain and lives in Madrid.',
    passage: null,
    sectionType: TestQuestionSection.GRAMMAR,
    level: EnglishLevel.A1,
    difficulty: DifficultyType.EASY,
    answer: 'is',
    explanation:
      '"Is" is the correct third-person singular present form of the verb "to be" for the subject pronoun "she".',
    options: [
      { content: 'is', isCorrect: true },
      { content: 'are', isCorrect: false },
      { content: 'am', isCorrect: false },
      { content: 'be', isCorrect: false },
    ],
  },

  // 2. B1 - VOCABULARY (MEDIUM)
  {
    question:
      'The team had to ___ the meeting until next Tuesday because the project manager was unwell.',
    passage: null,
    sectionType: TestQuestionSection.VOCABULARY,
    level: EnglishLevel.B1,
    difficulty: DifficultyType.MEDIUM,
    answer: 'postpone',
    explanation:
      '"Postpone" means to delay an event to a later date, matching the context of moving the meeting "until next Tuesday".',
    options: [
      { content: 'postpone', isCorrect: true },
      { content: 'cancel', isCorrect: false },
      { content: 'reject', isCorrect: false },
      { content: 'dismiss', isCorrect: false },
    ],
  },

  // 3. A2 - GRAMMAR (EASY)
  {
    question:
      'While Sarah was reading a book, her brother ___ video games in the living room.',
    passage: null,
    sectionType: TestQuestionSection.GRAMMAR,
    level: EnglishLevel.A2,
    difficulty: DifficultyType.EASY,
    answer: 'was playing',
    explanation:
      'The past continuous "was playing" is used to describe an ongoing action occurring simultaneously with another past continuous action ("was reading").',
    options: [
      { content: 'was playing', isCorrect: true },
      { content: 'plays', isCorrect: false },
      { content: 'is playing', isCorrect: false },
      { content: 'has played', isCorrect: false },
    ],
  },

  // 4. B2 - GRAMMAR (MEDIUM)
  {
    question:
      'Rarely ___ such dedication and artistic passion in so young a classical musician.',
    passage: null,
    sectionType: TestQuestionSection.GRAMMAR,
    level: EnglishLevel.B2,
    difficulty: DifficultyType.MEDIUM,
    answer: 'have I witnessed',
    explanation:
      'Negative and limiting adverbs such as "Rarely" placed at the start of a sentence trigger subject-auxiliary inversion ("have I witnessed").',
    options: [
      { content: 'have I witnessed', isCorrect: true },
      { content: 'I have witnessed', isCorrect: false },
      { content: 'I witnessed', isCorrect: false },
      { content: 'did I witnessed', isCorrect: false },
    ],
  },

  // 5. A1 - VOCABULARY (EASY)
  {
    question: 'I always eat breakfast in the ___ before I leave for work.',
    passage: null,
    sectionType: TestQuestionSection.VOCABULARY,
    level: EnglishLevel.A1,
    difficulty: DifficultyType.EASY,
    answer: 'morning',
    explanation:
      'Breakfast is the first meal of the day, traditionally eaten in the morning.',
    options: [
      { content: 'morning', isCorrect: true },
      { content: 'night', isCorrect: false },
      { content: 'evening', isCorrect: false },
      { content: 'midnight', isCorrect: false },
    ],
  },

  // 6. C1 - GRAMMAR (HARD)
  {
    question:
      'Not until the lead investigator reviewed the encrypted audit logs ___ the true magnitude of the financial fraud.',
    passage: null,
    sectionType: TestQuestionSection.GRAMMAR,
    level: EnglishLevel.C1,
    difficulty: DifficultyType.HARD,
    answer: 'did she realize',
    explanation:
      'Negative adverbial clauses beginning with "Not until..." require subject-auxiliary inversion in the main clause ("did she realize").',
    options: [
      { content: 'did she realize', isCorrect: true },
      { content: 'she realized', isCorrect: false },
      { content: 'she had realized', isCorrect: false },
      { content: 'was she realized', isCorrect: false },
    ],
  },

  // 7. A2 - READING (EASY)
  {
    question:
      'According to the notice, what new services can community library visitors access today?',
    passage:
      'Community libraries are changing. Today, visitors can do much more than borrow printed books. Many branches now offer free high-speed internet access, digital audiobooks, quiet study rooms, and weekly workshops on computer programming and creative writing.',
    sectionType: TestQuestionSection.READING,
    level: EnglishLevel.A2,
    difficulty: DifficultyType.EASY,
    answer: 'Attend educational workshops and use free internet',
    explanation:
      'The text states that libraries now offer "free high-speed internet access" and "weekly workshops on computer programming and creative writing".',
    options: [
      {
        content: 'Attend educational workshops and use free internet',
        isCorrect: true,
      },
      {
        content: 'Purchase brand new laptops at discounted prices',
        isCorrect: false,
      },
      {
        content: 'Only borrow physical hardcover novels',
        isCorrect: false,
      },
      {
        content: 'Enroll in official university degree programs',
        isCorrect: false,
      },
    ],
  },

  // 8. B1 - GRAMMAR (MEDIUM)
  {
    question:
      'How long ___ your best friend? Since childhood or from university?',
    passage: null,
    sectionType: TestQuestionSection.GRAMMAR,
    level: EnglishLevel.B1,
    difficulty: DifficultyType.MEDIUM,
    answer: 'have you known',
    explanation:
      'The present perfect ("have you known") is used with "how long" to express a state that began in the past and continues to the present.',
    options: [
      { content: 'have you known', isCorrect: true },
      { content: 'do you know', isCorrect: false },
      { content: 'are you knowing', isCorrect: false },
      { content: 'did you know', isCorrect: false },
    ],
  },

  // 9. A1 - GRAMMAR (EASY)
  {
    question:
      'They ___ watch television in the afternoon because they have sports practice.',
    passage: null,
    sectionType: TestQuestionSection.GRAMMAR,
    level: EnglishLevel.A1,
    difficulty: DifficultyType.EASY,
    answer: "don't",
    explanation:
      '"Don\'t" (do not) is the standard present simple negative auxiliary used with plural subject pronouns like "they".',
    options: [
      { content: "don't", isCorrect: true },
      { content: "doesn't", isCorrect: false },
      { content: "isn't", isCorrect: false },
      { content: "aren't", isCorrect: false },
    ],
  },

  // 10. B2 - VOCABULARY (MEDIUM)
  {
    question:
      'The two lead architects were able to reach a ___ after debating the building layout for several hours.',
    passage: null,
    sectionType: TestQuestionSection.VOCABULARY,
    level: EnglishLevel.B2,
    difficulty: DifficultyType.MEDIUM,
    answer: 'compromise',
    explanation:
      'A "compromise" is an agreement reached when both parties make mutual concessions to settle an argument.',
    options: [
      { content: 'compromise', isCorrect: true },
      { content: 'consequence', isCorrect: false },
      { content: 'coincidence', isCorrect: false },
      { content: 'contradiction', isCorrect: false },
    ],
  },

  // 11. C1 - READING (HARD)
  {
    question:
      'According to the passage, why is adaptive reuse technically demanding for contemporary architects?',
    passage:
      'In architectural discourse, the paradigm of adaptive reuse has shifted from a pragmatic conservation strategy to an imperative of environmental stewardship. Rather than demolishing decommissioned industrial relics and erecting carbon-intensive concrete monoliths, contemporary urbanists repurpose existing structures. This methodology retains embodied carbon sequestered within historic brick and timber while preserving urban heritage. Nonetheless, adaptive reuse demands sophisticated structural ingenuity: retrofitting antiquated envelopes to meet stringent modern thermal efficiency standards and seismic regulations frequently rivals the technical complexity of new construction.',
    sectionType: TestQuestionSection.READING,
    level: EnglishLevel.C1,
    difficulty: DifficultyType.HARD,
    answer:
      'Upgrading old structures to satisfy current energy and seismic codes requires complex engineering',
    explanation:
      'The passage explicitly concludes that retrofitting antiquated building envelopes to satisfy modern thermal efficiency and seismic standards rivals new construction in technical complexity.',
    options: [
      {
        content:
          'Upgrading old structures to satisfy current energy and seismic codes requires complex engineering',
        isCorrect: true,
      },
      {
        content:
          'Historic building materials cannot be combined with modern structural steel',
        isCorrect: false,
      },
      {
        content:
          'Demolition permits are significantly more difficult to acquire than renovation permits',
        isCorrect: false,
      },
      {
        content:
          'Architects lack historical blueprints for decommissioned industrial factories',
        isCorrect: false,
      },
    ],
  },

  // 12. A2 - VOCABULARY (EASY)
  {
    question:
      'The morning train was delayed, so the platform was ___ with commuters waiting to board.',
    passage: null,
    sectionType: TestQuestionSection.VOCABULARY,
    level: EnglishLevel.A2,
    difficulty: DifficultyType.EASY,
    answer: 'crowded',
    explanation:
      '"Crowded" describes a place that is packed with a large number of people.',
    options: [
      { content: 'crowded', isCorrect: true },
      { content: 'empty', isCorrect: false },
      { content: 'quiet', isCorrect: false },
      { content: 'narrow', isCorrect: false },
    ],
  },

  // 13. B1 - GRAMMAR (MEDIUM)
  {
    question:
      'If I had enough savings right now, I ___ a year-long trip around the world.',
    passage: null,
    sectionType: TestQuestionSection.GRAMMAR,
    level: EnglishLevel.B1,
    difficulty: DifficultyType.MEDIUM,
    answer: 'would take',
    explanation:
      'The second conditional ("If + past simple, would + base verb") describes a hypothetical or imaginary situation in the present.',
    options: [
      { content: 'would take', isCorrect: true },
      { content: 'will take', isCorrect: false },
      { content: 'took', isCorrect: false },
      { content: 'have taken', isCorrect: false },
    ],
  },

  // 14. B2 - GRAMMAR (MEDIUM)
  {
    question:
      'You ___ told me about the change in plans; I wasted an entire hour waiting in the cold.',
    passage: null,
    sectionType: TestQuestionSection.GRAMMAR,
    level: EnglishLevel.B2,
    difficulty: DifficultyType.MEDIUM,
    answer: 'should have',
    explanation:
      '"Should have + past participle" expresses a past obligation or criticism regarding an advisable action that did not occur.',
    options: [
      { content: 'should have', isCorrect: true },
      { content: 'must have', isCorrect: false },
      { content: "couldn't have", isCorrect: false },
      { content: 'would have', isCorrect: false },
    ],
  },

  // 15. A1 - READING (EASY)
  {
    question: 'What does Marco enjoy doing during his free time on weekends?',
    passage:
      'Hello! My name is Marco. I am twenty-five years old and I work as a graphic designer in Milan. On weekends, I love riding my bicycle in the park and cooking Italian dinners for my close friends.',
    sectionType: TestQuestionSection.READING,
    level: EnglishLevel.A1,
    difficulty: DifficultyType.EASY,
    answer: 'Riding his bicycle and cooking dinners for friends',
    explanation:
      'The text states that on weekends Marco loves "riding my bicycle in the park and cooking Italian dinners for my close friends".',
    options: [
      {
        content: 'Riding his bicycle and cooking dinners for friends',
        isCorrect: true,
      },
      {
        content: 'Designing graphics at the downtown office',
        isCorrect: false,
      },
      {
        content: 'Playing competitive sports in a national tournament',
        isCorrect: false,
      },
      {
        content: 'Working as a chef at a busy Italian restaurant',
        isCorrect: false,
      },
    ],
  },

  // 16. C1 - VOCABULARY (HARD)
  {
    question:
      "The chief executive's sudden resignation precipitated a ___ of rumors regarding internal discord on the board.",
    passage: null,
    sectionType: TestQuestionSection.VOCABULARY,
    level: EnglishLevel.C1,
    difficulty: DifficultyType.HARD,
    answer: 'flurry',
    explanation:
      'A "flurry" denotes a sudden, concentrated burst of activity or speculation, frequently collocating with "rumors" or "questions".',
    options: [
      { content: 'flurry', isCorrect: true },
      { content: 'scarcity', isCorrect: false },
      { content: 'glimmer', isCorrect: false },
      { content: 'trickle', isCorrect: false },
    ],
  },

  // 17. A2 - GRAMMAR (MEDIUM)
  {
    question:
      'This new laptop model is ___ than the desktop computer I bought three years ago.',
    passage: null,
    sectionType: TestQuestionSection.GRAMMAR,
    level: EnglishLevel.A2,
    difficulty: DifficultyType.MEDIUM,
    answer: 'much faster',
    explanation:
      '"Much faster" correctly applies the comparative form "faster" intensified by the adverb "much". "More faster" is a double comparative and ungrammatical.',
    options: [
      { content: 'much faster', isCorrect: true },
      { content: 'more faster', isCorrect: false },
      { content: 'fastest', isCorrect: false },
      { content: 'as fast', isCorrect: false },
    ],
  },

  // 18. B1 - VOCABULARY (MEDIUM)
  {
    question:
      'Adequate sleep and a balanced diet are ___ for maintaining long-term physical well-being.',
    passage: null,
    sectionType: TestQuestionSection.VOCABULARY,
    level: EnglishLevel.B1,
    difficulty: DifficultyType.MEDIUM,
    answer: 'essential',
    explanation:
      '"Essential" means fundamentally necessary or indispensable for a specific outcome.',
    options: [
      { content: 'essential', isCorrect: true },
      { content: 'optional', isCorrect: false },
      { content: 'temporary', isCorrect: false },
      { content: 'harmful', isCorrect: false },
    ],
  },

  // 19. C1 - GRAMMAR (HARD)
  {
    question:
      'It was only by implementing stringent cryptographic protocols ___ able to safeguard the network against unauthorized intrusions.',
    passage: null,
    sectionType: TestQuestionSection.GRAMMAR,
    level: EnglishLevel.C1,
    difficulty: DifficultyType.HARD,
    answer: 'that the engineers were',
    explanation:
      'This emphatic "it-cleft" sentence structure follows the rule: "It was [prepositional phrase] that [subject + verb]".',
    options: [
      { content: 'that the engineers were', isCorrect: true },
      { content: 'which the engineers were', isCorrect: false },
      { content: 'when were the engineers', isCorrect: false },
      { content: 'that were the engineers', isCorrect: false },
    ],
  },

  // 20. B2 - READING (MEDIUM)
  {
    question:
      'What is the primary psychological consequence of "decision fatigue" highlighted in the passage?',
    passage:
      'Cognitive scientists have long examined the phenomenon known as "decision fatigue". Every choice an individual makes throughout the day depletes finite mental energy reserves. As this mental reservoir diminishes, the human brain instinctively seeks cognitive shortcuts. Consequently, individuals either become reckless by making impulsive, ill-considered choices, or they succumb to decision paralysis, postponing even critical matters. Studies reveal that corporate executives and judges frequently exhibit compromised judgment late in the afternoon compared to morning sessions.',
    sectionType: TestQuestionSection.READING,
    level: EnglishLevel.B2,
    difficulty: DifficultyType.MEDIUM,
    answer:
      'It drains mental energy, causing people to act impulsively or avoid making decisions',
    explanation:
      'The text explains that decision fatigue depletes mental reserves, causing individuals to make impulsive choices or postpone critical decisions.',
    options: [
      {
        content:
          'It drains mental energy, causing people to act impulsively or avoid making decisions',
        isCorrect: true,
      },
      {
        content:
          'It increases analytical focus and memory retention during late afternoon tasks',
        isCorrect: false,
      },
      {
        content:
          'It completely eliminates cognitive bias in corporate executive boards',
        isCorrect: false,
      },
      {
        content:
          'It forces individuals to sleep longer hours during normal working days',
        isCorrect: false,
      },
    ],
  },

  // 21. A1 - GRAMMAR (EASY)
  {
    question: 'Yesterday, David ___ an apple and a sandwich for his lunch.',
    passage: null,
    sectionType: TestQuestionSection.GRAMMAR,
    level: EnglishLevel.A1,
    difficulty: DifficultyType.EASY,
    answer: 'ate',
    explanation:
      '"Ate" is the past simple form of the irregular verb "eat", required by the past time marker "yesterday".',
    options: [
      { content: 'ate', isCorrect: true },
      { content: 'eat', isCorrect: false },
      { content: 'eats', isCorrect: false },
      { content: 'eating', isCorrect: false },
    ],
  },

  // 22. A2 - VOCABULARY (MEDIUM)
  {
    question:
      'Please remember to ___ your winter jacket before stepping outside; the temperature is below zero.',
    passage: null,
    sectionType: TestQuestionSection.VOCABULARY,
    level: EnglishLevel.A2,
    difficulty: DifficultyType.MEDIUM,
    answer: 'put on',
    explanation:
      'The phrasal verb "put on" means to dress oneself in clothing or outerwear.',
    options: [
      { content: 'put on', isCorrect: true },
      { content: 'take off', isCorrect: false },
      { content: 'give up', isCorrect: false },
      { content: 'turn down', isCorrect: false },
    ],
  },

  // 23. B1 - GRAMMAR (MEDIUM)
  {
    question:
      'The ancient medieval fortress ___ by thousands of international tourists each summer.',
    passage: null,
    sectionType: TestQuestionSection.GRAMMAR,
    level: EnglishLevel.B1,
    difficulty: DifficultyType.MEDIUM,
    answer: 'is visited',
    explanation:
      'The present simple passive ("is visited") is used for routine or recurring facts where the object is the focus of the sentence.',
    options: [
      { content: 'is visited', isCorrect: true },
      { content: 'was visited', isCorrect: false },
      { content: 'visits', isCorrect: false },
      { content: 'has visited', isCorrect: false },
    ],
  },

  // 24. B2 - GRAMMAR (HARD)
  {
    question:
      '___ exhausted after their fourteen-hour international flight, the passengers slept until midday.',
    passage: null,
    sectionType: TestQuestionSection.GRAMMAR,
    level: EnglishLevel.B2,
    difficulty: DifficultyType.HARD,
    answer: 'Feeling',
    explanation:
      'A present participle clause ("Feeling exhausted...") functions adverbially to describe the reason or state of the subject during the main clause action.',
    options: [
      { content: 'Feeling', isCorrect: true },
      { content: 'Felt', isCorrect: false },
      { content: 'Having felt', isCorrect: false },
      { content: 'To feel', isCorrect: false },
    ],
  },

  // 25. A1 - VOCABULARY (EASY)
  {
    question: 'Can you please shut the ___? The cold wind is blowing into the room.',
    passage: null,
    sectionType: TestQuestionSection.VOCABULARY,
    level: EnglishLevel.A1,
    difficulty: DifficultyType.EASY,
    answer: 'window',
    explanation:
      'A "window" is an opening in a wall fitted with glass that can be shut to block outdoor wind.',
    options: [
      { content: 'window', isCorrect: true },
      { content: 'table', isCorrect: false },
      { content: 'chair', isCorrect: false },
      { content: 'floor', isCorrect: false },
    ],
  },

  // 26. C1 - GRAMMAR (HARD)
  {
    question:
      'The regulatory board insisted that the chief compliance officer ___ a full audit of all offshore accounts.',
    passage: null,
    sectionType: TestQuestionSection.GRAMMAR,
    level: EnglishLevel.C1,
    difficulty: DifficultyType.HARD,
    answer: 'conduct',
    explanation:
      'Verbs expressing insistence or formal requirements demand the mandative subjunctive (base form "conduct" without third-person "-s").',
    options: [
      { content: 'conduct', isCorrect: true },
      { content: 'conducts', isCorrect: false },
      { content: 'conducted', isCorrect: false },
      { content: 'would conduct', isCorrect: false },
    ],
  },

  // 27. A2 - READING (MEDIUM)
  {
    question:
      'What action are building residents instructed to take before Thursday morning?',
    passage:
      'Attention Residents: The property maintenance staff will inspect water pipes in all units this Thursday between 9:00 AM and 1:00 PM. Please ensure that kitchen sinks and bathroom plumbing fixtures are completely clear and accessible. Water utility services will be temporarily shut off during this four-hour inspection window.',
    sectionType: TestQuestionSection.READING,
    level: EnglishLevel.A2,
    difficulty: DifficultyType.MEDIUM,
    answer:
      'Ensure kitchen sinks and bathroom areas are clear and accessible',
    explanation:
      'The notice explicitly instructs residents to "ensure that kitchen sinks and bathroom plumbing fixtures are completely clear and accessible".',
    options: [
      {
        content:
          'Ensure kitchen sinks and bathroom areas are clear and accessible',
        isCorrect: true,
      },
      {
        content: 'Repair their own leaking pipes before the inspectors arrive',
        isCorrect: false,
      },
      {
        content:
          'Vacate their apartments for the remainder of the calendar week',
        isCorrect: false,
      },
      {
        content:
          'Pay an emergency plumbing fee directly to building management',
        isCorrect: false,
      },
    ],
  },

  // 28. B1 - VOCABULARY (MEDIUM)
  {
    question:
      'The research department decided to ___ a comprehensive market survey before releasing the product.',
    passage: null,
    sectionType: TestQuestionSection.VOCABULARY,
    level: EnglishLevel.B1,
    difficulty: DifficultyType.MEDIUM,
    answer: 'conduct',
    explanation:
      'The established standard collocation for organizing and administering research or an investigation is to "conduct a survey".',
    options: [
      { content: 'conduct', isCorrect: true },
      { content: 'compose', isCorrect: false },
      { content: 'attract', isCorrect: false },
      { content: 'invent', isCorrect: false },
    ],
  },

  // 29. B2 - VOCABULARY (HARD)
  {
    question:
      'The central bank introduced fiscal regulations intended to ___ runaway inflation and restore currency stability.',
    passage: null,
    sectionType: TestQuestionSection.VOCABULARY,
    level: EnglishLevel.B2,
    difficulty: DifficultyType.HARD,
    answer: 'curb',
    explanation:
      '"To curb" means to restrain or control an undesirable escalation, which is the standard economic term when managing inflation.',
    options: [
      { content: 'curb', isCorrect: true },
      { content: 'trigger', isCorrect: false },
      { content: 'yield', isCorrect: false },
      { content: 'escalate', isCorrect: false },
    ],
  },

  // 30. C1 - READING (HARD)
  {
    question:
      'What is the "existential paradox" of modern open-source software outlined by the author?',
    passage:
      'The foundational ethos of open-source software was predicated on decentralized collaboration and unrestricted transparency. By democratizing codebases, pioneering developers envisioned a digital commons free from corporate monopolies. Yet contemporary open-source architecture finds itself grappling with an existential paradox. Commercial tech giants routinely commodify open-source protocols, embedding them into lucrative cloud ecosystems without proportionately contributing to developer compensation or code security. This asymmetric dynamic leaves critical global digital infrastructure reliant on unpaid volunteer maintainers.',
    sectionType: TestQuestionSection.READING,
    level: EnglishLevel.C1,
    difficulty: DifficultyType.HARD,
    answer:
      'Commercial corporations generate massive profit from open code without providing adequate financial or security support',
    explanation:
      'The paradox is that multi-billion dollar corporations monetize open-source software while relying on uncompensated volunteer maintainers for security and upkeep.',
    options: [
      {
        content:
          'Commercial corporations generate massive profit from open code without providing adequate financial or security support',
        isCorrect: true,
      },
      {
        content:
          'Open-source developers are legally barred from contributing to commercial tech projects',
        isCorrect: false,
      },
      {
        content:
          'Decentralized code repositories are technically incapable of functioning on cloud servers',
        isCorrect: false,
      },
      {
        content:
          'Volunteer programmers have ceased writing documentation for public repositories',
        isCorrect: false,
      },
    ],
  },

  // 31. A1 - GRAMMAR (EASY)
  {
    question: 'There is ___ fresh orange on the dining table.',
    passage: null,
    sectionType: TestQuestionSection.GRAMMAR,
    level: EnglishLevel.A1,
    difficulty: DifficultyType.EASY,
    answer: 'a',
    explanation:
      'The indefinite article "a" is used before singular countable nouns modified by words beginning with a consonant sound ("fresh").',
    options: [
      { content: 'a', isCorrect: true },
      { content: 'an', isCorrect: false },
      { content: 'many', isCorrect: false },
      { content: 'some', isCorrect: false },
    ],
  },

  // 32. A2 - GRAMMAR (EASY)
  {
    question:
      "We don't have ___ fresh milk left in the refrigerator, so I need to go to the grocery store.",
    passage: null,
    sectionType: TestQuestionSection.GRAMMAR,
    level: EnglishLevel.A2,
    difficulty: DifficultyType.EASY,
    answer: 'any',
    explanation:
      '"Any" is the appropriate quantifier in negative sentences when referring to uncountable nouns like "milk".',
    options: [
      { content: 'any', isCorrect: true },
      { content: 'some', isCorrect: false },
      { content: 'many', isCorrect: false },
      { content: 'a few', isCorrect: false },
    ],
  },

  // 33. B1 - READING (MEDIUM)
  {
    question:
      'What is a primary environmental advantage of vertical farming described in the text?',
    passage:
      'Urban vertical farming is revolutionizing food production across metropolitan areas. By cultivating crops in stacked vertical layers inside climate-controlled indoor facilities, these automated operations consume up to 90% less water than conventional outdoor agriculture. Furthermore, because crops grow in sterile environments shielded from adverse weather and insects, vertical farms require virtually no chemical pesticides, supplying fresh produce directly to urban markets with minimal transportation emissions.',
    sectionType: TestQuestionSection.READING,
    level: EnglishLevel.B1,
    difficulty: DifficultyType.MEDIUM,
    answer:
      'It drastically reduces water consumption and eliminates the need for chemical pesticides',
    explanation:
      'The text highlights that vertical farms use up to 90% less water and require virtually no chemical pesticides compared to traditional farming.',
    options: [
      {
        content:
          'It drastically reduces water consumption and eliminates the need for chemical pesticides',
        isCorrect: true,
      },
      {
        content:
          'It depends entirely on natural open-air rainfall and seasonal weather patterns',
        isCorrect: false,
      },
      {
        content:
          'It relies on international shipping routes to transport harvested food',
        isCorrect: false,
      },
      {
        content:
          'It replaces all traditional rural farms with heavy industrial manufacturing plants',
        isCorrect: false,
      },
    ],
  },

  // 34. B2 - GRAMMAR (HARD)
  {
    question:
      'Had the financial analysts predicted the recession earlier, the institutional investors ___ their assets in defensive funds.',
    passage: null,
    sectionType: TestQuestionSection.GRAMMAR,
    level: EnglishLevel.B2,
    difficulty: DifficultyType.HARD,
    answer: 'would have placed',
    explanation:
      'An inverted third conditional ("Had they predicted...") requires "would have + past participle" in the result clause to express a hypothetical past outcome.',
    options: [
      { content: 'would have placed', isCorrect: true },
      { content: 'will have placed', isCorrect: false },
      { content: 'had placed', isCorrect: false },
      { content: 'would place', isCorrect: false },
    ],
  },

  // 35. A1 - VOCABULARY (EASY)
  {
    question: "My sister's daughter is my ___.",
    passage: null,
    sectionType: TestQuestionSection.VOCABULARY,
    level: EnglishLevel.A1,
    difficulty: DifficultyType.EASY,
    answer: 'niece',
    explanation:
      'A "niece" is the daughter of one\'s brother or sister.',
    options: [
      { content: 'niece', isCorrect: true },
      { content: 'nephew', isCorrect: false },
      { content: 'aunt', isCorrect: false },
      { content: 'cousin', isCorrect: false },
    ],
  },

  // 36. C1 - GRAMMAR (HARD)
  {
    question:
      'So intricate ___ that even seasoned software engineers required several weeks to decode its architecture.',
    passage: null,
    sectionType: TestQuestionSection.GRAMMAR,
    level: EnglishLevel.C1,
    difficulty: DifficultyType.HARD,
    answer: 'was the code',
    explanation:
      'When an adjective phrase introduced by "So" is fronted for emphasis ("So intricate..."), subject-verb inversion ("was the code") is required.',
    options: [
      { content: 'was the code', isCorrect: true },
      { content: 'the code was', isCorrect: false },
      { content: 'has the code been', isCorrect: false },
      { content: 'the code had been', isCorrect: false },
    ],
  },

  // 37. A2 - GRAMMAR (MEDIUM)
  {
    question:
      'If it rains heavily tomorrow afternoon, we ___ our hiking trip in the mountains.',
    passage: null,
    sectionType: TestQuestionSection.GRAMMAR,
    level: EnglishLevel.A2,
    difficulty: DifficultyType.MEDIUM,
    answer: 'will cancel',
    explanation:
      'The first conditional ("If + present simple, will + base verb") expresses a real and probable future condition and its result.',
    options: [
      { content: 'will cancel', isCorrect: true },
      { content: 'canceled', isCorrect: false },
      { content: 'would cancel', isCorrect: false },
      { content: 'cancel', isCorrect: false },
    ],
  },

  // 38. B1 - GRAMMAR (MEDIUM)
  {
    question:
      'During the interview, the journalist asked the author where ___ the inspiration for his historical novel.',
    passage: null,
    sectionType: TestQuestionSection.GRAMMAR,
    level: EnglishLevel.B1,
    difficulty: DifficultyType.MEDIUM,
    answer: 'he had found',
    explanation:
      'Reported questions follow affirmative statement word order (subject + verb) with tense backshift to the past perfect ("he had found").',
    options: [
      { content: 'he had found', isCorrect: true },
      { content: 'had he found', isCorrect: false },
      { content: 'did he find', isCorrect: false },
      { content: 'he has found', isCorrect: false },
    ],
  },

  // 39. C1 - VOCABULARY (HARD)
  {
    question:
      'Despite their initial skepticism, the peer review committee found the research methodology to be ___ and meticulously documented.',
    passage: null,
    sectionType: TestQuestionSection.VOCABULARY,
    level: EnglishLevel.C1,
    difficulty: DifficultyType.HARD,
    answer: 'impeccable',
    explanation:
      '"Impeccable" means flawless or of the highest standard, perfectly aligning with "meticulously documented".',
    options: [
      { content: 'impeccable', isCorrect: true },
      { content: 'ambiguous', isCorrect: false },
      { content: 'tentative', isCorrect: false },
      { content: 'superficial', isCorrect: false },
    ],
  },

  // 40. B2 - READING (HARD)
  {
    question:
      'What can be inferred from the passage regarding the main obstacle to integrating renewable power?',
    passage:
      'The global transition to renewable power presents infrastructural hurdles that transcend generation capacity. While solar panels and wind turbines are now highly cost-effective, existing power transmission grids were historically engineered for steady, centralized power stations rather than intermittent, decentralized generation. Balancing variable renewable supply with volatile consumer demand demands substantial investment in grid-scale battery storage, advanced frequency synchronization, and cross-border interconnectors. Without these infrastructural modernization efforts, surplus renewable energy is frequently curtailed and discarded during peak generation periods.',
    sectionType: TestQuestionSection.READING,
    level: EnglishLevel.B2,
    difficulty: DifficultyType.HARD,
    answer:
      'Existing electrical grids require structural modernization and storage to accommodate intermittent energy generation',
    explanation:
      'The passage emphasizes that because existing grids were engineered for centralized power, modernized grid infrastructure and storage are needed to prevent waste from fluctuating renewable power.',
    options: [
      {
        content:
          'Existing electrical grids require structural modernization and storage to accommodate intermittent energy generation',
        isCorrect: true,
      },
      {
        content:
          'Solar and wind turbine components remain too costly for most developed nations to manufacture',
        isCorrect: false,
      },
      {
        content:
          'Consumer demand for clean electricity has steadily declined over recent years',
        isCorrect: false,
      },
      {
        content:
          'Centralized coal and gas power plants produce fewer emissions than wind turbine arrays',
        isCorrect: false,
      },
    ],
  },
];
