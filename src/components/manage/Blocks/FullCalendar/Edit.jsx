import React from 'react';
import { Icon, SidebarPortal } from '@plone/volto/components';
import calendarSVG from '@plone/volto/icons/calendar.svg';
import BlockDataForm from '@plone/volto/components/manage/Form/BlockDataForm';
import { useIntl } from 'react-intl';
import FullCalendarBlockView from './View';
import FullCalendarBlockSchema from './schema';

const FullCalendarBlockEdit = (props) => {
  const intl = useIntl();
  const schema = FullCalendarBlockSchema(intl);

  /* we need to set defaults manually for some fields */
  React.useEffect(() => {
    const defaultValues = {};
    Object.keys(schema.properties).forEach((key) => {
      if (schema.properties[key].hasOwnProperty('default')) {
        defaultValues[key] = schema.properties[key].default;
      }
    });
    props.onChangeBlock(props.block, {
      ...defaultValues,
      ...props.data,
    });
  }, []);

  return (
    <>
      <SidebarPortal selected={props.selected}>
        <BlockDataForm
          schema={schema}
          title={schema.title}
          icon={<Icon name={calendarSVG} />}
          onChangeField={(id, value) => {
            props.onChangeBlock(props.block, {
              ...props.data,
              [id]: value,
            });
          }}
          formData={props.data}
        />
      </SidebarPortal>
      <FullCalendarBlockView data={props.data} />
    </>
  );
};

export default FullCalendarBlockEdit;
