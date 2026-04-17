"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, Lightbulb, Globe, Search, Languages, MessageCircle } from "lucide-react";

type Place = {
  category: string;
};

function categoryColor(category: string): string {
  const raw = (category || "").toString().toLowerCase().trim();
  const c = raw.replace(/[\s\-]+/g, "_").replace(/_+/g, "_");

  if (c.includes("library")) return "#2CA3E0";
  if (c.includes("food_access") || c === "food" || c.startsWith("food_") || c.endsWith("_food"))
    return "#2563EB";
  if (c.includes("government") || c.includes("city") || c.includes("state")) return "#99c24d";
  if (c.includes("education") || c.includes("adult")) return "#E11D48";
  if (c.includes("health")) return "#fb8500";
  if (c.includes("community_center")) return "#ffd60a";
  if (
    c.includes("religious") ||
    c.includes("faith") ||
    c.includes("church") ||
    c.includes("mosque") ||
    c.includes("temple") ||
    c.includes("synagogue")
  )
    return "#7C3AED";
  if (c.includes("community") || c.includes("nonprofit") || c.includes("organization")) return "#0F766E";

  return "#111827";
}

export default function AboutPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSnapshot() {
      try {
        setSnapshotLoading(true);
        setSnapshotError(null);
        const res = await fetch("/data/places_public.json");
        if (!res.ok) throw new Error(`Failed to load dataset: ${res.status}`);
        const data = (await res.json()) as Place[];
        setPlaces(Array.isArray(data) ? data : []);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Could not load current dataset.";
        setSnapshotError(message);
      } finally {
        setSnapshotLoading(false);
      }
    }

    void loadSnapshot();
  }, []);

  const countsByCategory = useMemo<Array<[string, number]>>(() => {
    const counts = new Map<string, number>();
    for (const place of places) {
      const key = (place.category || "Uncategorized").toString().trim() || "Uncategorized";
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [places]);

  const maxCount = useMemo(() => {
    return countsByCategory.length > 0 ? Math.max(...countsByCategory.map(([, count]) => count)) : 0;
  }, [countsByCategory]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div className="relative w-full overflow-hidden rounded-xl">
        <div className="relative w-full h-44 sm:h-56 md:h-64">
          <Image
            src="/about-picture.png"
            alt="Arrival Resources header"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-white/55" />
        </div>
      </div>

      <div className="space-y-4 text-center pb-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          About This Project
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            About This Project
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground leading-relaxed">
            &quot;Making Space for Arrival&quot; is an ongoing PhD research project exploring the relationship between migrant newcomers and urban space.
          </p>
          <p className="text-foreground leading-relaxed">
            At the center of this work is the idea of <strong>arrival infrastructure</strong>: the places, services, and networks that shape newcomers&apos; first months and years in a new city. Some of these are highly visible resources such as free English learning programs, food support, public libraries, and organizations that help people navigate benefits and social services. Others are ordinary, everyday spaces that become meaningful through repeated use.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            What This Website Does?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">
            This website is an attempt to document, visualize, and share parts of that arrival infrastructure in a way that can be practically useful. While newly arrived immigrants are a key audience, the map is not only for one group. People who have been here for years may still need to find resources, and community members and service providers may also use it to understand what exists and what&apos;s missing.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            What&apos;s Included (and What&apos;s Not)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">Current Data Snapshot</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                This chart reflects the current category mix in the live dataset used by the website.
              </p>
            </div>

            {snapshotLoading ? (
              <div className="text-sm text-muted-foreground">Loading current dataset snapshot…</div>
            ) : snapshotError ? (
              <div className="text-sm text-red-700">{snapshotError}</div>
            ) : (
              <div className="space-y-3">
                {countsByCategory.map(([category, count]) => {
                  const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div key={category} className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-4 text-sm">
                        <span className="text-foreground/85">{category}</span>
                        <span className="shrink-0 font-medium text-foreground/75">{count}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${width}%`,
                            background: categoryColor(category),
                            opacity: 0.8,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-foreground leading-relaxed">
            This map is non-exhaustive and based primarily on sources that are publicly available, and therefore easier to map at a scale. These are often organizations and civic spaces with an explicit role in supporting newcomers, either by providing resources directly or helping people navigate them (for example: ESOL classes, employment support, citizenship services, and immigration legal help). In many cases, these places also have staff who are trained to work with newly arrived immigrants, and their services are intentionally designed around access, signposting, and support.
          </p>
          <p className="text-foreground leading-relaxed">
            At the same time, many important arrival spaces are harder to capture through public data alone. Some religious institutions, for example, often play a crucial role in welcoming and serving immigrants. Some everyday commercial spaces such as barbershops, cafes, laundromats, and public spaces like parks can also be central to daily life, informal information-sharing, and community formation. Mapping these spaces typically requires local, contextual knowledge, and is often only feasible at a much finer, neighborhood scale. It also raises questions about privacy, safety, and what should or should not be made publicly visible in a public-facing map.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Next Steps
          </CardTitle>
          <CardDescription>
            This platform is evolving. Possible next steps include:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-foreground">
            <li className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span>
                <strong>Expanding the map</strong> by adding more places and improving coverage over time, especially through deeper local knowledge and careful curation.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Users className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span>
                <strong>Improving usability and design</strong> so people can find what they need faster and with less friction.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <MessageCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span>
                <strong>Adding natural-language support</strong>, such as a chatbot that can answer questions and offer more tailored recommendations.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Languages className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span>
                <strong>Exploring multilingual access</strong> so people can search and navigate in languages beyond English.
              </span>
            </li>
          </ul>
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-foreground leading-relaxed italic">
              Ultimately, the goal is not just to list services, but to make arrival infrastructure more visible and usable and to support a broader conversation about how cities can better make space for arrival.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
