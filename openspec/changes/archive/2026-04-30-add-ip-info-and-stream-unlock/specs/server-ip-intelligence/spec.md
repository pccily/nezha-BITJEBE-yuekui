## ADDED Requirements

### Requirement: IP tab is available on server detail page

The system SHALL provide an `IP` tab after the existing `Detail` and `Network` tabs on the server detail page when the IP information feature is enabled by theme configuration.

#### Scenario: IP tab appears when enabled

- **WHEN** a user opens a server detail page and the IP information feature is enabled
- **THEN** the tab switcher MUST show `Detail`, `Network`, and `IP` in that order

#### Scenario: IP tab is hidden when disabled

- **WHEN** a user opens a server detail page and the IP information feature is disabled
- **THEN** the tab switcher MUST NOT show the `IP` tab

### Requirement: IP information is restricted to administrator login

The system MUST NOT display real server IP addresses or IP metadata to unauthenticated visitors. The system SHALL display IP information only after confirming the visitor is logged in as an administrator.

#### Scenario: Unauthenticated visitor opens IP tab

- **WHEN** an unauthenticated visitor opens the `IP` tab
- **THEN** the system MUST show a login-required message and MUST NOT display IPv4, IPv6, ASN, organization, city, timezone, or quality scores

#### Scenario: Authenticated administrator opens IP tab

- **WHEN** an authenticated administrator opens the `IP` tab for a server with IP addresses
- **THEN** the system SHALL display available IPv4 and IPv6 information for that server

#### Scenario: IP metadata request is skipped before login

- **WHEN** the visitor is not confirmed as an authenticated administrator
- **THEN** the system MUST NOT request the `/ip-meta/` metadata endpoint for the server IP addresses

### Requirement: Server IP fields are sourced from Komari nodes

The system SHALL source server IPv4 and IPv6 values from `common:getNodes` and preserve them in the internal server model for the selected server.

#### Scenario: Node has IPv4 and IPv6

- **WHEN** `common:getNodes` returns `ipv4` and `ipv6` for a node
- **THEN** the internal server model SHALL include those values for the matching server

#### Scenario: Node has no IP address

- **WHEN** the selected server has neither IPv4 nor IPv6
- **THEN** the IP tab SHALL show an empty-state message indicating that no IP information is available

### Requirement: IP metadata can be queried through configurable endpoint

The system SHALL query IP metadata through a theme-configurable endpoint, defaulting to `/ip-meta`, after administrator login is confirmed and at least one IP address exists.

#### Scenario: IP metadata request succeeds

- **WHEN** an authenticated administrator opens the `IP` tab for a server with IP addresses
- **THEN** the system SHALL request `<IpMetaApiBase>/ip-meta?ips=<encoded comma separated ips>` and render returned records

#### Scenario: IP metadata request fails

- **WHEN** the IP metadata endpoint is unavailable or returns an error
- **THEN** the system SHALL show a non-blocking error or unavailable notice and SHALL keep the rest of the server detail page usable

### Requirement: Theme settings control IP and stream unlock features

The system SHALL expose theme settings to enable or disable IP information, enable or disable stream unlock display, configure IP metadata API base path, configure unlock probe API base path, and control IPv6 stream unlock display.

#### Scenario: Administrator disables stream unlock display

- **WHEN** stream unlock display is disabled in theme settings
- **THEN** the IP tab SHALL omit the stream unlock section while keeping IP metadata behavior unchanged

#### Scenario: Custom API base paths are configured

- **WHEN** custom IP metadata or unlock probe base paths are configured
- **THEN** the system SHALL use those paths for subsequent IP metadata and stream unlock requests

### Requirement: Stream unlock cached results are shown to administrators

The system SHALL display cached stream unlock results from the unlock probe endpoint for supported IPv4 and IPv6 families after administrator login is confirmed.

#### Scenario: Cached IPv4 unlock results exist

- **WHEN** an authenticated administrator opens the `IP` tab for a server with IPv4 and cached unlock results exist
- **THEN** the system SHALL request `<UnlockProbeApiBase>/unlock/latest?uuid=<uuid>&family=4` and display the IPv4 unlock result cards

#### Scenario: Cached IPv6 unlock results exist and IPv6 display is enabled

- **WHEN** an authenticated administrator opens the `IP` tab for a server with IPv6 and IPv6 stream unlock display is enabled
- **THEN** the system SHALL request `<UnlockProbeApiBase>/unlock/latest?uuid=<uuid>&family=6` and display the IPv6 unlock result cards

#### Scenario: No cached unlock result exists

- **WHEN** the unlock latest endpoint returns no result records
- **THEN** the system SHALL show an idle or no-record state for that IP family

### Requirement: Administrators can run stream unlock checks manually

The system SHALL allow an authenticated administrator to manually trigger stream unlock checks for the selected server when the server is online and the unlock feature is enabled.

#### Scenario: Administrator starts unlock check

- **WHEN** an authenticated administrator clicks the stream unlock check action for an online server
- **THEN** the system SHALL call `<UnlockProbeApiBase>/unlock/run` with the server UUID, IP family, and `useCache: false`

#### Scenario: Server is offline

- **WHEN** an authenticated administrator opens the `IP` tab for an offline server
- **THEN** the stream unlock check action MUST be disabled and cached results MAY still be displayed

#### Scenario: Visitor is unauthenticated

- **WHEN** an unauthenticated visitor opens the `IP` tab
- **THEN** the stream unlock check action MUST NOT be available

### Requirement: Supported stream unlock services are presented consistently

The system SHALL present stream unlock results for the supported service catalog with stable labels and ordering.

#### Scenario: Unlock result contains known services

- **WHEN** unlock results include Netflix, Disney+, YouTube Premium, Spotify, TikTok, ChatGPT, Claude, or Gemini keys
- **THEN** the system SHALL render those services using the configured catalog order and labels

#### Scenario: Unlock result contains unsupported services

- **WHEN** unlock results include unknown service keys
- **THEN** the system SHALL either omit unknown services or render them in a generic fallback area without breaking known service cards
