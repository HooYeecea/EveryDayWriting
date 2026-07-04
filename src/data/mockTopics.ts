import type { WritingTopic } from '../types'

function topic(id: number, type: string, description: string): WritingTopic {
  return {
    id,
    type,
    title: `Writing Topic ${id}`,
    description,
  }
}

export const MOCK_TOPICS: WritingTopic[] = [
  topic(
    1,
    'Argumentative Essay',
    'Some people believe that technology has made our lives more complicated, while others think it has made life easier. Discuss both views and give your own opinion.',
  ),
  topic(
    2,
    'Personal Letter',
    'Write a letter to your future self, reflecting on your current goals, challenges, and what you hope to achieve in the next five years.',
  ),
  topic(
    3,
    'Descriptive Writing',
    'Describe a place that holds special meaning to you. Use vivid sensory details to bring the scene to life for your reader.',
  ),
  topic(
    4,
    'Problem & Solution',
    'Many cities are investing in public transportation. What are the benefits and drawbacks of improving public transit systems?',
  ),
  topic(
    5,
    'Creative Writing',
    'Tell a short story that begins with the sentence: "The envelope arrived on a rainy Tuesday, and nothing was ever the same again."',
  ),
  topic(
    6,
    'Argumentative Essay',
    'In recent years, remote work has become increasingly common across many industries. Some employers argue that working from home improves employee satisfaction and reduces office costs, while others believe that in-person collaboration is essential for creativity, mentorship, and company culture. Discuss the advantages and disadvantages of remote work for both employees and employers, and explain whether you think hybrid models offer the best balance. Support your answer with specific examples.',
  ),
  topic(
    7,
    'Descriptive Writing',
    'Imagine you are preparing a travel guide for visitors who have never been to your hometown or a city you know well. Write a detailed description that covers at least three distinct neighborhoods or areas, explaining what makes each one unique. Include sights, sounds, smells, and local customs that would help a reader feel as if they were walking through the streets themselves. Your goal is to persuade readers that this place is worth visiting.',
  ),
  topic(
    8,
    'Problem & Solution',
    'Climate change is often described as one of the most urgent challenges of our time. Write an essay that identifies two major causes of climate change and two practical solutions that individuals, communities, or governments could adopt. For each solution, explain how it would work, what obstacles might prevent it from succeeding, and why you believe it is still worth pursuing despite those challenges.',
  ),
  topic(
    9,
    'Formal Letter',
    'You have been asked to write a formal letter to the editor of a local newspaper responding to a recent article about whether schools should ban smartphones in classrooms. In your letter, clearly state your position, acknowledge at least one counterargument, and provide reasoned evidence for your view. Maintain a respectful tone throughout, as your letter may be read by parents, teachers, and students alike.',
  ),
  topic(
    10,
    'Personal Letter',
    'Write a reflective personal letter to a friend who is considering a major career change. Draw on your own experiences—or those of people you know— to discuss the fears, uncertainties, and potential rewards that come with starting over in a new field. Offer honest advice about how to evaluate whether a change is right, what steps to take before making the leap, and how to stay motivated when progress feels slow.',
  ),
]

export function getMockRandomTopic(excludeId?: number): WritingTopic {
  const pool = excludeId ? MOCK_TOPICS.filter((t) => t.id !== excludeId) : MOCK_TOPICS
  return pool[Math.floor(Math.random() * pool.length)]
}
