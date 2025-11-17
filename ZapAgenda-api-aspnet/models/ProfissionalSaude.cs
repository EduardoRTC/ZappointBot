using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZapAgenda_api_aspnet.models
{
    [Table("ProfissionalSaude")]
    public class ProfissionalSaude
    {
        [Key]
        public int IdProfissionalSaude { get; set; }

        public int IdUsuario { get; set; }

        [Required]
        [MaxLength(50)]
        public string TipoConselho { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string RegistroConselho { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Especialidade { get; set; } = string.Empty;
        [ForeignKey("IdUsuario")]
        public Usuario Usuario { get; set; }
    }
}
