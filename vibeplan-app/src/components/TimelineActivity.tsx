"use client";

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, DollarSign, ExternalLink, Loader2, RefreshCw } from "lucide-react"
import Image from "next/image"
import TelegramLogo from "@/app/assets/telegram-app-48.png"
import InstagramLogo from "@/app/assets/instagram-48.png"
import type { SwapPreference } from "@/lib/itinerary/types"

interface TimelineActivity {
  id: number
  time: string
  title: string
  description: string
  location: string
  price: string
  estimated_price?: number
  original_price?: number
  savings?: number
  tags?: string[]
  discount?: string
  source_link?: string
  source_type?: string
  source_deal_id?: string
  category?: string
  coordinates: {
    lat: number
    lng: number
  }
}

interface TimelineActivityProps {
  activity: TimelineActivity
  isLast?: boolean
  isActive?: boolean
  isSwapping?: boolean
  swapError?: string
  onHover?: (activityId: number | null) => void
  onSelect?: (activityId: number) => void
  onSwap?: (activity: TimelineActivity, preference: SwapPreference) => void
}

// Helper function to determine the source icon
function getSourceIcon(activity: TimelineActivity) {
  // Check if source_link contains instagram
  if (activity.source_link && activity.source_link.includes('instagram.com')) {
    return { logo: InstagramLogo, alt: 'Instagram' }
  }

  return { logo: TelegramLogo, alt: 'Mock source' }
}

const swapOptions: Array<{ label: string; value: SwapPreference }> = [
  { label: "Similar", value: "similar" },
  { label: "Cheaper", value: "cheaper" },
  { label: "Closer", value: "closer" },
  { label: "More romantic", value: "romantic" },
  { label: "More indoor", value: "indoor" },
]

export function TimelineActivity({
  activity,
  isLast = false,
  isActive = false,
  isSwapping = false,
  swapError,
  onHover,
  onSelect,
  onSwap,
}: TimelineActivityProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      id={`timeline-activity-${activity.id}`}
      className="relative scroll-mt-8"
      onMouseEnter={() => onHover?.(activity.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Timeline connector */}
      <div className="absolute left-0 sm:left-0 top-0 bottom-0 w-px bg-border ml-1.5 sm:ml-2">
        {!isLast && <div className="absolute inset-0 bg-primary/20" />}
      </div>

      {/* Timeline dot */}
      <div
        className={`absolute left-0 sm:left-0 top-2 z-10 h-4 w-4 rounded-full border-2 border-background bg-primary transition-all sm:h-5 sm:w-5 sm:border-4 ${
          isActive ? "scale-125 shadow-lg ring-4 ring-primary/15" : ""
        }`}
      />

      {/* Content */}
      <div
        className="ml-8 rounded-md pb-6 sm:ml-12 sm:pb-8 cursor-default"
        onClick={() => onSelect?.(activity.id)}
      >
        {/* Time header */}
        <div className="mb-2 sm:mb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-primary">
                {activity.time}
              </h3>
              <h4 className="text-lg sm:text-xl font-serif mt-1 mb-2">
                {activity.title}
              </h4>
            </div>

            {onSwap && (
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={isSwapping}
                  onClick={(event) => {
                    event.stopPropagation()
                    setMenuOpen((open) => !open)
                  }}
                >
                  {isSwapping ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 sm:mr-1.5" />
                  )}
                  <span className="hidden sm:inline">Swap</span>
                </Button>

                {menuOpen && (
                  <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-md border bg-background p-1 text-sm shadow-lg">
                    {swapOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className="block w-full rounded-sm px-3 py-2 text-left hover:bg-muted"
                        onClick={(event) => {
                          event.stopPropagation()
                          setMenuOpen(false)
                          onSwap(activity, option.value)
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-3 sm:mb-4">
            {activity.description}
          </p>
        </div>

        {/* Metadata and Source Link Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 my-4">
          {/* Left: Metadata */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="break-words">{activity.location}</span>
            </div>
            {activity.price && (
              <div className="flex items-center flex-shrink-0">
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>{activity.price}</span>
              </div>
            )}
            {activity.discount && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {activity.discount}
              </Badge>
            )}
          </div>

          {/* Right: Source Link */}
          {activity.source_link && (() => {
            const sourceIcon = getSourceIcon(activity)
            return (
              <a
                href={activity.source_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline flex-shrink-0"
              >
                {activity.source_type === 'web' ? (
                  <ExternalLink className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <div className="relative w-4 h-4 flex-shrink-0">
                    <Image
                      src={sourceIcon.logo}
                      alt={sourceIcon.alt}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
                <span className="underline">View source</span>
              </a>
            )
          })()}
        </div>

        {/* Tags */}
        {activity.tags && activity.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-1.5">
            {activity.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {swapError && (
          <p className="mt-3 text-xs text-destructive">{swapError}</p>
        )}
      </div>
    </div>
  )
}
