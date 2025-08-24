using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ZapAgenda_api_aspnet.models.Enums;

namespace ZapAgenda_api_aspnet.models
{
    [Table("Cargo")]
    public class Cargo
    {
        [Key]
        public required CargoUsuario IdCargo { get; set; }
        [MaxLength(50, ErrorMessage ="Nome de cargo não pode ser maior que 50 caracteres")]
        public required string NomeCargo { get; set; }
        public List<Usuario> Usuario { get; set; } = [];
    }
}