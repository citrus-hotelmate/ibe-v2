'use client';

import { PropertyCard } from '@/components/property-card';


interface PropertyListingsProps {
  title: string;
  destination: string;
  properties: {
    id: number;
    type: string;
    location: string;
    lowestRate: number;
    nights: number;
    rating: number;
    image: string;
    price: string;
  }[];
}

export function PropertyListings({ title, destination, properties }: PropertyListingsProps) {
  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          {title} <span className="inline-block transition-transform duration-300 hover:translate-x-1">›</span>
        </h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {properties.map((property) => (
          <div key={property.id} className="h-full">
            <div className="h-full shadow-sm">
              <PropertyCard property={property} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}