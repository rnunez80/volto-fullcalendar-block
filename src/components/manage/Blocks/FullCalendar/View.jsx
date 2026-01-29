import React, { useEffect, useRef, useState } from 'react';
import { UniversalLink } from '@plone/volto/components';
import { useIntl } from 'react-intl';
import FullCalendar from '@fullcalendar/react';
import { Dimmer, Loader } from 'semantic-ui-react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import iCalendarPlugin from '@fullcalendar/icalendar';
import allLocales from '@fullcalendar/core/locales-all';
import config from '@plone/volto/registry';
import './fullcalendar.less';
import messages from './messages';

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

  /* server-side rendering with FullCalendar does not work here,
     so we need to render after client-side hydration - as described here:
     https://gist.github.com/gaearon/e7d97cdf38a2907924ea12e4ebdf3c85#option-2-lazily-show-component-with-uselayouteffect
  */
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

  /* store events in component state after FullCalendar retrieved them initially,
     otherwise FullCalendar would reload them on every re-render of this component
     (btw we let FullCalendar do the loading since it handles CORS quite well)
  */
  const [storedEvents, setStoredEvents] = useState([]);

  useEffect(() => {
    if (data.calendar_url && isValidURL(data.calendar_url)) {
      setStoredEvents(null);
    }
  }, [data.calendar_url]);

  /* since FullCalendar fires the `loading` callback multiple times
     we need to introduce this flag to avoid prematurely switching to `storedEvents`:
  */
  var isFullCalendarLoading = false;

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
      timeGridWeek: intl.formatMessage(messages.labelTimeGridWeek),
      timeGridDay: intl.formatMessage(messages.labelTimeGridDay),
      listDay: intl.formatMessage(messages.labelListDay),
      listWeek: intl.formatMessage(messages.labelListWeek),
      listMonth: intl.formatMessage(messages.labelListMonth),
      today: intl.formatMessage(messages.labelToday),
    },
    buttonHints: {
      prev: intl.formatMessage(messages.labelPrev),
      next: intl.formatMessage(messages.labelNext),
    },
    headerToolbar: {
      left: data.toolbar_left?.join(','),
      center: data.toolbar_center?.join(','),
      right: data.toolbar_right?.join(','),
    },
    viewDidMount: (arg) => {
      const headers = arg.el.querySelectorAll('th');
      headers.forEach((th) => th.setAttribute('scope', 'col'));
      const links = arg.el.querySelectorAll('a');
      links.forEach((link) => {
        if (
          link.classList.contains('fc-col-header-cell-cushion') ||
          link.classList.contains('fc-daygrid-day-number')
        ) {
          const span = document.createElement('span');
          span.innerHTML = link.innerHTML;
          span.className = link.className;
          link.parentNode.replaceChild(span, link);
        }
      });
      const tables = arg.el.querySelectorAll('table');
      tables.forEach((table) => {
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');
        if (thead && tbody) {
          const ths = thead.querySelectorAll('th');
          const trs = tbody.querySelectorAll('tr');
          if (trs.length > 0) {
            const tds = trs[0].querySelectorAll('td');
            if (ths.length !== tds.length) {
              // Mismatch detected. Attempt heuristic fix.
              // Often FullCalendar uses a spacer cell or similar.
              // If ths < tds, we might need a colspan on the last th, or an extra th.
              // If ths > tds, we might need a colspan on the last td, or an extra td.
              if (ths.length < tds.length) {
                const diff = tds.length - ths.length;
                const lastTh = ths[ths.length - 1];
                if (lastTh) {
                  const currentColSpan = parseInt(lastTh.getAttribute('colspan') || '1', 10);
                  lastTh.setAttribute('colspan', currentColSpan + diff);
                }
              }
            }
          }
        }
      });
    },
    viewDidUpdate: (arg) => {
      const headers = arg.el.querySelectorAll('th');
      headers.forEach((th) => th.setAttribute('scope', 'col'));
      const links = arg.el.querySelectorAll('a');
      links.forEach((link) => {
        if (
          link.classList.contains('fc-col-header-cell-cushion') ||
          link.classList.contains('fc-daygrid-day-number')
        ) {
          const span = document.createElement('span');
          span.innerHTML = link.innerHTML;
          span.className = link.className;
          link.parentNode.replaceChild(span, link);
        }
      });
      const tables = arg.el.querySelectorAll('table');
      tables.forEach((table) => {
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');
        if (thead && tbody) {
          const ths = thead.querySelectorAll('th');
          const trs = tbody.querySelectorAll('tr');
          if (trs.length > 0) {
            const tds = trs[0].querySelectorAll('td');
            if (ths.length !== tds.length) {
              if (ths.length < tds.length) {
                const diff = tds.length - ths.length;
                const lastTh = ths[ths.length - 1];
                if (lastTh) {
                  const currentColSpan = parseInt(lastTh.getAttribute('colspan') || '1', 10);
                  lastTh.setAttribute('colspan', currentColSpan + diff);
                }
              }
            }
          }
        }
      });
    },
    moreLinkContent: (arg) => {
      return (
        <span aria-label={`Show ${arg.num} more events`}>
          {arg.shortText}
        </span>
      );
    },
    eventDataTransform: (eventData) => {
      if (eventData.url) {
        eventData.linkUrl = eventData.url;
        delete eventData.url;
      }
      return eventData;
    },
    eventContent: (arg) => {
      const url =
        arg.event.extendedProps.linkUrl ||
        arg.event.extendedProps.url ||
        arg.event.url;
      const content = (
        <>
          {arg.timeText && <div className="fc-event-time">{arg.timeText}</div>}
          <div className="fc-event-title">{arg.event.title}</div>
        </>
      );

      if (!url) return content;

      return (
        <UniversalLink href={url} aria-label={`Event: ${arg.event.title}`}>
          {content}
        </UniversalLink>
      );
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
        {storedEvents === null && (
          <>
            <Dimmer active inverted>
              <Loader inverted size='massive' />
            </Dimmer>
            <FullCalendar
              ref={calendarRef}
              events={remoteEvents}
              loading={(isLoading) => onLoading(isLoading)}
              {...fcOptions}
            />
          </>
        )}
        {storedEvents !== null && (
          <FullCalendar
            ref={calendarRef}
            events={storedEvents}
            {...fcOptions}
          />
        )}
      </div>
    )
  );
};

export default FullCalendarBlockView;
