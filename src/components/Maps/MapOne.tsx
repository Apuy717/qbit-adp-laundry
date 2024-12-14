"use client";
import { RootState } from '@/stores/store';
import maplibregl, { Map } from 'maplibre-gl';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { iDropdown } from '../Inputs/InputComponent';
import { GetWithToken, iResponse } from '@/libs/FetchData';
import { Outlet } from '@/types/outlet';

const MapOne: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter()
  const { auth } = useSelector((s: RootState) => s.auth)

  useEffect(() => {
    if (!mapContainerRef.current) return;
    let map: Map | null = null

    async function GotAllOutlet() {
      const res = await GetWithToken<iResponse<Outlet[]>>({
        router: router,
        url: "/api/outlet",
        token: `${auth.access_token}`
      })

      if (res?.statusCode === 200) {
        if (!mapContainerRef.current) return;

        // Initialize the map
        map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', // Default style URL
          // center: [112.99932699142806, -0.922369925166563], // Longitude, Latitude (Kalimantan, Indonesia)
          center: [111.41782472033206, -3.1953929605595865],
          zoom: 3.8,
        });

        for (const outlet of res.data) {
          // Add a marker
          new maplibregl.Marker({ color: 'red' }) // Optional: Change color
            .setLngLat([outlet.longitude as any, outlet.latitude as any]) // Jakarta coordinates
            .setPopup(
              new maplibregl.Popup({ offset: 25 }).setText(outlet.name) // Add a popup
            ) // Optional: Add popup
            .addTo(map);
        }
      }
    }

    GotAllOutlet()

    // Clean up on component unmount
    return () => { map !== null && map.remove(); }
  }, []);

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-1 py-1 
    shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-7">
      <div className='w-full h-full' ref={mapContainerRef}></div>
    </div>
  );
};

export default MapOne;
