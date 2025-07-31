"use client";

import Image from "next/image";
import { SearchBar } from "@/components/search-bar";




export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[120vh] flex flex-col items-center justify-center bg-[#e2e0df] pt-10 pb-32">
      <div className="z-10 text-center px-4 absolute top-[10%]">
        <h2 className="text-2xl text-gray-700 mb-1 -mt-6 font-urbanist">Unforgettable stays await on</h2>
        <h1 className="text-[12vw] w-full text-center leading-[0.8] text-black tracking-tight font-urbanist">
          dream stay
        </h1>
      </div>

      <div className="relative w-full max-w-[90rem] aspect-[16/6] mt-10 rounded-[3rem] overflow-hidden shadow-2xl z-10 mx-auto bg-white/10 backdrop-blur-[2px] border border-white/10 before:content-[''] before:absolute before:inset-0 before:rounded-2xl before:border before:border-white/20">
        <Image
          src="/rooms/hotel-room.jpg"
          alt="Hero Bedroom"
          width={1500}
          height={800}
       
        />
      </div>
      <div className="absolute z-20 bottom-[19rem] left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-4">
        <SearchBar />
      </div>
    </section>
  );
}