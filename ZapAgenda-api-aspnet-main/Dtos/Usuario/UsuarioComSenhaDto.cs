using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using ZapAgenda_api_aspnet.models.Enums;

namespace ZapAgenda_api_aspnet.Dtos.Usuario
{
    public class UsuarioComSenhaDto
    {
        public int IdUsuario { get; set; }
        [MinLength(4)]
        [MaxLength(50, ErrorMessage = "Nome de usuário não pode ser maior que 50 caracteres")]
        public required string NomeUsuario { get; set; }
        [MinLength(3)]
        [MaxLength(255, ErrorMessage = "Nome Fantasia não pode ser maior que 255 caracteres")]
        public required string NomeInteiro { get; set; }
        [EmailAddress]
        [MaxLength(255, ErrorMessage = "Email não pode ser maior que 255 caracteres")]
        public string? Email { get; set; }
        public required CargoUsuario IdCargo { get; set; }
        public string? Cpf { get; set; }
        public string Senha { get; set; } = null!;
        public bool Status { get; set; }
    }
}