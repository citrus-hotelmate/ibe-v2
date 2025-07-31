import { MapPin, Star } from "lucide-react";

interface hotelCardProps {
  title: string;
  location: string;
  image: string;
  rating: number;
  price: number;
  onClick?: () => void; 
}

const HotelImage = ({ image, title }: { image: string; title: string }) => (
  <div className="relative aspect-[4/3] overflow-hidden">
    {image ? (
      <img 
        src={image} 
        alt={title}
        className="w-full h-full object-contain"
      />
    ) : null}
  </div>
);

console.log("HotelImage component rendered with image:", HotelImage);
const HotelDetails = ({ title, location, rating, price,  }: { title: string; location: string; rating: number; price: number }) => {
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
        background: "linear-gradient(to bottom, #e1d9d3 40%, #eeeeec 100%, #efedea 0%)",
      }}
    >
      <h3 className="text-base md:text-lg font-semibold text-card-foreground mb-1">
        {title}
      </h3>
      <div className="flex items-center gap-1 mb-0">
        <MapPin className="w-7 h-5 text-[#ff9100]" />
        <span className="text-sm text-muted-foreground">{location}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[2px] sm:gap-1">
          {renderStars()}
        </div>
        <div className="text-right">
          <span className="relative inline-block text-3xl md:text-4xl lg:text-5xl font-semibold text-card-foreground font-sans">
            <span className="absolute -left-2 md:-left-3 -top-1 text-sm md:text-base font-normal">$</span>
            <span>{price}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

const hotelCard = ({ title, location, image, rating, price , onClick}: hotelCardProps) => {
  return (
    <div onClick={onClick} className="rounded-[3rem] overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow duration-200 w-full max-w-xs mb-4 lg:mb-0 2xl:mb-0 md:mb-0">
      <HotelImage image={image} title={title} />
      <HotelDetails title={title} location={location} rating={rating} price={price} />
    </div>
  );
};

export default hotelCard;