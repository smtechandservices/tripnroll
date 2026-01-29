declare module 'react-water-wave' {
    import { CSSProperties, ReactNode } from 'react';

    interface WaterWaveProps {
        imageUrl: string;
        children?: (methods: any) => ReactNode;
        dropRadius?: number;
        perturbance?: number;
        resolution?: number;
        interactive?: boolean;
        crossOrigin?: string;
        style?: CSSProperties;
        className?: string;
    }

    const WaterWave: React.FC<WaterWaveProps>;
    export default WaterWave;
}
