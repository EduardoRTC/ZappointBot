using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace ZapAgenda_api_aspnet.extensions
{
    public static class AuthConfig
    {
        public static IServiceCollection ConfigureAuthOptions(this IServiceCollection services, IConfiguration configuration)
        {
            // Carrega .env somente fora do container (evita sobrescrever envs do Docker)
            var isContainer = Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true";
            if (!isContainer && File.Exists(Path.Combine(AppContext.BaseDirectory, ".env")))
            {
                // Se sua versão do DotNetEnv suportar, você pode usar: Env.Load(overrideExistingVars: false);
                Env.Load();
            }

            var issuer   = configuration["JWT:Issuer"];
            var audience = configuration["JWT:Audience"];

            // Preferir config → fallback para variável de ambiente
            var secret =
                configuration["JWT:Key"] ??
                configuration["JWT:Secret"] ??
                Environment.GetEnvironmentVariable("SIGNINGKEY");

            if (string.IsNullOrWhiteSpace(secret))
                throw new InvalidOperationException("JWT secret ausente. Defina JWT:Key (ou JWT:Secret / SIGNINGKEY).");

            var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));

            services
                .AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme =
                    options.DefaultChallengeScheme =
                    options.DefaultForbidScheme =
                    options.DefaultScheme =
                    options.DefaultSignInScheme =
                    options.DefaultSignOutScheme = JwtBearerDefaults.AuthenticationScheme;
                })
                .AddJwtBearer(options =>
                {
                    // Em dev, aceite HTTP sem TLS no bearer (ajuste se quiser exigir HTTPS)
                    options.RequireHttpsMetadata = false;
                    options.SaveToken = true;

                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidIssuer = issuer,

                        ValidateAudience = true,
                        ValidAudience = audience,

                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = signingKey,

                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.Zero
                    };

                    // Token no cookie "accessToken" (fallback p/ Authorization header)
                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = ctx =>
                        {
                            if (ctx.Request.Cookies.TryGetValue("accessToken", out var accessToken) &&
                                !string.IsNullOrWhiteSpace(accessToken))
                            {
                                ctx.Token = accessToken;
                            }
                            return Task.CompletedTask;
                        }
                    };
                });

            return services;
        }
    }
}
