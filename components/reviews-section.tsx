"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, ThumbsUp } from "lucide-react"
import { reviews } from "@/lib/data"

export function ReviewsSection() {
  const [visibleReviews, setVisibleReviews] = useState(3)
  const [helpfulReviews, setHelpfulReviews] = useState<string[]>([])

  const handleLoadMore = () => {
    setVisibleReviews((prev) => Math.min(prev + 3, reviews.length))
  }

  const markHelpful = (reviewId: string) => {
    if (!helpfulReviews.includes(reviewId)) {
      setHelpfulReviews((prev) => [...prev, reviewId])
    }
  }

  // Calculate average rating
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Guest Reviews</h2>
          <div className="flex items-center mt-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="ml-2 font-medium">{averageRating.toFixed(1)}</span>
            <span className="mx-2">•</span>
            <span className="text-muted-foreground">{reviews.length} reviews</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {["All", "5 Star", "4 Star", "3 Star", "Recent"].map((filter) => (
            <Button key={filter} variant="outline" size="sm">
              {filter}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6">
        {reviews.slice(0, visibleReviews).map((review) => (
          <Card key={review.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={review.avatar || "/placeholder.svg?height=48&width=48"}
                    alt={review.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{review.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{review.date}</span>
                        <span>•</span>
                        <span>{review.roomType}</span>
                      </div>
                    </div>

                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="mt-3 text-gray-700">{review.comment}</p>

                  <div className="mt-4 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-primary"
                      onClick={() => markHelpful(review.id)}
                      disabled={helpfulReviews.includes(review.id)}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {helpfulReviews.includes(review.id) ? "Helpful" : "Mark as helpful"}
                    </Button>

                    {review.response && (
                      <Button variant="link" size="sm">
                        View response
                      </Button>
                    )}
                  </div>

                  {review.response && (
                    <div className="mt-4 pl-4 border-l-2 border-muted">
                      <p className="text-sm font-medium">Response from host:</p>
                      <p className="text-sm text-muted-foreground mt-1">{review.response}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {visibleReviews < reviews.length && (
        <div className="text-center mt-6">
          <Button onClick={handleLoadMore} variant="outline">
            Load More Reviews
          </Button>
        </div>
      )}
    </div>
  )
}
