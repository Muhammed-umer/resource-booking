import type { Metadata } from "next";

import { AvailabilityBoard } from "@/components/availability-board";

export const metadata: Metadata = { title: "Availability Radar" };

export default async function UserAvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ facility?: string }>;
}) {
  const { facility } = await searchParams;
  return <AvailabilityBoard facility={facility} />;
}
