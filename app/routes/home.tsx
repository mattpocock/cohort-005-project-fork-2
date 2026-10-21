import type { Route } from "./+types/home";
import { DevUI } from "~/components/dev-ui";
import { FeaturedCourses } from "~/components/landing-featured-courses";
import { LandingFooter } from "~/components/landing-footer";
import { LandingHeader } from "~/components/landing-header";
import { LandingHero } from "~/components/landing-hero";
import { HowItWorks } from "~/components/landing-how-it-works";
import { getCurrentUserId, getDevCountry } from "~/lib/session";
import { getCountryTierInfo, COUNTRIES } from "~/lib/ppp";
import { landing } from "~/modules/landing/index.server";
import { eq } from "drizzle-orm";
import { db } from "~/db";
import { users } from "~/db/schema";

function getAllUsers() {
  return db.select().from(users).all();
}

function getUserById(id: number) {
  return db.select().from(users).where(eq(users.id, id)).get();
}

export function meta() {
  return [
    { title: "Cadence — Learn at your own pace" },
    {
      name: "description",
      content:
        "A modern course platform for developers. Browse courses, track your progress, and learn at your own pace.",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { featuredCourses, stats } = landing.get();
  const users = getAllUsers();
  const currentUserId = await getCurrentUserId(request);
  const currentUser = currentUserId ? getUserById(currentUserId) : null;
  const devCountry = await getDevCountry(request);
  const countryTierInfo = getCountryTierInfo(devCountry);

  return {
    featuredCourses,
    stats,
    users: users.map((u) => ({ id: u.id, name: u.name, role: u.role })),
    currentUser: currentUser
      ? { id: currentUser.id, name: currentUser.name, role: currentUser.role }
      : null,
    devCountry,
    countryTierInfo,
    countries: COUNTRIES,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const {
    featuredCourses,
    stats,
    users,
    currentUser,
    devCountry,
    countryTierInfo,
    countries,
  } = loaderData;
  const signedIn = currentUser != null;

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader signedIn={signedIn} />
      <LandingHero stats={stats} signedIn={signedIn} />
      <HowItWorks />
      {featuredCourses.length > 0 && (
        <FeaturedCourses featuredCourses={featuredCourses} />
      )}
      <LandingFooter signedIn={signedIn} />

      <DevUI
        users={users}
        currentUser={currentUser}
        devCountry={devCountry}
        countryTierInfo={countryTierInfo}
        countries={countries}
      />
    </div>
  );
}
