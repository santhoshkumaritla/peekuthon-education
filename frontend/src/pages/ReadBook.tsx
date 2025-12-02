import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Volume2, Loader2, Download } from "lucide-react";
import { sendParentSms } from "@/lib/sms";
import { BookStackIcon } from "@/components/icons/StationeryIcons";
import { bookAPI, getCurrentUserId } from "@/lib/api";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;


type ScrapedLesson = {
  source: string;
  title: string;
  summary: string;
};

const demoScrapers: Record<string, () => Promise<ScrapedLesson>> = {
  async byjus() {
    return {
      source: "Byju's",
      title: "Foundations of Calculus",
      summary:
        "Mocked copy describing limits, derivatives, and continuity as explained on Byju's.",
    };
  },
  async physicsWallah() {
    return {
      source: "Physics Wallah",
      title: "Electrostatics Crash Course",
      summary:
        "Simulated summary covering Coulomb's law and electric field visualizations.",
    };
  },
  async unacademy() {
    return {
      source: "Unacademy",
      title: "UPSC Modern History Capsule",
      summary:
        "Placeholder outline featuring socio-religious reform movements and key acts.",
    };
  },
  async chegg() {
    return {
      source: "Chegg",
      title: "Data Structures Q&A",
      summary:
        "Sample explanation discussing linked lists vs arrays with interview-style snippets.",
    };
  },
  async khanAcademy() {
    return {
      source: "Khan Academy",
      title: "Introduction to Genetics",
      summary:
        "Mock text referencing DNA replication and Punnett squares from Khan Academy lessons.",
    };
  },
  async coursera() {
    return {
      source: "Coursera",
      title: "Machine Learning Specialization",
      summary:
        "Demonstrative overview mentioning supervised learning and model evaluation labs.",
    };
  },
  async edx() {
    return {
      source: "edX",
      title: "Harvard CS50 Notes",
      summary:
        "Synthetic abstract covering pointers, memory safety, and algorithmic thinking.",
    };
  },
  async mitOCW() {
    return {
      source: "MIT OpenCourseWare",
      title: "Thermodynamics Lecture Digest",
      summary:
        "Imagined summary highlighting entropy, enthalpy, and engineering applications.",
    };
  },
  async nptel() {
    return {
      source: "NPTEL",
      title: "Signals & Systems Playlist",
      summary:
        "Pseudo-content on Fourier transforms and Laplace domain intuition from NPTEL.",
    };
  },
  async vedantu() {
    return {
      source: "Vedantu",
      title: "CBSE Chemistry Booster",
      summary:
        "Draft overview focusing on periodic trends and organic reaction mechanisms.",
    };
  },
};

interface BookPage {
  leftContent: string;
  rightContent: string;
}

