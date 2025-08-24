using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZapAgenda_api_aspnet.models
{
    [Table("Servico")]
    public class Servico : ModeloBase
    {
        [ForeignKey("IdEmpresa")]
        public Empresa Empresa { get; set; } = null!;
        [MinLength(3, ErrorMessage = "Descrição não pode ser menor que 3 caracteres")]
        [MaxLength(255, ErrorMessage = "Descrição não pode ser maior que 255 caracteres")]
        [Column(TypeName = "varchar(255)")]
        public string Descricao { get; set; } = null!;
        [Column(TypeName = "decimal(18,2)")]
        public decimal Valor { get; set; }
        public TimeSpan TempoDuracao { get; set; }
        public List<AgendamentoServico> AgendamentoServico { get; set; } = [];
    }
}