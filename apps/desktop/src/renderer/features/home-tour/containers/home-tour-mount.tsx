import { useHomeTour } from "~/features/home-tour/hooks/use-home-tour";

export function HomeTourMount() {
  useHomeTour();
  return null;
}
