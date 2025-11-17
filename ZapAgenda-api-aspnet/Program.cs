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

// ==================== CORS ====================
// Permite QUALQUER origem (qualquer DNS/porta).
// Esses aqui são só para DOCUMENTAÇÃO:
string[] documentedOrigins =
{
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://zappoint:3000"
};

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy
            .AllowAnyOrigin()   // 👈 qualquer origem
            .AllowAnyMethod()
            .AllowAnyHeader();
        // NÃO usar AllowCredentials junto com AllowAnyOrigin
    });
});

// ==================== Controllers & JSON ====================
builder.Services
    .AddControllers()
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;
    });

builder.Services.AddEndpointsApiExplorer();

// ==================== Swagger ====================
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
            Array.Empty<string>()
        }
    });
});

// ==================== DB Context ====================
builder.Services.AddDbContext<CoreDBContext>(options =>
{
    options.UseMySql(
        Environment.GetEnvironmentVariable("DEFAULT_CONNECTION_STRING"),
        new MySqlServerVersion(new Version(8, 0, 32))
    );
});

// ==================== Serviços & Repositórios ====================
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

// ==================== Build app ====================
var app = builder.Build();

// ==================== Pipeline HTTP ====================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

// Ordem recomendada:
// 1) Routing
// 2) CORS
// 3) Auth / Authorization
// 4) Middlewares custom
// 5) Controllers

app.UseRouting();

// 🔥 CORS global: aceita qualquer origem, qualquer DNS
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.UseMiddleware<CustomExceptionMiddleware>();

app.MapControllers();

// ==================== Migrações ====================
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<CoreDBContext>();
    db.Database.Migrate();
}

app.Run();