const ReadBook = () => {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState<BookPage[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [speakingPage, setSpeakingPage] = useState<number | null>(null);

  const generateBookContent = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    setPages([]);
    setCurrentPage(0);

    try {
      // Create a comprehensive prompt for Gemini
      const prompt = `Create a comprehensive educational book about "${topic}" with 15 pages of content. 

IMPORTANT: Format your response EXACTLY as follows:

Page 1:
Left: [content for left page - approximately 120-150 words to fill the page]
Right: [content for right page - approximately 120-150 words to fill the page]

Page 2:
Left: [content for left page - approximately 120-150 words to fill the page]
Right: [content for right page - approximately 120-150 words to fill the page]

Continue this pattern for exactly 15 pages. Make the content educational, well-structured, and suitable for learning. Cover the topic comprehensively from basics to advanced concepts. Use ## for section headings (double hashtags). Organize information logically. Each page side should have approximately 120-150 words to fill the page properly.`;

      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", errorData);
        throw new Error(`Failed to generate content: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data.candidates[0].content.parts[0].text;

      // Parse the generated content into pages
      let parsedPages = parseBookContent(generatedText);
      
      // Post-process: Split pages that are too long
      parsedPages = splitLongPages(parsedPages);
      
      setPages(parsedPages);
      
      // Save to MongoDB
      try {
        const userId = getCurrentUserId();
        if (userId) {
          await bookAPI.create({
            userId,
            topic: topic.trim(),
            pages: parsedPages,
            generatedAt: new Date()
          });
          console.log('Book saved to database');
        }
      } catch (dbError) {
        console.error('Failed to save book to database:', dbError);
      }
      
      await sendParentSms(`Your child read book name ${topic.trim()}`);
    } catch (error) {
      console.error("Error generating book content:", error);
      alert("Failed to generate book content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Split pages that are too long into multiple pages
  const splitLongPages = (pages: BookPage[]): BookPage[] => {
    const maxWordsPerSide = 150; // Maximum words per left/right side
    const newPages: BookPage[] = [];

    pages.forEach((page) => {
      const leftWords = page.leftContent.split(/\s+/).filter(w => w.length > 0);
      const rightWords = page.rightContent.split(/\s+/).filter(w => w.length > 0);

      // If content is within limits, keep as is
      if (leftWords.length <= maxWordsPerSide && rightWords.length <= maxWordsPerSide) {
        newPages.push(page);
        return;
      }

      // Calculate how many pages we need
      const leftPages = Math.ceil(leftWords.length / maxWordsPerSide);
      const rightPages = Math.ceil(rightWords.length / maxWordsPerSide);
      const totalPages = Math.max(leftPages, rightPages);

      // Split into multiple pages
      for (let i = 0; i < totalPages; i++) {
        const leftStart = i * maxWordsPerSide;
        const leftEnd = Math.min(leftStart + maxWordsPerSide, leftWords.length);
        const rightStart = i * maxWordsPerSide;
        const rightEnd = Math.min(rightStart + maxWordsPerSide, rightWords.length);

        newPages.push({
          leftContent: leftWords.slice(leftStart, leftEnd).join(" "),
          rightContent: rightWords.slice(rightStart, rightEnd).join(" "),
        });
      }
    });

    return newPages;
  };

  const parseBookContent = (text: string): BookPage[] => {
    const pages: BookPage[] = [];
    
    // Try multiple parsing strategies
    // Strategy 1: Look for "Page X:" followed by "Left:" and "Right:"
    const pageRegex = /Page\s+\d+:\s*Left:\s*([\s\S]*?)Right:\s*([\s\S]*?)(?=Page\s+\d+:|$)/gi;
    
    let match;
    while ((match = pageRegex.exec(text)) !== null) {
      const leftContent = match[1]?.trim() || "";
      const rightContent = match[2]?.trim() || "";
      if (leftContent || rightContent) {
        pages.push({ leftContent, rightContent });
      }
    }

    // Strategy 2: If regex didn't work, try splitting by "Left:" and "Right:" markers
    if (pages.length === 0) {
      const leftMatches = [...text.matchAll(/Left:\s*([\s\S]*?)(?=Right:|Page\s+\d+:|$)/gi)];
      const rightMatches = [...text.matchAll(/Right:\s*([\s\S]*?)(?=Left:|Page\s+\d+:|$)/gi)];
      
      const maxPairs = Math.min(leftMatches.length, rightMatches.length);
      for (let i = 0; i < maxPairs; i++) {
        pages.push({
          leftContent: leftMatches[i]?.[1]?.trim() || "",
          rightContent: rightMatches[i]?.[1]?.trim() || "",
        });
      }
    }

    // Strategy 3: If still no pages, split the entire text into chunks
    if (pages.length === 0) {
      // Remove markdown formatting and clean text
      const cleanText = text
        .replace(/\*\*/g, "")
        .replace(/#{1,6}\s/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      const words = cleanText.split(/\s+/);
      const wordsPerPage = 300; // Words per page (150 per side)
      const totalPages = Math.min(15, Math.max(10, Math.ceil(words.length / wordsPerPage)));

      for (let i = 0; i < totalPages; i++) {
        const startIdx = i * wordsPerPage;
        const endIdx = Math.min(startIdx + wordsPerPage, words.length);
        const pageWords = words.slice(startIdx, endIdx);
        const pageText = pageWords.join(" ");

        // Split page text in half for left and right
        const midPoint = Math.floor(pageText.length / 2);
        const lastPeriod = pageText.lastIndexOf(".", midPoint);
        const lastNewline = pageText.lastIndexOf("\n", midPoint);
        const splitPoint = lastPeriod > 0 ? lastPeriod + 1 : lastNewline > 0 ? lastNewline + 1 : midPoint;

        pages.push({
          leftContent: pageText.substring(0, splitPoint).trim() || "Content loading...",
          rightContent: pageText.substring(splitPoint).trim() || "Content loading...",
        });
      }
    }

    // Ensure we have at least one page
    if (pages.length === 0) {
      pages.push({
        leftContent: text.substring(0, Math.floor(text.length / 2)).trim() || "Content not available",
        rightContent: text.substring(Math.floor(text.length / 2)).trim() || "Content not available",
      });
    }

    return pages;
  };

  const speakText = (text: string, pageIndex: number) => {
    if (speakingPage === pageIndex) {
      // Stop speaking
      window.speechSynthesis.cancel();
      setSpeakingPage(null);
      return;
    }

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setSpeakingPage(null);
    };

    utterance.onerror = () => {
      setSpeakingPage(null);
    };

    setSpeakingPage(pageIndex);
    window.speechSynthesis.speak(utterance);
  };

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
      window.speechSynthesis.cancel();
      setSpeakingPage(null);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      window.speechSynthesis.cancel();
      setSpeakingPage(null);
    }
  };

  const downloadPDF = async () => {
    if (pages.length === 0) return;

    try {
      // Try to load jsPDF from CDN
      let jsPDF: any;
      
      // Load from CDN
      await new Promise<void>((resolve, reject) => {
        // Check if already loaded
        if ((window as any).jspdf) {
          jsPDF = (window as any).jspdf.jsPDF;
          resolve();
          return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
          jsPDF = (window as any).jspdf.jsPDF;
          resolve();
        };
        script.onerror = () => {
          reject(new Error('Failed to load jsPDF from CDN'));
        };
        document.head.appendChild(script);
      });
      
      if (!jsPDF) {
        throw new Error('jsPDF library not available');
      }
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = (pageWidth - 2 * margin) / 2;
      const leftX = margin;
      const rightX = margin + contentWidth + 5;

      // Add title page
      doc.setFontSize(20);
      doc.text(topic, pageWidth / 2, pageHeight / 2, { align: 'center' });
      doc.addPage();

      // Process each page
      pages.forEach((page, pageIndex) => {
        if (pageIndex > 0) {
          doc.addPage();
        }

        let y = margin + 10;
        doc.setFontSize(11);

        // Left page content
        const leftText = page.leftContent.replace(/\*\*/g, '').replace(/##\s+/g, '');
        const leftLines = doc.splitTextToSize(leftText, contentWidth);
        doc.text(leftLines, leftX, y, {
          maxWidth: contentWidth,
          align: 'left'
        });

        // Right page content
        const rightText = page.rightContent.replace(/\*\*/g, '').replace(/##\s+/g, '');
        const rightLines = doc.splitTextToSize(rightText, contentWidth);
        doc.text(rightLines, rightX, y, {
          maxWidth: contentWidth,
          align: 'left'
        });

        // Add page number
        doc.setFontSize(9);
        doc.text(
          `Page ${pageIndex + 1} of ${pages.length}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      });

      // Save the PDF
      doc.save(`${topic.replace(/[^a-z0-9]/gi, '_')}_book.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please install jspdf: npm install jspdf');
    }
  };

  // Format text: convert **text** to bold red and ## headings to styled headings
  const formatText = (text: string): (string | JSX.Element)[] => {
    if (!text) return [""];
    
    // First, handle headings (##)
    let processedText = text;
    const headingRegex = /##\s+(.+?)(?=\n|$)/g;
    const headingMatches: Array<{ index: number; text: string; heading: string }> = [];
    let headingMatch;
    
    while ((headingMatch = headingRegex.exec(text)) !== null) {
      headingMatches.push({
        index: headingMatch.index,
        text: headingMatch[0],
        heading: headingMatch[1],
      });
    }
    
    // Process text with both headings and bold text
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let keyCounter = 0;
    
    // Combine all matches (headings and bold) and sort by index
    const allMatches: Array<{ index: number; type: 'heading' | 'bold'; content: string; fullMatch: string }> = [];
    
    // Add heading matches
    headingMatches.forEach(match => {
      allMatches.push({
        index: match.index,
        type: 'heading',
        content: match.heading,
        fullMatch: match.text,
      });
    });
    
    // Add bold matches
    const boldRegex = /\*\*(.*?)\*\*/g;
    let boldMatch;
    while ((boldMatch = boldRegex.exec(text)) !== null) {
      allMatches.push({
        index: boldMatch.index,
        type: 'bold',
        content: boldMatch[1],
        fullMatch: boldMatch[0],
      });
    }
    
    // Sort by index
    allMatches.sort((a, b) => a.index - b.index);
    
    // Process matches
    allMatches.forEach(match => {
      // Add text before the match
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        if (beforeText) {
          parts.push(beforeText);
        }
      }
      
      // Add the formatted element
      if (match.type === 'heading') {
        parts.push(
          <h4 key={`heading-${keyCounter++}`} className="text-sm font-bold text-primary mt-3 mb-2">
            {match.content}
          </h4>
        );
      } else {
        parts.push(
          <span key={`bold-${keyCounter++}`} className="font-bold text-red-600 dark:text-red-400">
            {match.content}
          </span>
        );
      }
      
      lastIndex = match.index + match.fullMatch.length;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText) {
        parts.push(remainingText);
      }
    }

    return parts.length > 0 ? parts : [text];
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-4">
          <BookStackIcon className="w-10 h-10 text-primary" filled />
          <h1 className="text-4xl font-bold">Read your own book</h1>
        </div>
      </div>

      {/* Topic Input */}
      {pages.length === 0 && (
        <Card className="max-w-2xl mx-auto border-2">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-lg font-semibold">
                Enter a topic to learn about
              </Label>
              <Input
                id="topic"
                placeholder="e.g., Quantum Physics, Machine Learning, World History..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) {
                    generateBookContent();
                  }
                }}
                className="text-lg h-12"
                disabled={loading}
              />
            </div>
            <Button
              onClick={generateBookContent}
              disabled={loading || !topic.trim()}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating your book...
                </>
              ) : (
                "Generate Book"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Book Display */}
      {pages.length > 0 && (
        <div className="max-w-6xl mx-auto">
          {/* Book Pages */}
          <div className="relative bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 rounded-lg shadow-2xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[70vh]">
              {/* Left Page */}
              <Card className="bg-white dark:bg-gray-900 border-2 border-amber-200 dark:border-amber-800 shadow-lg relative h-full flex flex-col overflow-hidden">
                <CardContent className="p-4 flex-1 flex flex-col pb-12 min-h-0">
                  <h3 className="text-sm font-bold mb-2 text-primary flex-shrink-0">
                    {topic}
                  </h3>
                  <div 
                    className="text-xs leading-relaxed whitespace-pre-wrap break-words flex-1 overflow-y-auto pr-2 book-scrollbar min-h-0"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#fbbf24 #fef3c7'
                    }}
                  >
                    {formatText(pages[currentPage]?.leftContent || "No content").map((part, idx) => 
                      typeof part === 'string' ? <span key={idx}>{part}</span> : part
                    )}
                  </div>
                </CardContent>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-4 left-4"
                  onClick={() =>
                    speakText(
                      pages[currentPage]?.leftContent || "",
                      currentPage * 2
                    )
                  }
                >
                  <Volume2
                    className={`w-5 h-5 ${
                      speakingPage === currentPage * 2
                        ? "text-primary animate-pulse"
                        : ""
                    }`}
                  />
                </Button>
              </Card>

              {/* Right Page */}
              <Card className="bg-white dark:bg-gray-900 border-2 border-amber-200 dark:border-amber-800 shadow-lg relative h-full flex flex-col overflow-hidden">
                <CardContent className="p-4 flex-1 flex flex-col pb-12 min-h-0">
                  <div 
                    className="text-xs leading-relaxed whitespace-pre-wrap break-words flex-1 overflow-y-auto pr-2 book-scrollbar min-h-0"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#fbbf24 #fef3c7'
                    }}
                  >
                    {formatText(pages[currentPage]?.rightContent || "No content").map((part, idx) => 
                      typeof part === 'string' ? <span key={idx}>{part}</span> : part
                    )}
                  </div>
                </CardContent>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-4 right-4"
                  onClick={() =>
                    speakText(
                      pages[currentPage]?.rightContent || "",
                      currentPage * 2 + 1
                    )
                  }
                >
                  <Volume2
                    className={`w-5 h-5 ${
                      speakingPage === currentPage * 2 + 1
                        ? "text-primary animate-pulse"
                        : ""
                    }`}
                  />
                </Button>
              </Card>
            </div>

            {/* Book Spine Effect */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-300 to-amber-500 dark:from-amber-700 dark:to-amber-900 transform -translate-x-1/2"></div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-4">
            <Button
              onClick={prevPage}
              disabled={currentPage === 0}
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {pages.length}
              </p>
            </div>

            <Button
              onClick={nextPage}
              disabled={currentPage === pages.length - 1}
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <Button
              onClick={() => {
                setPages([]);
                setCurrentPage(0);
                setTopic("");
                window.speechSynthesis.cancel();
                setSpeakingPage(null);
              }}
              variant="secondary"
            >
              Create New Book
            </Button>
            <Button
              onClick={downloadPDF}
              variant="default"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download E-Book (PDF)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadBook;

