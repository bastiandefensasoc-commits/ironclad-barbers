import type { Barber } from "@/lib/types";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerContainer";
import { BarberCard } from "@/components/barbers/BarberCard";

export function BarberGrid({ barbers }: { barbers: Barber[] }) {
  return (
    <StaggerContainer className="grid grid-cols-2 gap-5 lg:grid-cols-4">
      {barbers.map((barber) => (
        <StaggerItem key={barber.slug}>
          <BarberCard barber={barber} />
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
