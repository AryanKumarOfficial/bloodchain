// src/lib/geo-util.ts

export interface Coordinates {
    latitude: number
    longitude: number
}

export class GeoUtil {
    /**
     * Calculate distance between two coordinates (Haversine formula)
     * Returns distance in kilometers
     */
    static calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
        // Validate coordinates
        if (!this.isValidCoordinate(coord1) || !this.isValidCoordinate(coord2)) {
            console.warn('Invalid coordinates provided to calculateDistance')
            return 0
        }

        const R = 6371 // Earth's radius in km
        const dLat = this.toRadians(coord2.latitude - coord1.latitude)
        const dLon = this.toRadians(coord2.longitude - coord1.longitude)

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(coord1.latitude)) *
            Math.cos(this.toRadians(coord2.latitude)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2)

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    /**
     * Check if coordinates are within search radius
     */
    static isWithinRadius(
        center: Coordinates,
        point: Coordinates,
        radiusKm: number
    ): boolean {
        if (!this.isValidCoordinate(center) || !this.isValidCoordinate(point)) {
            return false
        }
        return this.calculateDistance(center, point) <= radiusKm
    }

    /**
     * Get bounding box for search radius
     */
    static getBoundingBox(
        center: Coordinates,
        radiusKm: number
    ): {
        minLat: number
        maxLat: number
        minLon: number
        maxLon: number
    } {
        if (!this.isValidCoordinate(center)) {
            throw new Error('Invalid center coordinates')
        }

        const latOffset = radiusKm / 111.32
        const lonOffset =
            radiusKm / (111.32 * Math.cos(this.toRadians(center.latitude)))

        return {
            minLat: center.latitude - latOffset,
            maxLat: center.latitude + latOffset,
            minLon: center.longitude - lonOffset,
            maxLon: center.longitude + lonOffset,
        }
    }

    /**
     * Validate coordinates
     */
    static isValidCoordinate(coord: Coordinates): boolean {
        return (
            coord &&
            typeof coord.latitude === 'number' &&
            typeof coord.longitude === 'number' &&
            coord.latitude >= -90 &&
            coord.latitude <= 90 &&
            coord.longitude >= -180 &&
            coord.longitude <= 180
        )
    }

    private static toRadians(degrees: number): number {
        return (degrees * Math.PI) / 180
    }

    private static toDegrees(radians: number): number {
        return (radians * 180) / Math.PI
    }
}
