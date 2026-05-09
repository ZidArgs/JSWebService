import {uniqueKey} from "@emcjs/core/util/helper/UniqueGenerator.js";
import Session from "../../data/Session.js";

class SessionManager {

    #sessions = new Map();

    add(session) {
        if (!(session instanceof Session)) {
            throw new TypeError("session must be a Session");
        }
        if (session.isValid) {
            this.#sessions.set(session.id, session);
        }
    }

    get(sessionId) {
        const session = this.#sessions.get(sessionId);
        if (session != null && !session.isValid) {
            this.#sessions.delete(sessionId);
            return null;
        }
        return session;
    }

    createSession() {
        const sessionId = uniqueKey(128);
        const session = new Session(sessionId);
        this.add(session);
        return session;
    }

}

export default  new SessionManager();
