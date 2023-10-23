import React, { useState } from "react";
import type { Dayjs } from "dayjs";
import type { CalendarProps } from "antd";
import { Badge, Button, Calendar } from "antd";

import "./index.css";

const RANDOM_COLORS = [
  "blue",
  "purple",
  "cyan",
  "green",
  "magenta",
  "pink",
  "red",
  "orange",
  "yellow",
  "volcano",
  "geekblue",
  "lime",
  "gold",
] as const;
const RANDOM_WORDS = [
  "entertaining",
  "nauseating",
  "charming",
  "grubby",
  "icky",
  "weak",
  "marked",
  "scientific",
  "handy",
  "perpetual",
  "useful",
  "piquant",
  "synonymous",
] as const;
const ORGANIZATION_ID_TO_NAMES = {
  helloworld: "Helloworld",
  bookinfo: "Bookinfo",
  paperinfo: "Paperinfo",
  loremipsum: "Loremipsum",
  pingpong: "Pingpong",
  alicebob: "Alice and Bob Inc.",
} as const;
const ORGANIZATION_IDS = Object.keys(ORGANIZATION_ID_TO_NAMES);

interface CalendarState {
  dateToEventsRecord: Record<
    string,
    Array<{ orgId: string; eventName: string; eventTime: Date }>
  >;
  companyIdToColorRecord: Record<string, (typeof RANDOM_COLORS)[number]>;
}

const App: React.FC = () => {
  const [calendarState, setCalendarState] = useState<CalendarState>(() => {
    const date = new Date();
    date.setUTCDate(1);

    const populated = populateData(date);

    return {
      dateToEventsRecord: populated,
      companyIdToColorRecord: ORGANIZATION_IDS.reduce((record, id, idx) => {
        record[id] = RANDOM_COLORS[idx];
        return record;
      }, {} as CalendarState["companyIdToColorRecord"]),
    };
  });

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(
      calendarState.dateToEventsRecord,
      calendarState.companyIdToColorRecord,
      value
    );
    return (
      <ul className="events">
        {listData.map((item) => (
          <li key={item.content}>
            <Button
              type="text"
              className="w-full whitespace-normal text-left h-auto py-0 px-1"
            >
              <Badge color={item.color} text={item.content} />
            </Button>
          </li>
        ))}
      </ul>
    );
  };

  const cellRender: CalendarProps<Dayjs>["cellRender"] = (current, info) => {
    if (info.type === "date") return dateCellRender(current);
    return info.originNode;
  };

  return <Calendar cellRender={cellRender} />;
};

export default App;

// Helper functions.
function getListData(
  dateToEventsRecord: CalendarState["dateToEventsRecord"],
  companyIdToColors: CalendarState["companyIdToColorRecord"],
  value: Dayjs
) {
  const formatted = value.format("YYYY-MM-DD");
  const events = dateToEventsRecord[formatted];

  if (!events) return [];

  const result = events.map((event) => ({
    color: companyIdToColors[event.orgId],
    content: event.eventName,
    time: event.eventTime,
  }));
  result.sort((a, b) =>
    a.time.toISOString().localeCompare(b.time.toISOString())
  );

  return result;
}

function populateData(dateParam: Date) {
  const year = dateParam.getUTCFullYear();
  const month = dateParam.getUTCMonth() + 1;
  const date = dateParam.getUTCDate();

  const array = new Array(13).fill(1);
  const result: CalendarState["dateToEventsRecord"] = {};

  array.forEach((_, idx) => {
    const numberOfEvents = new Array(Math.round(Math.random() * 5 + 1)).fill(1);
    const key = `${year}-${month}-${date + idx * 2}`;

    result[key] = result[key] || [];

    numberOfEvents.forEach(() => {
      const orgIdIndex = Math.floor(Math.random() * ORGANIZATION_IDS.length);
      const eventName1 =
        RANDOM_WORDS[Math.floor(Math.random() * RANDOM_WORDS.length)];
      const eventName2 =
        RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];

      result[key].push({
        eventName: `${eventName1}-${eventName2}`,
        eventTime: new Date(
          new Date(key).valueOf() + Math.floor(Math.random() * 86400)
        ),
        orgId: ORGANIZATION_IDS[orgIdIndex],
      });
    });
  });

  return result;
}
