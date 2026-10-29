import { EventDetails } from "~/components/event-details";

export const metadata = { title: "Event Details — Tsukuyomi Watch" };

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventDetails id={id} />;
}
