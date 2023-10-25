import React, { useEffect, useState } from "react";
import type { Dayjs } from "dayjs";
import type { CalendarProps } from "antd";
import {
  Badge,
  Button,
  Calendar,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Timeline,
} from "antd";

import "./index.css";
import dayjs from "dayjs";

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
const ORGANIZATION_ID_TO_NAMES: Record<string, string> = {
  helloworld: "Helloworld",
  bookinfo: "Bookinfo",
  paperinfo: "Paperinfo",
  loremipsum: "Loremipsum",
  pingpong: "Pingpong",
  alicebob: "Alice and Bob Inc.",
};
const ORGANIZATION_IDS = Object.keys(ORGANIZATION_ID_TO_NAMES);
const ORGANIZATION_LABEL_VALUES = ORGANIZATION_IDS.map((id) => ({
  label: ORGANIZATION_ID_TO_NAMES[id],
  value: id,
}));
const FILTER_ORGANIZATION_LABEL_VALUES = [
  { label: "All organizations", value: "" },
  ...ORGANIZATION_LABEL_VALUES,
];

interface OrganizationEvent {
  id: string;
  orgId: string;
  eventName: string;
  eventTime: Dayjs;
}

interface CalendarState {
  dateToEventsRecord: Record<string, Array<OrganizationEvent>>;
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
  const [form] = Form.useForm();

  const [current, setCurrent] = useState(dayjs());
  const [modalMode, setModalMode] = useState<null | "create" | "update">(null);
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [singleViewMode, setSingleViewMode] = useState<"calendar" | "timeline">(
    "calendar"
  );

