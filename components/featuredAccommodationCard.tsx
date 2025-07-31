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
    renderStarRating: (rating: number) => JSX.Element[];
}

const FeaturedAccommodationImage = ({ image, name }: { image?: string; name: string }) => (
    <div className="relative aspect-[4/4] overflow-hidden">
        {image ? (
            image.startsWith("data:") ? (
                <Image
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover"
                    fill
                />
            ) : (
                <Image
                    src={image}
                    alt={name}
                    fill
                    className="w-full h-full object-cover"
                />
            )
        ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
                <Mountain className="h-12 w-12 text-muted-foreground" />
            </div>
        )}
    </div>
);

const FeaturedAccommodationDetails = ({
    room,
    renderStarRating,
}: {
    room: FeaturedRoom;
    renderStarRating: (rating: number) => JSX.Element[];
}) => (
    <div
        className="p-4 flex flex-col flex-1"
        style={{
            background: "linear-gradient(to bottom, #e1d9d3 40%, #eeeeec 100%, #efedea 0%)",
        }}
    >
        <h3 className="font-semibold text-lg mb-2">{room.name}</h3>
        <div className="flex items-center text-sm text-muted-foreground mb-2">
            <Users className="h-4 w-4 mr-1 text-primary" />
            <span className="notranslate">{room.adultCapacity}</span> Adults
            {room.childCapacity > 0 && (
                <>
                    , <span className="notranslate">{room.childCapacity}</span> Children
                </>
            )}
        </div>
        <div className="flex items-center mb-2">{renderStarRating(room.rating)}</div>
        {room.features.length > 0 && (
            <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {room.features.slice(0, 3).map((feature, idx) => (
                    <span key={idx}>
                        {feature.name}
                        {idx < Math.min(room.features.length, 3) - 1 && ", "}
                    </span>
                ))}
                {room.features.length > 3 && "..."}
            </div>
        )}
        <div className="mt-auto text-right font-bold text-3xl md:text-4xl lg:text-5xl relative">
            <span className="notranslate absolute -left-2 md:-left-3 -top-1">$</span>
            <span className="notranslate">{room.price}</span>
        </div>
    </div>
);

const FeaturedAccommodationCard = ({ room, renderStarRating }: Props) => {
    return (
        <div className="rounded-[3rem] bg-card text-card-foreground shadow-md overflow-hidden w-full max-w-xs mb-4 md:mb-0 lg:mb-0 2xl:mb-0 flex flex-col">
            <FeaturedAccommodationImage image={room.image} name={room.name} />
            <FeaturedAccommodationDetails room={room} renderStarRating={renderStarRating} />
        </div>
    );
};

export default FeaturedAccommodationCard;