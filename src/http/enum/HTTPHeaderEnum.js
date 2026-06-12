import Enum from "@emcjs/core/enum/Enum.js";

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers

export default class HTTPHeaderEnum extends Enum {

    //Authentication

    /**
     * Defines the authentication method that should be used to access a resource.
     * @alias "WWW-Authenticate"
     */
    static WWW_AUTHENTICATE = new this("WWW-Authenticate");

    /**
     * Contains the credentials to authenticate a user-agent with a server.
     * @alias "Authorization"
     */
    static AUTHORIZATION = new this("Authorization");

    /**
     * Defines the authentication method that should be used to access a resource behind a proxy server.
     * @alias "Proxy-Authenticate"
     */
    static PROXY_AUTHENTICATE = new this("Proxy-Authenticate");

    /**
     * Contains the credentials to authenticate a user agent with a proxy server.
     * @alias "Proxy-Authorization"
     */
    static PROXY_AUTHORIZATION = new this("Proxy-Authorization");

    // Caching

    /**
     * The time, in seconds, that the object has been in a proxy cache.
     * @alias "Age"
     */
    static AGE = new this("Age");

    /**
     * Directives for caching mechanisms in both requests and responses.
     * @alias "Cache-Control"
     */
    static CACHE_CONTROL = new this("Cache-Control");

    /**
     * Clears browsing data (e.g., cookies, storage, cache) associated with the requesting website.
     * @alias "Clear-Site-Data"
     */
    static CLEAR_SITE_DATA = new this("Clear-Site-Data");

    /**
     * The date/time after which the response is considered stale.
     * @alias "Expires"
     */
    static EXPIRES = new this("Expires");

    /**
     * Specifies a set of rules that define how a URL's query parameters will affect cache matching.
     * These rules dictate whether the same URL with different URL parameters should be saved as separate browser cache entries.
     * @alias "No-Vary-Search"
     * @experimental
     */
    static NO_VARY_SEARCH = new this("No-Vary-Search");

    // Conditionals

    /**
     * The last modification date of the resource, used to compare several versions of the same resource.
     * It is less accurate than {@link ETAG}, but easier to calculate in some environments.
     * Conditional requests using {@link IF_MODIFIED_SINCE} and {@link IF_UNMODIFIED_SINCE} use this value to change the behavior of the request.
     * @alias "Last-Modified"
     */
    static LAST_MODIFIED = new this("Last-Modified");

    /**
     * A unique string identifying the version of the resource.
     * Conditional requests using {@link IF_MATCH} and {@link IF_NONE_MATCH} use this value to change the behavior of the request.
     * @alias "ETag"
     */
    static ETAG = new this("ETag");

    /**
     * Makes the request conditional, and applies the method only if the stored resource matches one of the given ETags.
     * @alias "If-Match"
     */
    static IF_MATCH = new this("If-Match");

    /**
     * Makes the request conditional, and applies the method only if the stored resource doesn't match any of the given ETags.
     * This is used to update caches (for safe requests), or to prevent uploading a new resource when one already exists.
     * @alias "If-None-Match"
     */
    static IF_NONE_MATCH = new this("If-None-Match");

    /**
     * Makes the request conditional, and expects the resource to be transmitted only if it has been modified after the given date.
     * This is used to transmit data only when the cache is out of date.
     * @alias "If-Modified-Since"
     */
    static IF_MODIFIED_SINCE = new this("If-Modified-Since");

    /**
     * Makes the request conditional, and expects the resource to be transmitted only if it has not been modified after the given date.
     * This ensures the coherence of a new fragment of a specific range with previous ones, or to implement an optimistic concurrency
     * control system when modifying existing documents.
     * @alias "If-Unmodified-Since"
     */
    static IF_UNMODIFIED_SINCE = new this("If-Unmodified-Since");

    /**
     * Determines how to match request headers to decide whether a cached response can be used rather than requesting a fresh one from
     * the origin server.
     * @alias "Vary"
     */
    static VARY = new this("Vary");

    // Connection management

    /**
     * Controls whether the network connection stays open after the current transaction finishes.
     * @alias "Connection"
     */
    static CONNECTION = new this("Connection");

    /**
     * Controls how long a persistent connection should stay open.
     * @alias "Keep-Alive"
     */
    static KEEP_ALIVE = new this("Keep-Alive");

    // Content negotiation

