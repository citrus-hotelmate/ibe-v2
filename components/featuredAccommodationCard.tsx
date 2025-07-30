

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

const FeaturedAccommodationCard = ({ room, renderStarRating }: Props) => {
    return (
        <div className="rounded-3xl bg-card text-card-foreground shadow-md overflow-hidden">
            <div className="h-80 w-full relative">
                {room.image ? (
                    room.image.startsWith("data:") ? (
                        <Image
                            src={room.image}
                            alt={room.name}
                            className="w-full h-full object-cover"
                            fill
                        />
                    ) : (
                        <Image
                            src={room.image}
                            alt={room.name}
                            fill
                            className="object-cover"
                        />
                    )
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Mountain className="h-12 w-12 text-muted-foreground" />
                    </div>
                )}
            </div>
            <div className="p-4">
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
                    <div className="text-xs text-muted-foreground mb-2">
                        {room.features.slice(0, 2).map((feature, idx) => (
                            <span key={idx}>
                                {feature.name}
                                {idx < Math.min(room.features.length, 2) - 1 && ", "}
                            </span>
                        ))}
                        {room.features.length > 2 && "..."}
                    </div>
                )}
                <div className="text-right text-lg font-bold">
                    <span className="notranslate">${room.price}</span>
                </div>
            </div>
        </div>
    );
};

export default FeaturedAccommodationCard;