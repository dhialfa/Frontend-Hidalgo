// src/pages/Calendar.tsx
import React, { useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { DateSelectArg, EventClickArg, EventInput } from "@fullcalendar/core";
import PageMeta from "../../components/common/PageMeta";
import {
  getVisits,
  createVisit,
  updateVisit,
  deleteVisit,
  type Visit,
  type VisitStatus,
} from "../../api/visit/visits.api";
import {
  getPlanSubscription,
  type PlanSubscription,
} from "../../api/plan and subscriptions/plan-subscriptions.api";
import VisitModal, {
  type VisitModalInitial,
  type VisitBackendDTO,
} from "../../components/modal/VisitModal";

function toDateOnly(isoLike: string): string {
  return (isoLike || "").slice(0, 10);
}
function unwrapList<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}
function uniqNumbers(arr: Array<number | null | undefined>): number[] {
  return Array.from(new Set(arr.filter((x): x is number => typeof x === "number")));
}

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    visitId?: number;
    status?: VisitStatus;
    subscription?: number | null;
    user?: number | null;
    notes?: string;
    site_address?: string;
    cancel_reason?: string;
    customerName?: string;
    startISO?: string | null;
    endISO?: string | null;
  };
}

const statusColor: Record<VisitStatus | "restored", string> = {
  scheduled: "Primary",
  in_progress: "Warning",
  completed: "Success",
  canceled: "Danger",
  restored: "Primary",
};

export default function CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitial, setModalInitial] = useState<VisitModalInitial>({
    id: null,
    subscriptionId: null,
    userId: null,
    startISO: null,
    endISO: null,
    status: "scheduled",
    site_address: "",
    notes: "",
    cancel_reason: "",
    customerName: "",
  });

  const [subCache, setSubCache] = useState<Record<number, PlanSubscription>>({});

  const fetchEvents = async (
    fetchInfo: { startStr: string; endStr: string },
    successCallback: (events: CalendarEvent[]) => void,
    failureCallback: (error: any) => void
  ) => {
    try {
      const from = toDateOnly(fetchInfo.startStr);
      const to = toDateOnly(fetchInfo.endStr);

      const { data } = await getVisits({ start__gte: from, start__lte: to });
      const visits = unwrapList<Visit>(data);

      const subIds = uniqNumbers(visits.map(v => v.subscription ?? undefined));
      const missing = subIds.filter(id => !(id in subCache));
      if (missing.length) {
        const res = await Promise.allSettled(missing.map(id => getPlanSubscription(id)));
        const fetched: Record<number, PlanSubscription> = {};
        res.forEach((r, i) => {
          if (r.status === "fulfilled") fetched[missing[i]] = r.value.data;
        });
        if (Object.keys(fetched).length) setSubCache(prev => ({ ...prev, ...fetched }));
      }
      const merged = { ...subCache };

      const events: CalendarEvent[] = visits.map(v => {
        const subId = v.subscription ?? null;
        const cName = subId && merged[subId]?.customer_info?.name
          ? merged[subId]!.customer_info!.name
          : undefined;

        return {
          id: String(v.id),
          title: cName ?? "Sin cliente",
          start: toDateOnly(v.start ?? new Date().toISOString()),
          allDay: true,
          extendedProps: {
            calendar: statusColor[v.status] ?? "Primary",
            visitId: v.id,
            status: v.status,
            subscription: subId,
            user: v.user ?? null,
            notes: v.notes ?? "",
            site_address: v.site_address ?? "",
            cancel_reason: v.cancel_reason ?? "",
            customerName: cName,
            startISO: v.start ?? null,
            endISO: v.end ?? null,
          },
        };
      });

      successCallback(events);
    } catch (err) {
      console.error(err);
      failureCallback(err);
    }
  };

  const handleDateSelect = (sel: DateSelectArg) => {
    setModalInitial({
      id: null,
      subscriptionId: null,
      userId: null,
      startISO: `${toDateOnly(sel.startStr)}T08:00:00.000Z`,
      endISO: null,
      status: "scheduled",
      site_address: "",
      notes: "",
      cancel_reason: "",
      customerName: "",
    });
    setIsModalOpen(true);
  };

  const handleEventClick = (click: EventClickArg) => {
    const ev = click.event;
    const ex = ev.extendedProps as CalendarEvent["extendedProps"];
    setModalInitial({
      id: Number(ev.id),
      subscriptionId: ex.subscription ?? null,
      userId: ex.user ?? null,
      startISO: ex.startISO ?? null,
      endISO: ex.endISO ?? null,
      status: (ex.status as VisitStatus) ?? "scheduled",
      site_address: ex.site_address ?? "",
      notes: ex.notes ?? "",
      cancel_reason: ex.cancel_reason ?? "",
      customerName: ex.customerName ?? "",
    });
    setIsModalOpen(true);
  };

  async function onSaveFromModal(dto: VisitBackendDTO, opts?: { id?: number | null }) {
    if (opts?.id) await updateVisit(opts.id, dto as any);
    else await createVisit(dto as any);
    setIsModalOpen(false);
    calendarRef.current?.getApi().refetchEvents();
  }
  async function onDeleteFromModal(id: number) {
    await deleteVisit(id);
    setIsModalOpen(false);
    calendarRef.current?.getApi().refetchEvents();
  }

  return (
    <>
      <PageMeta title="Calendario de Visitas" description="Agenda y seguimiento de visitas" />
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="custom-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next addEventButton",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            locales={[esLocale]}
            locale="es"
            firstDay={1}
            weekNumbers={false}
            eventTimeFormat={{ hour: "2-digit", minute: "2-digit", meridiem: false }}
            dayHeaderFormat={{ weekday: "short" }}
            buttonText={{ today: "Hoy", month: "Mes", week: "Semana", day: "Día", list: "Lista" }}
            events={fetchEvents}
            selectable
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            customButtons={{
              addEventButton: {
                text: "Añadir visita +",
                click: () => {
                  const today = toDateOnly(new Date().toISOString());
                  setModalInitial({
                    id: null,
                    subscriptionId: null,
                    userId: null,
                    startISO: `${today}T08:00:00.000Z`,
                    endISO: null,
                    status: "scheduled",
                    site_address: "",
                    notes: "",
                    cancel_reason: "",
                    customerName: "",
                  });
                  setIsModalOpen(true);
                },
              },
            }}
          />
        </div>
      </div>

      <VisitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initial={modalInitial}
        onSave={onSaveFromModal}
        onDelete={modalInitial.id ? onDeleteFromModal : undefined}
        subCache={subCache}
        setSubCache={setSubCache}
      />
    </>
  );
}

const renderEventContent = (eventInfo: any) => {
  const colorClass = `fc-bg-${String(eventInfo.event.extendedProps.calendar || "Primary").toLowerCase()}`;
  return (
    <div className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded`}>
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-time">{eventInfo.timeText}</div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
};
