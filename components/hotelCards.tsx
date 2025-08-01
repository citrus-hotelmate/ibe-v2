import { MapPin, Star } from "lucide-react";
import { useState } from "react";

interface hotelCardProps {
  title: string;
  location: string;
  image: string;
  rating: number;
  price: number;
  onClick?: () => void;
}

const HotelImage = ({
  image,
  title,
  onWishlistClick,
}: {
  image: string;
  title: string;
  onWishlistClick: () => void;
}) => (
  <div className="relative aspect-[4/3.7] overflow-hidden">
    {image && (
      <img src={image} alt={title} className="w-full h-full object-cover" />
    )}

    {/* Heart Icon Button */}
    <button
      onClick={(e) => {
        e.stopPropagation(); // Prevent triggering card click
        onWishlistClick();
      }}
      className="absolute top-5 right-5 w-8 h-8 text-gray-600 opacity-90 hover:text-red-500 transition"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 21s-6-4.35-9-8.33C.52 9.28 2.24 4 6.5 4c1.74 0 3.41 1.01 4.5 2.09C12.09 5.01 13.76 4 15.5 4 19.76 4 21.48 9.28 18 12.67 15 16.65 12 21 12 21z" />
      </svg>
    </button>
  </div>
);

const HotelDetails = ({
  title,
  location,
  rating,
  price,
}: {
  title: string;
  location: string;
  rating: number;
  price: number;
}) => {
  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-5 h-5 ${
          index < rating
            ? "fill-[#ff9100] text-[#ff9100]"
            : "fill-none text-muted-foreground"
        }`}
      />
    ));
  };

  return (
    <div
      className="p-4 sm:p-5 md:p-6 h-full"
      style={{
        background:
          "linear-gradient(to bottom, #e1d9d3 40%, #eeeeec 100%, #efedea 0%)",
      }}
    >
      <h3 className="text-base md:text-lg font-semibold mb-1 font-urbanist">
        {title}
      </h3>
      <div className="flex items-center gap-1 mb-0">
        <MapPin className="w-7 h-5 text-[#ff9100]" />
        <span className="text-sm text-[#8f8f73]">{location}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[2px] sm:gap-1">
          {renderStars()}
        </div>
        <div className="text-right font-urbanist">
          <span className="relative inline-block text-3xl md:text-4xl lg:text-5xl font-semibold">
            <span className="absolute -left-5 -top-1 text-lg md:text-3xl font-semibold">
              $
            </span>
            <span>{price}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

const hotelCard = ({
  title,
  location,
  image,
  rating,
  price,
  onClick,
}: hotelCardProps) => {
  // Function to handle adding to wishlist
  const handleAddToWishlist = () => {
    const hotel = { title, location, image, rating, price };
    const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");

    // Avoid duplicates
    if (!wishlist.some((h: any) => h.title === title)) {
      wishlist.push(hotel);
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
      alert(`${title} added to wishlist!`);
    } else {
      alert(`${title} is already in wishlist!`);
    }
  };

  return (
    <div
      onClick={onClick}
      className="rounded-[3rem] overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow duration-200 w-full max-w-xs mb-4 lg:mb-0"
    >
      <HotelImage image={image} title={title} onWishlistClick={handleAddToWishlist} />
      <HotelDetails
        title={title}
        location={location}
        rating={rating}
        price={price}
      />
    </div>
  );
};

export default hotelCard;