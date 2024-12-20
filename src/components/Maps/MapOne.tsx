"use client";
import { GetWithToken, iResponse } from '@/libs/FetchData';
import { RootState } from '@/stores/store';
import { OutletMapWitContribution } from '@/types/outlet';
import maplibregl, { Map } from 'maplibre-gl';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

interface iMapOne {
  started_at: Date | string,
  ended_at: Date | string
}
const MapOne: React.FC<iMapOne> = (filter) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter()
  const { auth } = useSelector((s: RootState) => s.auth)

  useEffect(() => {
    if (!mapContainerRef.current) return;
    let map: Map | null = null

    async function GotAllOutlet() {
      const res = await GetWithToken<iResponse<OutletMapWitContribution[]>>({
        router: router,
        url: `/api/outlet/got/with-contribution-income?started=${filter.started_at}&ended=${filter.ended_at}`,
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

        const totalRevenue = res.data.reduce((sum, outlet) => {
          return sum + (outlet.total_sum ? parseFloat(outlet.total_sum) : 0);
        }, 0);

        for (const outlet of res.data) {
          //calculate percentage contribution 
          const totalSum = outlet.total_sum ? parseFloat(outlet.total_sum) : 0;
          const contributionPercentage = totalRevenue > 0 ? (totalSum / totalRevenue) * 100 : 0;
          // Add a marker
          new maplibregl.Marker({ color: 'red' }) // Optional: Change color
            .setLngLat([outlet.longitude as any, outlet.latitude as any]) // Jakarta coordinates
            .setPopup(
              new maplibregl.Popup({ offset: 25 })
                .setHTML(
                  `<div style="font-weight: bold;">
                    ${outlet.name}
                    </br>
                    <span style="color: green;">
                    Contribution: ${parseFloat(contributionPercentage.toFixed(1))}%
                    </span>
                  </div>`
                )
            ).addTo(map);
        }
      }
    }

    GotAllOutlet()

    // Clean up on component unmount
    return () => { map !== null && map.remove(); }
  }, [filter, router, auth.access_token]);

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-1 py-1 
    shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-7">
      <div className='w-full h-full' ref={mapContainerRef}></div>
    </div>
  );
};

export default MapOne;
