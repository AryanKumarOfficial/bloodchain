'use client'

import {useEffect, useState} from 'react'
import dynamic from 'next/dynamic'
import {Skeleton} from '@/components/ui/skeleton'

// Dynamically import Leaflet components with no SSR
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    {ssr: false, loading: () => <Skeleton className="h-[400px] w-full rounded-xl"/>}
)
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    {ssr: false}
)
const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    {ssr: false}
)
const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    {ssr: false}
)

export interface Location {
    lat: number
    lng: number
    title: string
    type: 'DONOR' | 'REQUEST'
}

export default function BloodMap({locations}: { locations: Location[] }) {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true)
    }, [])

    if (!isMounted) return <Skeleton className="h-[400px] w-full rounded-xl"/>

    return (
        <div className="h-[400px] w-full rounded-xl overflow-hidden border shadow-lg relative z-0">
            <MapContainer
                center={[23.2599, 77.4126]} // Default: Bhopal (Your location)
                zoom={13}
                style={{height: '100%', width: '100%'}}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {locations.map((loc, idx) => (
                    <Marker key={idx} position={[loc.lat, loc.lng]}>
                        <Popup>
                            <div className="p-2">
                <span className={`font-bold ${loc.type === 'REQUEST' ? 'text-red-600' : 'text-blue-600'}`}>
                  {loc.type}
                </span>
                                <p>{loc.title}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    )
}