    /**
     * Informs the server about the types of data that can be sent back.
     * @alias "Accept"
     */
    static ACCEPT = new this("Accept");

    /**
     * The encoding algorithm, usually a compression algorithm, that can be used on the resource sent back.
     * @alias "Accept-Encoding"
     */
    static ACCEPT_ENCODING = new this("Accept-Encoding");

    /**
     * Informs the server about the human language the server is expected to send back.
     * This is a hint and is not necessarily under the full control of the user:
     * the server should always pay attention not to override an explicit user choice (like selecting a language from a dropdown).
     * @alias "Accept-Language"
     */
    static ACCEPT_LANGUAGE = new this("Accept-Language");

    /**
     * A request content negotiation response header that advertises which media type the server is able to understand in a `PATCH` request.
     * @alias "Accept-Patch"
     */
    static ACCEPT_PATCH = new this("Accept-Patch");

    /**
     * A request content negotiation response header that advertises which media type the server is able to understand in a `POST` request.
     * @alias "Accept-Post"
     */
    static ACCEPT_POST = new this("Accept-Post");

    // Controls

    /**
     * Indicates expectations that need to be fulfilled by the server to properly handle the request.
     * @alias "Expect"
     */
    static EXPECT = new this("Expect");

    /**
     * When using `TRACE`, indicates the maximum number of hops the request can do before being reflected to the sender.
     * @alias "Max-Forwards"
     */
    static MAX_FORWARDS = new this("Max-Forwards");

    // Cookies

    /**
     * Contains stored HTTP cookies previously sent by the server with the {@link SET_COOKIE} header.
     * @alias "Cookie"
     */
    static COOKIE = new this("Cookie");

    /**
     * Send cookies from the server to the user-agent.
     * @alias "Set-Cookie"
     */
    static SET_COOKIE = new this("Set-Cookie");

    // CORS

    /**
     * Indicates whether the response to the request can be exposed when the credentials flag is true.
     * @alias "Access-Control-Allow-Credentials"
     */
    static ACCESS_CONTROL_ALLOW_CREDENTIALS = new this("Access-Control-Allow-Credentials");

    /**
     * Used in response to a preflight request to indicate which HTTP headers can be used when making the actual request.
     * @alias "Access-Control-Allow-Headers"
     */
    static ACCESS_CONTROL_ALLOW_HEADERS = new this("Access-Control-Allow-Headers");

    /**
     * Specifies the methods allowed when accessing the resource in response to a preflight request.
     * @alias "Access-Control-Allow-Methods"
     */
    static ACCESS_CONTROL_ALLOW_METHODS = new this("Access-Control-Allow-Methods");

    /**
     * Indicates whether the response can be shared.
     * @alias "Access-Control-Allow-Origin"
     */
    static ACCESS_CONTROL_ALLOW_ORIGIN = new this("Access-Control-Allow-Origin");

    /**
     * Indicates which headers can be exposed as part of the response by listing their names.
     * @alias "Access-Control-Expose-Headers"
     */
    static ACCESS_CONTROL_EXPOSE_HEADERS = new this("Access-Control-Expose-Headers");

    /**
     * Indicates how long the results of a preflight request can be cached.
     * @alias "Access-Control-Max-Age"
     */
    static ACCESS_CONTROL_MAX_AGE = new this("Access-Control-Max-Age");

    /**
     * Used when issuing a preflight request to let the server know which HTTP headers will be used when the actual request is made.
     * @alias "Access-Control-Request-Headers"
     */
    static ACCESS_CONTROL_REQUEST_HEADERS = new this("Access-Control-Request-Headers");

    /**
     * Used when issuing a preflight request to let the server know which HTTP method will be used when the actual request is made.
     * @alias "Access-Control-Request-Method"
     */
    static ACCESS_CONTROL_REQUEST_METHOD = new this("Access-Control-Request-Method");

    /**
     * Indicates where a fetch originates from.
     * @alias "Origin"
     */
    static ORIGIN = new this("Origin");

    /**
     * Specifies origins that are allowed to see values of attributes retrieved via features of the Resource Timing API, which would
     * otherwise be reported as zero due to cross-origin restrictions.
     * @alias "Timing-Allow-Origin"
     */
    static TIMING_ALLOW_ORIGIN = new this("Timing-Allow-Origin");

    // Downloads

