import Navbar from '../components/landing/Navbar'
import Hero from '../components/landing/Hero'
import StatsBar from '../components/landing/StatsBar'
import HowItWorks from '../components/landing/HowItWorks'
import FeatureShowcase from '../components/landing/FeatureShowcase'
import LiveDemo from '../components/landing/LiveDemo'
import PopularProblems from '../components/landing/PopularProblems'
import ComparisonTable from '../components/landing/ComparisonTable'
import FAQ from '../components/landing/FAQ'
import CTAFooter from '../components/landing/CTAFooter'

export default function App() {
  return (
    <div className="min-h-screen bg-base-950">
      <Navbar />
      <Hero />
      <StatsBar />
      <HowItWorks />
      <FeatureShowcase />
      <LiveDemo />
      <PopularProblems />
      <ComparisonTable />
      <FAQ />
      <CTAFooter />
    </div>
  )
}
