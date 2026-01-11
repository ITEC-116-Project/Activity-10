"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllEntities = void 0;
const users_1 = require("./entities/users");
const admin_1 = require("./entities/admin");
const organizer_1 = require("./entities/organizer");
const attendees_1 = require("./entities/attendees");
const event_1 = require("./entities/event");
const event_attendees_1 = require("./entities/event-attendees");
exports.AllEntities = [users_1.Users, admin_1.Admin, organizer_1.Organizer, attendees_1.Attendees, event_1.Event, event_attendees_1.EventAttendees];
//# sourceMappingURL=all-entities.js.map