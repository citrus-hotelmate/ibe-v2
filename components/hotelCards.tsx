import { MapPin, Star } from "lucide-react";
import { useState, useEffect } from "react";

interface hotelCardProps {
  title: string;
  location: string;
  image: string;
  rating: number;
  price: number;
  hotelType?: string;
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
  hotelType,
}: {
  title: string;
  location: string;
  rating: number;
  price: number;
  hotelType?: string;
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
      className="p-4 font-urbanist flex flex-col "
      style={{
        background: "linear-gradient(to bottom, #e1d9d3 40%, #eeeeec 100%, #efedea 0%)",
      }}
    >
      <h3 className="font-semibold text-base leading-snug line-clamp-2 min-h-[3rem]">
        {title}
        {hotelType && (
          <span className="font-semibold text-[#8f8f73] ml-1 text-sm">
            - {hotelType}
          </span>
        )}
      </h3>
      <div className="flex items-center text-xs mb-1.5">
        <MapPin className="w-4 h-4 mr-2 text-[#ff9100] flex-shrink-0" />
        <span className="text-[#8f8f73] notranslate truncate">{location}</span>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1">
          {renderStars()}
        </div>
        {/* Price on the right */}
        <div className="relative inline-block font-urbanist">
          <span className="absolute -left-4 -top-0.5 text-xl font-semibold">$</span>
          <span className="text-3xl font-medium notranslate">{price}</span>
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
  hotelType,
  onClick,
}: hotelCardProps) => {
  const hotel = { title, location, image, rating, price };
  const { isWishlisted, toggleWishlist } = useWishlist(title, hotel);

  return (
    <div
      onClick={onClick}
      className="rounded-[3rem] bg-card text-card-foreground shadow-md overflow-hidden w-[252px] h-auto flex flex-col"
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
        hotelType={hotelType}
      />
    </div>
  );
};

export default hotelCard;