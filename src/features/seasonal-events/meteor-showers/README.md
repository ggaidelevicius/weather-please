# Meteor shower reference data

`catalog.ts` contains the seven meteor showers supported by seasonal events. Its
rounded radiant coordinates and reference dates come from Table 5, page 25 of
the
[International Meteor Organization's 2026 Meteor Shower Calendar](https://www.imo.net/files/meteor-shower/cal2026.pdf),
edited by Jürgen Rendtel (IMO INFO 3-25). Coordinates are right ascension and
declination in degrees in the J2000 frame, near the usual shower maximum.

| Shower        | Right ascension | Declination | Reference date |
| ------------- | --------------- | ----------- | -------------- |
| Quadrantids   | 230°            | +49°        | January 3      |
| Lyrids        | 271°            | +34°        | April 22       |
| Eta Aquariids | 338°            | −1°         | May 6          |
| Perseids      | 48°             | +58°        | August 13      |
| Orionids      | 95°             | +16°        | October 21     |
| Leonids       | 152°            | +22°        | November 17    |
| Geminids      | 112°            | +33°        | December 14    |

The dates are approximate annual reminders, not predictions of an exact peak.
The calendar explicitly limits its maximum dates to its reference year; actual
maxima vary, and some showers have additional peaks or outbursts. `peakMonth` is
1-based. `peakWindowDays` is an application display allowance of three days
either side of the reference date, not a measured activity duration or a
guarantee of strong meteor activity throughout that window.

The fixed radiants support broad viewing directions near maximum. They do not
model daily radiant drift, individual meteor paths, rates, or outbursts. Showers
can be active outside the display window. Review the calendar when updating this
dataset and use year-specific forecasts before making exact peak or rate claims.
There is no runtime dependency on the IMO website.

## Local viewing guidance

Opening a meteor badge on a forecast tile loads the guide and its astronomy
libraries. Existing seasonal event dates and toggles still determine which
badges appear; the display allowance above does not extend those event dates.

The tile's calendar date identifies the observing night, from local noon to the
following local noon. `@photostructure/tz-lookup` estimates the selected weather
location's IANA time zone offline, and `Intl` supplies civil-time/DST rules. The
interface names the time zone explicitly. The compact lookup can be inaccurate
near time-zone boundaries; future civil times also depend on governments
retaining the currently known rules.

[Astronomy Engine](https://github.com/cosinekitty/astronomy) transforms the
J2000 radiant into the observer's horizontal frame and calculates the Sun and
Moon. Ten-minute samples require the Sun at least 12 degrees below the horizon
and the radiant at least 10 degrees above it. Contiguous windows last 30 minutes
to two hours. A heuristic favors higher radiants and less moonlight; it does not
predict meteor counts or an exact shower maximum. A twilight notice appears if
the Sun is less than 18 degrees below the horizon during the suggested window.
Terrain, buildings, light pollution and clouds are not modeled. Radiant
direction and Moon illumination refer to the displayed midpoint time, while Moon
horizon visibility describes the sampled window.

The calculation has no runtime network dependency and validates inputs. Tests
cover northern and southern observers, polar daylight, local dates across the
international date line, DST changes, lunar conditions, and the existing 2043
seasonal-event horizon. Unsupported inputs and missing viewing windows have
explicit fallback messages.
