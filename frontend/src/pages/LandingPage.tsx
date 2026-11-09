import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import PopularProblems from "../components/landing/PopularProblems";
import FAQ from "../components/landing/FAQ";
import CTAFooter from "../components/landing/CTAFooter";
import DeferredSection from "../components/landing/DeferredSection";
import "../components/landing/landing.css";

const HowItWorks = lazy(() => import("../components/landing/HowItWorks"));
const LiveDemo = lazy(() => import("../components/landing/LiveDemo"));
const FeatureShowcase = lazy(() => import("../components/landing/FeatureShowcase"));

export default function LandingPage() {
    return <div className="landing min-h-screen bg-bg text-text">
        <a className="skip-link" href="#landing-main">Skip to content</a>
        <Navbar />
        <main id="landing-main" tabIndex={-1} className="outline-none">
            <Hero />
            <DeferredSection id="how-it-works" title="How it works"><HowItWorks embedded /></DeferredSection>
            <DeferredSection id="live-interview" title="Live interview"><LiveDemo embedded /></DeferredSection>
            <PopularProblems />
            <DeferredSection id="what-you-get" title="What you get"><FeatureShowcase embedded /></DeferredSection>
            <FAQ />
            <CTAFooter />
        </main>
    </div>;
}
import { lazy } from "react";
