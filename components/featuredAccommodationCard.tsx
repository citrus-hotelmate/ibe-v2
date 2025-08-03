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
}: {
    room: FeaturedRoom;
}) => (
    <div
        className="p-5 font-urbanist"
        style={{
            background: "linear-gradient(to bottom, #e1d9d3 40%, #eeeeec 100%, #efedea 0%)",
        }}
    >
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{room.name}</h3>
        <div className="flex items-center text-sm mb-2">
            <Users className="h-4 w-4 mr-1 text-primary flex-shrink-0" />
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
        {/* Star rating moved to bottom row, inline with price */}
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
        <div className="mt-auto flex items-center justify-end text-4xl relative">
            {/* Price on the right */}
            <div className="relative inline-block font-urbanist">
                <span className="absolute -left-5 -top-1 text-2xl font-semibold">$</span>
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