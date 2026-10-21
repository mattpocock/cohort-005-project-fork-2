import { Link } from "react-router";
import { ArrowRight, BookOpen, User } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "~/components/ui/card";
import { CourseImage } from "~/components/course-image";
import type { FeaturedCourse } from "~/modules/landing/index.server";

/** The landing page's grid of featured course cards. */
export function FeaturedCourses({
  featuredCourses,
}: {
  featuredCourses: FeaturedCourse[];
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Featured Courses
          </h2>
          <p className="mt-2 text-muted-foreground">
            Start learning with our most popular courses
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/courses">
            View all
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featuredCourses.map((course) => (
          <FeaturedCourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}

function FeaturedCourseCard({ course }: { course: FeaturedCourse }) {
  return (
    <Link to={`/courses/${course.slug}`} className="group">
      <Card className="h-full overflow-hidden pt-0 transition-shadow group-hover:shadow-md">
        <CourseImage
          src={course.coverImageUrl}
          alt={course.title}
          className="aspect-video w-full object-cover"
        />
        <CardHeader>
          <h3 className="font-semibold leading-snug group-hover:text-primary">
            {course.title}
          </h3>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {course.description}
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="size-3" />
            {course.instructorName}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="size-3" />
            {course.lessonCount} lessons
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
