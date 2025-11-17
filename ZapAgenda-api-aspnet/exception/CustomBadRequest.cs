namespace ZapAgenda_api_aspnet.Exceptions;

public class CustomBadRequest : Exception
{
    public string Type { get; } = "https://httpstatuses.com/400";
    public string Title { get; }
    public string Detail { get; set; }
    public int StatusCode { get; } = StatusCodes.Status400BadRequest;

    public CustomBadRequest(string title, string detail) : base(detail)
    {
        Title = title;
        Detail = detail;
    }
}
