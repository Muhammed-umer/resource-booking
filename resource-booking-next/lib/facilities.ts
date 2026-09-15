import type { NavIconName } from "@/components/nav-icons";
import type { FacilityType } from "@/lib/db/schema";

/** Every facility a user can request. Mirrors the three ResourceCards. */
export type BookableFacility = FacilityType;

export const FACILITY_OPTIONS: {
  value: BookableFacility;
  label: string;
  subtitle: string;
  capacity: string;
  icon: NavIconName;
  theme: "teal" | "orange" | "purple";
}[] = [
  {
    value: "AUDITORIUM",
    label: "Auditorium",
    subtitle: "Large events & gatherings",
    capacity: "500",
    icon: "auditorium",
    theme: "teal",
  },
  {
    value: "SEMINAR_HALL",
    label: "Seminar Hall",
    subtitle: "Presentations & workshops",
    capacity: "100",
    icon: "seminar",
    theme: "orange",
  },
  {
    value: "GUEST_HOUSE",
    label: "Guest House",
    subtitle: "VIP stays & accommodation",
    capacity: "3 rooms",
    icon: "guest",
    theme: "purple",
  },
];

export const FACILITY_LABEL: Record<FacilityType, string> = {
  SEMINAR_HALL: "Seminar Hall",
  AUDITORIUM: "Auditorium",
  GUEST_HOUSE: "Guest House",
};
