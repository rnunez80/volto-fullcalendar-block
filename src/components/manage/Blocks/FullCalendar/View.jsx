import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Dimmer, Loader } from 'semantic-ui-react';
import config from '@plone/volto/registry';
import './fullcalendar.less';
import messages from './messages';

// Lazy load FullCalendar and its plugins
const FullCalendar = lazy(() => import('@fullcalendar/react'));
const dayGridPlugin = lazy(() => import('@fullcalendar/daygrid'));
const listPlugin = lazy(() => import('@fullcalendar/list'));
const timeGridPlugin = lazy(() => import('@fullcalendar/timegrid'));
const iCalendarPlugin = lazy(() => import('@fullcalendar/icalendar'));
const allLocales = lazy(() => import('@fullcalendar/core/locales-all'));

/* https://stackoverflow.com/a/43467144 */
function isValidURL(string) {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
}

const FullCalendarBlockView = (props) => {
  const intl = useIntl();

  const [isClientSide, setIsClientSide] = useState(false);

  useEffect(() => {
    setIsClientSide(true);
  }, []);

  const { data } = props;
  const remoteEvents =
    data.calendar_url && isValidURL(data.calendar_url)
      ? {
          url: data.calendar_url,
          format: 'ics',
        }
      : {};

  const calendarRef = useRef(null);

  const [storedEvents, setStoredEvents] = useState([]);

  useEffect(() => {
    if (data.calendar_url && isValidURL(data.calendar_url)) {
      setStoredEvents(null);
    }
  }, [data.calendar_url]);

  let isFullCalendarLoading = false;

  const onLoading = (isLoading) => {
    if (isLoading === false) {
      isFullCalendarLoading = false;
      setTimeout(() => {
        if (!isFullCalendarLoading && calendarRef.current) {
          let events = calendarRef.current.getApi().getEvents();
          setStoredEvents(events);
        }
      });
    } else {
      isFullCalendarLoading = true;
    }
  };

  const fcOptions = {
    initialDate: data.initial_date || null,
    plugins: [dayGridPlugin, iCalendarPlugin, listPlugin, timeGridPlugin],
    buttonText: {
      dayGridMonth: intl.formatMessage(messages.labelDayGridMonth),
      timeGridWeek: intl.formatMessage(messages.labelDayGridWeek),
      timeGridDay: intl.formatMessage(messages.labelDayGridDay),
      listDay: intl.formatMessage(messages.labelListDay),
      listWeek: intl.formatMessage(messages.labelListWeek),
      listMonth: intl.formatMessage(messages.labelListMonth),
      today: intl.formatMessage(messages.labelToday),
    },
    headerToolbar: {
      left: data.toolbar_left?.join(','),
      center: data.toolbar_center?.join(','),
      right: data.toolbar_right?.join(','),
    },
    initialView: data.initial_view ?? 'dayGridMonth',
    titleFormat: {
      year: data.title_format_year,
      month: data.title_format_month,
      day: data.title_format_day,
    },
    locales: allLocales,
    locale: intl.locale ?? 'en',
    ...(config.settings.fullcalendar?.additionalOptions || {}),
  };

  return (
    isClientSide && (
      <div className="calendar-wrapper">
        <Suspense fallback={<Dimmer active inverted><Loader inverted size='massive' /></Dimmer>}>
          {storedEvents === null ? (
            <FullCalendar
              ref={calendarRef}
              events={remoteEvents}
              loading={onLoading}
              {...fcOptions}
            />
          ) : (
            <FullCalendar
              ref={calendarRef}
              events={storedEvents}
              {...fcOptions}
            />
          )}
        </Suspense>
      </div>
    )
  );
};

export default FullCalendarBlockView;
