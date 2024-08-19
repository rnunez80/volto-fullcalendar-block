import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { flattenToAppURL } from '@plone/volto/helpers';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';
import config from '@plone/volto/registry';
import { RRule, rrulestr } from 'rrule';
import messages from '../FullCalendar/messages';

// Lazy load FullCalendar and its plugins
const FullCalendar = lazy(() => import('@fullcalendar/react'));
const dayGridPlugin = lazy(() => import('@fullcalendar/daygrid'));
const listPlugin = lazy(() => import('@fullcalendar/list'));
const timeGridPlugin = lazy(() => import('@fullcalendar/timegrid'));
const allLocales = lazy(() => import('@fullcalendar/core/locales-all'));

/* returns all events, computed by the recurrence rule of an Event item */
const expand = (item) => {
  let recurrence = item.recurrence;
  if (item.recurrence.indexOf('DTSTART') < 0) {
    var dtstart = RRule.optionsToString({
      dtstart: new Date(item.start),
    });
    recurrence = dtstart + '\n' + recurrence;
  }

  const rrule = rrulestr(recurrence, { unfold: true, forceset: true });

  return rrule.all().map((date) => {
    /* rrule.all() only gives us dates, so we add time part of
       our original event: item.start (`2022-03-01T09:00:00+00:00`) */
    let dateStr = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    let startStr = dateStr + item.start.slice(10);
    let endStr = dateStr + item.end.slice(10);
    /* and return full object for FullCalendar */
    return {
      title: item.title,
      start: startStr,
      end: endStr,
      url: flattenToAppURL(item['@id']),
      groupId: item['@id'],
    };
  });
};

const FullCalendarListing = ({ items, moment: momentlib, ...props }) => {
  const intl = useIntl();
  const moment = momentlib.default;
  moment.locale(intl.locale);

  const [isClientSide, setIsClientSide] = useState(false);

  useEffect(() => {
    setIsClientSide(true);
  }, []);

  let recurrences = [];

  let events = items
    .filter((i) => {
      if (!i.start) return false;
      if (i.recurrence) {
        recurrences = recurrences.concat(expand(i));
        return false;
      }
      return true;
    })
    .map((i) => {
      return {
        ...i,
        title: i.title,
        start: i.start,
        end: i.end || false,
        url: flattenToAppURL(i['@id']),
      };
    });

  events = events.concat(recurrences);

  events = events.map((event) => {
    let start = new Date(event.start);
    let end = new Date(event.end);
    if (
      start.getHours() === 0 &&
      start.getMinutes() === 0 &&
      end.getHours() === 23 &&
      end.getMinutes() === 59
    ) {
      event.allDay = true;
    }
    if (
      end.getHours() === 23 &&
      end.getMinutes() === 59
    ) {
      delete event.end;
    }
    return event;
  });

  const fcOptions = {
    initialDate: props.initial_date || null,
    plugins: [dayGridPlugin, listPlugin, timeGridPlugin],
    buttonText: {
      dayGridMonth: intl.formatMessage(messages.labelDayGridMonth),
      timeGridWeek: intl.formatMessage(messages.labelTimeGridWeek),
      timeGridDay: intl.formatMessage(messages.labelTimeGridDay),
      listDay: intl.formatMessage(messages.labelListDay),
      listWeek: intl.formatMessage(messages.labelListWeek),
      listMonth: intl.formatMessage(messages.labelListMonth),
      today: intl.formatMessage(messages.labelToday),
    },
    headerToolbar: {
      left: props.toolbar_left?.join(','),
      center: props.toolbar_center?.join(','),
      right: props.toolbar_right?.join(','),
    },
    initialView: props.initial_view ?? 'dayGridMonth',
    titleFormat: {
      year: props.title_format_year,
      month: props.title_format_month,
      day: props.title_format_day,
    },
    locales: allLocales,
    locale: intl.locale ?? 'en',
    ...(config.settings.fullcalendar?.additionalOptions || {}),
  };

  return (
    isClientSide && (
      <Suspense fallback={<div>Loading...</div>}>
        <FullCalendar events={events} {...fcOptions} />
      </Suspense>
    )
  );
};

export default injectLazyLibs(['moment'])(FullCalendarListing);
