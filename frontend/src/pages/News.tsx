import { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  Newspaper,
  Image as ImageIcon,
  ExternalLink,
  Globe,
  Languages,
} from "lucide-react";
import { sendParentSms } from "@/lib/sms";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface GNewsSource {
  name: string;
  url: string;
}

interface GNewsArticle {
  title: string;
  description: string | null;
  content: string | null;
  url: string;
  image: string | null;
  publishedAt: string;
  source: GNewsSource;
}

interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

const SUPPORTED_LANGUAGES = [
  { code: "ar", label: "Arabic" },
  { code: "bn", label: "Bengali" },
  { code: "bg", label: "Bulgarian" },
  { code: "ca", label: "Catalan" },
  { code: "zh", label: "Chinese" },
  { code: "cs", label: "Czech" },
  { code: "nl", label: "Dutch" },
  { code: "en", label: "English" },
  { code: "et", label: "Estonian" },
  { code: "fi", label: "Finnish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "el", label: "Greek" },
  { code: "gu", label: "Gujarati" },
  { code: "he", label: "Hebrew" },
  { code: "hi", label: "Hindi" },
  { code: "hu", label: "Hungarian" },
  { code: "id", label: "Indonesian" },
  { code: "it", label: "Italian" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "lv", label: "Latvian" },
  { code: "lt", label: "Lithuanian" },
  { code: "ml", label: "Malayalam" },
  { code: "mr", label: "Marathi" },
  { code: "no", label: "Norwegian" },
  { code: "pl", label: "Polish" },
  { code: "pt", label: "Portuguese" },
  { code: "pa", label: "Punjabi" },
  { code: "ro", label: "Romanian" },
  { code: "ru", label: "Russian" },
  { code: "sk", label: "Slovak" },
  { code: "sl", label: "Slovenian" },
  { code: "es", label: "Spanish" },
  { code: "sv", label: "Swedish" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "th", label: "Thai" },
  { code: "tr", label: "Turkish" },
  { code: "uk", label: "Ukrainian" },
  { code: "vi", label: "Vietnamese" },
];

const SUPPORTED_COUNTRIES = [
  { code: "ar", label: "Argentina" },
  { code: "au", label: "Australia" },
  { code: "at", label: "Austria" },
  { code: "bd", label: "Bangladesh" },
  { code: "be", label: "Belgium" },
  { code: "bw", label: "Botswana" },
  { code: "br", label: "Brazil" },
  { code: "bg", label: "Bulgaria" },
  { code: "ca", label: "Canada" },
  { code: "cl", label: "Chile" },
  { code: "cn", label: "China" },
  { code: "co", label: "Colombia" },
  { code: "cu", label: "Cuba" },
  { code: "cz", label: "Czechia" },
  { code: "eg", label: "Egypt" },
  { code: "ee", label: "Estonia" },
  { code: "et", label: "Ethiopia" },
  { code: "fi", label: "Finland" },
  { code: "fr", label: "France" },
  { code: "de", label: "Germany" },
  { code: "gh", label: "Ghana" },
  { code: "gr", label: "Greece" },
  { code: "hk", label: "Hong Kong" },
  { code: "hu", label: "Hungary" },
  { code: "in", label: "India" },
  { code: "id", label: "Indonesia" },
  { code: "ie", label: "Ireland" },
  { code: "il", label: "Israel" },
  { code: "it", label: "Italy" },
  { code: "jp", label: "Japan" },
  { code: "ke", label: "Kenya" },
  { code: "lv", label: "Latvia" },
  { code: "lb", label: "Lebanon" },
  { code: "lt", label: "Lithuania" },
  { code: "my", label: "Malaysia" },
  { code: "mx", label: "Mexico" },
  { code: "ma", label: "Morocco" },
  { code: "na", label: "Namibia" },
  { code: "nl", label: "Netherlands" },
  { code: "nz", label: "New Zealand" },
  { code: "ng", label: "Nigeria" },
  { code: "no", label: "Norway" },
  { code: "pk", label: "Pakistan" },
  { code: "pe", label: "Peru" },
  { code: "ph", label: "Philippines" },
  { code: "pl", label: "Poland" },
  { code: "pt", label: "Portugal" },
  { code: "ro", label: "Romania" },
  { code: "ru", label: "Russia" },
  { code: "sa", label: "Saudi Arabia" },
  { code: "sn", label: "Senegal" },
  { code: "sg", label: "Singapore" },
  { code: "sk", label: "Slovakia" },
  { code: "si", label: "Slovenia" },
  { code: "za", label: "South Africa" },
  { code: "kr", label: "South Korea" },
  { code: "es", label: "Spain" },
  { code: "se", label: "Sweden" },
  { code: "ch", label: "Switzerland" },
  { code: "tw", label: "Taiwan" },
  { code: "tz", label: "Tanzania" },
  { code: "th", label: "Thailand" },
  { code: "tr", label: "Turkey" },
  { code: "ug", label: "Uganda" },
  { code: "ua", label: "Ukraine" },
  { code: "ae", label: "United Arab Emirates" },
  { code: "gb", label: "United Kingdom" },
  { code: "us", label: "United States" },
  { code: "ve", label: "Venezuela" },
  { code: "vn", label: "Vietnam" },
  { code: "zw", label: "Zimbabwe" },
];

const News = () => {
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [language, setLanguage] = useState("en");
  const [country, setCountry] = useState("in");
  const [articles, setArticles] = useState<GNewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [imageError, setImageError] = useState(false);

  const truncateContent = (content: string, maxLength: number = 200): string => {
    if (!content || content.length <= maxLength) return content || "No content available.";
    return content.substring(0, maxLength).trim() + "...";
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatToISO = (date: string, endOfDay = false) => {
    if (!date) return "";
    const baseDate = new Date(date);
    if (Number.isNaN(baseDate.getTime())) return "";
    if (endOfDay) {
      baseDate.setHours(23, 59, 59, 999);
    } else {
      baseDate.setHours(0, 0, 0, 0);
    }
    return baseDate.toISOString();
  };

  const handleFetchNews = async () => {
    if (!query.trim()) {
      setError("Please enter a search query.");
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentIndex(0);
    setImageError(false);

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        lang: language,
        country,
        max: "10",
        sortby: "publishedAt",
      });

      const fromISO = formatToISO(fromDate);
      const toISO = formatToISO(toDate, true);
      if (fromISO) params.append("from", fromISO);
      if (toISO) params.append("to", toISO);

      const response = await fetch(`${API_BASE_URL}/news/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch news');
      }

      const data = result.data;
      setArticles(data.articles || []);
      setTotalResults(data.totalArticles || 0);
      setImageError(false);

      if (!data.articles || data.articles.length === 0) {
        setError("No news articles found for the selected filters.");
      } else {
        await sendParentSms(
          `News fetched for ${query.trim()} (${language.toUpperCase()}, ${country.toUpperCase()}) ${fromDate ? `from ${fromDate}` : ""
          } ${toDate ? `to ${toDate}` : ""}`.trim()
        );
      }
    } catch (err: any) {
      console.error("Error fetching news:", err);
      setError(err.message || "Failed to Search news. Please try again.");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(articles.length - 1, prev + 1));
    setImageError(false);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setImageError(false);
  };

  const currentArticle = articles[currentIndex];

  const languageOptions = useMemo(() => SUPPORTED_LANGUAGES, []);
  const countryOptions = useMemo(() => SUPPORTED_COUNTRIES, []);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            News
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="query" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search Query
              </Label>
              <Input
                id="query"
                placeholder="e.g., technology, politics, sports"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetchNews()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                From Date
              </Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                To Date
              </Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center gap-2">
                <Languages className="w-4 h-4" />
                Language
              </Label>
              <div className="relative">
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full appearance-none rounded-md border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {languageOptions.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label} ({lang.code.toUpperCase()})
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                  ⌄
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Country
              </Label>
              <div className="relative">
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full appearance-none rounded-md border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {countryOptions.map((countryItem) => (
                    <option key={countryItem.code} value={countryItem.code}>
                      {countryItem.label} ({countryItem.code.toUpperCase()})
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                  ⌄
                </span>
              </div>
            </div>
          </div>
          <Button
            onClick={handleFetchNews}
            disabled={loading}
            className="w-full md:w-auto"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Searching News...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search News
              </>
            )}
          </Button>
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
          {totalResults > 0 && (
            <div className="text-sm text-muted-foreground">
              Found {totalResults} article{totalResults !== 1 ? "s" : ""}
            </div>
          )}
        </CardContent>
      </Card>

      {currentArticle && (
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{currentArticle.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{currentArticle.source?.name ?? "Unknown Source"}</Badge>
                  <span>•</span>
                  <span>{formatDate(currentArticle.publishedAt)}</span>
                  <span>•</span>
                  <Badge variant="secondary">{language.toUpperCase()}</Badge>
                  <Badge variant="secondary">{country.toUpperCase()}</Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="shrink-0"
              >
                <a
                  href={currentArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  Read Full
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Image */}
            <div className="w-[75%] mx-auto aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              {currentArticle.image && !imageError ? (
                <img
                  src={currentArticle.image}
                  alt={currentArticle.title}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground p-8">
                  <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">
                    Image not available
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {currentArticle.description && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Description
                </h3>
                <p className="text-sm leading-relaxed">{currentArticle.description}</p>
              </div>
            )}

            {/* Content Summary */}
            {currentArticle.content && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Summary
                </h3>
                <p className="text-sm leading-relaxed text-foreground">
                  {truncateContent(currentArticle.content, 300)}
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} of {articles.length}
              </span>
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentIndex === articles.length - 1}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {articles.length === 0 && !loading && !error && (
        <Card>
          <CardContent className="py-12 text-center">
            <Newspaper className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              Enter dates and click "Search News" to view Indian news articles.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default News;

