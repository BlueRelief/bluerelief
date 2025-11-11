import { Badge } from "@/components/ui/badge";
import { Frown, Meh, AlertTriangle, Heart } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SentimentBadgeProps {
  sentiment: string | null | undefined;
  sentiment_score?: number | null;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SentimentBadge({
  sentiment,
  sentiment_score,
  showLabel = true,
  size = "md",
  className = "",
}: SentimentBadgeProps) {
  if (!sentiment) return null;

  const getSentimentConfig = (sentiment: string) => {
    const lowerSentiment = sentiment.toLowerCase();
    switch (lowerSentiment) {
      case "positive":
        return {
          icon: Heart,
          label: "Positive",
          color: "!bg-green-500/10 !text-green-700 dark:!bg-green-950/50 dark:!text-green-300",
          description: "Positive sentiment detected in the source post",
        };
      case "negative":
        return {
          icon: Frown,
          label: "Negative",
          color: "!bg-red-500/10 !text-red-700 dark:!bg-red-950/50 dark:!text-red-300",
          description: "Negative sentiment detected in the source post",
        };
      case "neutral":
        return {
          icon: Meh,
          label: "Neutral",
          color: "!bg-gray-500/10 !text-gray-700 dark:!bg-gray-950/50 dark:!text-gray-300",
          description: "Neutral sentiment detected in the source post",
        };
      case "urgent":
        return {
          icon: AlertTriangle,
          label: "Urgent",
          color: "!bg-orange-500/10 !text-orange-700 dark:!bg-orange-950/50 dark:!text-orange-300",
          description: "Urgent tone detected - requires immediate attention",
        };
      case "fearful":
        return {
          icon: AlertTriangle,
          label: "Fearful",
          color: "!bg-purple-500/10 !text-purple-700 dark:!bg-purple-950/50 dark:!text-purple-300",
          description: "Fearful sentiment detected - panic or distress",
        };
      default:
        return {
          icon: Meh,
          label: sentiment,
          color: "!bg-gray-500/10 !text-gray-700 dark:!bg-gray-950/50 dark:!text-gray-300",
          description: "Sentiment analysis result",
        };
    }
  };

  const config = getSentimentConfig(sentiment);
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-2.5 py-1",
  };

  const iconSizeClasses = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  const badgeContent = (
    <Badge className={`${config.color} ${sizeClasses[size]} border ${className}`}>
      <Icon className={`${iconSizeClasses[size]} mr-1`} />
      {showLabel && config.label}
      {sentiment_score !== null && sentiment_score !== undefined && (
        <span className="ml-1 opacity-70">
          ({sentiment_score > 0 ? "+" : ""}
          {sentiment_score.toFixed(2)})
        </span>
      )}
    </Badge>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
      <TooltipContent className="max-w-[250px]">
        <p className="font-semibold mb-1">{config.label} Sentiment</p>
        <p className="text-xs">{config.description}</p>
        {sentiment_score !== null && sentiment_score !== undefined && (
          <p className="text-xs mt-1 opacity-75">
            Score: {sentiment_score.toFixed(2)} (range: -1.0 to 1.0)
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

