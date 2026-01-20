"use client";

import Link from "next/link";
import Image from "next/image";
import { RESOURCE_ARTICLES } from "@/shared/constants/resources";

export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 md:pt-28">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-semibold text-jet-blue md:text-5xl">
            Resources
          </h1>
          <p className="mt-4 text-base text-gray-700 md:text-lg">
            Learn how to integrate JetPromptOptimizer into your stack, automate evaluations,
            and share prompt playbooks with your team.
          </p>
        </div>

        {/* Articles Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {RESOURCE_ARTICLES.map((article) => (
            <Link
              key={article.id}
              href={`/resources/${article.slug}`}
              className="group flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:border-jet-blue/30"
            >
              {/* Featured Image Placeholder */}
              {article.featuredImage ? (
                <div className="relative h-48 w-full overflow-hidden rounded-t-xl bg-gradient-to-br from-jet-blue/10 to-signal-orange/10">
                  <Image
                    src={article.featuredImage}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className="relative h-48 w-full overflow-hidden rounded-t-xl bg-gradient-to-br from-jet-blue/10 to-signal-orange/10 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="mb-2 text-4xl">📚</div>
                    <div className="h-2 w-24 mx-auto bg-jet-blue/20 rounded-full"></div>
                  </div>
                </div>
              )}

              {/* Article Content */}
              <div className="flex flex-1 flex-col p-6">
                {/* Tags */}
                <div className="mb-3 flex flex-wrap gap-2">
                  {article.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-jet-blue/10 px-3 py-1 text-xs font-medium text-jet-blue"
                    >
                      {tag}
                    </span>
                  ))}
                  {article.tags.length > 2 && (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                      +{article.tags.length - 2}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="mb-3 text-xl font-semibold text-jet-blue group-hover:text-signal-orange transition-colors line-clamp-2">
                  {article.title}
                </h2>

                {/* Excerpt */}
                <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-600 line-clamp-3">
                  {article.excerpt}
                </p>

                {/* Author & Meta */}
                <div className="mt-auto border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div>
                      <p className="font-medium text-gray-700">{article.author}</p>
                      <p className="text-gray-500">{article.authorTitle}</p>
                    </div>
                    <div className="text-right">
                      <p>{article.readTime}</p>
                      <p>{article.publishedDate}</p>
                    </div>
                  </div>
                </div>

                {/* Read More */}
                <div className="mt-4 flex items-center text-sm font-medium text-jet-blue group-hover:text-signal-orange transition-colors">
                  Read Article
                  <svg
                    className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State (if no articles) */}
        {RESOURCE_ARTICLES.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-gray-500">No resources available at this time.</p>
          </div>
        )}
      </div>
    </main>
  );
}
