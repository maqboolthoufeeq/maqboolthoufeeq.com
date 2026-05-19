import { cn, slugify, readingTime } from '@/lib/utils'

describe('cn', () => {
  it('should merge basic class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('should handle clsx object syntax', () => {
    expect(cn({ 'px-2': true, 'py-1': false })).toBe('px-2')
  })

  it('should merge Tailwind classes with conflict resolution', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('should handle array inputs', () => {
    expect(cn(['px-2', 'py-1'])).toBe('px-2 py-1')
  })

  it('should override conflicting Tailwind utilities', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })

  it('should handle mixed class names and objects', () => {
    const result = cn('px-2', { 'py-1': true, 'mx-1': false })
    expect(result).toContain('px-2')
    expect(result).toContain('py-1')
    expect(result).not.toContain('mx-1')
  })

  it('should handle empty inputs', () => {
    expect(cn('')).toBe('')
    expect(cn()).toBe('')
  })

  it('should handle undefined and null values', () => {
    expect(cn('px-2', undefined, null, 'py-1')).toBe('px-2 py-1')
  })
})

describe('slugify', () => {
  it('should convert text to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('should trim whitespace', () => {
    expect(slugify('  hello world  ')).toBe('hello-world')
  })

  it('should remove special characters', () => {
    expect(slugify('Hello, World!')).toBe('hello-world')
  })

  it('should convert spaces to hyphens', () => {
    expect(slugify('hello world test')).toBe('hello-world-test')
  })

  it('should collapse multiple spaces into single hyphen', () => {
    expect(slugify('hello   world')).toBe('hello-world')
  })

  it('should collapse multiple hyphens into single hyphen', () => {
    expect(slugify('hello---world')).toBe('hello-world')
  })

  it('should remove leading and trailing hyphens', () => {
    expect(slugify('-hello-world-')).toBe('hello-world')
  })

  it('should handle numbers correctly', () => {
    expect(slugify('Article 2024')).toBe('article-2024')
  })

  it('should handle complex punctuation', () => {
    expect(slugify("That's a great idea!")).toBe('thats-a-great-idea')
  })

  it('should handle mixed case with special characters', () => {
    expect(slugify('JavaScript & TypeScript')).toBe('javascript-typescript')
  })

  it('should handle empty string', () => {
    expect(slugify('')).toBe('')
  })

  it('should handle string with only special characters', () => {
    expect(slugify('!@#$%')).toBe('')
  })
})

describe('readingTime', () => {
  it('should calculate reading time for content with multiple words', () => {
    const content = 'word '.repeat(400)
    expect(readingTime(content)).toBe(2)
  })

  it('should calculate reading time at 200 words per minute', () => {
    const content = 'word '.repeat(200)
    expect(readingTime(content)).toBe(1)
  })

  it('should return minimum 1 minute for short content', () => {
    expect(readingTime('hello world')).toBe(1)
  })

  it('should round up reading time', () => {
    const content = 'word '.repeat(201)
    expect(readingTime(content)).toBe(2)
  })

  it('should handle single word', () => {
    expect(readingTime('word')).toBe(1)
  })

  it('should handle empty string', () => {
    expect(readingTime('')).toBe(1)
  })

  it('should handle whitespace only', () => {
    expect(readingTime('   ')).toBe(1)
  })

  it('should calculate correct time for 600 words', () => {
    const content = 'word '.repeat(600)
    expect(readingTime(content)).toBe(3)
  })

  it('should calculate correct time for 1000 words', () => {
    const content = 'word '.repeat(1000)
    expect(readingTime(content)).toBe(5)
  })

  it('should handle content with newlines and tabs', () => {
    const content = 'word\nword\tword '.repeat(200)
    expect(readingTime(content)).toBe(3)
  })
})
