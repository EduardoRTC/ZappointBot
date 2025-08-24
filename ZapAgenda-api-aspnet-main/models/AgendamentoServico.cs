using System.ComponentModel.DataAnnotations.Schema;

namespace ZapAgenda_api_aspnet.models
{
    [Table("AgendamentoServico")]
    public class AgendamentoServico
    {
        public int IdAgendamento { get; set; }
        [ForeignKey("IdAgendamento")]
        public Agendamento Agendamento { get; set; } = null!;
        public int IdServico { get; set; }
        [ForeignKey("IdServico")]
        public Servico Servico { get; set; } = null!;
    }
}