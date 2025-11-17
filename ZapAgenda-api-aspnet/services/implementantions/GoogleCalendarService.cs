using Google.Apis.Auth.OAuth2;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Services;
using System.Threading.Tasks;

public class GoogleCalendarService
{
    private readonly CalendarService _calendarService;

    public GoogleCalendarService(string serviceAccountJsonPath)
    {
        var credential = GoogleCredential.FromFile(serviceAccountJsonPath)
            .CreateScoped(CalendarService.Scope.Calendar);

        _calendarService = new CalendarService(new BaseClientService.Initializer()
        {
            HttpClientInitializer = credential,
            ApplicationName = "ZappointBot",
        });
    }

    public async Task CreateEventAsync(string calendarEmail, string summary, string description, DateTime start, DateTime end, string timeZone = "America/Sao_Paulo")
    {
        var evt = new Event
        {
            Summary = summary,
            Description = description,
            Start = new EventDateTime
            {
                DateTime = start,
                TimeZone = timeZone
            },
            End = new EventDateTime
            {
                DateTime = end,
                TimeZone = timeZone
            },
            Attendees = new List<EventAttendee>
            {
                new EventAttendee { Email = calendarEmail }
            }
        };

        await _calendarService.Events.Insert(evt, calendarEmail).ExecuteAsync();
    }
}