    /**
     * Indicates if the resource transmitted should be displayed inline (default behavior without the header), or if it should be handled
     * like a download and the browser should present a "Save As" dialog.
     * @alias "Content-Disposition"
     */
    static CONTENT_DISPOSITION = new this("Content-Disposition");

    // Integrity digest

    /**
     * Provides a digest of the stream of octets framed in an HTTP message (the message content) dependent on {@link CONTENT_ENCODING}
     * and {@link CONTENT_RANGE}.
     * @alias "Content-Digest"
     * @experimental
     */
    static CONTENT_DIGEST = new this("Content-Digest");

    /**
     * Provides a digest of the selected representation of the target resource before transmission.
     * Unlike the {@link CONTENT_DIGEST}, the digest does not consider {@link CONTENT_ENCODING} or {@link CONTENT_RANGE}.
     * @alias "Repr-Digest"
     * @experimental
     */
    static REPR_DIGEST = new this("Repr-Digest");

    /**
     * States the wish for a {@link CONTENT_DIGEST} header. It is the `Content-`analogue of {@link WANT_REPR_DIGEST}.
     * @alias "Want-Content-Digest"
     * @experimental
     */
    static WANT_CONTENT_DIGEST = new this("Want-Content-Digest");

    /**
     * States the wish for a {@link REPR_DIGEST} header. It is the `Repr-`analogue of {@link WANT_CONTENT_DIGEST}.
     * @alias "Want-Repr-Digest"
     * @experimental
     */
    static WANT_REPR_DIGEST = new this("Want-Repr-Digest");

    // Integrity policy

    /**
     * Ensures that all resources the user agent loads (of a certain type) have Subresource Integrity guarantees.
     * @alias "Integrity-Policy"
     */
    static INTEGRITY_POLICY = new this("Integrity-Policy");

    /**
     * Reports on resources that the user agent loads that would violate Subresource Integrity guarantees if the integrity policy
     * were enforced (using the {@link INTEGRITY_POLICY} header).
     * @alias "Integrity-Policy-Report-Only"
     */
    static INTEGRITY_POLICY_REPORT_ONLY = new this("Integrity-Policy-Report-Only");

    // Message body information

    /**
     * The size of the resource, in decimal number of bytes.
     * @alias "Content-Length"
     */
    static CONTENT_LENGTH = new this("Content-Length");

    /**
     * Indicates the media type of the resource.
     * @alias "Content-Type"
     */
    static CONTENT_TYPE = new this("Content-Type");

    /**
     * Used to specify the compression algorithm.
     * @alias "Content-Encoding"
     */
    static CONTENT_ENCODING = new this("Content-Encoding");

    /**
     * Describes the human language(s) intended for the audience, so that it allows a user to differentiate according to the users'
     * own preferred language.
     * @alias "Content-Language"
     */
    static CONTENT_LANGUAGE = new this("Content-Language");

    /**
     * Indicates an alternate location for the returned data.
     * @alias "Content-Location"
     */
    static CONTENT_LOCATION = new this("Content-Location");

    // Preferences

    /**
     * Indicates preferences for specific server behaviors during request processing. For example, it can request minimal response content
     * (`return=minimal`) or asynchronous processing (`respond-async`).
     * The server processes the request normally if the header is unsupported.
     * @alias "Prefer"
     */
    static PREFER = new this("Prefer");

    /**
     * Informs the client which preferences specified in the {@link PREFER} header were applied by the server.
     * It is a response-only header providing transparency about preference handling.
     * @alias "Preference-Applied"
     */
    static PREFERENCE_APPLIED = new this("Preference-Applied");

    // Proxies

    /**
     * Contains information from the client-facing side of proxy servers that is altered or lost when a proxy is involved in the path of
     * the request.
     * @alias "Forwarded"
     */
    static FORWARDED = new this("Forwarded");

    /**
     * Added by proxies, both forward and reverse proxies, and can appear in the request headers and the response headers.
     * @alias "Via"
     */
    static VIA = new this("Via");

    // Range requests

    /**
     * Indicates if the server supports range requests, and if so in which unit the range can be expressed.
     * @alias "Accept-Ranges"
     */
    static ACCEPT_RANGES = new this("Accept-Ranges");

    /**
     * Indicates the part of a document that the server should return.
     * @alias "Range"
     */
    static RANGE = new this("Range");

    /**
     * Creates a conditional range request that is only fulfilled if the given etag or date matches the remote resource.
     * Used to prevent downloading two ranges from incompatible version of the resource.
     * @alias "If-Range"
     */
    static IF_RANGE = new this("If-Range");

