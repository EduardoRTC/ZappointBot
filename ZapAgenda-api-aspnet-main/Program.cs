using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using DotNetEnv;
using ZapAgenda_api_aspnet.services;
using ZapAgenda_api_aspnet.interfaces;
using ZapAgenda_api_aspnet.data;
using ZapAgenda_api_aspnet.repositories.interfaces;
using ZapAgenda_api_aspnet.repositories.implementations;
using ZapAgenda_api_aspnet.Middlewares;
using ZapAgenda_api_aspnet.extensions;
using ZapAgenda_api_aspnet.services.interfaces;
using ZapAgenda_api_aspnet.services.implementantions;
using Microsoft.OpenApi.Models;

Env.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowMyOrigin", builder =>
        builder.WithOrigins("http://localhost:5173")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials()
               .AllowAnyHeader());
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Demo Api", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] { }
        }
    });
});

builder.Services.AddControllers().AddNewtonsoftJson(options =>
{
    options.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;
});

builder.Services.AddDbContext<CoreDBContext>(options =>
{
    options.UseMySql(Environment.GetEnvironmentVariable("DEFAULT_CONNECTION_STRING"), new MySqlServerVersion(new Version(8, 0, 32)));
});

builder.Services.AddHttpClient<IIbgeService, IbgeService>();
builder.Services.AddProblemDetails();
builder.Services.ConfigureAuthOptions(builder.Configuration);
builder.Services.AddAuthorization();
builder.Services.AddScoped<IEmpresaRepository, EmpresaRepository>();
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddScoped<IIbgeService, IbgeService>();
builder.Services.AddScoped<ICriptografarService, CriptografarService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<IServicoRepository, ServicoRepository>();
builder.Services.AddScoped<IAgendamentoRepository, AgendamentoRepository>();

var app = builder.Build();

app.UseCors("AllowMyOrigin");

app.UseMiddleware<CustomExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();
app.UseHttpsRedirection();
app.MapControllers();

app.Run();
