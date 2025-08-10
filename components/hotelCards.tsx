import { MapPin, Star } from "lucide-react";
import { useState, useEffect } from "react";

interface hotelCardProps {
  title: string;
  location: string;
  image: string;
  rating: number;
  price: number;
  onClick?: () => void;
}

const useWishlist = (title: string, hotel: any) => {
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    setIsWishlisted(wishlist.some((h: any) => h.title === title));
  }, [title]);

  const toggleWishlist = () => {
    const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");

    if (!isWishlisted) {
      if (!wishlist.some((h: any) => h.title === title)) {
        wishlist.push(hotel);
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
      }
      setIsWishlisted(true);
    } else {
      const updatedWishlist = wishlist.filter((h: any) => h.title !== title);
      localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
      setIsWishlisted(false);
    }
  };

  return { isWishlisted, toggleWishlist };
};

const HotelImage = ({
  image,
  title,
  onWishlistClick,
  isWishlisted,
}: {
  image: string;
  title: string;
  onWishlistClick: () => void;
  isWishlisted: boolean;
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
      className={`absolute top-3 sm:top-5 right-3 sm:right-5 w-5 h-5 sm:w-6 sm:h-6 transition ${isWishlisted ? "text-red-500" : "text-gray-600 opacity-90 "
        }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={isWishlisted ? "currentColor" : "none"}
        stroke="currentColor"
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
        className={`w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 ${index < rating
            ? "fill-[#ff9100] text-[#ff9100]"
            : "fill-none text-muted-foreground"
          }`}
      />
    ));
  };

  return (
    <div
      className="p-3 sm:p-4 md:p-5 lg:p-6 h-full"
      style={{
        background:
          "linear-gradient(to bottom, #e1d9d3 40%, #eeeeec 100%, #efedea 0%)",
      }}
    >
      <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-1 font-urbanist notranslate line-clamp-2">
        {title}
      </h3>
      <div className="flex items-center gap-1 mb-0">
        <MapPin className="w-4 sm:w-5 md:w-7 h-4 sm:h-5 text-[#ff9100] flex-shrink-0" />
        <span className="text-xs sm:text-sm text-[#8f8f73] notranslate truncate">{location}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[1px] sm:gap-[2px] md:gap-1">
          {renderStars()}
        </div>
        <div className="text-right font-urbanist">
          <span className="relative inline-block text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold">
            <span className="absolute -left-3 sm:-left-4 md:-left-5 -top-1 text-sm sm:text-base md:text-lg lg:text-2xl font-semibold">
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
  const hotel = { title, location, image, rating, price };
  const { isWishlisted, toggleWishlist } = useWishlist(title, hotel);

  return (
    <div
      onClick={onClick}
      className="rounded-2xl sm:rounded-3xl lg:rounded-[3rem] overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow duration-200 w-full max-w-xs mx-auto mb-4 lg:mb-0 cursor-pointer"
    >
      <HotelImage
        image={image}
        title={title}
        onWishlistClick={toggleWishlist}
        isWishlisted={isWishlisted}
      />
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