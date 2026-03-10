// ============================================================================
// 首页章节内容数据
// ============================================================================
//
// 来源：index.md（Dan Koe — How to Fix Your Entire Life in 1 Day）
// 每张卡片展示一个章节的核心观点摘要

export interface Chapter {
  id: number
  titleEn: string
  titleZh: string
  summaryEn: string
  summaryZh: string
  quoteEn?: string
  quoteZh?: string
}

export const articleMeta = {
  titleEn: 'How to Fix Your Entire Life in 1 Day',
  titleZh: 'Welcome to my website',
  authorEn: 'By Dan Koe',
  authorZh: '作者：Dan Koe',
}

export const chapters: Chapter[] = [
  {
    id: 1,
    titleEn: "I — You Aren't the Person Who Would Be There",
    titleZh: 'I — 你还不是那个能到达终点的人',
    summaryEn:
      'If you want a specific outcome in life, you must have the lifestyle that creates that outcome long before you reach it. Most people set surface-level goals and hype themselves up, then go back to old ways — because they were building on a rotting foundation.',
    summaryZh:
      '如果你想要某个特定的人生成果，你必须在达到它之前很久就拥有创造那个成果的生活方式。大多数人设定肤浅的目标，给自己打鸡血，然后回到老路——因为他们是在腐烂的地基上建造。',
    quoteEn:
      'If you want a specific outcome in life, you must have the lifestyle that creates that outcome long before you reach it.',
    quoteZh: '如果你想要某个特定的人生成果，你必须在到达之前就拥有创造它的生活方式。',
  },
  {
    id: 2,
    titleEn: "II — You Don't Want to Be There",
    titleZh: 'II — 你并不真正想要到达那里',
    summaryEn:
      'All behavior is goal-oriented. When you procrastinate, you\'re not "lacking discipline" — you\'re pursuing a different goal, like protecting yourself from judgment. Real change requires changing your goals, not just your actions.',
    summaryZh:
      '所有行为都是目标导向的。当你拖延时，你并非"缺乏纪律"——你在追求另一个目标，比如保护自己免受评判。真正的改变需要改变你的目标，而不仅仅是行动。',
    quoteEn:
      '"Trust only movement. Life happens at the level of events, not of words." — Alfred Adler',
    quoteZh: '"只相信行动。生命发生在事件层面，而非言语层面。" —— 阿尔弗雷德·阿德勒',
  },
  {
    id: 3,
    titleEn: "III — You're Afraid to Be There",
    titleZh: 'III — 你害怕到达那里',
    summaryEn:
      'Your identity was shaped by conditioning since childhood. You defend it to maintain psychological consistency. When your identity feels threatened, you go into fight or flight — just like physical threats. Breaking the cycle means questioning who you think you are.',
    summaryZh:
      '你的身份认同从童年起就被条件反射塑造。你捍卫它以维持心理一致性。当你的身份认同受到威胁时，你会进入战斗或逃跑模式——就像面对身体威胁一样。打破这个循环意味着质疑你认为自己是谁。',
    quoteEn:
      '"If you have accepted an idea and are firmly convinced it is true, it has the same power over you as the hypnotist\'s words." — Maxwell Maltz',
    quoteZh:
      '"如果你接受了一个想法并坚信它是真的，它对你的力量等同于催眠师的话语。" —— 麦克斯韦尔·马尔茨',
  },
  {
    id: 4,
    titleEn: 'IV — The Life You Want Lies Within a Specific Level of Mind',
    titleZh: 'IV — 你想要的生活存在于特定的心智层级',
    summaryEn:
      "The mind evolves through predictable stages — from Impulsive to Unitive. At each stage, your relationship with identity, rules, and reality shifts. Understanding where you are helps you see what's next.",
    summaryZh:
      '心智通过可预测的阶段进化——从冲动型到统一型。在每个阶段，你与身份、规则和现实的关系都会转变。理解你在哪里有助于看清下一步。',
  },
  {
    id: 5,
    titleEn: 'V — Intelligence Is Getting What You Want',
    titleZh: 'V — 智慧是得到你想要的',
    summaryEn:
      'True intelligence is the ability to set a goal, act toward it, sense where you are, compare it to the goal, and iterate. High intelligence means learning from mistakes and understanding goals are hierarchical.',
    summaryZh:
      '真正的智慧是设定目标、朝目标行动、感知自己在哪里、与目标比较、然后迭代的能力。高智慧意味着从错误中学习，并理解目标是分层的。',
    quoteEn:
      '"The only real test of intelligence is if you get what you want out of life." — Naval Ravikant',
    quoteZh: '"智慧的唯一真正考验是你是否从生活中得到了你想要的。" —— 纳瓦尔·拉维坎特',
  },
  {
    id: 6,
    titleEn: 'VI — How to Launch Into a New Life (in 1 Day)',
    titleZh: 'VI — 如何在一天内进入全新的人生',
    summaryEn:
      'A comprehensive protocol: Morning psychological excavation to uncover pain and create vision. Daytime pattern interrupts to break autopilot. Evening synthesis to crystallize insights into actionable goals.',
    summaryZh:
      '一套完整的方案：早晨进行心理挖掘，揭开痛点并创造愿景。白天进行模式中断，打破自动驾驶。晚上进行综合，将洞见结晶为可执行的目标。',
  },
  {
    id: 7,
    titleEn: 'VII — Turn Your Life Into a Video Game',
    titleZh: 'VII — 把你的人生变成一款电子游戏',
    summaryEn:
      "Organize your life with 6 components: Anti-vision (what's at stake), Vision (how you win), 1-year goal (mission), 1-month project (boss fight), Daily levers (quests), and Constraints (rules). This creates your own world — a forcefield against distractions.",
    summaryZh:
      '用 6 个组件组织你的人生：反愿景（赌注）、愿景（如何赢）、一年目标（使命）、一月项目（Boss 战）、每日杠杆（任务）、约束（规则）。这创造了你自己的世界——一个抵御干扰的力场。',
    quoteEn:
      '"The optimal state of inner experience is one in which there is order in consciousness." — Csikszentmihalyi',
    quoteZh: '"内在体验的最佳状态是意识中存在秩序的状态。" —— 契克森米哈伊',
  },
]
