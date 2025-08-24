using System.ComponentModel.DataAnnotations;

namespace ZapAgenda_api_aspnet.Dtos.Usuario
{
    public class UpdateSenhaUsuarioDto
    {
        [MinLength(8)]
        public required string Senha { get; set; }
        [MinLength(8)]
        public required string SenhaAntiga { get; set; }
    }
}