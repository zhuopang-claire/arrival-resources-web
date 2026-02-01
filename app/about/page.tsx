"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, MapPin, Users, Lightbulb, Globe, Search, Languages, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";

export default function AboutPage() {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Hero Section */}
      <div className="space-y-4 text-center pb-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          About This Project
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          "Making Space for Arrival" is an ongoing PhD research project exploring the relationship between migrant newcomers and urban space.
        </p>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            About This Project
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground leading-relaxed">
            "Making Space for Arrival" is an ongoing PhD research project exploring the relationship between migrant newcomers and urban space.
          </p>
          <p className="text-foreground leading-relaxed">
            At the center of this work is the idea of <strong>arrival infrastructure</strong>: the places, services, and networks that shape newcomers' first months and years in a new city. Some of these are highly visible resources—such as free English learning programs, food support, public libraries, and organizations that help people navigate benefits and social services. Others are ordinary, everyday spaces that become meaningful through repeated use.
          </p>
        </CardContent>
      </Card>

      {/* What this website does */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            What This Website Does?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">
            This website is an attempt to document, visualize, and share parts of that arrival infrastructure in a way that can be practically useful. While newly arrived immigrants are a key audience, the map is not only for one group. People who have been here for years may still need to find resources, and community members and service providers may also use it to understand what exists and what's missing.
          </p>
        </CardContent>
      </Card>

      {/* What's included and what's not */}
      <Card>
        <CardHeader>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-left"
          >
            <CardTitle className="flex items-center justify-between gap-2 cursor-pointer hover:text-primary transition-colors">
              <span className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                What’s Included (and What’s Not)
              </span>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </CardTitle>
          </button>
        </CardHeader>
        {isExpanded && (
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              This map is non-exhaustive and based primarily on sources that are publicly available, and therefore easier to map at a scale. These are often organizations and civic spaces with an explicit role in supporting newcomers, either by providing resources directly or helping people navigate them (for example: ESOL classes, employment support, citizenship services, and immigration legal help). In many cases, these places also have staff who are trained to work with newly arrived immigrants, and their services are intentionally designed around access, signposting, and support.
            </p>
            <p className="text-foreground leading-relaxed">
              At the same time, many important arrival spaces are harder to capture through public data alone. Religious institutions, for example, often play a crucial role in welcoming and serving immigrants. Everyday commercial spaces—barbershops, cafés, laundromats—and public spaces like parks can also be central to daily life, informal information-sharing, and community formation. Mapping these spaces typically requires local, contextual knowledge, and is often only feasible at a much finer, neighborhood scale. It also raises questions about privacy, safety, and what should (or should not) be made publicly visible in a public-facing map.
            </p>
          </CardContent>
        )}
      </Card>

      {/* Next Steps */}
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
              Ultimately, the goal is not just to list services, but to make arrival infrastructure more visible and usable—and to support a broader conversation about how cities can better make space for arrival.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
