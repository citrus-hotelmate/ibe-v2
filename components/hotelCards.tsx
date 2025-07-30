import { MapPin, Star } from "lucide-react";

interface hotelCardProps {
  title: string;
  location: string;
  image: string;
  rating: number;
  price: number;
}

const HotelImage = ({ image, title }: { image: string; title: string }) => (
  <div className="relative h-64 overflow-hidden">
    <img 
      src={image} 
      alt={title}
      className="w-full h-full object-cover"
    />
  </div>
);

const HotelDetails = ({ title, location, rating, price }: { title: string; location: string; rating: number; price: number }) => {
  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating 
            ? "fill-[#ff9100] text-[#ff9100]" 
            : "fill-none text-muted-foreground"
        }`}
      />
    ));
  };

  return (
    <div
      className="p-6 h-full"
      style={{
        background: "linear-gradient(to bottom, #e1d9d3 3%, #eeeeec 20%, #efedea 15%)",
      }}
    >
      <h3 className="text-lg font-semibold text-card-foreground mb-1">
        {title}
      </h3>
      <div className="flex items-center gap-1 mb-4">
        <MapPin className="w-4 h-4 text-[#ff9100]" />
        <span className="text-sm text-muted-foreground">{location}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {renderStars()}
        </div>
        <div className="text-right">
          <span className="relative inline-block text-3xl font-semibold text-card-foreground font-sans">
            <span className="absolute -left-3 -top-1 text-xl font-normal">$</span>
            <span>{price}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

const hotelCard = ({ title, location, image, rating, price }: hotelCardProps) => {
  return (
    <div className="rounded-[2.5rem] overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow duration-200 w-72 h-96.5">
      <HotelImage image={image} title={title} />
      <HotelDetails title={title} location={location} rating={rating} price={price} />
    </div>
  );
};

export default hotelCard;