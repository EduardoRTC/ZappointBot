using System.Security.Claims;
using System.Text;
using DotNetEnv;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using ZapAgenda_api_aspnet.Dtos.Usuario;
using ZapAgenda_api_aspnet.services.interfaces;

namespace ZapAgenda_api_aspnet.services.implementantions
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _config;
        private readonly SymmetricSecurityKey _key;
        public TokenService(IConfiguration config)
        {
            Env.Load();
            _config = config;
            _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Environment.GetEnvironmentVariable("SIGNINGKEY")));
        }
        public string CreateToken(UsuarioDto usuario)
        {
            var claims = new List<Claim>{
                new Claim(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub, usuario.IdUsuario.ToString()),
                new Claim(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email, usuario.Email ?? string.Empty),
                new Claim(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.PreferredUsername, usuario.NomeUsuario),
                new Claim("empresaid", usuario.IdEmpresa.ToString()),
                new Claim("cargo",usuario.IdCargo.ToString())
            };
            var credential = new SigningCredentials(_key, SecurityAlgorithms.HmacSha256);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.Now.AddDays(1),
                SigningCredentials = credential,
                Issuer = _config["JWT:Issuer"],
                Audience = _config["Jwt:Audience"]
            };
            var tokenHandler = new JsonWebTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return token;
        }
    }
}