import CreateEventModal from './CreateEventModal';

// Re-export CreateEventModal so both components share identical UI and behavior
const EventsCreateModal = (props) => <CreateEventModal {...props} />;

export default EventsCreateModal;
