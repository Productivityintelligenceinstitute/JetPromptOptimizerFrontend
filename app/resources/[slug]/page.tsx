"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { getArticleBySlug } from "@/shared/constants/resources";
import { useState, useEffect, JSX } from "react";

function formatMarkdownContent(content: string) {
  const lines = content.split("\n");
  const formatted: JSX.Element[] = [];
  let key = 0;
  let inList = false;
  let listItems: string[] = [];
  let inTable = false;
  let tableRows: string[] = [];
  let firstH1Skipped = false;
  let skipIntro = true; // Skip title/byline block until the first horizontal rule

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : "";

    // Skip intro (title/byline) until the first horizontal rule (---)
    if (skipIntro) {
      if (line === "---") {
        skipIntro = false;
      }
      continue;
    }

    // Handle headers
    if (line.startsWith("# ")) {
      // Skip the first H1 since it's already displayed in the page header
      if (!firstH1Skipped) {
        firstH1Skipped = true;
        continue;
      }
      if (inList) {
        formatted.push(
          <ul key={key++} className="mb-4 ml-6 list-disc space-y-2">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-gray-700">{item}</li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      formatted.push(
        <h1 key={key++} className="mb-6 text-4xl font-bold text-jet-blue md:text-5xl">
          {line.substring(2)}
        </h1>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      if (inList) {
        formatted.push(
          <ul key={key++} className="mb-4 ml-6 list-disc space-y-2">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-gray-700">{item}</li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      formatted.push(
        <h2 key={key++} className="mb-4 mt-8 text-3xl font-semibold text-jet-blue">
          {line.substring(3)}
        </h2>
      );
      continue;
    }

    if (line.startsWith("### ")) {
      if (inList) {
        formatted.push(
          <ul key={key++} className="mb-4 ml-6 list-disc space-y-2">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-gray-700">{item}</li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      formatted.push(
        <h3 key={key++} className="mb-3 mt-6 text-2xl font-semibold text-jet-blue">
          {line.substring(4)}
        </h3>
      );
      continue;
    }

    // Handle horizontal rules
    if (line === "---") {
      if (inList) {
        formatted.push(
          <ul key={key++} className="mb-4 ml-6 list-disc space-y-2">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-gray-700">{item}</li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      formatted.push(<hr key={key++} className="my-8 border-gray-200" />);
      continue;
    }

    // Handle blockquotes
    if (line.startsWith("> ")) {
      if (inList) {
        formatted.push(
          <ul key={key++} className="mb-4 ml-6 list-disc space-y-2">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-gray-700">{item}</li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      formatted.push(
        <blockquote
          key={key++}
          className="my-4 border-l-4 border-signal-orange bg-gray-50 p-4 italic text-gray-700"
        >
          {line.substring(2)}
        </blockquote>
      );
      continue;
    }

    // Handle list items
    if (line.startsWith("• ") || line.startsWith("- ")) {
      inList = true;
      listItems.push(line.substring(2));
      // Check if next line is not a list item to close the list
      if (nextLine && !nextLine.startsWith("• ") && !nextLine.startsWith("- ") && nextLine !== "") {
        formatted.push(
          <ul key={key++} className="mb-4 ml-6 list-disc space-y-2">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-gray-700">{item}</li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      continue;
    }

    // Handle numbered lists
    if (/^\d+\.\s/.test(line)) {
      inList = true;
      listItems.push(line.replace(/^\d+\.\s/, ""));
      if (nextLine && !/^\d+\.\s/.test(nextLine) && nextLine !== "") {
        formatted.push(
          <ol key={key++} className="mb-4 ml-6 list-decimal space-y-2">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-gray-700">{item}</li>
            ))}
          </ol>
        );
        listItems = [];
        inList = false;
      }
      continue;
    }

    // Handle table rows
    if (line.startsWith("|") && line.endsWith("|")) {
      if (line.includes("---")) {
        // Skip separator row
        continue;
      }
      tableRows.push(line);
      if (nextLine && !nextLine.startsWith("|")) {
        // End of table
        const headers = tableRows[0].split("|").map((h) => h.trim()).filter((h) => h);
        const rows = tableRows.slice(1).map((row) =>
          row.split("|").map((cell) => cell.trim()).filter((cell) => cell)
        );

        formatted.push(
          <div key={key++} className="my-6 overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-jet-blue/10">
                  {headers.map((header, idx) => (
                    <th
                      key={idx}
                      className="border border-gray-300 px-4 py-2 text-left font-semibold text-jet-blue"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-gray-50">
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className="border border-gray-300 px-4 py-2 text-gray-700"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
      continue;
    }

    // Handle markdown images ![alt](src)
    if (line.match(/^!\[.*?\]\(.*?\)$/)) {
      if (inList) {
        formatted.push(
          <ul key={key++} className="mb-4 ml-6 list-disc space-y-2">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-gray-700">{item}</li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      const imageMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imageMatch) {
        formatted.push(
          <div key={key++} className="my-8 w-full overflow-hidden rounded-xl">
            <div className="relative h-64 w-full md:h-96">
              <Image
                src={imageMatch[2]}
                alt={imageMatch[1]}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 1024px"
              />
            </div>
          </div>
        );
      }
      continue;
    }

    // Handle regular paragraphs
    if (line && !inList) {
      // Process inline formatting (bold, links)
      const parts: (string | JSX.Element)[] = [];
      let currentIndex = 0;
      const text = line;

      // Process bold text (**text**)
      const boldRegex = /\*\*(.*?)\*\*/g;
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }
        parts.push(
          <strong key={`bold-${key}-${currentIndex}`} className="font-semibold text-gray-900">
            {match[1]}
          </strong>
        );
        lastIndex = match.index + match[0].length;
        currentIndex++;
      }
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }

      // Process links [text](url)
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const processedParts: (string | JSX.Element)[] = [];
      parts.forEach((part) => {
        if (typeof part === "string") {
          let linkLastIndex = 0;
          let linkMatch;
          while ((linkMatch = linkRegex.exec(part)) !== null) {
            if (linkMatch.index > linkLastIndex) {
              processedParts.push(part.substring(linkLastIndex, linkMatch.index));
            }
            processedParts.push(
              <a
                key={`link-${key}-${currentIndex++}`}
                href={linkMatch[2]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-jet-blue hover:text-signal-orange hover:underline"
              >
                {linkMatch[1]}
              </a>
            );
            linkLastIndex = linkMatch.index + linkMatch[0].length;
          }
          if (linkLastIndex < part.length) {
            processedParts.push(part.substring(linkLastIndex));
          }
        } else {
          processedParts.push(part);
        }
      });

      formatted.push(
        <p key={key++} className="mb-4 leading-relaxed text-gray-700">
          {processedParts.length > 0 ? processedParts : line}
        </p>
      );
    }
  }

  // Close any open lists
  if (inList && listItems.length > 0) {
    formatted.push(
      <ul key={key++} className="mb-4 ml-6 list-disc space-y-2">
        {listItems.map((item, idx) => (
          <li key={idx} className="text-gray-700">{item}</li>
        ))}
      </ul>
    );
  }

  return formatted;
}

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const article = slug ? getArticleBySlug(slug) : undefined;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!article) {
      router.push("/resources");
    }
  }, [article, router]);

  if (!article) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-4 pt-24 pb-16 text-center">
          <p className="text-gray-500">Article not found. Redirecting...</p>
        </div>
      </main>
    );
  }

  const handleCopyLinkedInPost = () => {
    if (article.linkedInPost) {
      navigator.clipboard.writeText(article.linkedInPost);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 pt-32 pb-16">
        {/* Back Button */}
        <Link
          href="/resources"
          className="mb-8 inline-flex items-center text-sm font-medium text-jet-blue hover:text-signal-orange transition-colors"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Resources
        </Link>

        {/* Featured Image */}
        {article.featuredImage && (
          <div className="mb-8 w-full overflow-hidden rounded-xl">
            <div className="relative h-64 w-full md:h-96">
              <Image
                src={article.featuredImage}
                alt={article.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1024px"
                priority
              />
            </div>
          </div>
        )}

        {/* Article Header */}
        <header className="mb-8">
          {/* Tags */}
          <div className="mb-4 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-jet-blue/10 px-3 py-1 text-xs font-medium text-jet-blue"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="mb-4 text-4xl font-bold text-jet-blue md:text-5xl">
            {article.title}
          </h1>

          {/* Author & Meta */}
          <div className="mb-6 flex flex-wrap items-center gap-4 border-b border-gray-200 pb-3">
            <div>
              <p className="text-sm text-gray-600">JetPilot</p>
            </div>
            <div className="ml-auto flex items-center gap-4 text-sm text-gray-500">
              <span>{article.publishedDate}</span>
              <span>•</span>
              <span>{article.readTime}</span>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <article className="prose prose-lg max-w-none">
          <div className="space-y-4">{formatMarkdownContent(article.content)}</div>
        </article>

        {/* LinkedIn Post Section */}
        {article.linkedInPost && (
          <div className="mt-12 rounded-xl border border-gray-200 bg-gray-50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-jet-blue">
                Share on LinkedIn
              </h3>
              <button
                onClick={handleCopyLinkedInPost}
                className="flex items-center gap-2 rounded-md bg-jet-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-jet-blue/90"
              >
                {copied ? (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy Post
                  </>
                )}
              </button>
            </div>
            <div className="rounded-lg bg-white p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {article.linkedInPost}
              </pre>
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-12 rounded-xl bg-linear-to-br from-jet-blue to-jet-blue/90 p-8 text-center text-white">
          <h3 className="mb-2 text-2xl font-semibold">
            Ready to Turn Every Prompt into Performance?
          </h3>
          <p className="mb-6 text-lg opacity-90">
            Optimize your thinking before you hit Enter.
          </p>
          <a
            href="https://app.jetpromptoptimizer.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-md bg-signal-orange px-6 py-3 font-semibold text-white transition-colors hover:bg-signal-orange/90"
          >
            Experience the Jet Prompt Optimizer Today →
          </a>
        </div>

        {/* Back to Resources */}
        <div className="mt-8 text-center">
          <Link
            href="/resources"
            className="inline-flex items-center text-jet-blue hover:text-signal-orange transition-colors"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            View All Resources
          </Link>
        </div>
      </div>
    </main>
  );
}

