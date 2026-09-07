import WristbandThreeMap from './wristband-three-map';

export default function EntranceOneMap(props: React.ComponentProps<typeof WristbandThreeMap>) {
  return <WristbandThreeMap {...props} entrance />;
}
