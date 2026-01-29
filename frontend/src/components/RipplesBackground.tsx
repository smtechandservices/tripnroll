'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Dynamically import WaterWave to avoid SSR issues
const WaterWave = dynamic(() => import('react-water-wave'), {
    ssr: false,
});

interface RipplesBackgroundProps {
    imageUrl: string;
    children?: ReactNode;
}

export function RipplesBackground({ imageUrl, children }: RipplesBackgroundProps) {
    return (
        <div className="absolute inset-0 w-full h-full">
            <WaterWave
                className='bg-cover bg-center bg-no-repeat'
                imageUrl={imageUrl}
                dropRadius={10}
                perturbance={0.003}
                resolution={256}
                style={{
                    width: '100%',
                    height: '100%',
                }}
            >
                {() => (
                    <div className="w-full h-full">
                        {children}
                    </div>
                )}
            </WaterWave>
        </div>
    );
}
