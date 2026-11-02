import { Banner } from "@/components/landing/Banner";
import { Hero } from "@/components/landing/Hero";
import { Audiences, CompareCta, FinalCta, Features, Steps } from "@/components/landing/Sections";

export default function Home() {
  return (
    <main className="w-full px-5 pb-16 sm:px-8 lg:px-12">
      <Banner />
      <Hero />
      <Features />
      <Audiences />
      <Steps />
      <CompareCta />
      <FinalCta />
    </main>
  );
}
