import Image from "next/image";
import { Mountain, Users } from "lucide-react";

interface Feature {
  category: string;
  name: string;
}

interface FeaturedRoom {
  id: number;
  name: string;
  adultCapacity: number;
  childCapacity: number;
  totalRooms: number;
  image?: string;
  features: Feature[];
  price: number;
  rating: number;
}

interface Props {
  room: FeaturedRoom;
}

const FeaturedAccommodationImage = ({ image, name }: { image?: string; name: string }) => (
  <div className="relative aspect-[4/3.7] overflow-hidden">
    {image ? (
      image.startsWith("data:") ? (
        <Image src={image} alt={name} className="w-full h-full object-cover" fill />
      ) : (
        <Image src={image} alt={name} fill className="w-full h-full object-cover" />
      )
    ) : (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <Mountain className="h-12 w-12 text-muted-foreground" />
      </div>
    )}
  </div>
);

const FeaturedAccommodationDetails = ({ room }: { room: FeaturedRoom }) => (
  <div
    className="p-4 font-urbanist flex flex-col h-full"
    style={{
      background:
        "linear-gradient(to bottom, #e1d9d3 40%, #eeeeec 100%, #efedea 0%)",
    }}
  >
    {/* Reserve smaller space for up to 2 lines of title */}
    <h3 className="font-semibold text-base leading-snug line-clamp-2 min-h-[2rem]">
      {room.name}
    </h3>

    <div className="flex items-center text-xs mb-1.5">
      <Users className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
      <span className="notranslate text-[#8f8f73]">{room.adultCapacity}</span>
      <span className="text-[#8f8f73]">&nbsp;Adults</span>
      {room.childCapacity > 0 && (
        <>
          <span className="text-[#8f8f73]">,&nbsp;</span>
          <span className="notranslate text-[#8f8f73]">{room.childCapacity}</span>
          <span className="text-[#8f8f73]">&nbsp;Children</span>
        </>
      )}
    </div>

    {/* Always render; smaller reserved block for features */}
    <div className="text-[11px] text-muted-foreground line-clamp-2 min-h-[1rem]">
      {room.features?.length
        ? room.features.slice(0, 3).map((feature, idx) => (
            <span key={idx}>
              {feature.name}
              {idx < Math.min(room.features.length, 3) - 1 && ", "}
            </span>
          ))
        : null}
      {room.features && room.features.length > 3 && "..."}
    </div>

    {/* Price pinned to bottom */}
    <div className="mt-auto flex items-center justify-end text-3xl relative">
      <div className="relative inline-block font-urbanist">
        <span className="absolute -left-4 -top-0.5 text-xl font-semibold">$</span>
        <span className="notranslate font-medium">{room.price}</span>
      </div>
    </div>
  </div>
);

const FeaturedAccommodationCard = ({ room }: Props) => {
  return (
    <div className="rounded-[3rem] bg-card text-card-foreground shadow-md overflow-hidden w-[252px] h-auto flex flex-col">
      <FeaturedAccommodationImage image={room.image} name={room.name} />
      <FeaturedAccommodationDetails room={room} />
    </div>
  );
};

export default FeaturedAccommodationCard;