    /**
     * Indicates where in a full body message a partial message belongs.
     * @alias "Content-Range"
     */
    static CONTENT_RANGE = new this("Content-Range");

    // Redirects#

    /**
     * Indicates the URL to redirect a page to.
     * @alias "Location"
     */
    static LOCATION = new this("Location");

    /**
     * Directs the browser to reload the page or redirect to another.
     *
     * Takes the same value as the `meta` element with `http-equiv="refresh"`.
     * @alias "Refresh"
     */
    static REFRESH = new this("Refresh");

    // Request context

    /**
     * Contains an Internet email address for a human user who controls the requesting user agent.
     * @alias "From"
     */
    static FROM = new this("From");

    /**
     * Specifies the domain name of the server (for virtual hosting), and (optionally) the TCP port number on which the server is listening.
     * @alias "Host"
     */
    static HOST = new this("Host");

    /**
     * The address of the previous web page from which a link to the currently requested page was followed.
     * @alias "Referer"
     */
    static REFERRER = new this("Referer");

    /**
     * Governs which referrer information sent in the {@link REFERRER} header should be included with requests made.
     * @alias "Referrer-Policy"
     */
    static REFERRER_POLICY = new this("Referrer-Policy");

    /**
     * Contains a characteristic string that allows the network protocol peers to identify the application type, operating system, software
     * vendor or software version of the requesting software user agent.
     * @alias "User-Agent"
     */
    static USER_AGENT = new this("User-Agent");

    // Response context

    /**
     * Lists the set of HTTP request methods supported by a resource.
     * @alias "Allow"
     */
    static ALLOW = new this("Allow");

    /**
     * Contains information about the software used by the origin server to handle the request.
     * @alias "Server"
     */
    static SERVER = new this("Server");

    // Security

    /**
     * Allows a server to declare an embedder policy for a given document.
     * @alias "Cross-Origin-Embedder-Policy"
     */
    static CROSS_ORIGIN_EMBEDDER_POLICY = new this("Cross-Origin-Embedder-Policy");

    /**
     * Prevents other domains from opening/controlling a window.
     * @alias "Cross-Origin-Opener-Policy"
     */
    static CROSS_ORIGIN_OPENER_POLICY = new this("Cross-Origin-Opener-Policy");

    /**
     * Prevents other domains from reading the response of the resources to which this header is applied.
     * @alias "Cross-Origin-Resource-Policy"
     */
    static CROSS_ORIGIN_RESOURCE_POLICY = new this("Cross-Origin-Resource-Policy");

    /**
     * Controls resources the user agent is allowed to load for a given page.
     * @alias "Content-Security-Policy"
     */
    static CONTENT_SECURITY_POLICY = new this("Content-Security-Policy");

    /**
     * Allows web developers to experiment with policies by monitoring, but not enforcing, their effects.
     * These violation reports consist of JSON documents sent via an HTTP `POST` request to the specified URI.
     * @alias "Content-Security-Policy-Report-Only"
     */
    static CONTENT_SECURITY_POLICY_REPORT_ONLY = new this("Content-Security-Policy-Report-Only");

    /**
     * Provides a mechanism to allow and deny the use of browser features in a website's own frame, and in `<iframe>`s that it embeds.
     * @alias "Permissions-Policy"
     */
    static PERMISSION_POLICY = new this("Permissions-Policy");

    /**
     * Force communication using HTTPS instead of HTTP.
     * @alias "Strict-Transport-Security"
     */
    static STRICT_TRANSPORT_SECURITY = new this("Strict-Transport-Security");

    /**
     * Sends a signal to the server expressing the client's preference for an encrypted and authenticated response, and that it can successfully
     * handle the `upgrade-insecure-requests` directive.
     * @alias "Upgrade-Insecure-Requests"
     */
    static UPGRADE_INSECURE_REQUESTS = new this("Upgrade-Insecure-Requests");

    /**
     * Disables MIME sniffing and forces browser to use the type given in {@link CONTENT_TYPE}.
     * @alias "X-Content-Type-Options"
     */
    static X_CONTENT_TYPE_OPTIONS = new this("X-Content-Type-Options");

    /**
     * Indicates whether a browser should be allowed to render a page in a `<frame>`, `<iframe>`, `<embed>` or `<object>`.
     * @alias "X-Frame-Options"
     */
    static X_FRAME_OPTIONS = new this("X-Frame-Options");

