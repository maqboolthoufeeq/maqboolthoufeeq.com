'use server'

import { prisma } from '@/lib/prisma'

const PAGE_SIZE = 6

export async function fetchMorePosts(skip: number, q = '', tag = '') {
  return prisma.post.findMany({
    where: {
      published: true,
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
      ...(tag ? { tags: { some: { slug: tag } } } : {}),
    },
    orderBy: { publishedAt: 'desc' },
    skip,
    take: PAGE_SIZE,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      publishedAt: true,
      coverImage: true,
      tags: { select: { id: true, name: true, slug: true } },
    },
  })
}
