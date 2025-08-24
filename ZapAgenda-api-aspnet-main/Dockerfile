# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["ZapAgenda-api-aspnet.csproj", "./"]
RUN dotnet restore "ZapAgenda-api-aspnet.csproj"
COPY . .
RUN dotnet publish "ZapAgenda-api-aspnet.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "ZapAgenda-api-aspnet.dll"]