    /**
     * A cross-domain policy file may grant clients, such as Adobe Acrobat or Apache Flex (among others), permission to handle data across
     * domains that would otherwise be restricted due to the Same-Origin Policy.
     * The `X-Permitted-Cross-Domain-Policies` header overrides such policy files so that clients still block unwanted requests.
     * @alias "X-Permitted-Cross-Domain-Policies"
     */
    static X_PERMITTED_CROSS_DOMAIN_POLOCIES = new this("X-Permitted-Cross-Domain-Policies");

    /**
     * May be set by hosting environments or other frameworks and contains information about them while not providing any usefulness to the
     * application or its visitors. Unset this header to avoid exposing potential vulnerabilities.
     * @alias "X-Powered-By"
     */
    static X_POWERED_BY = new this("X-Powered-By");

    /**
     * Enables cross-site scripting filtering.
     * @alias "X-XSS-Protection"
     */
    static X_XSS_PROTECTION = new this("X-XSS-Protection");

    // Fetch metadata request headers

    /**
     * Indicates the relationship between a request initiator's origin and its target's origin.
     * It is a Structured Header whose value is a token with possible values `cross-site`, `same-origin`, `same-site`, and `none`.
     * @alias "Sec-Fetch-Site"
     */
    static SEC_FETCH_SITE = new this("Sec-Fetch-Site");

    /**
     * Indicates the request's mode to a server.
     * It is a Structured Header whose value is a token with possible values `cors`, `navigate`, `no-cors`, `same-origin`, and `websocket`.
     * @alias "Sec-Fetch-Mode"
     */
    static SEC_FETCH_MODE = new this("Sec-Fetch-Mode");

    /**
     * Indicates whether or not a navigation request was triggered by user activation.
     * It is a Structured Header whose value is a boolean so possible values are `?0` for false and `?1` for true.
     * @alias "Sec-Fetch-User"
     */
    static SEC_FETCH_USER = new this("Sec-Fetch-User");

    /**
     * Indicates the request's destination.
     * It is a Structured Header whose value is a token with possible values `audio`, `audioworklet`, `document`, `embed`, `empty`, `font`,
     * `image`, `manifest`, `object`, `paintworklet`, `report`, `script`, `serviceworker`, `sharedworker`, `style`, `track`, `video`, `worker`
     * and `xslt`.
     * @alias "Sec-Fetch-Dest"
     */
    static SEC_FETCH_DEST = new this("Sec-Fetch-Dest");

    /**
     * Indicates the purpose of the request, when the purpose is something other than immediate use by the user-agent.
     * The header currently has one possible value, `prefetch`, which indicates that the resource is being fetched preemptively for a possible
     * future navigation.
     * @alias "Sec-Purpose"
     */
    static SEC_PURPOSE = new this("Sec-Purpose");

    /**
     * A request header sent in preemptive request to `fetch()` a resource during service worker boot.
     * The value, which is set with `NavigationPreloadManager.setHeaderValue()`, can be used to inform a server that a different resource should
     * be returned than in a normal `fetch()` operation.
     * @alias "Service-Worker-Navigation-Preload"
     */
    static SERVICE_WORKER_NAVIGATION_PRELOAD = new this("Service-Worker-Navigation-Preload");

    // Fetch storage access headers

    /**
     * Indicates the "storage access status" for the current fetch context, which will be one of `none`, `inactive`, or `active`.
     * The server may respond with {@link ACTIVATE_STORAGE_ACCESS} to request that the browser activate an `inactive` permission and retry
     * the request, or to load a resource with access to its third-party cookies if the status is `active`.
     * @alias "Sec-Fetch-Storage-Access"
     */
    static SEC_FETCH_STORAGE_ACCESS = new this("Sec-Fetch-Storage-Access");

    /**
     * Used in response to {@link SEC_FETCH_STORAGE_ACCESS} to indicate that the browser can activate an existing permission for secure access
     * and retry the request with cookies, or load a resource with cookie access if it already has an activated permission.
     * @alias "Activate-Storage-Access"
     */
    static ACTIVATE_STORAGE_ACCESS = new this("Activate-Storage-Access");

    // Server-sent events

    /**
     * Response header used to specify server endpoints where the browser should send warning and error reports when using the Reporting API.
     * @alias "Reporting-Endpoints"
     */
    static REPORTING_ENDPOINTS = new this("Reporting-Endpoints");

