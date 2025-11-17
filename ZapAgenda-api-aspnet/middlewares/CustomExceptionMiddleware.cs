using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using ZapAgenda_api_aspnet.Exceptions;

namespace ZapAgenda_api_aspnet.Middlewares;

public class CustomExceptionMiddleware
{
    private readonly RequestDelegate _next;

    public CustomExceptionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (CustomBadRequest ex)
        {
            await HandleBadRequestAsync(context, ex);
        }
    }

    private static Task HandleBadRequestAsync(HttpContext context, CustomBadRequest ex)
    {
        var problemDetails = new ProblemDetails
        {
            Type = ex.Type,
            Title = ex.Title,
            Detail = ex.Detail,
            Status = ex.StatusCode,
            Instance = $"{context.Request.Method} {context.Request.Path}"
        };

        problemDetails.Extensions["requestId"] = context.TraceIdentifier;

        var atividade = context.Features.Get<IHttpActivityFeature>()?.Activity;
        if (atividade != null)
        {
            problemDetails.Extensions["traceId"] = atividade.Id;
        }

        context.Response.StatusCode = ex.StatusCode;
        context.Response.ContentType = "application/json";

        return context.Response.WriteAsJsonAsync(problemDetails);
    }
}
