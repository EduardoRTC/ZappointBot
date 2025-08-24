using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZapAgenda_api_aspnet.models
{
    [Table("Agendamento")]
    public class Agendamento : ModeloBase
    {
        [MaxLength(50, ErrorMessage = "Status não pode ser maior que 50 caracteres")]
        [Column(TypeName = "varchar(50)")]
        public string StatusAgendamento { get; set; } = "Pendente";
        public DateTime DataHoraInicio { get; set; }
        public DateTime DataHoraFim { get; set; }
        [MaxLength(500, ErrorMessage = "Observação não pode ser maior que 500 caracteres")]
        [Column(TypeName = "varchar(500)")]
        public string? Observacao { get; set; }
        public TimeSpan TempoDuracaoAgendamento { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal ValorTotal { get; set; }
        public List<AgendamentoServico> AgendamentoServico { get; set; } = [];
        public int IdCliente { get; set; }
        [ForeignKey("IdCliente")]
        public Cliente Cliente { get; set; } = null!;
        public int IdUsuario { get; set; }
        [ForeignKey("IdUsuario")]
        public Usuario Usuario { get; set; } = null!;
        [ForeignKey("IdEmpresa")]
        public Empresa Empresa { get; set; } = null!;
    }
}