    // Transfer coding

    /**
     * Specifies the form of encoding used to safely transfer the resource to the user.
     * @alias "Transfer-Encoding"
     */
    static TRANSFER_ENCODING = new this("Transfer-Encoding");

    /**
     * Specifies the transfer encodings the user agent is willing to accept.
     * @alias "TE"
     */
    static TE = new this("TE");

    /**
     * Allows the sender to include additional fields at the end of chunked message.
     * @alias "Trailer"
     */
    static TRAILER = new this("Trailer");

    // WebSockets

    /**
     * Response header that indicates that the server is willing to upgrade to a WebSocket connection.
     * @alias "Sec-WebSocket-Accept"
     */
    static SEC_WEBSOCKET_ACCEPT = new this("Sec-WebSocket-Accept");

    /**
     * In requests, this header indicates the WebSocket extensions supported by the client in preferred order. In responses, it indicates
     * the extension selected by the server from the client's preferences.
     * @alias "Sec-WebSocket-Extensions"
     */
    static SEC_WEBSOCKET_EXTENSIONS = new this("Sec-WebSocket-Extensions");

    /**
     * Request header containing a key that verifies that the client explicitly intends to open a `WebSocket`.
     * @alias "Sec-WebSocket-Key"
     */
    static SEC_WEBSOCKET_KEY = new this("Sec-WebSocket-Key");

    /**
     * In requests, this header indicates the sub-protocols supported by the client in preferred order. In responses, it indicates the
     * sub-protocol selected by the server from the client's preferences.
     * @alias "Sec-WebSocket-Protocol"
     */
    static SEC_WEBSOCKET_PROTOCOL = new this("Sec-WebSocket-Protocol");

    /**
     * In requests, this header indicates the version of the WebSocket protocol used by the client. In responses, it is sent only if the
     * requested protocol version is not supported by the server, and lists the versions that the server supports.
     * @alias "Sec-WebSocket-Version"
     */
    static SEC_WEBSOCKET_VERSION = new this("Sec-WebSocket-Version");

    // Other

    /**
     * Used to list alternate ways to reach this service.
     * @alias "Alt-Svc"
     */
    static ALT_SVC = new this("Alt-Svc");

    /**
     * Used to identify the alternative service in use.
     * @alias "Alt-Used"
     */
    static ALT_USED = new this("Alt-Used");

    /**
     * Contains the date and time at which the message was originated.
     * @alias "Date"
     */
    static DATE = new this("Date");

    /**
     * This entity-header field provides a means for serializing one or more links in HTTP headers. It is semantically equivalent to
     * the HTML `<link>` element.
     * @alias "Link"
     */
    static LINK = new this("Link");

    /**
     * Indicates how long the user agent should wait before making a follow-up request.
     * @alias "Retry-After"
     */
    static RETRY_AFTER = new this("Retry-After");

    /**
     * Communicates one or more metrics and descriptions for the given request-response cycle.
     * @alias "Server-Timing"
     */
    static SERVER_TIMING = new this("Server-Timing");

    /**
     * Included in fetches for a service worker's script resource. This header helps administrators log service worker script requests for
     * monitoring purposes.
     * @alias "Service-Worker"
     */
    static SERVICE_WORKER = new this("Service-Worker");

    /**
     * Used to remove the path restriction by including this header in the response of the Service Worker script.
     * @alias "Service-Worker-Allowed"
     */
    static SERVICE_WORKER_ALLOWED = new this("Service-Worker-Allowed");

    /**
     * Links to a source map so that debuggers can step through original source code instead of generated or transformed code.
     * @alias "SourceMap"
     */
    static SOURCE_MAP = new this("SourceMap");

    /**
     * This HTTP/1.1 (only) header can be used to upgrade an already established client/server connection to a different protocol (over the
     * same transport protocol). For example, it can be used by a client to upgrade a connection from HTTP 1.1 to HTTP 2.0, or an HTTP or
     * HTTPS connection into a WebSocket.
     * @alias "Upgrade"
     */
    static UPGRADE = new this("Upgrade");

    /**
     * Provides a hint from about the priority of a particular resource request on a particular connection. The value can be sent in a request
     * to indicate the client priority, or in a response if the server chooses to reprioritize the request.
     * @alias "Priority"
     */
    static PRIORITY = new this("Priority");

}
