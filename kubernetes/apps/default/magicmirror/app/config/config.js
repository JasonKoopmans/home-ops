/* Magic Mirror Config Sample
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 *
 * For more information on how you can configure this file
 * see https://docs.magicmirror.builders/getting-started/configuration.html#general
 * and https://docs.magicmirror.builders/modules/configuration.html
 */
let config = {
	address: "0.0.0.0",
	port: 8080,
	basePath: "/",
	ipWhitelist: [],
	useHttps: false, 		// Support HTTPS or not, default "false" will use HTTP
	httpsPrivateKey: "", 	// HTTPS private key path, only require when useHttps is true
	httpsCertificate: "", 	// HTTPS Certificate path, only require when useHttps is true
    language: "en",
    locale: "en-US",
    logLevel: ["DEBUG", "INFO", "LOG", "WARN", "ERROR"], // Add "DEBUG" for even more logging
    timeFormat: 12,
    units: "imperial",
    modules: [
        {
            module: "alert",
        },
        {
            module: "updatenotification",
            position: "top_bar"
        },
        {
            module: "clock",
            position: "top_left"
        },
        {
            module: "calendar",
            header: "Family Calendar",
            position: "top_left",
            config: {
            calendars: [
                {
                    symbol: "calendar-check",
                    url: "${SECRET_MAGICMIRROR_GCALENDAR_FAMILY}"
                },
                {
                    symbol: "suitcase",
                    url: "https://fr.ftp.opendatasoft.com/openscol/fr-en-calendrier-scolaire/Zone-A.ics"
                },
                {
                    symbol: "power-off",
                    url: "https://calendar.google.com/calendar/ical/fr.french%23holiday%40group.v.calendar.google.com/public/basic.ics"
                },
                {
                    symbol: "cake-candles",
                    url: "https://calendar.google.com/calendar/ical/d95c64ab2ab0d76b581ac5b2d507ecef58b798b094eea4549cd4d61743457abe%40group.calendar.google.com/private-ac9398e45e7666fbd88b72f704261fb1/basic.ics"
                },
            ]
            }
        },
        {
            module: "MMM-NameDay",
            position: "top_left", // You can change this to your desired position.
            config: {
                country: ["us", "it"], // You can add multiple countries.
                updateInterval: 10*60*60*1000, // 10 hours
            }
        },
        {
            module: "MMM-MyScoreboard",
            position: "top_right",
            classes: "default everyone",
            header: "Scoreboard",
            config: {
              showLeagueSeparators: true,
              colored: true,
              viewStyle: "mediumLogos",
              sports: [
                {
                  league: "NBA",
                  teams: ["MIL"]
                },
                {
                  league: "MLB",
                  teams: ["MIL", "MIN", "CHC"]
                },
                {
                  league: "NFL",
                  groups: ["NFC", "AFC"]
                },
                {
                  league: "NCAAM_MM",
                  label: "March Madness"
                }
              ]
            }
        },
        {
            module: "facts",
            position: "bottom_bar",
            config: {
                updateInterval: 100 * 60 , // every 100 minutes
                fadeSpeed: 1
            
            }
        },  
    ]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {module.exports = config;}