  useEffect(() => {
    form.setFieldsValue({
      id: "-1",
      eventTime: dayjs(),
    });
  }, [form]);

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData({
      dateToEventsRecord: calendarState.dateToEventsRecord,
      companyIdToColors: calendarState.companyIdToColorRecord,
      value,
      selectedOrganization,
    });
    return (
      <ul className="events">
        {listData.map((item) => (
          <li key={`${item.event.orgId}-${item.event.eventName}`}>
            <Button
              type="text"
              className="w-full whitespace-normal text-left h-auto py-0 px-1"
              onClick={() => {
                setModalMode("update");
                form.setFieldsValue(item.event);
              }}
            >
              <Badge
                color={item.color}
                text={`[${ORGANIZATION_ID_TO_NAMES[item.event.orgId]}] ${
                  item.event.eventName
                }`}
              />
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

  function onFormSubmit(values: OrganizationEvent) {
    setCalendarState((prev) => {
      const formattedDate = dayjs(values.eventTime).format("YYYY-MM-DD");
      const newDateEventsRecord = { ...prev.dateToEventsRecord };

      let newDateEvents = newDateEventsRecord[formattedDate];
      if (!newDateEvents) {
        newDateEvents = [];
      } else {
        newDateEvents = [...newDateEvents];
      }

      const matchingIdx = newDateEvents.findIndex(
        (event) => event.id === values.id
      );
      if (matchingIdx > -1) {
        newDateEvents[matchingIdx] = values;
      } else {
        newDateEvents.push(values);
      }

      newDateEventsRecord[formattedDate] = newDateEvents;

      return {
        ...prev,
        dateToEventsRecord: newDateEventsRecord,
      };
    });
    setModalMode(null);

    form.resetFields();
    form.setFieldsValue({
      id: "-1",
      eventTime: dayjs(),
    });
  }

  return (
    <main>
      <div className="p-4">
        <div className="flex justify-between mb-4">
          <Form className="flex gap-x-2">
            <Form.Item>
              <DatePicker
                picker="month"
                format="MMMM YYYY"
                value={current}
                onChange={(value) => {
                  if (!value) return;
                  setCurrent(value);
                }}
              />
            </Form.Item>

            <Form.Item>
              <Select
                value={selectedOrganization}
                options={FILTER_ORGANIZATION_LABEL_VALUES}
                onChange={(value) => setSelectedOrganization(value)}
              />
            </Form.Item>

            {selectedOrganization !== "" && (
              <Form.Item>
                <Select
                  value={singleViewMode}
                  options={[
                    { label: "Calendar", value: "calendar" },
                    { label: "Timeline", value: "timeline" },
                  ]}
                  onChange={(value) =>
                    setSingleViewMode(value as "timeline" | "calendar")
                  }
                />
              </Form.Item>
            )}
          </Form>

          <div>
            <Button type="primary" onClick={() => setModalMode("create")}>
              Create new event
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {selectedOrganization === "" || singleViewMode === "calendar" ? (
          <Calendar
            cellRender={cellRender}
            onChange={(value) => setCurrent(value)}
            value={current}
            headerRender={() => null}
          />
        ) : (
          <TimelineComponent
            calendarState={calendarState}
            selectedOrganization={selectedOrganization}
          />
        )}
      </div>

      <Modal
        open={modalMode !== null}
        centered
        title={modalMode === "create" ? "Create event" : "Update event"}
        okButtonProps={{ htmlType: "submit", form: "create-new-event" }}
        okText={modalMode === "create" ? "Create event" : "Update event"}
        onCancel={() => setModalMode(null)}
      >
        <Form onFinish={onFormSubmit} name="create-new-event" form={form}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          <Form.Item name="orgId" label="Organization">
            <Select options={ORGANIZATION_LABEL_VALUES} />
          </Form.Item>

          <Form.Item name="eventName" label="Event name">
            <Input />
          </Form.Item>

          <Form.Item name="eventTime" label="Event time">
            <DatePicker />
          </Form.Item>
        </Form>
      </Modal>
    </main>
  );
};

export default App;

function TimelineComponent({
  calendarState,
  selectedOrganization,
}: {
  calendarState: CalendarState;
  selectedOrganization: string;
}) {
  const listData = getListData({
    dateToEventsRecord: calendarState.dateToEventsRecord,
    companyIdToColors: calendarState.companyIdToColorRecord,
    selectedOrganization,
  });
  const timelineByDate: Record<string, typeof listData> = {};

  for (const eventInfo of listData) {
    const formatted = eventInfo.event.eventTime.format("YYYY-MM-DD");
    if (!timelineByDate[formatted]) {
      timelineByDate[formatted] = [];
    }

    timelineByDate[formatted].push(eventInfo);
  }

  const currentDate = dayjs().format("YYYY-MM-DD");

  return (
    <Timeline>
      {Object.keys(timelineByDate).map((date) => {
        const item = timelineByDate[date];

        console.info(currentDate, dayjs(date).format("YYYY-MM-DD"));
        return (
          <Timeline.Item
            key={date}
            color={
              currentDate === dayjs(date).format("YYYY-MM-DD")
                ? "blue"
                : dayjs(date).isAfter(dayjs(currentDate))
                ? "gray"
                : "green"
            }
          >
            <div>{date}</div>

            <ul>
              {item.map((eventInfo) => (
                <li key={eventInfo.event.id}>
                  {eventInfo.event.eventTime.format("HH:mm")}{" "}
                  {eventInfo.event.eventName}
                </li>
              ))}
            </ul>
          </Timeline.Item>
        );
      })}
    </Timeline>
  );
}

// Helper functions.
function getListData({
  dateToEventsRecord,
  companyIdToColors,
  value,
  selectedOrganization,
}: {
  dateToEventsRecord: CalendarState["dateToEventsRecord"];
  companyIdToColors: CalendarState["companyIdToColorRecord"];
  value?: Dayjs;
  selectedOrganization: string;
}) {
  let events: OrganizationEvent[];

  if (value) {
    const formatted = value.format("YYYY-MM-DD");
    events = dateToEventsRecord[formatted];
  } else {
    events = Object.values(dateToEventsRecord).flat();
  }

  if (!events) return [];
  if (selectedOrganization)
    events = events.filter((event) => event.orgId === selectedOrganization);

  const result = events.map((event) => ({
    color: companyIdToColors[event.orgId],
    event,
  }));
  result.sort((a, b) =>
    a.event.eventTime
      .toISOString()
      .localeCompare(b.event.eventTime.toISOString())
  );

  return result;
}

function populateData(dateParam: Date) {
  const year = dateParam.getUTCFullYear();
  const month = dateParam.getUTCMonth() + 1;
  const date = dateParam.getUTCDate();

  const array = new Array(15).fill(1);
  const result: CalendarState["dateToEventsRecord"] = {};

  array.forEach((_, idx) => {
    const numberOfEvents = new Array(Math.round(Math.random() * 5 + 1)).fill(1);
    const key = `${year}-${month}-${date + idx * 2}`;

    result[key] = result[key] || [];

    numberOfEvents.forEach((_, eventIndex) => {
      const orgIdIndex = Math.floor(Math.random() * ORGANIZATION_IDS.length);
      const eventName1 =
        RANDOM_WORDS[Math.floor(Math.random() * RANDOM_WORDS.length)];
      const eventName2 =
        RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];

      result[key].push({
        id: `${key}-${eventIndex}`,
        eventName: `${eventName1}-${eventName2}`,
        eventTime: dayjs(
          new Date(key).valueOf() + Math.floor(Math.random() * 86400)
        ),
        orgId: ORGANIZATION_IDS[orgIdIndex],
      });
    });
  });

  return result;
}
