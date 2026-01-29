// shared/components/Homepage/Testimonials.tsx
import { useState } from 'react';

interface Testimonial {
  id: number;
  quote: string;
  name: string;
  title: string;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote:
      "Professors, teachers, and researchers don't know how to use platforms like Azure — they need simple solutions like this.",
    name: "Bhaskarjit Sarmah",
    title: "User",
    avatar: "/assets/avatars/bhaskarjit-sarmah.jpg",
  },
  {
    id: 2,
    quote:
      "JPO creates agent instructions in seconds that I would spend significantly longer and the output on LLM is beyond my expectations on the depth provided. Great tool - highly recommend for getting more impactful output!",
    name: "Pratik Patel",
    title: "User",
    avatar: "/assets/avatars/pratik-patel.jpg",
  },
  {
    id: 3,
    quote:
      "It addressed my topic and developed the general topic into more detail, which was useful.",
    name: "User",
    title: "Jet Prompt Optimizer User",
    avatar: "/assets/avatars/user.jpg",
  },
  {
    id: 4,
    quote:
      "Appreciate how specific and clear the prompt was. Simple 'plug and play.'",
    name: "User",
    title: "Jet Prompt Optimizer User",
    avatar: "/assets/avatars/user.jpg",
  },
  {
    id: 5,
    quote:
      "Took a series of prompts I had used in Chat and condensed them into a cogent single prompt.",
    name: "User",
    title: "Jet Prompt Optimizer User",
    avatar: "/assets/avatars/user.jpg",
  },
  {
    id: 6,
    quote:
      "Turn my novice prompt into a well-structured and effective prompt, which gave me a better response.",
    name: "User",
    title: "Jet Prompt Optimizer User",
    avatar: "/assets/avatars/user.jpg",
  },
  {
    id: 7,
    quote:
      "Create prompts that were AI optimized. I'd have no idea how to do that on my own.",
    name: "User",
    title: "Jet Prompt Optimizer User",
    avatar: "/assets/avatars/user.jpg",
  },
  {
    id: 8,
    quote:
      "Brings a great deal of clarity into framing contexts and frames.",
    name: "User",
    title: "Jet Prompt Optimizer User",
    avatar: "/assets/avatars/user.jpg",
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentTestimonial = testimonials[currentIndex];

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <section className="relative py-16 sm:py-24  bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">

        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Testimonials
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Hear what our users have to say about Jet Prompt Optimizer.
          </p>
        </div>

        <div className="relative">

          {/* Prev Button */}
          <button
            onClick={prevTestimonial}
            className="absolute left-0 sm:left-[8%] top-1/2 -translate-y-1/2  z-10 w-10 h-10 flex items-center justify-center bg-[#335386]  hover:bg-blue-800 rounded-full shadow-md transition"
            aria-label="Previous testimonial"
          >
            <svg width="11" height="11" viewBox="0 0 12 20" fill="none">
              <path d="M10 2L2 10L10 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Card */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 md:p-12 border border-gray-200 relative overflow-hidden">
            <blockquote className="text-lg font-regular text-gray-900 relative">
              <p className="relative">
                <span className="relative z-10">{currentTestimonial.quote}</span>
              </p>
            </blockquote>

            {/* Footer */}
            <div className="mt-8 flex items-center">
              <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden">
                <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600">
                  <span className="text-xl font-medium">
                    {currentTestimonial.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
              </div>

              <div className="ml-4">
                <p className="font-medium text-gray-900">
                  {currentTestimonial.name}
                </p>
                <p className="text-gray-600">{currentTestimonial.title}</p>
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToTestimonial(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "w-2 bg-[#ED6730]"
                      : "w-2 bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={nextTestimonial}
            className="absolute right-0 sm:right-[8%] top-1/2 -translate-y-1/2 -mr-2 z-10 w-10 h-10 flex items-center justify-center bg-[#335386] hover:bg-blue-800 rounded-full shadow-md transition"
            aria-label="Next testimonial"
          >
            <svg width="11" height="11" viewBox="0 0 12 20" fill="none">
              <path d="M2 2L10 10L2 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

        </div>
      </div>
    </section>
  );
}
