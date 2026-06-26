export default class AbstractCredentials extends EventTarget {

    constructor() {
        if (new.target === AbstractCredentials) {
            throw new Error("can not construct abstract class");
        }
        super();
    }

    verify() {
        return false;
    }

}
