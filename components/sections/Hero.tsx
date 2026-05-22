import { getSiteContent } from '@/lib/site-content'
import HeroAnimated from './HeroAnimated'

export default async function Hero() {
  const hero = await getSiteContent('hero')
  return <HeroAnimated hero={hero} />
}
