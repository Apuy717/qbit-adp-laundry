"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { GetWithToken, PostWithToken } from "@/libs/FetchData";
import { RootState } from "@/stores/store";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { FiClock, FiCopy } from "react-icons/fi";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

type ScheduleApiItem = {
  id: string;
  status: "open" | "closed";
  day: number;
  opened_time: string;
  closed_time: string;
  created_at: string;
  updated_at: string;
};

type ScheduleGetResponse = {
  statusCode: number;
  msg: string;
  data: ScheduleApiItem[];
  err?: string | string[];
};

type DayForm = {
  day: number;
  enabled: boolean;
  opened_time: string;
  closed_time: string;
};

type SchedulePostPayload = {
  day: number;
  opened_time: string;
  closed_time: string;
};

const dayLabels: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

const getDefaultDays = (): DayForm[] =>
  [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    day,
    enabled: false,
    opened_time: "07:00",
    closed_time: "21:00",
  }));

function toHHmm(time: string): string {
  if (!time) return "07:00";
  return time.slice(0, 5);
}

export default function OutletScheduleSettingPage() {
  const params = useParams();
  const router = useRouter();
  const auth = useSelector((s: RootState) => s.auth);

  const outletId = useMemo(() => String(params.outletid || ""), [params.outletid]);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [days, setDays] = useState<DayForm[]>(getDefaultDays());

  useEffect(() => {
    const getSchedule = async () => {
      if (!auth.auth.access_token || !outletId) {
        setDays(getDefaultDays());
        setLoading(false);
        return;
      }

      setLoading(true);
      const res = await GetWithToken<ScheduleGetResponse>({
        router,
        url: `/api/schedule/outlet/${outletId}`,
        token: `${auth.auth.access_token}`,
      });

      if (res?.statusCode === 200 && Array.isArray(res.data) && res.data.length > 0) {
        const byDay = new Map<number, ScheduleApiItem>();
        res.data.forEach((item) => byDay.set(item.day, item));

        const defaultDays = getDefaultDays();

        const mapped = defaultDays.map((d) => {
          const item = byDay.get(d.day);
          if (!item) return { ...d };
          return {
            day: d.day,
            enabled: true,
            opened_time: toHHmm(item.opened_time),
            closed_time: toHHmm(item.closed_time),
          };
        });

        setDays(mapped);
      } else {
        setDays(getDefaultDays());
      }

      setLoading(false);
    };

    getSchedule();
  }, [auth.auth.access_token, outletId, router]);

  const updateDay = (day: number, key: keyof DayForm, value: string | boolean) => {
    setDays((prev) => prev.map((item) => (item.day === day ? { ...item, [key]: value } : item)));
  };

  const copyFirstDayToAll = () => {
    const monday = days.find((d) => d.day === 1) || days[0];
    setDays((prev) =>
      prev.map((item) => ({
        ...item,
        enabled: monday.enabled,
        opened_time: monday.opened_time,
        closed_time: monday.closed_time,
      })),
    );
  };

  const handleSave = async () => {
    if (!auth.auth.access_token || !outletId) return;

    for (const d of days) {
      if (d.enabled && d.opened_time >= d.closed_time) {
        toast.warning(`${dayLabels[d.day]}: open time must be earlier than close time`);
        return;
      }
    }

    const payload: SchedulePostPayload[] = days
      .filter((d) => d.enabled)
      .map((d) => ({
        day: d.day,
        opened_time: d.opened_time,
        closed_time: d.closed_time,
      }));

    setSaving(true);
    console.log(payload);
    
    const res = await PostWithToken<ScheduleGetResponse>({
      router,
      url: `/api/schedule/outlet/${outletId}`,
      token: `${auth.auth.access_token}`,
      data: payload,
    });

    if (res?.statusCode === 200) {
      toast.success("Outlet schedule updated successfully");
      router.push(`/outlet/detail/${outletId}`);
    } else {
      toast.error("Failed to update schedule");
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-242.5">
      <Breadcrumb pageName="Set Outlet Schedule" />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-stroke bg-white px-5 py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div>
          <h2 className="text-lg font-semibold text-black dark:text-white">Business Hours</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Set open and close times for the outlet.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(`/outlet/detail/${outletId}`)}
            className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
          >
            <FaArrowLeft size={13} />
            Back
          </button>
          <button
            type="button"
            onClick={copyFirstDayToAll}
            className="inline-flex items-center gap-2 rounded-md border border-stroke px-4 py-2 text-sm font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
          >
            <FiCopy size={13} />
            Copy Monday to All
          </button>
        </div>
      </div>

      <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Loading schedule...</p>
        ) : (
          <div className="space-y-3">
            {days.map((d) => (
              <div
                key={d.day}
                className="rounded-xl border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4"
              >
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[160px_120px_1fr_1fr] lg:items-center">
                  <p className="text-sm font-semibold text-black dark:text-white">{dayLabels[d.day]}</p>

                  <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={d.enabled}
                      onChange={(e) => updateDay(d.day, "enabled", e.target.checked)}
                    />
                    Open
                  </label>

                  <div className="rounded-md border border-stroke bg-white px-3 py-2 dark:border-strokedark dark:bg-boxdark">
                    <p className="mb-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <FiClock size={12} />
                      Open Time
                    </p>
                    <input
                      type="time"
                      value={d.opened_time}
                      disabled={!d.enabled}
                      onChange={(e) => updateDay(d.day, "opened_time", e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-black outline-none dark:text-white disabled:opacity-50"
                    />
                  </div>

                  <div className="rounded-md border border-stroke bg-white px-3 py-2 dark:border-strokedark dark:bg-boxdark">
                    <p className="mb-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <FiClock size={12} />
                      Close Time
                    </p>
                    <input
                      type="time"
                      value={d.closed_time}
                      disabled={!d.enabled}
                      onChange={(e) => updateDay(d.day, "closed_time", e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-black outline-none dark:text-white disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-4 flex justify-end gap-3 border-t border-stroke pt-4 dark:border-strokedark">
              <button
                type="button"
                onClick={() => router.push(`/outlet/detail/${outletId}`)}
                className="rounded-md border border-stroke px-5 py-2 text-sm font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Schedule"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
