using System.ComponentModel.DataAnnotations;

namespace ZapAgenda_api_aspnet.Dtos.Usuario
{
    public class LoginDto
    {
        public required string NomeUsuario { get; set; }
        public required string Senha { get; set; }
    }
}