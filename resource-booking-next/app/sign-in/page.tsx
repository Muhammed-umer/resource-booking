import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import collegeLogo from "@/assets/CollegeLogo.png";
import { NavIcon, type NavIconName } from "@/components/nav-icons";
import { SignInForm } from "@/components/sign-in-form";
import { devAccounts } from "@/lib/auth/dev-accounts";
import { getSessionUser, homePathForRole } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Sign in" };

const FACILITIES: { icon: NavIconName; name: string; detail: string }[] = [
  { icon: "auditorium", name: "Auditorium", detail: "Large events & gatherings" },
  { icon: "seminar", name: "Seminar Hall", detail: "Presentations & workshops" },
  { icon: "guest", name: "Guest House", detail: "VIP stays & accommodation" },
];

/**
 * Split sign-in screen: the college on the left in the app's primary colour,
 * the form on the right. One sign-in for every role — the account's role
 * decides where you land afterwards.
 */
export default async function SignInPage() {
  const sessionUser = await getSessionUser();
  if (sessionUser) redirect(homePathForRole(sessionUser.role));

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Left: college identity on the primary colour */}
      <section className="relative flex flex-col justify-between gap-10 overflow-hidden bg-primary px-6 py-10 text-white sm:px-10 lg:px-14 lg:py-14">
        {/* Soft decorative rings, same hue, so the panel isn't a flat block */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full border-[40px] border-white/5"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-48 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary-dark/40"
        />

        {/* Crest as-is, college name beside it on exactly two lines */}
        <header className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
          {/*
            Served as-is: the file is a WebP with a transparent background
            (despite its .png name); the optimizer would flatten that alpha for
            non-WebP clients. No filter or backing — the original artwork.
          */}
          <Image
            src={collegeLogo}
            alt="Government College of Engineering, Erode emblem"
            priority
            unoptimized
            className="h-28 w-28 shrink-0 object-contain drop-shadow-md lg:h-32 lg:w-32"
          />

          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-white/75 uppercase">
              Tamil Nadu
            </p>
            {/*
              Line lengths are fixed and sizes picked so each line fits the
              text column at every breakpoint: ~280px on phones, ~300px at lg
              (half a 1024px screen minus padding and the crest), ~430px at xl.
            */}
            <h1 className="mt-1 text-[1.35rem] leading-tight font-black sm:text-2xl xl:text-3xl 2xl:text-4xl">
              <span className="block whitespace-nowrap">Government College of</span>
              <span className="block whitespace-nowrap text-white/90">
                Engineering, Erode
              </span>
            </h1>
          </div>
        </header>

        <div className="relative flex flex-col gap-6">
          <div>
            <p className="text-lg font-semibold lg:text-xl">Resource Booking Portal</p>
            <p className="mt-1 max-w-md text-white/85">
              Book the Auditorium, Seminar Hall and Guest House in one place, and
              track every request through to approval.
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {FACILITIES.map((facility) => (
              <li
                key={facility.name}
                className="flex items-center gap-4 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary">
                  <NavIcon name={facility.icon} className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{facility.name}</span>
                  <span className="block text-sm text-white/75">
                    {facility.detail}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/70">Knowledge is Power</p>
      </section>

      {/* Right: the form */}
      <section className="flex flex-col items-center justify-center gap-6 bg-gray-50 px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-gray-800">Welcome back</h2>
          <p className="mt-1 text-gray-500">
            Sign in with your department or admin account.
          </p>
        </div>

        <SignInForm devAccounts={await devAccounts()} />

        <p className="max-w-sm text-center text-sm text-gray-500">
          Accounts are created by the department office. There is no self-signup.
        </p>
      </section>
    </main>
  );
}
