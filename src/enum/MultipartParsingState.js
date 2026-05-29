import Enum from "@emcjs/core/enum/Enum.js";

export default class MultipartParsingState extends Enum {

    static INIT = new this("INIT");

    static READING_HEADERS = new this("READING_HEADERS");

    static READING_DATA = new this("READING_DATA");

    static READING_PART_SEPARATOR = new this("READING_PART_SEPARATOR");

}
