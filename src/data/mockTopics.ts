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
]

export function getRandomTopic(excludeId?: number): WritingTopic {
  const pool = excludeId
    ? MOCK_TOPICS.filter((t) => t.id !== excludeId)
    : MOCK_TOPICS
  return pool[Math.floor(Math.random() * pool.length)]
}
