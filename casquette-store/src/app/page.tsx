import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { Gallery } from "@/components/sections/Gallery";
import { WhyBuy } from "@/components/sections/WhyBuy";
import { Reviews } from "@/components/sections/Reviews";
import { OrderSection } from "@/components/sections/OrderSection";
import { Footer } from "@/components/sections/Footer";

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Gallery />
        <WhyBuy />
        <Reviews />
        <OrderSection />
      </main>
      <Footer />
    </>
  );
}
