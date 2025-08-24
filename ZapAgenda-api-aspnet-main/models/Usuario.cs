using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ZapAgenda_api_aspnet.models.Enums;

namespace ZapAgenda_api_aspnet.models
{
    [Table("Usuario")]
    public class Usuario : ModeloBase
    {
        [MinLength(4)]
        [MaxLength(50, ErrorMessage = "Nome de usuário não pode ser maior que 50 caracteres")]
        [Column(TypeName = "varchar(50)")]
        public required string NomeUsuario { get; set; }
        [ForeignKey("IdEmpresa")]
        public Empresa Empresa { get; set; } = null!;
        public DateTime UltimoLogin { get; set; } = DateTime.UtcNow;
        [MinLength(3)]
        [MaxLength(255, ErrorMessage = "Nome Fantasia não pode ser maior que 255 caracteres")]
        [Column(TypeName = "varchar(255)")]
        public required string NomeInteiro { get; set; }
        [MinLength(8)]
        [MaxLength(255, ErrorMessage = "Nome Fantasia não pode ser maior que 255 caracteres")]
        [Column(TypeName = "varchar(255)")]
        public string Senha { get; set; } = null!;
        [EmailAddress]
        [MaxLength(255, ErrorMessage = "Email não pode ser maior que 255 caracteres")]
        [Column(TypeName = "varchar(255)")]
        public string? Email { get; set; }
        public int TentativasLogin { get; set; }
        public DateTime UltimaTentativaFalhaLogin { get; set; } = DateTime.MinValue;
        public bool PerfilBloqueado { get; set; } = false;
        public required CargoUsuario IdCargo { get; set; }
        [ForeignKey("IdCargo")]
        public Cargo Cargo { get; set; } = null!;
        [MinLength(11, ErrorMessage = "CPF precisa ter 11 digitos")]
        [MaxLength(11, ErrorMessage = "CPF não pode ter mais que 11 digitos")]
        [Column(TypeName = "varchar(11)")]
        public string? Cpf { get; set; } = null;
    }
}