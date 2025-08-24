using ZapAgenda_api_aspnet.models.Enums;

namespace ZapAgenda_api_aspnet.Dtos.Usuario
{
    public class UsuarioDto
    {
        public int IdUsuario { get; set; }
        public required string NomeUsuario { get; set; }
        public required string NomeInteiro { get; set; }
        public string? Email { get; set; }
        public required CargoUsuario IdCargo { get; set; }
        public required Guid IdEmpresa {get;set;}
        public string? Cpf { get; set; }
    }
}