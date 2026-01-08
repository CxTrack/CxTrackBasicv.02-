/**
 * AddressAutocomplete - Google Places API address input with autocomplete
 * Provides suggestions as user types, auto-fills city, state, postal code, country
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';

// Types for address components
export interface AddressComponents {
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
}

interface AddressAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onAddressSelect?: (components: AddressComponents) => void;
    placeholder?: string;
    className?: string;
    label?: string;
    disabled?: boolean;
}

// Google Places API prediction type
interface PlacePrediction {
    place_id: string;
    description: string;
    structured_formatting: {
        main_text: string;
        secondary_text: string;
    };
}

// Simple cache for API responses
const predictionCache = new Map<string, PlacePrediction[]>();

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
    value,
    onChange,
    onAddressSelect,
    placeholder = 'Start typing an address...',
    className = '',
    label,
    disabled = false,
}) => {
    const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Check if Google Places API is loaded
    const isGoogleLoaded = useCallback(() => {
        return !!(window as any).google?.maps?.places;
    }, []);

    // Fetch predictions from Google Places API
    const fetchPredictions = useCallback(async (input: string) => {
        if (!input || input.length < 3) {
            setPredictions([]);
            setShowDropdown(false);
            return;
        }

        // Check cache first
        const cacheKey = input.toLowerCase();
        if (predictionCache.has(cacheKey)) {
            setPredictions(predictionCache.get(cacheKey) || []);
            setShowDropdown(true);
            return;
        }

        if (!isGoogleLoaded()) {
            console.warn('Google Places API not loaded. Add your API key to enable address autocomplete.');
            return;
        }

        setLoading(true);

        try {
            const service = new (window as any).google.maps.places.AutocompleteService();

            const response = await new Promise<PlacePrediction[]>((resolve, reject) => {
                service.getPlacePredictions(
                    {
                        input,
                        types: ['address'],
                        componentRestrictions: { country: ['ca', 'us'] }, // Canada and US
                    },
                    (results: PlacePrediction[] | null, status: string) => {
                        if (status === 'OK' && results) {
                            resolve(results);
                        } else if (status === 'ZERO_RESULTS') {
                            resolve([]);
                        } else {
                            reject(new Error(status));
                        }
                    }
                );
            });

            predictionCache.set(cacheKey, response);
            setPredictions(response);
            setShowDropdown(response.length > 0);
        } catch (error) {
            console.error('Error fetching predictions:', error);
            setPredictions([]);
        } finally {
            setLoading(false);
        }
    }, [isGoogleLoaded]);

    // Get place details and parse address components
    const getPlaceDetails = useCallback(async (placeId: string, description: string) => {
        if (!isGoogleLoaded()) {
            onChange(description);
            setShowDropdown(false);
            return;
        }

        try {
            const geocoder = new (window as any).google.maps.Geocoder();

            const result = await new Promise<any>((resolve, reject) => {
                geocoder.geocode({ placeId }, (results: any[], status: string) => {
                    if (status === 'OK' && results[0]) {
                        resolve(results[0]);
                    } else {
                        reject(new Error(status));
                    }
                });
            });

            // Parse address components
            const components: AddressComponents = {
                address: '',
                city: '',
                state: '',
                postal_code: '',
                country: '',
            };

            let streetNumber = '';
            let route = '';

            result.address_components?.forEach((component: any) => {
                const types = component.types;

                if (types.includes('street_number')) {
                    streetNumber = component.long_name;
                }
                if (types.includes('route')) {
                    route = component.long_name;
                }
                if (types.includes('locality') || types.includes('sublocality')) {
                    components.city = component.long_name;
                }
                if (types.includes('administrative_area_level_1')) {
                    components.state = component.short_name;
                }
                if (types.includes('postal_code')) {
                    components.postal_code = component.long_name;
                }
                if (types.includes('country')) {
                    components.country = component.long_name;
                }
            });

            // Construct street address
            components.address = streetNumber ? `${streetNumber} ${route}` : route;

            // Update all fields via callback
            onChange(components.address);
            onAddressSelect?.(components);

        } catch (error) {
            console.error('Error getting place details:', error);
            // Fallback to just setting the description
            onChange(description);
        }

        setShowDropdown(false);
        setPredictions([]);
    }, [isGoogleLoaded, onChange, onAddressSelect]);

    // Handle input change with debounce
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
        setSelectedIndex(-1);

        // Debounce API calls
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            fetchPredictions(newValue);
        }, 300);
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown || predictions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, predictions.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    const prediction = predictions[selectedIndex];
                    getPlaceDetails(prediction.place_id, prediction.description);
                }
                break;
            case 'Escape':
                setShowDropdown(false);
                setSelectedIndex(-1);
                break;
        }
    };

    // Handle prediction selection
    const handleSelect = (prediction: PlacePrediction) => {
        getPlaceDetails(prediction.place_id, prediction.description);
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return (
        <div className="relative">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label}
                </label>
            )}

            <div className="relative">
                <MapPin
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => predictions.length > 0 && setShowDropdown(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full pl-10 pr-10 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                        } ${className}`}
                />

                {loading && (
                    <Loader2
                        size={18}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
                    />
                )}

                {value && !loading && (
                    <button
                        type="button"
                        onClick={() => {
                            onChange('');
                            setPredictions([]);
                            setShowDropdown(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Dropdown suggestions */}
            {showDropdown && predictions.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                    {predictions.map((prediction, index) => (
                        <button
                            key={prediction.place_id}
                            type="button"
                            onClick={() => handleSelect(prediction)}
                            className={`w-full px-4 py-3 text-left flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${index === selectedIndex ? 'bg-gray-50 dark:bg-gray-700' : ''
                                } ${index === 0 ? 'rounded-t-lg' : ''} ${index === predictions.length - 1 ? 'rounded-b-lg' : ''
                                }`}
                        >
                            <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                    {prediction.structured_formatting.main_text}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {prediction.structured_formatting.secondary_text}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Fallback message when Google API is not loaded */}
            {showDropdown && predictions.length === 0 && value.length >= 3 && !loading && !isGoogleLoaded() && (
                <div className="absolute z-50 w-full mt-1 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                        💡 Address autocomplete requires Google Places API. Add your API key to enable this feature.
                    </p>
                </div>
            )}
        </div>
    );
};

export default AddressAutocomplete;
