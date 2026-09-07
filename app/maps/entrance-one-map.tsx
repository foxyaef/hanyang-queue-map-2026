import WristbandThreeMap from './wristband-three-map';

export default function EntranceOneMap(props: { value: number; locationName: string; overlayText?: string }) {
  return <WristbandThreeMap {...props} entrance />;
}
