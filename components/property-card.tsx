'use client';

import Image from 'next/image';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface PropertyCardProps {
  property: {
    id: number;
    type: string;
    location: string;
    price: string;
    nights: number;
    rating: number;
    image: string;
    occupancy?: string;
    amenities?: string[];
    lowestRate: number

  };
}

export function PropertyCard({ property }: PropertyCardProps) {
  const router = useRouter();

  return (
    <div
      className="rounded-3xl bg-card text-card-foreground shadow-md overflow-hidden cursor-pointer flex flex-col"
      onClick={() => property.type === 'ABC' && router.push('/hotel')}
    >
      <div className="h-80 w-full relative">
        <Image
          src={property.image}
          alt={`${property.type}`}
          fill
          className="object-cover w-full h-full"
        />
      </div>

      <div className="p-4 flex flex-col justify-between flex-1">
        <h3 className="font-semibold text-lg mb-2 text-gray-900">
          {property.type}
        </h3>

        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <Users className="h-4 w-4 mr-1 text-primary" />
          <span>{property.occupancy}</span>
        </div>

        <div className="flex items-center mb-2">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className={cn(
                "text-lg",
                i < Math.floor(property.rating) ? "text-yellow-400" : "text-gray-300"
              )}
            >
              ★
            </span>
          ))}
        </div>

        <div className="text-right text-lg font-bold">
          {/* Display lowest rate */}
          <span className="notranslate">{property.lowestRate}</span>
        </div>
      </div>
    </div>
  );
}
