import WristbandOneMap from './wristband-one-map';

export default function EntranceTwoMap(props: { value: number; locationName: string; overlayText?: string }) {
  return <WristbandOneMap {...props} entranceTwo />;
}
