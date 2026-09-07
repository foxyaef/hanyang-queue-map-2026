import WristbandTwoMap from './wristband-two-map';

export default function EntranceThreeMap(props: { value: number; locationName: string; overlayText?: string }) {
  return <WristbandTwoMap {...props} entranceThree />;
}
