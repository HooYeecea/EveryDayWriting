import type { WritingTopic } from '../types'

export const MOCK_TOPICS: WritingTopic[] = [
  {
    id: 1,
    prompt:
      'Some people believe that technology has made our lives more complicated, while others think it has made life easier. Discuss both views and give your own opinion.',
    type: 'Argumentative Essay',
  },
  {
    id: 2,
    prompt:
      'Write a letter to your future self, reflecting on your current goals, challenges, and what you hope to achieve in the next five years.',
    type: 'Personal Letter',
  },
  {
    id: 3,
    prompt:
      'Describe a place that holds special meaning to you. Use vivid sensory details to bring the scene to life for your reader.',
    type: 'Descriptive Writing',
  },
  {
    id: 4,
    prompt:
      'Many cities are investing in public transportation. What are the benefits and drawbacks of improving public transit systems?',
    type: 'Problem & Solution',
  },
  {
    id: 5,
    prompt:
      'Tell a short story that begins with the sentence: "The envelope arrived on a rainy Tuesday, and nothing was ever the same again."',
    type: 'Creative Writing',
  },
  {
    id: 6,
    prompt:
      'In recent years, remote work has become increasingly common across many industries. Some employers argue that working from home improves employee satisfaction and reduces office costs, while others believe that in-person collaboration is essential for creativity, mentorship, and company culture. Discuss the advantages and disadvantages of remote work for both employees and employers, and explain whether you think hybrid models offer the best balance. Support your answer with specific examples.',
    type: 'Argumentative Essay',
  },
  {
    id: 7,
    prompt:
      'Imagine you are preparing a travel guide for visitors who have never been to your hometown or a city you know well. Write a detailed description that covers at least three distinct neighborhoods or areas, explaining what makes each one unique. Include sights, sounds, smells, and local customs that would help a reader feel as if they were walking through the streets themselves. Your goal is to persuade readers that this place is worth visiting.',
    type: 'Descriptive Writing',
  },
  {
    id: 8,
    prompt:
      'Climate change is often described as one of the most urgent challenges of our time. Write an essay that identifies two major causes of climate change and two practical solutions that individuals, communities, or governments could adopt. For each solution, explain how it would work, what obstacles might prevent it from succeeding, and why you believe it is still worth pursuing despite those challenges.',
    type: 'Problem & Solution',
  },
  {
    id: 9,
    prompt:
      'You have been asked to write a formal letter to the editor of a local newspaper responding to a recent article about whether schools should ban smartphones in classrooms. In your letter, clearly state your position, acknowledge at least one counterargument, and provide reasoned evidence for your view. Maintain a respectful tone throughout, as your letter may be read by parents, teachers, and students alike.',
    type: 'Formal Letter',
  },
  {
    id: 10,
    prompt:
      'Write a reflective personal letter to a friend who is considering a major career change. Draw on your own experiences—or those of people you know— to discuss the fears, uncertainties, and potential rewards that come with starting over in a new field. Offer honest advice about how to evaluate whether a change is right, what steps to take before making the leap, and how to stay motivated when progress feels slow.',
    type: 'Personal Letter',
  },
]

export function getRandomTopic(excludeId?: number): WritingTopic {
  const pool = excludeId
    ? MOCK_TOPICS.filter((t) => t.id !== excludeId)
    : MOCK_TOPICS
  return pool[Math.floor(Math.random() * pool.length)]
}
